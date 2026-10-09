import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
const user = { id: 'u' };
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user, isPro: true, isAdmin: false }),
}));
vi.mock('@/services/api', () => ({
  api: {
    getStudentTestSeries: vi.fn(),
    getExams: vi.fn(),
    subscribeToStudentCatalogUpdates: vi.fn(() => () => {}),
    getSeriesTestsForStudent: vi.fn(),
    getTestSeriesAnalytics: vi.fn(),
    getUserAttempts: vi.fn(),
  },
}));
import { api } from '@/services/api';
import { TestSeriesCatalog } from './TestSeriesCatalog';
import { TestSeriesDetail } from './TestSeriesDetail';
const series = {
  id: 'actual-series',
  examId: 'exam-id',
  slug: 'actual-slug',
  title: 'Recorded Series',
  isActive: true,
  isPremium: false,
  fullMockCount: 0,
  topicTestCount: 0,
  pyqTestCount: 0,
  testCount: 0,
};
const catalog = (path = '/test-series') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TestSeriesCatalog />
    </MemoryRouter>
  );
const detail = () =>
  render(
    <MemoryRouter initialEntries={['/test-series/actual-slug']}>
      <Routes>
        <Route path="/test-series/:seriesId" element={<TestSeriesDetail />} />
      </Routes>
    </MemoryRouter>
  );
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getStudentTestSeries).mockResolvedValue([]);
  vi.mocked(api.getExams).mockResolvedValue([]);
  vi.mocked(api.getSeriesTestsForStudent).mockResolvedValue([]);
  vi.mocked(api.getTestSeriesAnalytics).mockResolvedValue({
    totalTests: 0,
    testsAttempted: 0,
    subjects: [],
    weakTopics: [],
    history: [],
    testTypeBreakdown: [],
    trend: [],
  } as any);
  vi.mocked(api.getUserAttempts).mockResolvedValue([]);
});
describe('No phantom student series', () => {
  it('uses a true empty state, never canonical stock series', async () => {
    catalog();
    expect(await screen.findByText('No test series found')).toBeInTheDocument();
    expect(screen.queryByText('WBP Constable')).not.toBeInTheDocument();
  });
  it('shows failure rather than injecting fake records and can retry', async () => {
    vi.mocked(api.getStudentTestSeries).mockRejectedValueOnce(new Error('offline'));
    catalog();
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No test series found')).toBeInTheDocument();
  });
  it('filters by actual exam relationship, not fuzzy SSC titles', async () => {
    vi.mocked(api.getExams).mockResolvedValue([
      { id: 'exam-id', title: 'SSC CGL', slug: 'ssc-cgl' },
    ] as any);
    vi.mocked(api.getStudentTestSeries).mockResolvedValue([
      { ...series, examId: 'another-id', title: 'SSC GD Wrong Exam' },
    ] as any);
    catalog('/test-series?exam=ssc-cgl');
    expect(await screen.findByText('No test series found')).toBeInTheDocument();
    expect(screen.queryByText('SSC GD Wrong Exam')).not.toBeInTheDocument();
  });
  it('supports slug filter for matching backend exam IDs', async () => {
    vi.mocked(api.getExams).mockResolvedValue([
      { id: 'exam-id', title: 'SSC CGL', slug: 'ssc-cgl' },
    ] as any);
    vi.mocked(api.getStudentTestSeries).mockResolvedValue([series] as any);
    catalog('/test-series?exam=ssc-cgl');
    expect(await screen.findByText('Recorded Series')).toBeInTheDocument();
  });
  it('does not manufacture a detail page for a missing series', async () => {
    detail();
    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
    expect(api.getSeriesTestsForStudent).not.toHaveBeenCalled();
  });
  it('does not insert unrelated demo tests into an empty saved series', async () => {
    vi.mocked(api.getStudentTestSeries).mockResolvedValue([series] as any);
    detail();
    expect(await screen.findByRole('heading', { name: 'Recorded Series' })).toBeInTheDocument();
    expect(screen.queryByText(/Full Mock Test #1/)).not.toBeInTheDocument();
  });
  it('shows tests-read failure rather than manufactured empty/demo content', async () => {
    vi.mocked(api.getStudentTestSeries).mockResolvedValue([series] as any);
    vi.mocked(api.getSeriesTestsForStudent).mockRejectedValue(new Error('tests offline'));
    detail();
    expect(await screen.findByRole('alert')).toHaveTextContent('tests offline');
  });
});
