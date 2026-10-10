import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminSettings } from './AdminSettings';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminApi } from '@/services/domains/admin';
import { localAppSettings } from '@/services/domains/localStore';
import { MaintenanceProvider } from '@/context/MaintenanceContext';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  supabaseRuntime: {},
}));

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Keep this component test isolated from the configured Supabase project.
// The settings service has a local fallback, so these tests should not depend
// on the remote app_settings table or its PostgREST schema cache.
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabaseRuntime: {},
}));

// Mock ExamContext & Layout components for AppLayout test
vi.mock('@/context/ExamContext', () => ({
  useExam: () => ({
    exams: [],
    selectedExam: null,
    setSelectedExam: vi.fn(),
  }),
}));

vi.mock('@/components/layout/StudentNavbar', () => ({
  StudentNavbar: () => <div data-testid="student-navbar">Student Navbar</div>,
}));

vi.mock('@/components/layout/StudentSidebar', () => ({
  StudentSidebar: () => <div data-testid="student-sidebar">Student Sidebar</div>,
}));

vi.mock('@/components/layout/BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav">Bottom Nav</div>,
}));

describe('AdminSettings & Maintenance Mode System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr-admin-1',
        fullName: 'Super Admin',
        email: 'admin@practicekoro.online',
        role: 'admin',
      },
      isAdmin: true,
      isStudent: false,
      loading: false,
      adminRole: 'super_admin',
      hasPermission: () => true,
      updateProfile: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('Service Layer: Upsert & Settings Management', () => {
    it('correctly upserts a newly introduced setting that did not exist before', async () => {
      const customKey = 'custom_test_feature_key';
      const customValue = 'enabled_v2';

      // Ensure key doesn't exist yet
      expect(localAppSettings.find((s) => s.id === customKey)).toBeUndefined();

      // Perform upsert
      const res = await adminApi.updateAppSetting(customKey, customValue);
      expect(res.success).toBe(true);

      // Verify that local store has the row inserted
      const saved = localAppSettings.find((s) => s.id === customKey);
      expect(saved).toBeDefined();
      expect(saved?.value).toBe(customValue);

      // Verify getAppSettings returns the upserted row
      const allSettings = await adminApi.getAppSettings();
      const match = allSettings.find((s) => s.id === customKey);
      expect(match).toBeDefined();
      expect(match?.value).toBe(customValue);
    });

    it('returns accurate boolean for getMaintenanceMode', async () => {
      // Set maintenance mode to true
      await adminApi.updateAppSetting('sys_maintenance_mode', true);
      let isMaint = await adminApi.getMaintenanceMode();
      expect(isMaint).toBe(true);

      // Set maintenance mode to false
      await adminApi.updateAppSetting('sys_maintenance_mode', false);
      isMaint = await adminApi.getMaintenanceMode();
      expect(isMaint).toBe(false);
    });
  });

  describe('AdminSettings Component', () => {
    it('renders global settings form and saves updates', async () => {
      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <AdminSettings />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByText('General Settings')).toBeInTheDocument();
      });

      // Find Platform Name input and change it
      const appNameInput = screen.getByLabelText('Platform Name');
      fireEvent.change(appNameInput, { target: { value: 'PracticeKoro Super' } });

      // Toggle maintenance switch
      const toggle = screen.getByRole('switch', {
        name: /toggle maintenance mode/i,
      });
      fireEvent.click(toggle);

      // Submit form
      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Settings saved successfully/i)).toBeInTheDocument();
      });

      // Verify updated in memory
      const allSettings = await adminApi.getAppSettings();
      const updatedName = allSettings.find((s) => s.id === 'general_app_name');
      expect(updatedName?.value).toBe('PracticeKoro Super');
    });

    it('loads and updates Razorpay Key ID without any secret inputs', async () => {
      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <AdminSettings />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('General Settings')).toBeInTheDocument();
      });

      // Switch to Payments tab
      const paymentsTabBtn = screen.getByRole('button', { name: /^payments/i });
      fireEvent.click(paymentsTabBtn);

      await waitFor(() => {
        expect(screen.getByText('Payment Gateway & Invoicing')).toBeInTheDocument();
      });

      // Change Razorpay Key ID to a test key
      const keyIdInput = screen.getByLabelText('Razorpay Key ID');
      fireEvent.change(keyIdInput, { target: { value: 'rzp_test_1234567890' } });

      // Secrets must never be enterable here: no secret inputs exist.
      expect(screen.queryByPlaceholderText(/Razorpay Key Secret/i)).toBeNull();
      expect(screen.queryByPlaceholderText(/whsec_/i)).toBeNull();

      // Submit form
      const saveBtn = screen.getByRole('button', { name: /save payment settings/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Payment gateway settings saved/i)).toBeInTheDocument();
      });

      // Verify Key ID persisted and NO secret was stored
      const config = await adminApi.getPaymentGatewayConfig('razorpay');
      expect(config.keyId).toBe('rzp_test_1234567890');
      expect(config.hasSecret).toBe(false);
      expect(config.secretPreview).toBeNull();
    });

    it('updates and persists official contact channels including support email, phone, and address', async () => {
      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <AdminSettings />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('General Settings')).toBeInTheDocument();
      });

      // Update Contact details
      const emailInput = screen.getByLabelText('Support Email');
      fireEvent.change(emailInput, { target: { value: 'help@practicekoro.online' } });

      const phoneInput = screen.getByLabelText('Contact Phone');
      fireEvent.change(phoneInput, { target: { value: '+91 91234 56789' } });

      const addressInput = screen.getByLabelText('Address (Optional)');
      fireEvent.change(addressInput, { target: { value: 'Kolkata, West Bengal' } });

      // Submit form
      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Settings saved successfully/i)).toBeInTheDocument();
      });

      // Verify contact details updated in service
      const allSettings = await adminApi.getAppSettings();
      const emailSetting = allSettings.find((s) => s.id === 'general_support_email');
      expect(emailSetting?.value).toBe('help@practicekoro.online');

      const phoneSetting = allSettings.find((s) => s.id === 'general_support_phone');
      expect(phoneSetting?.value).toBe('+91 91234 56789');

      const addressSetting = allSettings.find((s) => s.id === 'general_support_address');
      expect(addressSetting?.value).toBe('Kolkata, West Bengal');
    });

    it('disables controls and shows read-only banner when user is not super_admin', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'usr-admin-2',
          fullName: 'Staff Admin',
          email: 'staff@practicekoro.online',
          role: 'admin',
        },
        isAdmin: true,
        isStudent: false,
        loading: false,
        adminRole: 'editor',
        hasPermission: () => false,
      });

      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <AdminSettings />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Read-only: an active Super Admin is required to change platform settings/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Platform Name')).toBeDisabled();
      expect(screen.getByRole('switch', { name: /toggle maintenance mode/i })).toBeDisabled();
    });
  });

  describe('Service Layer: Payment Gateway Credentials Management', () => {
    it('rejects client secrets and persists public Key IDs without them', async () => {
      // Secret fields must be rejected explicitly, not silently presented as saved.
      const res1 = await adminApi.updatePaymentGatewayConfig({
        gateway: 'razorpay',
        keyId: 'rzp_test_sample',
        keySecret: 'initial_secret_1234',
        webhookSecret: 'whsec_should_be_dropped',
        isActive: true,
      });
      expect(res1.success).toBe(false);
      expect(res1.error).toMatch(/server-side/);

      const cfg1 = await adminApi.getPaymentGatewayConfig('razorpay');
      expect(cfg1.keyId).not.toBe('rzp_test_sample');
      expect(cfg1.hasSecret).toBe(false);
      expect(cfg1.secretPreview).toBeNull();
      expect(cfg1.hasWebhookSecret).toBe(false);

      // Key ID updates still work without any secrets involved.
      const res2 = await adminApi.updatePaymentGatewayConfig({
        gateway: 'razorpay',
        keyId: 'rzp_live_newkey',
        isActive: true,
      });
      expect(res2.success).toBe(true);

      const cfg2 = await adminApi.getPaymentGatewayConfig('razorpay');
      expect(cfg2.keyId).toBe('rzp_live_newkey');
      expect(cfg2.hasSecret).toBe(false);
    });
  });

  describe('MaintenanceScreen Component', () => {
    it('renders bilingual messages and support details', () => {
      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <MaintenanceScreen />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('প্ল্যাটফর্ম সাময়িক রক্ষণাবেক্ষণে রয়েছে')).toBeInTheDocument();
      expect(
        screen.getByText(/Platform Maintenance & Infrastructure Upgrade in Progress/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/আবার চেষ্টা করুন/i)).toBeInTheDocument();
      expect(screen.getByText(/সাপোর্ট ইমেইল/i)).toBeInTheDocument();
      expect(screen.getByText(/জরুরি হেল্পলাইন/i)).toBeInTheDocument();
    });
  });

  describe('AppLayout Route Guarding', () => {
    it('blocks student candidate and shows MaintenanceScreen when maintenance mode is active', async () => {
      // Configure non-admin student
      mockUseAuth.mockReturnValue({
        user: {
          id: 'usr-student-1',
          fullName: 'Candidate Student',
          email: 'student@test.com',
          role: 'student',
        },
        isAdmin: false,
        isStudent: true,
        loading: false,
      });

      // Set maintenance mode active
      await adminApi.updateAppSetting('sys_maintenance_mode', true);

      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <AppLayout />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      // Should render MaintenanceScreen, blocking student layout
      await waitFor(() => {
        expect(screen.getByText('প্ল্যাটফর্ম সাময়িক রক্ষণাবেক্ষণে রয়েছে')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('student-navbar')).not.toBeInTheDocument();
    });

    it('allows admin to bypass maintenance screen and access layout', async () => {
      // Configure admin user
      mockUseAuth.mockReturnValue({
        user: {
          id: 'usr-admin-1',
          fullName: 'Super Admin',
          email: 'admin@practicekoro.online',
          role: 'admin',
        },
        isAdmin: true,
        isStudent: false,
        loading: false,
      });

      // Set maintenance mode active
      await adminApi.updateAppSetting('sys_maintenance_mode', true);

      render(
        <MemoryRouter initialEntries={['/exams']}>
          <MaintenanceProvider>
            <AppLayout />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      // Admin should bypass maintenance screen and see student sidebar
      await waitFor(() => {
        expect(screen.getByTestId('student-sidebar')).toBeInTheDocument();
      });
      expect(screen.queryByText('প্ল্যাটফর্ম সাময়িক রক্ষণাবেক্ষণে রয়েছে')).not.toBeInTheDocument();
    });
  });
});
