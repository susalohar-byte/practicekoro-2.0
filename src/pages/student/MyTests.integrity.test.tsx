import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const user = { id: 'u' };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/services/api', () => ({
  api: { getUserAttempts: vi.fn(), getStudentTestSeries: vi.fn(), getTestSeriesAnalytics: vi.fn() },
}));
import { api } from '@/services/api';
import { MyTests } from './MyTests';
const attempt = (id: string, testType = 'full_mock', correct = 1, wrong = 1, score = 1) => ({
  id,
  userId: 'u',
  testId: id,
  testTitle: `Recorded ${id}`,
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  status: 'completed',
  testType,
  score,
  totalMarks: 10,
  accuracy: (100 * correct) / (correct + wrong),
  correctCount: correct,
  wrongCount: wrong,
  skippedCount: 0,
  timeSpentSeconds: 60,
});
const mount = () =>
  render(
    <MemoryRouter>
      <MyTests />
    </MemoryRouter>
  );
describe('Student results UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getUserAttempts).mockResolvedValue([
      attempt('mock'),
      attempt('practice', 'topic', 1, 9, 0),
    ] as any);
    vi.mocked(api.getStudentTestSeries).mockResolvedValue([]);
  });
  it('shows accessible loading while results are pending', () => {
    vi.mocked(api.getUserAttempts).mockImplementation(() => new Promise(() => {}));
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('Loading your results');
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });
  it('shows retry rather than zero metrics on failed history', async () => {
    vi.mocked(api.getUserAttempts).mockRejectedValueOnce(new Error('offline'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recorded mock')).toBeInTheDocument();
  });
  it('actually changes mock versus practice scope', async () => {
    mount();
    await screen.findByText('Recorded mock');
    fireEvent.click(screen.getByRole('button', { name: 'Mock Tests' }));
    expect(screen.queryByText('Recorded practice')).not.toBeInTheDocument();
    expect(screen.getByText('Recorded mock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Live Tests' }));
    expect(screen.queryByText('Recorded mock')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('not available');
  });
  it('uses pooled answer accuracy rather than averaging unequal test sizes', async () => {
    mount();
    await screen.findByText('Recorded mock');
    expect(screen.getAllByText('17%').length).toBeGreaterThan(0);
  });
  it('time selection changes actual records', async () => {
    vi.mocked(api.getUserAttempts).mockResolvedValue([
      { ...attempt('old'), createdAt: '2020-01-01T00:00:00Z' },
    ] as any);
    mount();
    await screen.findByText('Results');
    expect(screen.queryByText('Recorded old')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: 'All Time' } });
    expect(screen.getByText('Recorded old')).toBeInTheDocument();
  });
  it('See All reveals older results beyond the first ten', async () => {
    vi.mocked(api.getUserAttempts).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => ({
        ...attempt(`mock-${i}`),
        createdAt: new Date(Date.now() - i * 60_000).toISOString(),
      })) as any
    );
    mount();
    await screen.findByText('Recorded mock-0');
    expect(screen.queryByText('Recorded mock-11')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'See All' })[0]);
    expect(screen.getByText('Recorded mock-11')).toBeInTheDocument();
  });
  it('does not substitute zero scores when series analytics fail', async () => {
    vi.mocked(api.getStudentTestSeries).mockResolvedValue([
      { id: 's', title: 'Unavailable series', testCount: 5 },
    ] as any);
    vi.mocked(api.getTestSeriesAnalytics).mockRejectedValue(new Error('denied'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('No zero scores');
    expect(screen.queryByText('Unavailable series')).not.toBeInTheDocument();
    await waitFor(() => expect(api.getTestSeriesAnalytics).toHaveBeenCalledWith('s'));
  });
});
