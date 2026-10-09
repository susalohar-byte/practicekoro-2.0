import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
const user = { id: 'u' };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user, isAdmin: false }) }));
vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
}));
vi.mock('@/context/MaintenanceContext', () => ({
  useContentLanguage: () => ({ isBilingualEnabled: true }),
}));
vi.mock('@/components/common/MathText', () => ({
  MathText: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/components/student/StudentSupportModal', () => ({ StudentSupportModal: () => null }));
vi.mock('@/services/api', () => ({
  api: {
    getAppSettings: vi.fn(),
    getTestById: vi.fn(),
    getStudentTestQuestions: vi.fn(),
    getTestAttempt: vi.fn(),
    saveAnswers: vi.fn(),
    submitTestAttempt: vi.fn(),
  },
}));
import { api } from '@/services/api';
import { TestRunner } from './TestRunner';
const mount = () =>
  render(
    <MemoryRouter initialEntries={['/exams/t/runner?attemptId=a']}>
      <Routes>
        <Route path="/exams/:testId/runner" element={<TestRunner />} />
        <Route path="/exams/:testId/results/:attemptId" element={<p>Confirmed result</p>} />
      </Routes>
    </MemoryRouter>
  );
describe('Exam runner recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(api.getAppSettings).mockResolvedValue([]);
    vi.mocked(api.getTestById).mockResolvedValue({
      id: 't',
      title: 'Recorded test',
      durationMinutes: 1,
    } as any);
    vi.mocked(api.getStudentTestQuestions).mockResolvedValue([
      {
        id: 'q',
        questionText: 'Recorded question',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        subjectName: 'History',
      },
    ] as any);
    vi.mocked(api.getTestAttempt).mockResolvedValue({
      id: 'a',
      testId: 't',
      userId: 'u',
      status: 'in_progress',
      startTime: new Date().toISOString(),
    } as any);
    vi.mocked(api.saveAnswers).mockResolvedValue(true);
    vi.mocked(api.submitTestAttempt).mockResolvedValue({ score: 1, accuracy: 100 } as any);
  });
  afterEach(() => vi.restoreAllMocks());
  it('shows an actionable error instead of a blank page when questions fail', async () => {
    vi.mocked(api.getStudentTestQuestions).mockRejectedValue(new Error('offline'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    expect(api.submitTestAttempt).not.toHaveBeenCalled();
  });
  it('does not crash an exam when browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mount();
    expect(await screen.findByText('Recorded question')).toBeInTheDocument();
  });
  it('submits restored answers, not an empty stale closure, when already expired', async () => {
    const answer = {
      questionId: 'q',
      selectedOption: 'B',
      isMarkedForReview: false,
      timeSpentSeconds: 20,
    };
    localStorage.setItem('practicekoro_attempt_a', JSON.stringify({ answers: [answer] }));
    vi.mocked(api.getTestAttempt).mockResolvedValue({
      id: 'a',
      testId: 't',
      userId: 'u',
      status: 'in_progress',
      startTime: new Date(Date.now() - 120_000).toISOString(),
    } as any);
    mount();
    await waitFor(() => expect(api.submitTestAttempt).toHaveBeenCalledOnce());
    expect(api.submitTestAttempt).toHaveBeenCalledWith('a', [answer], expect.any(Number), 't');
    expect(await screen.findByText('Confirmed result')).toBeInTheDocument();
  });
  it('preserves answers and shows failure if expiry submission is rejected', async () => {
    vi.mocked(api.getTestAttempt).mockResolvedValue({
      id: 'a',
      testId: 't',
      userId: 'u',
      status: 'in_progress',
      startTime: new Date(Date.now() - 120_000).toISOString(),
    } as any);
    vi.mocked(api.submitTestAttempt).mockRejectedValue(new Error('submission denied'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('submission denied');
    expect(screen.queryByText('Confirmed result')).not.toBeInTheDocument();
    expect(api.submitTestAttempt).toHaveBeenCalledOnce();
    await act(async () => {});
  });
  it('blocks an attempt that belongs to another user/test', async () => {
    vi.mocked(api.getTestAttempt).mockResolvedValue({ testId: 'other', userId: 'another' } as any);
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('does not belong');
    expect(api.submitTestAttempt).not.toHaveBeenCalled();
  });
});
