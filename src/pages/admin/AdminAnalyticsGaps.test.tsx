import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminItemAnalysis } from './AdminItemAnalysis';
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

describe('Item Analysis & Date-Range Revenue Analytics Gaps (Gap 5)', () => {
  describe('Backend Services Domain Logic', () => {
    it('getItemAnalysis correctly identifies questions where >= 80% students failed', async () => {
      const allItems = await api.getItemAnalysis();
      expect(allItems.length).toBeGreaterThan(0);

      const highFailureItems = await api.getItemAnalysis({ preset: 'high_failure' });
      expect(highFailureItems.length).toBeGreaterThan(0);

      // Every question in high_failure must have failureRate >= 80
      for (const item of highFailureItems) {
        expect(item.failureRate).toBeGreaterThanOrEqual(80);
        expect(item.isHighFailure).toBe(true);
      }
    });

    it('getItemAnalysis correctly identifies time traps (>90s average solution time)', async () => {
      const timeTrapItems = await api.getItemAnalysis({ preset: 'time_traps' });
      expect(timeTrapItems.length).toBeGreaterThan(0);

      for (const item of timeTrapItems) {
        expect(item.avgTimeSpentSeconds).toBeGreaterThan(90);
        expect(item.isTimeTrap).toBe(true);
      }
    });

    it('getItemAnalysis provides distractor analysis breakdown (A, B, C, D percentages)', async () => {
      const items = await api.getItemAnalysis();
      const first = items[0];
      expect(first.optionDistribution).toBeDefined();
      expect(first.optionDistribution.A).toBeDefined();
      expect(first.optionDistribution.B).toBeDefined();
      expect(first.optionDistribution.C).toBeDefined();
      expect(first.optionDistribution.D).toBeDefined();

      const totalPct =
        first.optionDistribution.A +
        first.optionDistribution.B +
        first.optionDistribution.C +
        first.optionDistribution.D;
      const skippedPct = (first.skippedCount / first.totalAttempts) * 100;
      expect(totalPct + skippedPct).toBeCloseTo(100, 0);
    });

    it('getDateRangeRevenueStats correctly filters revenue and signups by preset and custom date interval', async () => {
      // 1. Preset this month
      const thisMonthStats = await api.getDateRangeRevenueStats(undefined, undefined, 'this_month');
      expect(thisMonthStats).toBeDefined();
      expect(thisMonthStats.preset).toBe('this_month');
      expect(thisMonthStats.dailyTrend.length).toBeGreaterThan(0);

      // 2. Custom date range: Jan 1 to Jan 15, 2026
      const customStats = await api.getDateRangeRevenueStats('2026-01-01', '2026-01-15', 'custom');
      expect(customStats).toBeDefined();
      expect(customStats.startDate).toBe('2026-01-01');
      expect(customStats.endDate).toBe('2026-01-15');
      expect(customStats.preset).toBe('custom');
      // Should have transactions from Jan 5, Jan 12, Jan 14 seeded data
      expect(customStats.totalRevenue).toBeGreaterThan(0);
      expect(customStats.transactionCount).toBeGreaterThan(0);
      expect(customStats.newSignupsCount).toBeGreaterThan(0);
    });
  });

  describe('AdminItemAnalysis Page Component', () => {
    it('renders KPI cards, preset filters, and questions table with failure rate', async () => {
      render(
        <MemoryRouter>
          <AdminItemAnalysis />
        </MemoryRouter>
      );

      // Verify Header
      expect(
        await screen.findByText(/Item Analysis & Question Psychometrics/i)
      ).toBeInTheDocument();

      // Verify KPI stat cards
      expect(screen.getByText(/Questions Analyzed/i)).toBeInTheDocument();
      expect(screen.getByText(/High Failure \(≥80% Wrong\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Time Traps \(>90s Avg\)/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Platform Accuracy/i)).toBeInTheDocument();

      // Verify Preset Filter Buttons
      expect(screen.getByRole('button', { name: /High Failure Rate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Time Traps/i })).toBeInTheDocument();

      // Filter by High Failure
      const highFailureBtn = screen.getByRole('button', { name: /High Failure Rate/i });
      fireEvent.click(highFailureBtn);

      // Questions table should display failure percentages
      await waitFor(() => {
        expect(screen.getByText(/মাইকেল মধুসূদন দত্ত/i)).toBeInTheDocument();
      });
    });
  });

  describe('AdminDashboard Date Range & Item Analysis Integration', () => {
    it('renders custom date-range revenue filter controls and Item Analysis Quality Watch', async () => {
      render(
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      );

      // Check for Custom Date-Range Revenue Analytics Header
      expect(
        await screen.findByText(/^Revenue & Growth Analytics$/i)
      ).toBeInTheDocument();

      // Check for Date Range Presets
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Last 7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Range' })).toBeInTheDocument();

      // Click "Custom Range" button to show date inputs
      const customBtn = screen.getByRole('button', { name: 'Custom Range' });
      fireEvent.click(customBtn);

      // Verify custom date input fields and apply button appear
      expect(screen.getByText(/Select Date Interval:/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Apply Date Filter/i })).toBeInTheDocument();
      });

      // Verify date filter can be applied
      const applyBtn = screen.getByRole('button', { name: /Apply Date Filter/i });
      fireEvent.click(applyBtn);
    });
  });
});
