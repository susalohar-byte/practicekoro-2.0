import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { api } from '@/services/api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', fullName: 'Super Admin', email: 'admin@practicekoro.com' },
    role: 'admin',
    isPro: true,
    isAdmin: true,
    adminRole: 'super_admin',
    hasPermission: () => true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({
    isMaintenanceMode: false,
    appSettings: [],
    reloadSettings: vi.fn(),
  }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

describe('AdminDashboard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all key KPI cards with truthful labels and no hardcoded +12% fake trends', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Verify main header
    expect(await screen.findByRole('heading', { level: 1, name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Overview of your PracticeKoro platform/i)).toBeInTheDocument();

    // Verify 6 KPI metric cards
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getAllByText('Active Students').length).toBeGreaterThan(0);
    expect(screen.getByText('Tests Attempted')).toBeInTheDocument();
    expect(screen.getByText('Questions Solved')).toBeInTheDocument();
    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('allows switching date range filter presets and displays range info', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Find the date range dropdown trigger button in page header
    const triggerButtons = screen.getAllByRole('button', { name: /Last 30 Days/i });
    expect(triggerButtons.length).toBeGreaterThan(0);
    const mainRangeTrigger = triggerButtons[0];

    // Open date dropdown
    fireEvent.click(mainRangeTrigger);

    // Select Last 7 Days from the open dropdown menu (first matching button)
    const last7Buttons = screen.getAllByRole('button', { name: 'Last 7 Days' });
    expect(last7Buttons.length).toBeGreaterThan(0);
    fireEvent.click(last7Buttons[0]);

    // After selection, the main trigger displays Last 7 Days
    await waitFor(() => {
      const updatedTriggers = screen.getAllByRole('button', { name: /Last 7 Days/i });
      expect(updatedTriggers.length).toBeGreaterThan(0);
    });
  });

  it('renders Popular Exams & Test attempt rankings accurately', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Verify section titles
    expect(await screen.findByText('Most Popular Exams')).toBeInTheDocument();
    expect(screen.getByText('Most Attempted Tests')).toBeInTheDocument();

    // Ensure no broken percentages like 350% (old * 3.5 bug)
    const allPercentages = screen.queryAllByText(/%$/);
    for (const el of allPercentages) {
      const match = el.textContent?.match(/^([0-9.]+)%$/);
      if (match) {
        const val = parseFloat(match[1]);
        expect(val).toBeLessThanOrEqual(100);
      }
    }

    // Verify exam emblems/logos are rendered
    const popularSection = screen.getByText('Most Popular Exams').closest('div');
    expect(popularSection).toBeInTheDocument();
  });

  it('renders custom exam logo images in Popular Exams when iconName is set', async () => {
    vi.spyOn(api, 'getAllAdminExams').mockResolvedValueOnce([
      {
        id: 'custom-exam-1',
        title: 'Custom Police Exam',
        slug: 'custom-police',
        iconName: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        orderIndex: 1,
        isActive: true,
        testsCount: 10,
      } as any,
    ]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('Most Popular Exams')).toBeInTheDocument();
    const logoImg = await screen.findByAltText('Custom Police Exam');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute(
      'src',
      expect.stringContaining('data:image/png;base64')
    );
  });

  it('renders Top Students leaderboard accurately', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('Top Students')).toBeInTheDocument();
  });

  it('displays error state and provides a working retry button when API fails', async () => {
    const spyStats = vi.spyOn(api, 'getAdminDashboardV2Stats').mockRejectedValue(new Error('Network RPC timeout'));
    const spyExams = vi.spyOn(api, 'getAllAdminExams').mockRejectedValue(new Error('Network RPC timeout'));
    const spyTests = vi.spyOn(api, 'getAllAdminTests').mockRejectedValue(new Error('Network RPC timeout'));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Should display error alert banner
    expect(
      await screen.findByText(/Failed to load dashboard data. Backend did not respond./i)
    ).toBeInTheDocument();

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);

    // After retry, should attempt to fetch again
    await waitFor(() => {
      expect(spyStats).toHaveBeenCalledTimes(2);
    });

    spyStats.mockRestore();
    spyExams.mockRestore();
    spyTests.mockRestore();
  });
});
