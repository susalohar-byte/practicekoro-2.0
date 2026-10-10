import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PopularTestSeriesCard, TestAttempt } from '@/types';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'student', fullName: 'Rahul Das' }, isPro: false }),
}));
vi.mock('@/context/ExamContext', () => ({
  useExam: () => ({ selectedExam: { title: 'WBP Constable' } }),
}));
vi.mock('@/services/bannerService', () => ({
  bannerService: { getActiveBanners: vi.fn(), trackBannerClick: vi.fn() },
}));
vi.mock('@/services/api', () => ({
  api: {
    getActiveLiveTest: vi.fn(),
    getUserAttempts: vi.fn(),
    getPopularTestSeriesCards: vi.fn(),
    getAppLeaderboard: vi.fn(),
  },
}));
import { api } from '@/services/api';
import { bannerService } from '@/services/bannerService';
import { Home } from './Home';

const attempt = (patch: Partial<TestAttempt> = {}): TestAttempt => ({
  id: 'attempt-1',
  userId: 'student',
  testId: 'test-1',
  status: 'completed',
  startTime: '2026-01-01T00:00:00Z',
  timeSpentSeconds: 60,
  score: 8,
  totalMarks: 10,
  correctCount: 8,
  wrongCount: 2,
  skippedCount: 0,
  accuracy: 80,
  createdAt: '2026-01-01T00:00:00Z',
  ...patch,
});
const mount = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}
    >
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>
  );
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(api.getUserAttempts).mockResolvedValue([]);
  vi.mocked(api.getActiveLiveTest).mockResolvedValue(null);
  vi.mocked(api.getPopularTestSeriesCards).mockResolvedValue([]);
  vi.mocked(api.getAppLeaderboard).mockResolvedValue([]);
  vi.mocked(bannerService.getActiveBanners).mockResolvedValue([]);
});
describe('Student dashboard presentation', () => {
  it('shows an honest first-test state without fabricated accuracy or live tests', async () => {
    mount();
    await screen.findByText('Find the right test for you');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome back, Rahul');
    const progress = screen.getByRole('region', { name: 'Your progress, at a glance' });
    expect(within(progress).getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('78%')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Live test' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore mock tests/ })).toHaveAttribute(
      'href',
      '/test-series'
    );
  });
  it('keeps the exact resume route and calculates statistics from completed attempts only', async () => {
    vi.mocked(api.getUserAttempts).mockResolvedValue([
      attempt(),
      attempt({ id: 'attempt-2', accuracy: 60 }),
      attempt({
        id: 'resume-id',
        status: 'in_progress',
        testTitle: 'History mock',
        testId: 'history',
      }),
    ]);
    mount();
    expect(await screen.findByRole('link', { name: /Resume test/ })).toHaveAttribute(
      'href',
      '/exams/history/runner?attemptId=resume-id'
    );
    expect(screen.getByText('70%')).toBeInTheDocument();
    const progress = screen.getByRole('region', { name: 'Your progress, at a glance' });
    expect(within(progress).getByText('2')).toBeInTheDocument();
    expect(within(progress).getByText('20')).toBeInTheDocument();
  });
  it('offers a working retry instead of displaying zero progress on load failure', async () => {
    vi.mocked(api.getUserAttempts)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([attempt()]);
    mount();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We couldn’t load your progress');
    fireEvent.click(within(alert).getByRole('button', { name: /Try again/ }));
    expect(await screen.findByText('80%')).toBeInTheDocument();
  });
  it('renders keyboard-accessible test-series links using only supplied counts', async () => {
    const card: PopularTestSeriesCard = {
      id: 'series',
      title: 'Recorded series',
      orderIndex: 0,
      cardGradientStart: '#123456',
      cardGradientEnd: '#654321',
      fullMockCount: 7,
      route: '/test-series/recorded',
    };
    vi.mocked(api.getPopularTestSeriesCards).mockResolvedValue([card]);
    mount();
    const link = await screen.findByRole('link', { name: /Recorded series/ });
    expect(link).toHaveAttribute('href', '/test-series/recorded');
    expect(within(link).getByText('7')).toBeInTheDocument();
    expect(within(link).queryByText(/topic tests|PYQs/)).not.toBeInTheDocument();
  });
  it('does not turn an unsafe banner URL into an executable link', async () => {
    vi.mocked(bannerService.getActiveBanners).mockResolvedValue([
      {
        id: 'banner',
        title: 'Featured fixture',
        primaryCtaLink: 'javascript:alert(1)',
        imageUrl: '/fixture.png',
        isActive: true,
        displayOrder: 0,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]);
    mount();
    const announcement = await screen.findByRole('region', { name: 'Announcements' });
    expect(within(announcement).getByRole('link')).toHaveAttribute('href', '/test-series');
  });

  it('retains all four quick-access destinations', () => {
    mount();
    for (const [name, href] of [
      ['Topic practice', '/practice'],
      ['Saved questions', '/saved-questions'],
      ['Audio books', '/audio-books'],
      ['Leaderboard', '/rank'],
    ]) {
      expect(screen.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('href', href);
    }
  });
});
