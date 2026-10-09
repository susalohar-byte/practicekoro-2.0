import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttemptAnswerState } from '@/types';
import { useAttemptAutosave } from './useAttemptAutosave';
vi.mock('@/services/api', () => ({ api: { saveAnswers: vi.fn() } }));
import { api } from '@/services/api';
const answers: Record<string, AttemptAnswerState> = {
  q: {
    questionId: 'q',
    selectedOption: 'A' as const,
    isMarkedForReview: false,
    timeSpentSeconds: 0,
  },
};
describe('Exam autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(api.saveAnswers).mockReset().mockResolvedValue(true);
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());
  it('saves despite one-second clock updates and uses current elapsed time', async () => {
    const { rerender } = renderHook(({ time }) => useAttemptAutosave('a', answers, time, true), {
      initialProps: { time: 0 },
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ time: 1 });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(api.saveAnswers).toHaveBeenCalledOnce();
    expect(api.saveAnswers).toHaveBeenCalledWith('a', Object.values(answers), 1);
  });
  it('writes immediate local recovery before the debounce', () => {
    renderHook(() => useAttemptAutosave('a', answers, 5, true));
    expect(JSON.parse(localStorage.getItem('practicekoro_attempt_a')!).answers).toEqual(
      Object.values(answers)
    );
  });
  it('shows failed confirmation and can retry successfully', async () => {
    vi.mocked(api.saveAnswers).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useAttemptAutosave('a', answers, 5, true));
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.error).toMatch(/could not be saved/);
    act(() => result.current.retry());
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.error).toBe('');
  });
  it('handles rejected save without an unhandled rejection', async () => {
    vi.mocked(api.saveAnswers).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useAttemptAutosave('a', answers, 5, true));
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.error).toMatch(/server/);
  });
  it('does not save while submitting or before an attempt exists', async () => {
    renderHook(() => useAttemptAutosave('', answers, 0, false));
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(api.saveAnswers).not.toHaveBeenCalled();
  });
  it('cancels old snapshots when answers change', async () => {
    const { rerender } = renderHook(({ value }) => useAttemptAutosave('a', value, 0, true), {
      initialProps: { value: answers },
    });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    const next = { q: { ...answers.q, selectedOption: 'B' as const } };
    rerender({ value: next });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(api.saveAnswers).toHaveBeenCalledOnce();
    expect(api.saveAnswers).toHaveBeenCalledWith('a', Object.values(next), 0);
  });
});
