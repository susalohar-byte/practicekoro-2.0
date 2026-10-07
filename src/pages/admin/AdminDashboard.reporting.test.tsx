import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const mocks = vi.hoisted(() => ({
  api: Object.fromEntries(
    [
      'getAdminDashboardV2Stats',
      'getAllAdminExams',
      'getAllAdminTests',
      'getDashboardLeaderboard',
      'getDashboardAuditLogs',
      'getItemAnalysis',
      'getDashboardPeriodData',
      'getDashboardSystemActivity',
      'getDashboardExamAttemptCounts',
    ].map((k) => [k, vi.fn()])
  ),
}));
vi.mock('@/services/api', () => ({ api: mocks.api }));
import { AdminDashboard } from './AdminDashboard';
const period = (n = 20) => ({
  newStudents: n,
  activeStudents: n,
  testsAttempted: n,
  completedTests: n,
  questionsAnswered: n,
  netRevenue: n,
  previous: {
    newStudents: 10,
    activeStudents: 10,
    testsAttempted: 10,
    completedTests: 10,
    questionsAnswered: 10,
    netRevenue: 10,
  },
  growthSeries: [
    { label: 'Historical day', newStudents: 3, activeStudents: 2 },
    { label: 'Recent day', newStudents: 17, activeStudents: 18 },
  ],
  attemptSeries: [
    { label: 'Historical day', totalAttempts: 3, uniqueStudents: 2 },
    { label: 'Recent day', totalAttempts: 17, uniqueStudents: 18 },
  ],
  revenueSeries: [
    { label: 'Historical day', amount: 3, highlighted: false },
    { label: 'Recent day', amount: 17, highlighted: true },
  ],
  attemptCounts: { test1: n },
});
const mount = () =>
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );
const settle = () => waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
const select = (label: string) => {
  fireEvent.click(screen.getAllByRole('button', { name: /Last 30 Days/ })[0]);
  fireEvent.click(screen.getAllByRole('button', { name: label })[0]);
};
beforeEach(() => {
  cleanup();
  vi.resetAllMocks();
  mocks.api.getAdminDashboardV2Stats.mockResolvedValue({
    totalStudents: 100,
    activeSubscriptions: 2,
    totalExams: 1,
    totalTests: 1,
    totalQuestions: 0,
    topicQuestions: 0,
    fullMockQuestions: 0,
    pyqQuestions: 0,
  });
  mocks.api.getAllAdminExams.mockResolvedValue([
    { id: 'exam1', title: 'Real exam', slug: 'real', isActive: true },
  ]);
  mocks.api.getAllAdminTests.mockResolvedValue([
    { id: 'test1', title: 'Real test', type: 'full_mock' },
  ]);
  mocks.api.getDashboardLeaderboard.mockResolvedValue([
    {
      display_name: 'Actual student',
      district: 'Actual district',
      average_percentage: 0,
      tests_count: 3,
    },
  ]);
  mocks.api.getDashboardAuditLogs.mockResolvedValue({ logs: [] });
  mocks.api.getItemAnalysis.mockResolvedValue([]);
  mocks.api.getDashboardPeriodData.mockResolvedValue(period());
  mocks.api.getDashboardSystemActivity.mockResolvedValue([]);
  mocks.api.getDashboardExamAttemptCounts.mockResolvedValue({ exam1: 20 });
});
describe('Authoritative dashboard snapshots', () => {
  it('uses real previous metrics, history and attempt counts without catalog counters', async () => {
    mount();
    await settle();
    expect(screen.getAllByText('+100%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Historical day').length).toBeGreaterThan(0);
    expect(screen.getByText('Real test')).toBeInTheDocument();
    expect(mocks.api.getDashboardExamAttemptCounts).toHaveBeenCalledWith({ test1: 20 });
    expect(screen.getByText('Actual district')).toBeInTheDocument();
    expect(screen.getByText('Avg. Score')).toBeInTheDocument();
  });
  it('refetches real bounded revenue when its chart selector changes', async () => {
    mocks.api.getDashboardPeriodData.mockImplementation(async (bounds) => ({
      ...period(),
      revenueSeries: [
        {
          label: bounds.label === 'Last 14 Days' ? 'New bounded revenue' : 'Original revenue',
          amount: bounds.daysCount,
          highlighted: false,
        },
      ],
    }));
    mount();
    await settle();
    const card = screen.getByRole('heading', { name: 'Revenue' }).parentElement!.parentElement!
      .parentElement!;
    fireEvent.click(within(card).getByRole('button', { name: 'Last 30 Days' }));
    await screen.findByText('New bounded revenue');
    expect(mocks.api.getDashboardPeriodData.mock.calls.some(([b]) => b.daysCount === 14)).toBe(
      true
    );
  });
  it('queries the full All Time range instead of this year', async () => {
    mount();
    await settle();
    select('All Time');
    await settle();
    expect(
      mocks.api.getDashboardPeriodData.mock.calls.some(
        ([b]) => b.isAllTime && b.startIso.startsWith('1969-12-31T18:30')
      )
    ).toBe(true);
  });
  it('initial partial failure shows no fresh zero KPIs and can retry', async () => {
    mocks.api.getItemAnalysis.mockRejectedValueOnce(new Error('questions permission denied'));
    mount();
    await screen.findByRole('alert');
    expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('questions permission denied');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await settle();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
  it('preserves a complete snapshot if a new filter has a partial failure', async () => {
    mount();
    await settle();
    mocks.api.getDashboardPeriodData.mockResolvedValue(period(999));
    mocks.api.getDashboardAuditLogs.mockRejectedValue(new Error('audit denied'));
    select('Last 7 Days');
    await screen.findByText('Stale Data');
    expect(
      screen.getByText(/Showing the last complete snapshot: Last 30 Days/)
    ).toBeInTheDocument();
    expect(screen.queryByText('999')).not.toBeInTheDocument();
  });
  it('rejects reversed custom dates without sending another query', async () => {
    mount();
    await settle();
    select('Custom Range');
    fireEvent.change(screen.getByLabelText('Report start date'), {
      target: { value: '2026-10-08' },
    });
    fireEvent.change(screen.getByLabelText('Report end date'), { target: { value: '2026-10-07' } });
    const calls = mocks.api.getDashboardPeriodData.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Apply Date Filter' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid date range/i);
    expect(mocks.api.getDashboardPeriodData).toHaveBeenCalledTimes(calls);
  });
  it('does not publish an older request after a newer period completes', async () => {
    let resolveOld!: (p: ReturnType<typeof period>) => void;
    mocks.api.getDashboardPeriodData.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      })
    );
    mount();
    select('Last 7 Days');
    await settle();
    await act(async () => resolveOld(period(999)));
    expect(screen.queryByText('999')).not.toBeInTheDocument();
    expect(screen.getAllByText('+100%').length).toBeGreaterThan(0);
  });
});
