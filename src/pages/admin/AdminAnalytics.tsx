import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { analyticsRange } from '@/services/domains/admin.analytics';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';
import { AdminMoneyChart } from '@/components/admin/AdminMoneyChart';
import type { DateRangePreset, PlatformAnalyticsData } from '@/types';

export function analyticsCsv(data: PlatformAnalyticsData, period: string) {
  const rows = [
    ['Metric', 'Value', 'Scope'],
    ['Total students', data.studentPerformance.totalStudents, 'Current student profiles'],
    ['New students', data.studentPerformance.newStudents ?? 'Unavailable', period],
    ['Active students', data.studentPerformance.activeStudents, period],
    ['Tests started', data.studentPerformance.testsAttempted, period],
    ['Answered questions', data.studentPerformance.questionsAnswered, period],
    ['Accuracy (%)', data.studentPerformance.overallAccuracy, period],
    ['Retained revenue (INR)', data.revenue.totalRevenue, period],
    ['Distinct paying students', data.revenue.paidStudents, period],
    ['Active Pro students', data.revenue.activeSubscriptions, 'Current unexpired subscriptions'],
  ];
  return rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export const AdminAnalytics = () => {
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const today = getKolkataDateString(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
  const [loadedPeriod, setLoadedPeriod] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const range = useMemo(() => {
    try {
      return analyticsRange(preset, start, end);
    } catch {
      return null;
    }
  }, [preset, start, end]);
  const period = range
    ? `${getKolkataDateString(new Date(range.startIso))} → ${getKolkataDateString(new Date(range.endIso))} (Asia/Kolkata)`
    : '';
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setData(null);
    setExpanded({});
    if (!range) {
      setError('Choose a valid start date on or before the end date.');
      setLoading(false);
      return;
    }
    api
      .getPlatformAnalyticsOverview(
        preset,
        preset === 'custom' ? start : undefined,
        preset === 'custom' ? end : undefined
      )
      .then((result) => {
        if (active) {
          setData(result);
          setLoadedPeriod(period);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Analytics could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [preset, start, end, reload, range, period]);
  const download = () => {
    if (!data || loading || error || loadedPeriod !== period) return;
    const url = URL.createObjectURL(
      new Blob([analyticsCsv(data, loadedPeriod)], { type: 'text/csv;charset=utf-8;' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `PracticeKoro_Analytics_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const card =
    'bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs';
  const showAll = (name: string, length: number) =>
    length > 5 && (
      <button
        className="text-blue-600 text-xs"
        onClick={() => setExpanded((s) => ({ ...s, [name]: !s[name] }))}
      >
        {expanded[name] ? 'Show fewer' : 'View All'}
      </button>
    );
  const visible = <T,>(name: string, items: T[]) => (expanded[name] ? items : items.slice(0, 5));
  return (
    <div className="space-y-5 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Analytics & Insights</h1>
          <p className="text-sm text-slate-500">Recorded student, content and revenue activity.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs">
            Reporting period{' '}
            <select
              aria-label="Reporting period"
              className="border rounded-lg p-2"
              value={preset}
              onChange={(e) => setPreset(e.target.value as DateRangePreset)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </label>
          {preset === 'custom' && (
            <>
              <label className="text-xs">
                Start date{' '}
                <input
                  aria-label="Start date"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label className="text-xs">
                End date{' '}
                <input
                  aria-label="End date"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
            </>
          )}
          <button
            disabled={!data || loading || !!error || loadedPeriod !== period}
            onClick={download}
            className="border rounded-xl p-2 text-xs disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </header>
      <p className="text-xs text-slate-500">
        {period}. Activity and revenue use the selected period. Total students and active Pro
        students are current snapshots. Retained revenue excludes pending/failed payments and
        recorded refunds; it is not a refund cash-flow report.
      </p>
      {loading && <p role="status">Loading complete analytics records…</p>}
      {error && (
        <div role="alert" className="rounded-xl p-4 border border-red-200 text-red-700">
          Analytics unavailable: {error}{' '}
          <button
            onClick={() => setReload((v) => v + 1)}
            className="ml-3 underline inline-flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Total Students', data.studentPerformance.totalStudents],
              ['New Students', data.studentPerformance.newStudents ?? 'Unavailable'],
              ['Active Students', data.studentPerformance.activeStudents],
              ['Tests Started', data.studentPerformance.testsAttempted],
              ['Questions Answered', data.studentPerformance.questionsAnswered],
              [
                'Overall Accuracy',
                data.studentPerformance.questionsAnswered
                  ? `${data.studentPerformance.overallAccuracy}%`
                  : 'No answered questions',
              ],
              ['Retained Revenue', `₹${data.revenue.totalRevenue.toLocaleString('en-IN')}`],
              ['Active Pro Students', data.revenue.activeSubscriptions],
            ].map(([label, value]) => (
              <section key={label} className={card}>
                <h2 className="text-xs text-slate-500">{label}</h2>
                <p className="text-xl font-bold mt-2">{value}</p>
              </section>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <section className={card}>
              <h2 className="font-bold mb-3">Revenue by Period</h2>
              <AdminMoneyChart
                points={data.revenue.revenueTrend.map((p) => ({
                  label: p.label,
                  revenue: p.amount,
                }))}
              />
            </section>
            <section className={card}>
              <h2 className="font-bold mb-3">Recorded Test Activity</h2>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr>
                    <th>Period starting</th>
                    <th>Tests started</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentPerformance.performanceTrend.map((p) => (
                    <tr key={p.date} className="border-t">
                      <th className="py-3 text-left font-medium">{p.label}</th>
                      <td>{p.attemptsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.studentPerformance.performanceTrend.some((p) => p.attemptsCount) && (
                <p className="text-xs mt-3 text-slate-500">No tests started in this period.</p>
              )}
            </section>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            {(['subjects', 'topics'] as const).map((name) => {
              const items =
                name === 'subjects'
                  ? data.questionInsights.weakestSubjects.map((s) => ({
                      id: s.subjectId,
                      name: s.subjectName,
                      count: s.totalQuestionsAttempted,
                      accuracy: s.accuracyRate,
                    }))
                  : data.questionInsights.weakestTopics.map((t) => ({
                      id: t.chapterId,
                      name: t.chapterName,
                      count: t.totalQuestionsAttempted,
                      accuracy: t.accuracyRate,
                    }));
              return (
                <section key={name} className={card}>
                  <div className="flex justify-between mb-3">
                    <h2 className="font-bold">
                      Weakest {name === 'subjects' ? 'Subjects' : 'Topics'}
                    </h2>
                    {showAll(name, items.length)}
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Accuracy</th>
                        <th>Answered questions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible(name, items).map((i) => (
                        <tr key={i.id} className="border-t">
                          <th className="py-3 font-medium text-left">{i.name}</th>
                          <td>{i.accuracy}%</td>
                          <td>{i.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!items.length && (
                    <p className="text-xs mt-3 text-slate-500">
                      No recorded answered questions with available {name}.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
          <section className={card}>
            <div className="flex justify-between mb-3">
              <h2 className="font-bold">Student Rankings</h2>
              {showAll('students', data.studentRankings.length)}
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Completed-attempt score totals, then recorded answer accuracy. No synthetic trends or
              inactive demo students.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Tests started</th>
                    <th>Answered questions</th>
                    <th>Accuracy</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {visible('students', data.studentRankings).map((s) => (
                    <tr key={s.userId} className="border-t">
                      <td className="py-3">{s.rank}</td>
                      <th className="text-left font-medium">{s.name}</th>
                      <td>{s.totalTests}</td>
                      <td>{s.questionsAttempted}</td>
                      <td>{s.questionsAttempted ? `${s.accuracy}%` : 'Unavailable'}</td>
                      <td>{s.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.studentRankings.length && (
              <p className="text-xs mt-3 text-slate-500">
                No recorded student activity in this period.
              </p>
            )}
          </section>
          <section className={card}>
            <div className="flex justify-between mb-3">
              <h2 className="font-bold">Most Wrong Questions</h2>
              {showAll('questions', data.questionInsights.mostWrongQuestions.length)}
            </div>
            {visible('questions', data.questionInsights.mostWrongQuestions).map((q) => (
              <div key={q.questionId} className="border-t py-3 text-xs">
                <p className="font-semibold">{q.questionText}</p>
                <p>
                  {q.wrongCount} wrong of {q.totalAttempts} answered · {q.accuracyRate}% accuracy
                </p>
              </div>
            ))}
            {!data.questionInsights.mostWrongQuestions.length && (
              <p className="text-xs text-slate-500">
                No recorded question analysis for this period.
              </p>
            )}
          </section>
          <div className="grid lg:grid-cols-2 gap-5">
            <section className={card}>
              <h2 className="font-bold mb-3">Student Growth</h2>
              <p className="text-xs text-slate-500 mb-3">
                Actual new registrations during the selected period.
              </p>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr>
                    <th>Period starting</th>
                    <th>New students</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenue.revenueTrend.map((p) => (
                    <tr key={p.date} className="border-t">
                      <th className="py-3 text-left font-medium">{p.label}</th>
                      <td>{p.signups}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className={card}>
              <h2 className="font-bold mb-3">Student District Distribution</h2>
              <p className="text-xs text-slate-500 mb-3">
                Current student profiles, including unspecified districts. Not a selected-period
                activity count.
              </p>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.demographics?.districts || []).map((d) => (
                    <tr key={d.district} className="border-t">
                      <th className="py-3 text-left font-medium">{d.district}</th>
                      <td>{d.studentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.demographics?.districts.length && (
                <p className="text-xs text-slate-500">No district data available.</p>
              )}
            </section>
          </div>
          <section className={card}>
            <h2 className="font-bold mb-2">Unavailable Analytics Features</h2>
            <p className="text-xs text-slate-500 mb-3">
              Gender distributions and historical subject trends are not available in this report.
              No estimates are displayed. Practice-pack delivery requires a dedicated targeting and
              delivery workflow.
            </p>
            <button disabled className="border rounded-lg p-2 text-xs opacity-50">
              Dispatch Topic Practice Pack — unavailable
            </button>
          </section>
        </>
      )}
    </div>
  );
};
