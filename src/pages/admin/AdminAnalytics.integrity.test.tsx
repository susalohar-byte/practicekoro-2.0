import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AdminAnalytics, analyticsCsv } from './AdminAnalytics';
import { api } from '@/services/api';
import type { PlatformAnalyticsData } from '@/types';
vi.mock('@/services/api', () => ({ api: { getPlatformAnalyticsOverview: vi.fn() } }));
const data: PlatformAnalyticsData = {
  studentPerformance: {
    totalStudents: 12,
    newStudents: 2,
    activeStudents: 3,
    testsAttempted: 4,
    questionsAnswered: 5,
    overallAccuracy: 20,
    performanceTrend: [],
  },
  studentRankings: [],
  questionInsights: { weakestSubjects: [], weakestTopics: [], mostWrongQuestions: [] },
  revenue: {
    totalRevenue: 80,
    monthlyRevenue: 80,
    paidStudents: 1,
    activeSubscriptions: 2,
    revenueTrend: [],
  },
};
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(api.getPlatformAnalyticsOverview).mockResolvedValue(data);
});
describe('Analytics truthful UI', () => {
  it('reloads the backend for range changes and has no estimated gender distribution', async () => {
    render(<AdminAnalytics />);
    await screen.findByText('₹80');
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: '7d' } });
    await waitFor(() =>
      expect(api.getPlatformAnalyticsOverview).toHaveBeenLastCalledWith('7d', undefined, undefined)
    );
    expect(screen.queryByText('(65%)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dispatch Topic Practice Pack/ })).toBeDisabled();
  });
  it('shows load errors, disables export, and retries without fake zero cards', async () => {
    vi.mocked(api.getPlatformAnalyticsOverview).mockRejectedValueOnce(
      new Error('permission denied')
    );
    render(<AdminAnalytics />);
    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    expect(screen.getByRole('button', { name: 'Export Report' })).toBeDisabled();
    expect(screen.queryByText('Total Students')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('₹80');
  });
  it('ignores stale responses after newer range data arrives', async () => {
    let resolve!: (x: PlatformAnalyticsData) => void;
    vi.mocked(api.getPlatformAnalyticsOverview)
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          })
      )
      .mockResolvedValueOnce({ ...data, revenue: { ...data.revenue, totalRevenue: 55 } });
    render(<AdminAnalytics />);
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: '7d' } });
    await screen.findByText('₹55');
    resolve(data);
    await waitFor(() => expect(screen.queryByText('₹80')).not.toBeInTheDocument());
  });
  it('rejects invalid custom ranges without a backend mutation or export', async () => {
    render(<AdminAnalytics />);
    await screen.findByText('₹80');
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-10-08' } });
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-10-07' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('valid start date');
    expect(screen.getByRole('button', { name: 'Export Report' })).toBeDisabled();
  });
  it('exports actual new student counts and distinguishes current snapshots', () => {
    const csv = analyticsCsv(data, 'selected period');
    expect(csv).toContain('"New students","2","selected period"');
    expect(csv).toContain('"Total students","12","Current student profiles"');
    expect(csv).toContain('"Retained revenue (INR)","80","selected period"');
  });
});
