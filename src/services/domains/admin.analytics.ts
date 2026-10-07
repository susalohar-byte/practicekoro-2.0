import { supabaseRuntime as supabase } from '@/lib/supabase';
import type {
  DateRangePreset,
  PlatformAnalyticsData,
  StudentRankRow,
  QuestionInsightRow,
} from '@/types';
import { readCompleteQuery, netPaymentAmount } from './admin.reporting';
import {
  getDateRangeBounds,
  getKolkataDateString,
  generateChartBuckets,
  type DateRangeBounds,
} from './admin.dashboard';

export function analyticsRange(
  preset: DateRangePreset,
  start?: string,
  end?: string
): DateRangeBounds {
  const names: Partial<Record<DateRangePreset, string>> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7d': 'Last 7 Days',
    last_7_days: 'Last 7 Days',
    '30d': 'Last 30 Days',
    last_30_days: 'Last 30 Days',
    this_month: 'This Month',
    all_time: 'All Time',
    custom: 'Custom Range',
  };
  if (preset === 'this_year') {
    const today = getKolkataDateString(new Date());
    return getDateRangeBounds('Custom Range', `${today.slice(0, 4)}-01-01`, today);
  }
  return getDateRangeBounds(names[preset] || 'Last 30 Days', start, end);
}
const inRange = (r: any, b: DateRangeBounds) =>
  Date.parse(r.created_at) >= Date.parse(b.startIso) &&
  Date.parse(r.created_at) <= Date.parse(b.endIso);
const rate = (correct: number, total: number) =>
  total ? Math.round((correct / total) * 1000) / 10 : 0;

/** Complete authorized rows only: no secret/service key, no simulated production metrics. */
export async function getAuthoritativeAnalytics(
  preset: DateRangePreset,
  start?: string,
  end?: string
): Promise<PlatformAnalyticsData> {
  const b = analyticsRange(preset, start, end);
  const read = (table: string, columns: string, filter: (q: any) => any = (q) => q) =>
    readCompleteQuery(() =>
      filter(
        supabase.from(table).select(columns, { count: 'exact' }).order('id', { ascending: true })
      )
    );
  const dated = (q: any) => q.gte('created_at', b.startIso).lte('created_at', b.endIso);
  const [profiles, attempts, answers, payments, subscriptions] = await Promise.all([
    read('profiles', 'id,full_name,email,role,created_at,district', (q) => q.eq('role', 'student')),
    read('test_attempts', 'id,user_id,status,score,created_at', dated),
    read(
      'attempt_answers',
      'id,attempt_id,question_id,selected_option,is_correct,created_at,test_attempts!inner(user_id),questions(id,question_text,question_bengali_text,difficulty,subject_id,chapter_id,subjects:subjects!questions_subject_id_fkey(id,name),chapters:chapters!questions_chapter_id_fkey(id,name))',
      (q) => dated(q).not('selected_option', 'is', null)
    ),
    read('payments', 'id,user_id,amount,refund_amount,status,created_at', dated),
    read('subscriptions', 'id,user_id,status,expires_at', (q) =>
      q.eq('status', 'active').gt('expires_at', new Date().toISOString())
    ),
  ]);
  return aggregateAnalytics(b, profiles, attempts, answers, payments, subscriptions);
}

export function aggregateAnalytics(
  b: DateRangeBounds,
  profiles: any[],
  attempts: any[],
  answers: any[],
  payments: any[],
  subscriptions: any[]
): PlatformAnalyticsData {
  profiles = profiles.filter((p) => p.role === 'student');
  const students = new Map(profiles.map((p) => [p.id, p]));
  attempts = attempts.filter((a) => students.has(a.user_id) && inRange(a, b));
  const owner = (a: any) =>
    (Array.isArray(a.test_attempts) ? a.test_attempts[0] : a.test_attempts)?.user_id;
  answers = answers.filter(
    (a) => a.selected_option != null && students.has(owner(a)) && inRange(a, b)
  );
  payments = payments.filter((p) => inRange(p, b));
  const pro = new Set(
    subscriptions
      .filter(
        (s) =>
          s.status === 'active' && Date.parse(s.expires_at) > Date.now() && students.has(s.user_id)
      )
      .map((s) => s.user_id)
  );
  const perStudent = new Map<string, StudentRankRow>();
  const entry = (id: string) => {
    if (!perStudent.has(id)) {
      const p = students.get(id)!;
      perStudent.set(id, {
        rank: 0,
        userId: id,
        name: p.full_name || 'Unnamed student',
        email: p.email || '',
        totalTests: 0,
        questionsAttempted: 0,
        correctCount: 0,
        accuracy: 0,
        totalScore: 0,
        isPro: pro.has(id),
      });
    }
    return perStudent.get(id)!;
  };
  for (const a of attempts) {
    const e = entry(a.user_id);
    e.totalTests++;
    if (a.status === 'completed') e.totalScore += Number(a.score || 0);
    if (!e.lastActive || Date.parse(a.created_at) > Date.parse(e.lastActive))
      e.lastActive = a.created_at;
  }
  const questionMap = new Map<string, QuestionInsightRow>();
  const topics = new Map<
    string,
    {
      chapterId: string;
      chapterName: string;
      subjectName: string;
      totalQuestionsAttempted: number;
      correct: number;
    }
  >();
  const subjects = new Map<
    string,
    { subjectId: string; subjectName: string; totalQuestionsAttempted: number; correct: number }
  >();
  for (const a of answers) {
    const e = entry(owner(a));
    e.questionsAttempted++;
    if (a.is_correct === true) e.correctCount++;
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    // Deleted/unavailable question metadata does not fabricate a question or topic name.
    if (!q) continue;
    const subject = Array.isArray(q.subjects) ? q.subjects[0] : q.subjects;
    const chapter = Array.isArray(q.chapters) ? q.chapters[0] : q.chapters;
    if (!questionMap.has(a.question_id))
      questionMap.set(a.question_id, {
        questionId: a.question_id,
        questionText: q.question_text || 'Question text unavailable',
        questionBengaliText: q.question_bengali_text,
        subjectName: subject?.name || 'Subject unavailable',
        chapterName: chapter?.name || 'Topic unavailable',
        difficulty: q.difficulty,
        totalAttempts: 0,
        wrongCount: 0,
        failureRate: 0,
        accuracyRate: 0,
      });
    const item = questionMap.get(a.question_id)!;
    item.totalAttempts++;
    if (a.is_correct === false) item.wrongCount++;
    if (a.is_correct === true) item.accuracyRate++;
    if (q.subject_id) {
      if (!subjects.has(q.subject_id))
        subjects.set(q.subject_id, {
          subjectId: q.subject_id,
          subjectName: subject?.name || 'Subject unavailable',
          totalQuestionsAttempted: 0,
          correct: 0,
        });
      const s = subjects.get(q.subject_id)!;
      s.totalQuestionsAttempted++;
      if (a.is_correct === true) s.correct++;
    }
    if (q.chapter_id) {
      if (!topics.has(q.chapter_id))
        topics.set(q.chapter_id, {
          chapterId: q.chapter_id,
          chapterName: chapter?.name || 'Topic unavailable',
          subjectName: subject?.name || 'Subject unavailable',
          totalQuestionsAttempted: 0,
          correct: 0,
        });
      const t = topics.get(q.chapter_id)!;
      t.totalQuestionsAttempted++;
      if (a.is_correct === true) t.correct++;
    }
  }
  const studentRankings = [...perStudent.values()]
    .map((s) => ({ ...s, accuracy: rate(s.correctCount, s.questionsAttempted) }))
    .sort(
      (a, c) =>
        c.totalScore - a.totalScore || c.accuracy - a.accuracy || a.userId.localeCompare(c.userId)
    )
    .map((s, i) => ({ ...s, rank: i + 1 }));
  const dated = [...profiles.filter((p) => inRange(p, b)), ...attempts, ...answers, ...payments];
  const chartStart =
    b.isAllTime && dated.length
      ? Math.min(...dated.map((r) => Date.parse(r.created_at)))
      : Date.parse(b.startIso);
  const buckets =
    b.isAllTime && !dated.length
      ? []
      : generateChartBuckets(new Date(chartStart).toISOString(), b.endIso, 8);
  const bucketRows = (rows: any[], k: (typeof buckets)[number]) =>
    rows.filter(
      (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
    );
  const correct = answers.filter((a) => a.is_correct === true).length;
  const districts = new Map<string, number>();
  for (const p of profiles) {
    const district =
      typeof p.district === 'string' && p.district.trim() ? p.district.trim() : 'Not specified';
    districts.set(district, (districts.get(district) || 0) + 1);
  }
  return {
    demographics: {
      districts: [...districts]
        .map(([district, studentCount]) => ({ district, studentCount }))
        .sort((a, b) => b.studentCount - a.studentCount || a.district.localeCompare(b.district)),
    },
    studentPerformance: {
      totalStudents: profiles.length,
      newStudents: profiles.filter((p) => inRange(p, b)).length,
      activeStudents: new Set([...attempts.map((a) => a.user_id), ...answers.map(owner)]).size,
      testsAttempted: attempts.length,
      questionsAnswered: answers.length,
      overallAccuracy: rate(correct, answers.length),
      topStudent: studentRankings[0],
      performanceTrend: buckets.map((k) => {
        const a = bucketRows(attempts, k),
          r = bucketRows(answers, k);
        return {
          date: k.dateStr,
          label: k.label,
          attemptsCount: a.length,
          averageAccuracy: rate(r.filter((x) => x.is_correct === true).length, r.length),
          averageScore: a.length
            ? a.reduce((sum, x) => sum + Number(x.score || 0), 0) / a.length
            : 0,
        };
      }),
    },
    studentRankings,
    questionInsights: {
      mostWrongQuestions: [...questionMap.values()]
        .map((q) => ({
          ...q,
          failureRate: rate(q.wrongCount, q.totalAttempts),
          accuracyRate: rate(q.accuracyRate, q.totalAttempts),
        }))
        .sort((a, c) => c.failureRate - a.failureRate || c.totalAttempts - a.totalAttempts),
      weakestTopics: [...topics.values()]
        .map(({ correct, ...t }) => ({
          ...t,
          accuracyRate: rate(correct, t.totalQuestionsAttempted),
        }))
        .sort((a, c) => a.accuracyRate - c.accuracyRate),
      weakestSubjects: [...subjects.values()]
        .map(({ correct, ...s }) => ({
          ...s,
          accuracyRate: rate(correct, s.totalQuestionsAttempted),
        }))
        .sort((a, c) => a.accuracyRate - c.accuracyRate),
    },
    revenue: {
      totalRevenue:
        payments.reduce((sum, p) => sum + Math.round(netPaymentAmount(p) * 100), 0) / 100,
      monthlyRevenue: payments
        .filter(
          (p) =>
            getKolkataDateString(new Date(p.created_at)).slice(0, 7) ===
            getKolkataDateString(new Date()).slice(0, 7)
        )
        .reduce((sum, p) => sum + netPaymentAmount(p), 0),
      paidStudents: new Set(
        payments
          .filter((p) => netPaymentAmount(p) > 0 && students.has(p.user_id))
          .map((p) => p.user_id)
      ).size,
      activeSubscriptions: pro.size,
      revenueTrend: buckets.map((k) => {
        const p = bucketRows(payments, k);
        return {
          date: k.dateStr,
          label: k.label,
          amount: p.reduce((sum, x) => sum + Math.round(netPaymentAmount(x) * 100), 0) / 100,
          transactions: p.filter((x) => x.status === 'completed').length,
          signups: bucketRows(profiles, k).length,
        };
      }),
    },
  };
}
