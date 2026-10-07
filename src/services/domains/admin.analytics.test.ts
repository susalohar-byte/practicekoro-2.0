import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  data: {} as Record<string, any[]>,
  errors: {} as Record<string, string>,
  calls: [] as any[],
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
import { aggregateAnalytics, analyticsRange, getAuthoritativeAnalytics } from './admin.analytics';
const stamp = '2026-10-07T10:00:00Z';
const profile = {
  id: 's',
  role: 'student',
  full_name: 'Student',
  email: 's@example.test',
  created_at: stamp,
};
const attempt = { id: 'a', user_id: 's', status: 'completed', score: 2, created_at: stamp };
const answer = (id: string, correct: boolean, selected: string | null = 'A') => ({
  id,
  attempt_id: 'a',
  question_id: 'q',
  selected_option: selected,
  is_correct: correct,
  created_at: stamp,
  test_attempts: { user_id: 's' },
  questions: {
    id: 'q',
    question_text: 'Real question',
    subject_id: 'subject',
    chapter_id: 'topic',
    subjects: { name: 'Subject' },
    chapters: { name: 'Topic' },
  },
});
describe('Authoritative Analytics', () => {
  beforeEach(() => {
    m.data = {};
    m.errors = {};
    m.calls = [];
  });
  it('maps presets and rejects invalid custom ranges', () => {
    expect(analyticsRange('7d').daysCount).toBe(7);
    expect(() => analyticsRange('custom', '2026-10-08', '2026-10-07')).toThrow();
  });
  it('computes actual new students, answered questions, accuracy, revenue and distinct Pro students', () => {
    const b = analyticsRange('custom', '2026-10-07', '2026-10-07');
    const x = aggregateAnalytics(
      b,
      [profile, { ...profile, id: 'admin', role: 'admin' }],
      [attempt, { ...attempt, id: 'admin-att', user_id: 'admin' }],
      [answer('1', true), answer('2', false), answer('3', false, null)],
      [
        {
          id: 'p',
          user_id: 's',
          amount: 100,
          refund_amount: 20,
          status: 'completed',
          created_at: stamp,
        },
        { id: 'pending', amount: 999, status: 'pending', created_at: stamp },
      ],
      [
        { user_id: 's', status: 'active', expires_at: '2099-01-01' },
        { user_id: 's', status: 'active', expires_at: '2099-01-01' },
        { user_id: 'admin', status: 'active', expires_at: '2099-01-01' },
      ]
    );
    expect(x.studentPerformance).toMatchObject({
      totalStudents: 1,
      newStudents: 1,
      testsAttempted: 1,
      questionsAnswered: 2,
      overallAccuracy: 50,
      activeStudents: 1,
    });
    expect(x.revenue).toMatchObject({ totalRevenue: 80, paidStudents: 1, activeSubscriptions: 1 });
    expect(x.questionInsights.weakestSubjects[0]).toMatchObject({
      totalQuestionsAttempted: 2,
      accuracyRate: 50,
    });
    expect(x.studentRankings[0]).toMatchObject({
      questionsAttempted: 2,
      correctCount: 1,
      totalScore: 2,
    });
  });
  it('never fabricates records, percentages or all-time empty trend history', () => {
    const x = aggregateAnalytics(analyticsRange('all_time'), [], [], [], [], []);
    expect(x.studentPerformance.totalStudents).toBe(0);
    expect(x.studentRankings).toEqual([]);
    expect(x.revenue.revenueTrend).toEqual([]);
  });
  it('excludes out-of-range records and keeps real zero accuracy', () => {
    const x = aggregateAnalytics(
      analyticsRange('custom', '2026-10-07', '2026-10-07'),
      [profile],
      [attempt, { ...attempt, id: 'old', created_at: '2025-01-01' }],
      [answer('1', false)],
      [{ id: 'old', amount: 99, status: 'completed', created_at: '2025-01-01' }],
      []
    );
    expect(x.studentPerformance.testsAttempted).toBe(1);
    expect(x.questionInsights.weakestTopics[0].accuracyRate).toBe(0);
    expect(x.revenue.totalRevenue).toBe(0);
  });
  it('reads every server page, filters dates and students, and rejects table errors', async () => {
    m.data.profiles = Array.from({ length: 7 }, (_, i) => ({ ...profile, id: `s${i}` }));
    m.data.test_attempts = [{ ...attempt, user_id: 's0' }];
    const x = await getAuthoritativeAnalytics('custom', '2026-10-07', '2026-10-07');
    expect(m.calls.find(c => c.table === 'attempt_answers').columns).toContain('chapters:chapters!questions_chapter_id_fkey');
    expect(x.studentPerformance.totalStudents).toBe(7);
    expect(x.studentPerformance.newStudents).toBe(7);
    expect(x.studentPerformance.testsAttempted).toBe(1);
    m.errors.attempt_answers = 'permission denied';
    await expect(getAuthoritativeAnalytics('custom', '2026-10-07', '2026-10-07')).rejects.toThrow(
      'permission denied'
    );
  });
});
