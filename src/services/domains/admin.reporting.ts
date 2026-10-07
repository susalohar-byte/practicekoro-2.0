import { isSupabaseConfigured, supabaseRuntime as supabase } from '@/lib/supabase';
import type { AdminDashboardV2Stats, DateRangeRevenueStats } from '@/types';
import {
  getDateRangeBounds,
  getKolkataDateString,
  parseKolkataStartOfDay,
  parseKolkataEndOfDay,
  generateChartBuckets,
  type DateRangeBounds,
} from './admin.dashboard';

/** Every read is authorized by the caller's Supabase session/RLS; never a service key. */
export async function readCompleteQuery(build: () => any): Promise<any[]> {
  const rows: any[] = [];
  let expected: number | null = null;
  do {
    const { data, error, count } = await build().range(rows.length, rows.length + 499);
    if (error) throw new Error(error.message);
    if (!Array.isArray(data) || typeof count !== 'number')
      throw new Error('The backend did not confirm a complete reporting result.');
    if (expected !== null && count !== expected)
      throw new Error('Reporting records changed during loading. Please retry.');
    expected = count;
    if (!data.length && rows.length < count)
      throw new Error('Reporting data was truncated. Please retry.');
    rows.push(...data);
  } while (expected !== null && rows.length < expected);
  return rows;
}
function rows(table: string, columns: string, filter: (q: any) => any = (q) => q) {
  return readCompleteQuery(() => {
    let query = supabase.from(table).select(columns, { count: 'exact' });
    query =
      table === 'test_exams'
        ? query.order('test_id', { ascending: true }).order('exam_id', { ascending: true })
        : query.order('id', { ascending: true });
    return filter(query);
  });
}
async function count(table: string, filter: (q: any) => any = (q) => q): Promise<number> {
  const r = await filter(supabase.from(table).select('*', { count: 'exact', head: true }));
  if (r.error) throw new Error(r.error.message);
  if (typeof r.count !== 'number') throw new Error(`${table} count was not confirmed.`);
  return r.count;
}
const within = (value: string, b: DateRangeBounds) =>
  Date.parse(value) >= Date.parse(b.startIso) && Date.parse(value) <= Date.parse(b.endIso);
export function netPaymentAmount(p: any): number {
  if (p.status !== 'completed') return 0; // fully refunded, pending and failed contribute no retained revenue
  return (
    (Math.round(Number(p.amount || 0) * 100) - Math.round(Number(p.refund_amount || 0) * 100)) / 100
  );
}
export interface DashboardPeriod {
  newStudents: number;
  activeStudents: number;
  testsAttempted: number;
  completedTests: number;
  questionsAnswered: number;
  netRevenue: number;
  previous: Omit<
    DashboardPeriod,
    'previous' | 'growthSeries' | 'attemptSeries' | 'revenueSeries' | 'attemptCounts'
  > | null;
  growthSeries: { label: string; newStudents: number; activeStudents: number }[];
  attemptSeries: { label: string; totalAttempts: number; uniqueStudents: number }[];
  revenueSeries: { label: string; amount: number; highlighted: boolean }[];
  attemptCounts: Record<string, number>;
}
export function aggregateDashboardPeriod(
  b: DateRangeBounds,
  profiles: any[],
  attempts: any[],
  answers: any[],
  payments: any[]
): DashboardPeriod {
  const summarize = (range: DateRangeBounds) => {
    const a = attempts.filter((r) => within(r.created_at, range));
    return {
      newStudents: profiles.filter((r) => within(r.created_at, range)).length,
      activeStudents: new Set(a.map((r) => r.user_id).filter(Boolean)).size,
      testsAttempted: a.length,
      completedTests: a.filter((r) => r.status === 'completed').length,
      questionsAnswered: answers.filter(
        (r) => r.selected_option != null && within(r.created_at, range)
      ).length,
      netRevenue:
        payments
          .filter((r) => within(r.created_at, range))
          .reduce((n, r) => n + Math.round(netPaymentAmount(r) * 100), 0) / 100,
    };
  };
  const current = summarize(b);
  const previous =
    b.prevStartIso && b.prevEndIso
      ? summarize({ ...b, startIso: b.prevStartIso, endIso: b.prevEndIso })
      : null;
  // All-time charts start at the earliest actual event, not a made-up 1970 history.
  const dated = [...profiles, ...attempts, ...answers, ...payments]
    .filter((r) => within(r.created_at, b))
    .map((r) => Date.parse(r.created_at));
  const chartStart =
    b.isAllTime && dated.length
      ? parseKolkataStartOfDay(
          getKolkataDateString(
            new Date(dated.reduce((min, value) => Math.min(min, value), Infinity))
          )
        ).toISOString()
      : b.startIso;
  const buckets = b.isAllTime && !dated.length ? [] : generateChartBuckets(chartStart, b.endIso, 7);
  const growthSeries = buckets.map((k) => {
    const a = attempts.filter(
      (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
    );
    return {
      label: k.label,
      newStudents: profiles.filter(
        (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
      ).length,
      activeStudents: new Set(a.map((r) => r.user_id).filter(Boolean)).size,
    };
  });
  const attemptSeries = buckets.map((k) => {
    const a = attempts.filter(
      (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
    );
    return {
      label: k.label,
      totalAttempts: a.length,
      uniqueStudents: new Set(a.map((r) => r.user_id).filter(Boolean)).size,
    };
  });
  const revenueSeries = buckets.map((k) => ({
    label: k.label,
    amount:
      payments
        .filter((r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs)
        .reduce((n, r) => n + Math.round(netPaymentAmount(r) * 100), 0) / 100,
    highlighted: false,
  }));
  const attemptCounts: Record<string, number> = {};
  for (const a of attempts.filter((r) => within(r.created_at, b)))
    if (a.test_id) attemptCounts[a.test_id] = (attemptCounts[a.test_id] || 0) + 1;
  return { ...current, previous, growthSeries, attemptSeries, revenueSeries, attemptCounts };
}
export async function getDashboardPeriodData(b: DateRangeBounds): Promise<DashboardPeriod> {
  if (!isSupabaseConfigured) return aggregateDashboardPeriod(b, [], [], [], []);
  const start = b.prevStartIso || b.startIso;
  const filter = (q: any) => q.gte('created_at', start).lte('created_at', b.endIso);
  const [p, a, r, m] = await Promise.all([
    rows('profiles', 'id, created_at', (q) => filter(q.eq('role', 'student'))),
    rows('test_attempts', 'id, user_id, test_id, status, created_at', filter),
    rows('attempt_answers', 'id, selected_option, created_at', (q) =>
      filter(q.not('selected_option', 'is', null))
    ),
    rows('payments', 'id, amount, refund_amount, status, created_at', (q) =>
      filter(q.in('status', ['completed', 'refunded']))
    ),
  ]);
  return aggregateDashboardPeriod(b, p, a, r, m);
}
export async function getDashboardOverview(): Promise<AdminDashboardV2Stats> {
  const now = new Date();
  const today = getDateRangeBounds('Today');
  const month = getDateRangeBounds('This Month');
  const year = parseKolkataStartOfDay(getKolkataDateString(now).slice(0, 4) + '-01-01').getTime();
  const [totalStudents, totalExams, totalQuestions, tests, subs, payments, period] =
    await Promise.all([
      count('profiles', (q) => q.eq('role', 'student')),
      count('exams'),
      count('questions'),
      rows('tests', 'id, test_type'),
      rows('subscriptions', 'id, user_id', (q) =>
        q.eq('status', 'active').gt('expires_at', now.toISOString())
      ),
      rows('payments', 'id, amount, refund_amount, status, created_at', (q) =>
        q.in('status', ['completed', 'refunded'])
      ),
      getDashboardPeriodData(getDateRangeBounds('Last 30 Days')),
    ]);
  const revenueSince = (time: number) =>
    payments
      .filter((p) => Date.parse(p.created_at) >= time)
      .reduce((n, p) => n + Math.round(netPaymentAmount(p) * 100), 0) / 100;
  const proStudents = new Set(subs.map((s) => s.user_id)).size;
  return {
    totalStudents,
    newStudents: period.newStudents,
    activeStudents: period.activeStudents,
    totalRevenue: revenueSince(0),
    todayRevenue: revenueSince(Date.parse(today.startIso)),
    monthRevenue: revenueSince(Date.parse(month.startIso)),
    yearRevenue: revenueSince(year),
    freeStudents: Math.max(0, totalStudents - proStudents),
    proStudents,
    activeSubscriptions: subs.length,
    testsAttempted: await count('test_attempts'),
    completedTests: await count('test_attempts', (q) => q.eq('status', 'completed')),
    questionsAnswered: await count('attempt_answers', (q) => q.not('selected_option', 'is', null)),
    totalExams,
    totalTests: tests.length,
    topicTests: tests.filter((t) => ['topic', 'chapter_mock', 'subject_mock'].includes(t.test_type))
      .length,
    fullMockTests: tests.filter((t) => t.test_type === 'full_mock').length,
    pyqTests: tests.filter((t) => t.test_type === 'pyq').length,
    totalQuestions,
    topicQuestions: await count('questions', (q) => q.eq('source_type', 'topic')),
    fullMockQuestions: await count('questions', (q) => q.eq('source_type', 'other')),
    pyqQuestions: await count('questions', (q) => q.eq('source_type', 'pyq')),
    revenueTrend: [],
    recentActivity: [],
  };
}
/** Accept full ISO bounds without converting them through the browser's timezone. */
export async function getAuthoritativeRevenueRange(
  start?: string,
  end?: string,
  preset = 'this_month'
): Promise<DateRangeRevenueStats> {
  const presets: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7d': 'Last 7 Days',
    last_7_days: 'Last 7 Days',
    this_month: 'This Month',
    '30d': 'Last 30 Days',
    last_30_days: 'Last 30 Days',
    all_time: 'All Time',
  };
  let b = getDateRangeBounds(presets[preset] || 'This Month');
  if (preset === 'this_year')
    b = getDateRangeBounds(
      'Custom Range',
      getKolkataDateString(new Date()).slice(0, 4) + '-01-01',
      getKolkataDateString(new Date())
    );
  if (preset === 'custom') {
    if (!start) throw new Error('Start date is required.');
    const s = start.includes('T') ? new Date(start) : parseKolkataStartOfDay(start);
    const e = end
      ? end.includes('T')
        ? new Date(end)
        : parseKolkataEndOfDay(end)
      : parseKolkataEndOfDay(getKolkataDateString(new Date()));
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()) || s > e)
      throw new Error('Choose a valid reporting date range.');
    b = {
      startIso: s.toISOString(),
      endIso: e.toISOString(),
      label: 'Custom Range',
      daysCount: Math.round((e.getTime() - s.getTime() + 1) / 86400000),
      isAllTime: false,
    };
  }
  const filter = (q: any) => q.gte('created_at', b.startIso).lte('created_at', b.endIso);
  const [payments, profiles] = await Promise.all([
    rows('payments', 'id, amount, refund_amount, status, created_at', (q) =>
      filter(q.in('status', ['completed', 'refunded']))
    ),
    rows('profiles', 'id, created_at', (q) => filter(q.eq('role', 'student'))),
  ]);
  const earliest = [...payments, ...profiles].map((r) => Date.parse(r.created_at));
  const startDay =
    b.isAllTime && earliest.length
      ? getKolkataDateString(
          new Date(earliest.reduce((min, value) => Math.min(min, value), Infinity))
        )
      : getKolkataDateString(new Date(b.startIso));
  const endDay = getKolkataDateString(new Date(b.endIso));
  const paymentDays = new Map<string, { cents: number; transactions: number }>();
  const signupDays = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status !== 'completed') continue;
    const date = getKolkataDateString(new Date(payment.created_at));
    const bucket = paymentDays.get(date) || { cents: 0, transactions: 0 };
    bucket.cents += Math.round(netPaymentAmount(payment) * 100);
    bucket.transactions++;
    paymentDays.set(date, bucket);
  }
  for (const profile of profiles) {
    const date = getKolkataDateString(new Date(profile.created_at));
    signupDays.set(date, (signupDays.get(date) || 0) + 1);
  }
  const dailyTrend = [];
  let day = parseKolkataStartOfDay(startDay).getTime();
  if (!b.isAllTime || earliest.length)
    while (day <= Date.parse(b.endIso)) {
      const date = getKolkataDateString(new Date(day));
      const bucket = paymentDays.get(date);
      dailyTrend.push({
        date,
        label: new Date(day).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          month: 'short',
          day: 'numeric',
        }),
        amount: (bucket?.cents || 0) / 100,
        transactions: bucket?.transactions || 0,
        signups: signupDays.get(date) || 0,
      });
      day += 86400000;
    }
  const totalRevenue =
    payments.reduce((n, p) => n + Math.round(netPaymentAmount(p) * 100), 0) / 100;
  const transactions = payments.filter((p) => p.status === 'completed').length;
  const avgOrderValue = transactions ? totalRevenue / transactions : 0;
  return {
    startDate: startDay,
    endDate: endDay,
    preset: preset as any,
    label: b.label,
    totalRevenue,
    totalTransactions: transactions,
    transactionCount: transactions,
    avgOrderValue,
    averageOrderValue: avgOrderValue,
    newStudentSignups: profiles.length,
    newSignupsCount: profiles.length,
    dailyTrend,
  };
}

export async function getDashboardSystemActivity(b: DateRangeBounds) {
  if (!isSupabaseConfigured) return [];
  const latest = async (table: string, columns: string, filter: (q: any) => any = (q) => q) => {
    const r = await filter(
      supabase
        .from(table)
        .select(columns)
        .gte('created_at', b.startIso)
        .lte('created_at', b.endIso)
        .order('created_at', { ascending: false })
        .limit(20)
    );
    if (r.error) throw new Error(r.error.message);
    if (!Array.isArray(r.data)) throw new Error('Activity response was not confirmed.');
    return r.data as any[];
  };
  const [payments, subs, profiles, tests, exams] = await Promise.all([
    latest('payments', 'id, amount, status, created_at', (q) => q.eq('status', 'completed')),
    latest('subscriptions', 'id, status, created_at'),
    latest('profiles', 'id, created_at', (q) => q.eq('role', 'student')),
    latest('tests', 'id, title, created_at'),
    latest('exams', 'id, title, created_at'),
  ]);
  return [
    ...payments.map((p) => ({
      id: p.id,
      type: 'payment',
      description: `Payment recorded: ₹${Number(p.amount).toLocaleString('en-IN')}`,
      timestamp: p.created_at,
    })),
    ...subs.map((s) => ({
      id: s.id,
      type: 'subscription',
      description: 'Subscription record created',
      timestamp: s.created_at,
    })),
    ...profiles.map((p) => ({
      id: p.id,
      type: 'registration',
      description: 'Student registered',
      timestamp: p.created_at,
    })),
    ...tests.map((t) => ({
      id: t.id,
      type: 'test_created',
      description: `Test created: ${t.title}`,
      timestamp: t.created_at,
    })),
    ...exams.map((e) => ({
      id: e.id,
      type: 'exam_created',
      description: `Exam configured: ${e.title}`,
      timestamp: e.created_at,
    })),
  ];
}
export async function getDashboardExamAttemptCounts(
  attemptCounts: Record<string, number>
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  const [tests, links] = await Promise.all([
    rows('tests', 'id, exam_id'),
    rows('test_exams', 'test_id, exam_id'),
  ]);
  const pairs = new Set<string>();
  const totals: Record<string, number> = {};
  for (const t of [...tests.map((t) => ({ test_id: t.id, exam_id: t.exam_id })), ...links]) {
    const pair = JSON.stringify([t.test_id, t.exam_id]);
    if (!t.exam_id || pairs.has(pair)) continue;
    pairs.add(pair);
    totals[t.exam_id] = (totals[t.exam_id] || 0) + (attemptCounts[t.test_id] || 0);
  }
  return totals;
}
export const adminReportingApi = {
  getDashboardPeriodData,
  getDashboardSystemActivity,
  getDashboardExamAttemptCounts,
  getDashboardLeaderboard,
  getDashboardAuditLogs,
};

export async function getDashboardLeaderboard(b: DateRangeBounds) {
  if (!isSupabaseConfigured) return [];
  // The deployed student leaderboard only accepts a lower bound. Do not silently
  // present it as an end-bounded historical leaderboard.
  const attempts = await rows(
    'test_attempts',
    'id, user_id, score, total_marks, status, created_at',
    (q) => q.gte('created_at', b.startIso).lte('created_at', b.endIso).eq('status', 'completed')
  );
  const users: Record<string, { total: number; n: number }> = {};
  for (const a of attempts)
    if (a.user_id && Number(a.total_marks) > 0) {
      const u = users[a.user_id] || (users[a.user_id] = { total: 0, n: 0 });
      u.total += (Number(a.score) / Number(a.total_marks)) * 100;
      u.n++;
    }
  const ids = Object.keys(users);
  if (!ids.length) return [];
  const profiles: any[] = [];
  for (let i = 0; i < ids.length; i += 100)
    profiles.push(
      ...(await rows('profiles', 'id, full_name, district', (q) =>
        q.eq('role', 'student').in('id', ids.slice(i, i + 100))
      ))
    );
  return profiles
    .map((p) => ({
      display_name: p.full_name || 'Student',
      district: p.district,
      average_percentage: users[p.id].total / users[p.id].n,
      tests_count: users[p.id].n,
    }))
    .sort(
      (a, b) =>
        b.average_percentage - a.average_percentage || a.display_name.localeCompare(b.display_name)
    )
    .slice(0, 5)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
export async function getDashboardAuditLogs(b: DateRangeBounds) {
  if (!isSupabaseConfigured) return { logs: [] };
  const r = await supabase
    .from('admin_audit_logs')
    .select('id, entity_id, action, admin_name, details, created_at')
    .gte('created_at', b.startIso)
    .lte('created_at', b.endIso)
    .order('created_at', { ascending: false })
    .limit(200);
  if (r.error) throw new Error(r.error.message);
  if (!Array.isArray(r.data)) throw new Error('Audit feed was not confirmed.');
  return {
    logs: r.data.map((r) => ({
      id: r.id,
      entityId: r.entity_id,
      action: r.action,
      adminName: r.admin_name,
      details: r.details,
      createdAt: r.created_at,
    })),
  };
}
