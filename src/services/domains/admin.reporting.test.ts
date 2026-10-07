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
import {
  getDashboardPeriodData,
  getAuthoritativeRevenueRange,
  getDashboardOverview,
  getDashboardExamAttemptCounts,
  getDashboardLeaderboard,
  readCompleteQuery,
  netPaymentAmount,
} from './admin.reporting';
import {
  getDateRangeBounds,
  getKolkataDateString,
  generateChartBuckets,
  normalizeActivityItems,
} from './admin.dashboard';
const b = getDateRangeBounds('Custom Range', '2026-10-07', '2026-10-08');
const time = '2026-10-06T19:30:00Z'; // Oct 7, 01:00 Kolkata, not Oct 6
beforeEach(() => {
  m.data = {
    profiles: [
      { id: 'u1', role: 'student', full_name: 'Learner', district: 'Kolkata', created_at: time },
      { id: 'u2', role: 'student', created_at: '2026-10-08T06:00:00Z' },
      { id: 'staff', role: 'admin', created_at: time },
    ],
    test_attempts: [
      {
        id: 'a1',
        user_id: 'u1',
        test_id: 't1',
        status: 'completed',
        created_at: time,
        score: 40,
        total_marks: 100,
        accuracy: 60,
      },
      {
        id: 'a2',
        user_id: 'u1',
        test_id: 't1',
        status: 'completed',
        created_at: '2026-10-08T06:00:00Z',
        score: 80,
        total_marks: 100,
        accuracy: 80,
      },
    ],
    attempt_answers: [
      { id: 'r1', selected_option: 'A', created_at: time },
      { id: 'r2', selected_option: 'B', created_at: '2026-10-08T06:00:00Z' },
      { id: 'skip', selected_option: null, created_at: time },
    ],
    payments: [
      { id: 'p1', status: 'completed', amount: 100, refund_amount: 30, created_at: time },
      { id: 'p2', status: 'refunded', amount: 50, refund_amount: 50, created_at: time },
      { id: 'pending', status: 'pending', amount: 999, created_at: time },
    ],
    tests: [{ id: 't1', title: 'Test', exam_id: 'e1', test_type: 'full_mock' }],
    exams: [{ id: 'e1' }],
    questions: [],
    subscriptions: [],
    test_exams: [
      { test_id: 't1', exam_id: 'e1' },
      { test_id: 't1', exam_id: 'e2' },
    ],
  };
  m.errors = {};
  m.calls = [];
});
describe('authoritative Dashboard reporting regressions', () => {
  it('aggregates real temporal signups, distinct students, answers and retained revenue', async () => {
    const r = await getDashboardPeriodData(b);
    expect(r).toMatchObject({
      newStudents: 2,
      activeStudents: 1,
      testsAttempted: 2,
      completedTests: 2,
      questionsAnswered: 2,
      netRevenue: 70,
      attemptCounts: { t1: 2 },
    });
    expect(r.growthSeries.map((x) => x.newStudents)).toEqual([1, 1]);
    expect(r.attemptSeries.map((x) => x.totalAttempts)).toEqual([1, 1]);
    expect(r.revenueSeries.map((x) => x.amount)).toEqual([70, 0]);
  });
  it('compares actual previous-period events instead of scaling current totals', async () => {
    m.data.profiles.push({ id: 'prev', role: 'student', created_at: '2026-10-05T06:00:00Z' });
    const r = await getDashboardPeriodData(b);
    expect(r.previous?.newStudents).toBe(1);
    expect(r.newStudents).toBe(2);
  });
  it('rejects reporting permission errors, not false zero totals', async () => {
    m.errors.payments = 'Payments denied';
    await expect(getDashboardPeriodData(b)).rejects.toThrow('Payments denied');
  });
  it('pages through a capped response until the confirmed exact count is loaded', async () => {
    m.data.profiles = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      role: 'student',
      created_at: time,
    }));
    const r = await getDashboardPeriodData(b);
    expect(r.newStudents).toBe(7);
    expect(m.calls.filter((c) => c.table === 'profiles').length).toBeGreaterThan(1);
  });
  it('never treats a truncated or unconfirmed response as complete', async () => {
    await expect(
      readCompleteQuery(() => ({ range: async () => ({ data: [], count: 5, error: null }) }))
    ).rejects.toThrow('truncated');
    await expect(
      readCompleteQuery(() => ({ range: async () => ({ data: [], count: null, error: null }) }))
    ).rejects.toThrow('confirm');
  });
  it('counts an answered response only when a selected option is recorded', async () => {
    m.data.attempt_answers = [];
    expect((await getDashboardPeriodData(b)).questionsAnswered).toBe(0);
  });
  it('keeps all-time historical payments rather than substituting this year', async () => {
    m.data.payments.push({
      id: 'historic',
      status: 'completed',
      amount: 200,
      refund_amount: 0,
      created_at: '2020-01-01T10:00:00Z',
    });
    const r = await getAuthoritativeRevenueRange(undefined, undefined, 'all_time');
    expect(r.totalRevenue).toBe(270);
    expect(r.startDate).toBe('2020-01-01');
  });
  it('preserves full Kolkata ISO boundaries and returns net, not gross revenue', async () => {
    const r = await getAuthoritativeRevenueRange(b.startIso, b.endIso, 'custom');
    expect(r.startDate).toBe('2026-10-07');
    expect(r.totalRevenue).toBe(70);
    expect(r.dailyTrend[0].amount).toBe(70);
    expect(r.newSignupsCount).toBe(2);
  });
  it('propagates date-range financial and signup read errors', async () => {
    m.errors.profiles = 'Profiles denied';
    await expect(getAuthoritativeRevenueRange(b.startIso, b.endIso, 'custom')).rejects.toThrow(
      'Profiles denied'
    );
  });
  it('excludes failed, pending and fully refunded revenue and preserves actual zero', () => {
    expect(netPaymentAmount({ status: 'failed', amount: 100 })).toBe(0);
    expect(netPaymentAmount({ status: 'pending', amount: 100 })).toBe(0);
    expect(netPaymentAmount({ status: 'completed', amount: 0, refund_amount: 0 })).toBe(0);
    expect(netPaymentAmount({ status: 'completed', amount: 99.99, refund_amount: 9.99 })).toBe(90);
  });
  it('deduplicates owning and shared test/exam links without losing linked exam credits', async () => {
    expect(await getDashboardExamAttemptCounts({ t1: 2 })).toEqual({ e1: 2, e2: 2 });
  });
  it('derives ranking attempt counts from attempts, not a missing catalog field', async () => {
    const r = await getDashboardPeriodData(b);
    expect(r.attemptCounts.t1).toBe(2);
    expect((m.data.tests[0] as any).attemptsCount).toBeUndefined();
  });
  it('computes an end-bounded completed-student leaderboard', async () => {
    m.data.test_attempts.push({
      id: 'future',
      user_id: 'u1',
      score: 100,
      total_marks: 100,
      status: 'completed',
      created_at: '2026-10-09T06:00:00Z',
    });
    const r = await getDashboardLeaderboard(b);
    expect(r[0].average_percentage).toBe(60);
    expect(r[0].tests_count).toBe(2);
  });
  it('produces real overview counts and net revenue without relying on the old RPC', async () => {
    const r = await getDashboardOverview();
    expect(r.totalStudents).toBe(2);
    expect(r.totalRevenue).toBe(70);
    expect(r.questionsAnswered).toBe(2);
  });
  it('overview answer read errors are not hidden by attempt-count fallbacks', async () => {
    m.errors.attempt_answers = 'Answers denied';
    await expect(getDashboardOverview()).rejects.toThrow('Answers denied');
  });
  it('assigns every boundary event to one calendar bucket only', () => {
    const k = generateChartBuckets(b.startIso, b.endIso, 7);
    expect(k).toHaveLength(2);
    expect(k[1].startMs).toBe(k[0].endMs + 1);
    expect(getKolkataDateString(new Date(k[0].startMs))).toBe('2026-10-07');
  });
  it('validates reversed and malformed custom ranges', () => {
    expect(() => getDateRangeBounds('Custom Range', '2026-10-08', '2026-10-07')).toThrow(
      'valid date range'
    );
    expect(() => getDateRangeBounds('Custom Range', '2026-02-30', '2026-03-01')).toThrow();
  });
  it('compares month-to-date with an equally long preceding period', () => {
    const r = getDateRangeBounds('This Month');
    expect(Date.parse(r.endIso) - Date.parse(r.startIso)).toBe(
      Date.parse(r.prevEndIso!) - Date.parse(r.prevStartIso!)
    );
  });
  it('keeps distinct events with the same ID and deduplicates exact entity/category/timestamp duplicates', () => {
    const a = [
      { id: 'same', type: 'registration', description: 'Joined', timestamp: time },
      {
        id: 'same',
        type: 'subscription',
        description: 'Activated',
        timestamp: '2026-10-08T06:00:00Z',
      },
    ];
    expect(normalizeActivityItems(a)).toHaveLength(2);
    expect(normalizeActivityItems([...a, a[0]])).toHaveLength(2);
  });
});
