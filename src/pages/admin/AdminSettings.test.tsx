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
        expect(screen.getByText('Global Platform Settings')).toBeInTheDocument();
      });

      // Find Platform Name input and change it
      const appNameInput = screen.getByDisplayValue('PracticeKoro');
      fireEvent.change(appNameInput, { target: { value: 'PracticeKoro Super' } });

      // Toggle maintenance switch
      const toggle = screen.getByRole('checkbox', {
        name: /toggle maintenance mode/i,
        hidden: true,
      });
      fireEvent.click(toggle);

      // Submit form
      const saveBtn = screen.getByRole('button', { name: /save all settings/i });
      fireEvent.click(saveBtn);
      fireEvent.submit(saveBtn.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/settings updated and saved successfully/i)).toBeInTheDocument();
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
        expect(screen.getByText('Razorpay Payment Gateway')).toBeInTheDocument();
      });

      // Change Razorpay Key ID to a test key
      const keyIdInput = screen.getByPlaceholderText(/rzp_test_/i);
      fireEvent.change(keyIdInput, { target: { value: 'rzp_test_1234567890' } });

      // Secrets must never be enterable here: no secret inputs exist.
      expect(screen.queryByPlaceholderText(/Razorpay Key Secret/i)).toBeNull();
      expect(screen.queryByPlaceholderText(/whsec_/i)).toBeNull();

      // Submit form
      const saveBtn = screen.getByRole('button', { name: /save all settings/i });
      fireEvent.click(saveBtn);
      fireEvent.submit(saveBtn.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/settings updated and saved successfully/i)).toBeInTheDocument();
      });

      // Verify Key ID persisted and NO secret was stored
      const config = await adminApi.getPaymentGatewayConfig('razorpay');
      expect(config.keyId).toBe('rzp_test_1234567890');
      expect(config.hasSecret).toBe(false);
      expect(config.secretPreview).toBeNull();
    });

    it('updates and persists official contact channels including WhatsApp, email, and hours', async () => {
      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <AdminSettings />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Global Platform Settings')).toBeInTheDocument();
      });

      // Update Contact details
      const emailInput = screen.getByPlaceholderText('support@practicekoro.online');
      fireEvent.change(emailInput, { target: { value: 'help@practicekoro.online' } });

      const whatsappInput = screen.getByPlaceholderText('+91 98765 43210 (WhatsApp)');
      fireEvent.change(whatsappInput, { target: { value: '+91 91234 56789' } });

      const hoursInput = screen.getByPlaceholderText('Mon - Sat: 10:00 AM - 7:00 PM (IST)');
      fireEvent.change(hoursInput, { target: { value: '24/7 Priority Support' } });

      // Submit form
      const saveBtn = screen.getByRole('button', { name: /save all settings/i });
      fireEvent.click(saveBtn);
      fireEvent.submit(saveBtn.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/settings updated and saved successfully/i)).toBeInTheDocument();
      });

      // Verify contact details updated in service
      const allSettings = await adminApi.getAppSettings();
      const emailSetting = allSettings.find((s) => s.id === 'general_support_email');
      expect(emailSetting?.value).toBe('help@practicekoro.online');

      const whatsappSetting = allSettings.find((s) => s.id === 'general_support_whatsapp');
      expect(whatsappSetting?.value).toBe('+91 91234 56789');

      const hoursSetting = allSettings.find((s) => s.id === 'general_support_hours');
      expect(hoursSetting?.value).toBe('24/7 Priority Support');
    });

    it('renders admin profile section and allows selecting preset avatar', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({ error: null });
      mockUseAuth.mockReturnValue({
        user: {
          id: 'usr-admin-1',
          fullName: 'Super Admin',
          email: 'admin@practicekoro.online',
          role: 'admin',
          avatarUrl: '',
        },
        isAdmin: true,
        isStudent: false,
        loading: false,
        updateProfile: mockUpdateProfile,
      });

      render(
        <MemoryRouter>
          <MaintenanceProvider>
            <AdminSettings />
          </MaintenanceProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Admin Profile & Avatar/i)).toBeInTheDocument();
      });

      // Click on a preset avatar button
      const presetBtn = screen.getByTitle('Select preset 1');
      fireEvent.click(presetBtn);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            avatarUrl: expect.stringContaining('dicebear.com'),
          })
        );
      });
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
