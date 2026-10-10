import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttemptAnswerState } from '@/types';
const m = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabaseRuntime: { rpc: m.rpc } }));
import { catalogApi } from './catalog';
const answers: AttemptAnswerState[] = [
  { questionId: 'q', selectedOption: 'A', isMarkedForReview: false, timeSpentSeconds: 3 },
];
const grade = {
  score: 0,
  total_marks: 5,
  percentage: 0,
  accuracy: 0,
  correct_count: 0,
  wrong_count: 1,
  skipped_count: 4,
  passed: false,
};
describe('Audited student data integrity regressions', () => {
  beforeEach(() => {
    m.rpc.mockReset();
    localStorage.clear();
    vi.spyOn(catalogApi, 'getTestById').mockResolvedValue(null);
  });
  it.each([false, null, undefined, {}, 'true'])(
    'does not acknowledge invalid autosave result %j',
    async (data) => {
      m.rpc.mockResolvedValue({ data, error: null });
      expect(await catalogApi.saveAnswers('a', answers, 3)).toBe(false);
    }
  );
  it('acknowledges only a confirmed boolean true', async () => {
    m.rpc.mockResolvedValue({ data: true, error: null });
    expect(await catalogApi.saveAnswers('a', answers, 3)).toBe(true);
  });
  it('retains newest browser recovery when an older RPC completes', async () => {
    let finish!: (result: unknown) => void;
    m.rpc.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    const pending = catalogApi.saveAnswers('a', answers, 3);
    const newer = JSON.stringify({
      answers: [{ ...answers[0], selectedOption: 'B' }],
      timeSpentSeconds: 9,
    });
    localStorage.setItem('practicekoro_attempt_a', newer);
    finish({ data: true, error: null });
    await pending;
    expect(localStorage.getItem('practicekoro_attempt_a')).toBe(newer);
  });
  it.each([
    {},
    { success: false },
    [],
    null,
    { ...grade, score: 'not-a-number' },
    { ...grade, total_marks: 0 },
    { ...grade, accuracy: 101 },
    { ...grade, correct_count: -1 },
    { ...grade, score: '' },
  ])('rejects invalid grading response %j', async (data) => {
    m.rpc.mockResolvedValue({ data, error: null });
    await expect(catalogApi.submitTestAttempt('a', answers, 3, 't')).rejects.toThrow();
  });
  it('keeps genuine zero metrics rather than inventing scores', async () => {
    m.rpc.mockResolvedValue({ data: grade, error: null });
    expect(await catalogApi.submitTestAttempt('a', answers, 3, 't')).toMatchObject({
      score: 0,
      accuracy: 0,
      totalMarks: 5,
      wrongCount: 1,
    });
  });
  it('accepts Postgres numeric strings', async () => {
    m.rpc.mockResolvedValue({ data: { ...grade, total_marks: '5', score: '-0.25' }, error: null });
    expect(await catalogApi.submitTestAttempt('a', answers, 3, 't')).toMatchObject({
      score: -0.25,
      totalMarks: 5,
    });
  });
});
