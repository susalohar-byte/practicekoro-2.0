import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Play,
  Award,
  BookOpen,
  Crown,
  Search,
  CheckCircle2,
  RotateCcw,
  Eye,
  FileText,
  Layers,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Target,
} from 'lucide-react';
import type { MockTest, TestSeries, TestAttempt, TestSeriesAnalytics } from '@/types';

type CategoryTab = 'all' | 'full_mock' | 'topic' | 'pyq';
type StatusFilter = 'all' | 'unattempted' | 'completed';

export const TestSeriesDetail: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user, isPro } = useAuth();

  const [series, setSeries] = useState<TestSeries | null>(null);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [analytics, setAnalytics] = useState<TestSeriesAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startingTestId, setStartingTestId] = useState<string | null>(null);

  // Pro Pass Subscription Modal State
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedLockedTest, setSelectedLockedTest] = useState<MockTest | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!seriesId) return;
      try {
        setLoading(true);
        setAnalytics(null);
        setAnalyticsError(false);
        // Load all test series to find the matching series by ID or slug
        const allSeries = await api.getStudentTestSeries();
        const found = allSeries.find((s) => s.id === seriesId || s.slug === seriesId);

        if (found) {
          if (mounted) setSeries(found);
          const [seriesTests, report] = await Promise.all([
            api.getSeriesTestsForStudent(found.id),
            api.getTestSeriesAnalytics(found.id).catch((err) => {
              console.error('Failed to load test series analytics:', err);
              if (mounted) setAnalyticsError(true);
              return null;
            }),
          ]);
          const myAttempts = user?.id
            ? await api.getUserAttempts(
                user.id,
                seriesTests.map((test) => test.id)
              )
            : [];
          if (mounted) {
            setTests(seriesTests);
            setAttempts(myAttempts);
            setAnalytics(report);
          }
        }
      } catch (err) {
        console.error('Failed to load test series detail:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [seriesId, user]);

  // Map latest attempt by test ID
  const latestAttemptMap = useMemo(() => {
    const map = new Map<string, TestAttempt>();
    attempts.forEach((a) => {
      const existing = map.get(a.testId);
      if (!existing || new Date(a.createdAt || 0) > new Date(existing.createdAt || 0)) {
        map.set(a.testId, a);
      }
    });
    return map;
  }, [attempts]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const all = tests.length;
    const fullMock = tests.filter((t) => t.testType === 'full_mock').length;
    const topic = tests.filter(
      (t) =>
        t.testType === 'topic' || t.testType === 'chapter_mock' || t.testType === 'subject_mock'
    ).length;
    const pyq = tests.filter((t) => t.testType === 'pyq').length;
    return { all, fullMock, topic, pyq };
  }, [tests]);

  // Filtered tests
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // 1. Category Tab
      if (activeTab === 'full_mock' && test.testType !== 'full_mock') return false;
      if (
        activeTab === 'topic' &&
        !(
          test.testType === 'topic' ||
          test.testType === 'chapter_mock' ||
          test.testType === 'subject_mock'
        )
      ) {
        return false;
      }
      if (activeTab === 'pyq' && test.testType !== 'pyq') return false;

      // 2. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = test.title.toLowerCase().includes(q);
        const matchesSubject = (test.subjectName || '').toLowerCase().includes(q);
        const matchesChapter = (test.chapterName || '').toLowerCase().includes(q);
        const matchesPaper = (test.paperName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesChapter && !matchesPaper) {
          return false;
        }
      }

      // 3. Status filter
      const attempt = latestAttemptMap.get(test.id);
      const isCompleted = attempt && attempt.status === 'completed';
      if (statusFilter === 'completed' && !isCompleted) return false;
      if (statusFilter === 'unattempted' && isCompleted) return false;

      return true;
    });
  }, [tests, activeTab, searchTerm, statusFilter, latestAttemptMap]);

  // Completed count for progress bar
  const completedCount = useMemo(() => {
    return tests.filter((t) => {
      const a = latestAttemptMap.get(t.id);
      return a && a.status === 'completed';
    }).length;
  }, [tests, latestAttemptMap]);

  const completionPercent =
    tests.length > 0 ? Math.round((completedCount / tests.length) * 100) : 0;
  const seriesSummary = analytics;
  const trendPoints = seriesSummary?.trend.slice(-12) ?? [];
  const maxTrend = Math.max(100, ...trendPoints.map((point) => point.percentage));
  const testTypeLabels: Record<string, string> = {
    full_mock: 'Full Mock',
    pyq: 'Previous Year Questions',
    topic_test: 'Subject & Topic Tests',
    live_test: 'Live Tests',
  };

  // Handle test start
  const handleStartTest = async (test: MockTest) => {
    const isLocked = test.isPremium && !isPro;
    if (isLocked) {
      setSelectedLockedTest(test);
      setShowSubscriptionModal(true);
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: { pathname: `/exams/${test.id}/runner` } } });
      return;
    }

    if (startingTestId) return;

    try {
      setStartingTestId(test.id);
      const attemptInfo = await api.startTestAttempt(test.id);
      navigate(`/exams/${test.id}/runner?attemptId=${attemptInfo.attemptId}`);
    } catch (err) {
      console.error('Failed to start test attempt:', err);
      alert('Failed to initialize test attempt. Please try again.');
    } finally {
      setStartingTestId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans transition-colors">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="h-48 bg-slate-200 dark:bg-slate-800/80 rounded-3xl animate-pulse" />
          <div className="h-14 bg-slate-200 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-slate-200 dark:bg-slate-800/80 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Test Series Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The requested test series could not be found or has been deactivated by administration.
          </p>
          <button
            type="button"
            onClick={() => navigate('/test-series')}
            className="px-5 py-2.5 bg-[#0158FC] hover:bg-[#0047D4] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Test Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans transition-colors">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── 0. BREADCRUMBS & BACK LINK ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <Link
              to="/"
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Home
            </Link>
            <span className="text-slate-300 dark:text-slate-600">&gt;</span>
            <Link
              to="/test-series"
              className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Test Series
            </Link>
            <span className="text-slate-300 dark:text-slate-600">&gt;</span>
            <span className="text-slate-800 dark:text-slate-100 font-bold truncate max-w-[200px] sm:max-w-xs">
              {series.title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/test-series')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Series</span>
          </button>
        </div>

        {/* ── 1. SERIES HEADER BANNER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0158FC] via-[#0b48c2] to-[#1e1b4b] text-white p-6 sm:p-8 shadow-xl shadow-blue-500/10">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider text-blue-100">
                  {series.examTitle || 'Government Exam'}
                </span>
                {series.isPremium ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 backdrop-blur-md border border-amber-300/30 text-xs font-black uppercase tracking-wider text-amber-300">
                    <Crown className="w-3.5 h-3.5" />
                    Pro Pass Exclusive
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-400/20 backdrop-blur-md border border-emerald-300/30 text-xs font-black uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Free Series
                  </span>
                )}
              </div>

              {/* Progress pill */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-2xl self-start sm:self-auto">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-blue-200">Your Progress</p>
                  <p className="text-xs font-black text-white">
                    {completedCount} of {tests.length} Completed ({completionPercent}%)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-w-3xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                {series.title}
              </h1>
              {series.description && (
                <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed">
                  {series.description}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            {/* Quick meta stats */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-blue-100/90">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-300" />
                {tests.length} Total Mock Tests
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-300" />
                {tabCounts.fullMock} Full Length Mocks
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-300" />
                {tabCounts.topic} Topic Drills
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-300" />
                {tabCounts.pyq} Official PYQ Papers
              </span>
            </div>
          </div>
        </div>

        {/* ── SERIES PERFORMANCE: computed from the student's saved attempts ── */}
        <section aria-labelledby="series-performance-title" className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0158FC]" />
            <h2
              id="series-performance-title"
              className="text-lg font-black text-slate-900 dark:text-white"
            >
              Series Performance
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: 'Overall score',
                value: analyticsError
                  ? '—'
                  : `${(seriesSummary?.overallScorePercent ?? 0).toFixed(1)}%`,
              },
              {
                label: 'Average score',
                value: analyticsError
                  ? '—'
                  : `${(seriesSummary?.averageScorePercent ?? 0).toFixed(1)}%`,
              },
              {
                label: 'Accuracy',
                value: analyticsError
                  ? '—'
                  : `${(seriesSummary?.accuracyPercent ?? 0).toFixed(1)}%`,
              },
              {
                label: 'Best score',
                value: analyticsError
                  ? '—'
                  : `${(seriesSummary?.bestScorePercent ?? 0).toFixed(1)}%`,
              },
              {
                label: 'Tests completed',
                value: analyticsError
                  ? '—'
                  : `${seriesSummary?.testsAttempted ?? completedCount} / ${seriesSummary?.totalTests ?? tests.length}`,
              },
              {
                label: 'Completion',
                value: analyticsError
                  ? '—'
                  : `${(seriesSummary?.completionPercent ?? completionPercent).toFixed(1)}%`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {analyticsError && (
            <p
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Series analytics could not be loaded. Your individual test history is still available
              below.
            </p>
          )}
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Overall score weights each test by its marks using your latest completed attempt.
            Accuracy is correct answers divided by attempted questions.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Performance Trend
                </h3>
              </div>
              {trendPoints.length === 0 ? (
                <p className="py-5 text-sm text-slate-500 dark:text-slate-400">
                  Complete a test to start your series performance trend.
                </p>
              ) : (
                <div
                  className="flex h-32 items-end gap-2 overflow-x-auto border-b border-slate-100 pb-2 dark:border-slate-800"
                  role="img"
                  aria-label="Test score trend, chronological"
                >
                  {trendPoints.map((point, index) => (
                    <div
                      key={point.attemptId}
                      className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-1"
                      title={`${point.testTitle}: ${point.percentage.toFixed(1)}%`}
                    >
                      <span className="text-[9px] font-bold text-slate-500">
                        {Math.round(point.percentage)}%
                      </span>
                      <div
                        className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-[#0158FC] to-[#0198FD]"
                        style={{ height: `${Math.max(4, (point.percentage / maxTrend) * 82)}%` }}
                      />
                      <span className="text-[9px] font-semibold text-slate-400">{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#0158FC]" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Performance by Test Type
                </h3>
              </div>
              {(seriesSummary?.testTypeBreakdown ?? []).length === 0 ? (
                <p className="py-5 text-sm text-slate-500 dark:text-slate-400">
                  Test type analysis will appear after your first completed test.
                </p>
              ) : (
                <div className="space-y-3">
                  {seriesSummary!.testTypeBreakdown
                    .filter((item) => item.testsAttempted > 0)
                    .map((item) => (
                      <div key={item.type}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {testTypeLabels[item.type] ?? item.type}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {item.testsAttempted} tests · {item.averageScorePercent.toFixed(1)}% avg
                            · {item.bestScorePercent.toFixed(1)}% best ·{' '}
                            {item.accuracyPercent.toFixed(1)}% accuracy
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-[#0198FD]"
                            style={{
                              width: `${Math.min(100, Math.max(0, item.averageScorePercent))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {seriesSummary?.subjects.length ||
          seriesSummary?.weakTopics.length ||
          seriesSummary?.history.length ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-3 text-sm font-extrabold text-slate-900 dark:text-white">
                  Subject Performance
                </h3>
                {seriesSummary?.subjects.length ? (
                  <div className="space-y-2">
                    {seriesSummary.subjects.map((subject) => (
                      <div
                        key={subject.subjectId}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                          {subject.subjectName}
                        </span>
                        <span className="font-black text-[#0158FC]">
                          {subject.accuracyPercent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Subject stats appear when answer data is available.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Needs Improvement
                  </h3>
                </div>
                {seriesSummary?.weakTopics.length ? (
                  <div className="space-y-2">
                    {seriesSummary.weakTopics.map((topic) => (
                      <div key={topic.topicId} className="text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-100">
                          {topic.subjectName} · {topic.topicName}
                        </p>
                        <p className="text-amber-700 dark:text-amber-300">
                          {topic.accuracyPercent.toFixed(1)}% accuracy · {topic.questionsAttempted}{' '}
                          attempted
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    No weak topic has enough attempt data to report yet.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-3 text-sm font-extrabold text-slate-900 dark:text-white">
                  Your Improvement Report
                </h3>
                {seriesSummary?.weakTopics.length ? (
                  <>
                    <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">
                      Focus practice on these topics, then take the related topic tests and another
                      full mock.
                    </p>
                    <ol className="list-inside list-decimal space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {seriesSummary.weakTopics.slice(0, 3).map((topic) => (
                        <li key={topic.topicId}>
                          {topic.subjectName} — {topic.topicName}
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Complete tests with subject and topic data to receive evidence-based practice
                    suggestions.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {!!seriesSummary?.history.length && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Test History
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {seriesSummary.history.map((item) => (
                  <div
                    key={item.attemptId}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                        {item.testTitle}
                      </p>
                      <p className="text-slate-500">
                        {new Date(item.completedAt).toLocaleDateString()} · {item.correctCount}{' '}
                        correct · {item.wrongCount} wrong · {item.skippedCount} skipped · −
                        {item.negativeMarks.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-[#0158FC]">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/exams/${item.testId}/results/${item.attemptId}`)}
                        className="font-bold text-[#0158FC] hover:underline"
                      >
                        View result
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── 2. CATEGORY TABS & CONTROLS ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* 4 Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Tests', count: tabCounts.all, emoji: '🌟' },
                { id: 'full_mock', label: 'Full Mocks', count: tabCounts.fullMock, emoji: '🎯' },
                { id: 'topic', label: 'Topic & Chapter', count: tabCounts.topic, emoji: '⚡' },
                { id: 'pyq', label: 'Official PYQ', count: tabCounts.pyq, emoji: '📜' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as CategoryTab)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-[#0158FC] text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status Filter */}
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto text-xs font-bold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unattempted')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'unattempted'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Unattempted
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-500 text-white shadow-xs font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Search bar inside tests */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests in this series by test name, paper, or chapter..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0158FC] transition-all"
            />
          </div>
        </div>

        {/* ── 3. TESTS LIST ── */}
        {filteredTests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0158FC] dark:text-blue-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                No Tests Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {searchTerm
                  ? `No test in this series matched "${searchTerm}". Try another keyword.`
                  : 'No tests available under this category yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredTests.map((test) => {
              const attempt = latestAttemptMap.get(test.id);
              const isCompleted = attempt && attempt.status === 'completed';
              const isInProgress = attempt && attempt.status === 'in_progress';
              const isLocked = test.isPremium && !isPro;

              return (
                <div
                  key={test.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-5 sm:p-6 shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                    isCompleted
                      ? 'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : isLocked
                        ? 'border-amber-200/80 dark:border-amber-900/50'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  {/* Left: Test Details */}
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Test Type Badge */}
                      {test.testType === 'full_mock' && (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          🎯 Full Mock
                        </span>
                      )}
                      {test.testType === 'pyq' && (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          📜 Official PYQ {test.year ? `• ${test.year}` : ''}
                        </span>
                      )}
                      {(test.testType === 'topic' ||
                        test.testType === 'chapter_mock' ||
                        test.testType === 'subject_mock') && (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          ⚡ Topic Drill
                        </span>
                      )}

                      {/* Access Badge */}
                      {test.isPremium ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Crown className="w-2.5 h-2.5 text-amber-500" />
                          Pro Pass
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Free Starter
                        </span>
                      )}

                      {/* Completed Pill */}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Attempted
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                      {test.title}
                    </h3>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {test.durationMinutes} Mins
                      </span>
                      <span>•</span>
                      <span>{test.totalQuestions} Questions</span>
                      <span>•</span>
                      <span>{test.totalMarks} Marks</span>
                      {test.negativeMarking > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            -{test.negativeMarking} Negative
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>Online CBT</span>
                    </div>

                    {/* Result breakdown if attempted */}
                    {isCompleted && attempt && (
                      <div className="pt-2 flex items-center gap-3 text-xs font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                          Score: {attempt.score ?? 0} / {test.totalMarks}
                        </span>
                        {attempt.accuracy !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                            Accuracy: {Math.round(attempt.accuracy)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isCompleted && attempt ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/exams/${test.id}/solutions/${attempt.id}`)}
                          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold text-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Solutions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartTest(test)}
                          className="px-4 py-2.5 rounded-xl bg-[#0158FC] hover:bg-[#0047D4] text-white font-extrabold text-xs transition-colors inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reattempt</span>
                        </button>
                      </div>
                    ) : isInProgress && attempt ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/exams/${test.id}/runner?attemptId=${attempt.id}`)}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs transition-colors inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Test</span>
                      </button>
                    ) : isLocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLockedTest(test);
                          setShowSubscriptionModal(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs transition-colors inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Unlock with Pro Pass</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={startingTestId === test.id}
                        onClick={() => handleStartTest(test)}
                        className="px-5 py-2.5 rounded-xl bg-[#0158FC] hover:bg-[#0047D4] text-white font-extrabold text-xs transition-colors inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{startingTestId === test.id ? 'Starting...' : 'Start Test'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 4. SUBSCRIPTION MODAL ── */}
        {showSubscriptionModal && selectedLockedTest && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center overflow-y-auto p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-amber-200 dark:border-amber-800/60 relative">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Crown className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Pro Pass Exclusive
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                  {selectedLockedTest.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This mock test is part of the premium PracticeKoro Test Series.
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                    PracticeKoro Pro Pass
                  </span>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                    ₹299 / 365 Days
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                  One Pro Pass unlocks all Full Mocks, PYQ papers, and Topic Tests across all Bengal
                  & Central exams.
                </p>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 pt-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Access all premium mock tests & test series</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Mistakes Notebook & detailed step-by-step solutions</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Unlimited re-attempts across all test series</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubscriptionModal(false);
                    navigate('/subscription');
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all text-center block"
                >
                  Get Pro Pass — ₹299
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="w-full py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition-colors"
                >
                  Continue with Free Tests
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
