import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  data: {} as Record<string, any[]>,
  errors: {} as Record<string, string>,
  calls: [] as any[],
  ranges: [] as [number, number][],
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    from: (table: string) => {
      const filters: ((r: any) => boolean)[] = [];
      let lo = 0,
        hi = Infinity,
        head = false;
      const q: any = {
        select: (columns: string, opt: any = {}) => {
          head = Boolean(opt.head);
          m.calls.push({ table, columns, head });
          return q;
        },
        order: () => q,
        range: (a: number, b: number) => {
          m.ranges.push([a, b]);
          lo = a;
          hi = b;
          return q;
        },
        limit: (n: number) => {
          hi = n - 1;
          return q;
        },
        eq: (k: string, v: any) => {
          filters.push((r) => r[k] === v);
          return q;
        },
        in: (k: string, v: any[]) => {
          filters.push((r) => v.includes(r[k]));
          return q;
        },
        not: (k: string, _op: string, _v: any) => {
          filters.push((r) => r[k] != null);
          return q;
        },
        gt: (k: string, v: any) => {
          filters.push((r) => r[k] > v);
          return q;
        },
        gte: (k: string, v: any) => {
          filters.push((r) => Date.parse(r[k]) >= Date.parse(v));
          return q;
        },
        lte: (k: string, v: any) => {
          filters.push((r) => Date.parse(r[k]) <= Date.parse(v));
          return q;
        },
        then: (yes: any, no: any) => {
          const all = (m.data[table] || []).filter((r) => filters.every((f) => f(r)));
          // Simulate a server result limit lower than the requested 500, with exact count.
          return Promise.resolve({
            data: head ? null : all.slice(lo, Math.min(hi + 1, lo + 2)),
            count: all.length,
            error: m.errors[table] ? { message: m.errors[table] } : null,
          }).then(yes, no);
        },
      };
      return q;
    },
  },
}));
import { ADMIN_ITEM_ANALYSIS_SELECT, getItemAnalysis } from './admin.settings';
const directSubject = {
  id: 's1',
  name: 'General Knowledge',
  exams: { id: 'e1', title: 'Real Exam' },
};
const question = {
  id: 'q1',
  question_text: 'Real question',
  subject_id: 's1',
  chapter_id: 'c1',
  subjects: directSubject,
  chapters: { id: 'c1', name: 'Actual Chapter', subjects: directSubject },
  difficulty: 'medium',
  correct_option: 'A',
  option_a: 'A',
  option_b: 'B',
};
const answer = (id: string, selected: string | null, correct = false) => ({
  id,
  question_id: 'q1',
  created_at: '2026-10-07T04:30:00Z',
  selected_option: selected,
  is_correct: correct,
  time_spent_seconds: 20,
  questions: structuredClone(question),
});
beforeEach(() => {
  m.data = { attempt_answers: [answer('a1', 'A', true), answer('a2', 'B'), answer('a3', null)] };
  m.errors = {};
  m.calls = [];
  m.ranges = [];
});
describe('Schema-correct Dashboard item analysis', () => {
  it('disambiguates chapter instead of topic and routes exams through real subject foreign keys', async () => {
    await getItemAnalysis();
    const select = m.calls[0].columns;
    expect(select).toBe(ADMIN_ITEM_ANALYSIS_SELECT);
    expect(select).toContain('chapters:chapters!questions_chapter_id_fkey');
    expect(select).not.toContain('questions_topic_id_fkey');
    expect(select).toContain('subjects:subjects!questions_subject_id_fkey');
    expect(select).toContain('subjects:subjects!chapters_subject_id_fkey');
    expect(select.match(/exams:exams!subjects_exam_id_fkey/g)).toHaveLength(2);
  });
  it('retains real question, chapter and exam labels and aggregates all server pages', async () => {
    const [r] = await getItemAnalysis();
    expect(r).toMatchObject({
      questionId: 'q1',
      chapterId: 'c1',
      chapterName: 'Actual Chapter',
      examId: 'e1',
      examTitle: 'Real Exam',
      subjectId: 's1',
      subjectName: 'General Knowledge',
      totalAttempts: 3,
      correctCount: 1,
      wrongCount: 1,
      skippedCount: 1,
      accuracyRate: 33.3,
    });
    expect(m.ranges).toEqual([
      [0, 499],
      [2, 501],
    ]);
  });
  it('filters by the actual exam derived through the subject hierarchy', async () => {
    expect(await getItemAnalysis({ examId: 'e1' })).toHaveLength(1);
    expect(await getItemAnalysis({ examId: 'unrelated' })).toHaveLength(0);
  });
  it('falls back to the chapter parent when the question has no subject assignment', async () => {
    m.data.attempt_answers[0].questions.subjects = null;
    m.data.attempt_answers[0].questions.subject_id = null;
    m.data.attempt_answers = [m.data.attempt_answers[0]];
    const [r] = await getItemAnalysis();
    expect(r).toMatchObject({
      subjectId: 's1',
      subjectName: 'General Knowledge',
      examId: 'e1',
      examTitle: 'Real Exam',
    });
  });
  it('keeps unassigned questions without fabricating an exam', async () => {
    const a = answer('a1', 'A', true);
    (a.questions as any).subjects = null;
    (a.questions as any).chapters = null;
    m.data.attempt_answers = [a];
    const [r] = await getItemAnalysis();
    expect(r.questionId).toBe('q1');
    expect(r.examId).toBeUndefined();
    expect(r.examTitle).toBeUndefined();
  });
  it('applies exact reporting bounds and distinguishes an empty range from failed reads', async () => {
    expect(
      await getItemAnalysis({ startIso: '2026-10-08T00:00:00Z', endIso: '2026-10-08T23:59:59Z' })
    ).toEqual([]);
    m.errors.attempt_answers = 'permission denied';
    await expect(getItemAnalysis()).rejects.toThrow('permission denied');
  });
});
