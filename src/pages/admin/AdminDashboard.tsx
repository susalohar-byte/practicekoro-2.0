import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Users,
  User,
  FileText,
  Database,
  Crown,
  IndianRupee,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { AdminDashboardV2Stats, Exam, MockTest } from '@/types';
import { cn } from '@/lib/utils';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import type { DashboardPeriod } from '@/services/domains/admin.reporting';
import {
  getDateRangeBounds,
  calculatePeriodGrowth,
  type DateRangeBounds,
} from '@/services/domains/admin.dashboard';

export const AdminDashboard: React.FC = () => {
  // ─── DATE RANGE FILTER STATE ───
  const [dateRangePreset, setDateRangePreset] = useState('Last 30 Days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [appliedCustomStart, setAppliedCustomStart] = useState('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // Timeframe states for individual charts
  const [studentGrowthRange, setStudentGrowthRange] = useState('Last 30 Days');
  const [testAttemptsRange, setTestAttemptsRange] = useState('Last 30 Days');
  const [revenueRange, setRevenueRange] = useState('Last 30 Days');

  // Hover states for tooltips
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(null);
  const [hoveredGrowthIndex, setHoveredGrowthIndex] = useState<number | null>(null);
  const [hoveredAttemptIndex, setHoveredAttemptIndex] = useState<number | null>(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Live Database Sync States
  const [stats, setStats] = useState<AdminDashboardV2Stats | null>(null);
  const [dbExams, setDbExams] = useState<Exam[]>([]);
  const [dbTests, setDbTests] = useState<MockTest[]>([]);
  const [dbLeaderboard, setDbLeaderboard] = useState<any[]>([]);
  const [periodData, setPeriodData] = useState<DashboardPeriod | null>(null);
  const [chartPeriods, setChartPeriods] = useState<{
    growth: DashboardPeriod;
    attempts: DashboardPeriod;
    revenue: DashboardPeriod;
  } | null>(null);
  const [examAttemptCounts, setExamAttemptCounts] = useState<Record<string, number>>({});
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [customDateError, setCustomDateError] = useState('');

  // Sequence token to prevent out-of-order race conditions
  const requestIdRef = useRef(0);

  // Compute effective date bounds in Asia/Kolkata timezone
  const dateBounds: DateRangeBounds = useMemo(() => {
    return getDateRangeBounds(
      dateRangePreset,
      appliedCustomStart || undefined,
      appliedCustomEnd || undefined
    );
  }, [dateRangePreset, appliedCustomStart, appliedCustomEnd]);
  // Load real backend data
  const loadPlatformData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(null);

    try {
      const bounds = getDateRangeBounds(
        dateRangePreset,
        appliedCustomStart || undefined,
        appliedCustomEnd || undefined
      );

      // Share identical period queries inside a refresh; chart selectors use real bounds.
      const cache = new Map<string, Promise<DashboardPeriod>>();
      const periodFor = (range: string) => {
        const b = getDateRangeBounds(
          range,
          range === 'Custom Range' ? appliedCustomStart : undefined,
          range === 'Custom Range' ? appliedCustomEnd : undefined
        );
        const key = JSON.stringify(b);
        if (!cache.has(key)) cache.set(key, api.getDashboardPeriodData(b));
        return cache.get(key)!;
      };
      const [
        statsRes,
        examsRes,
        testsRes,
        lbRes,
        currentPeriod,
        growthPeriod,
        attemptPeriod,
        revenuePeriod,
      ] = await Promise.all([
        api.getAdminDashboardV2Stats(),
        api.getAllAdminExams(),
        api.getAllAdminTests(),
        api.getDashboardLeaderboard(bounds),
        periodFor(dateRangePreset),
        periodFor(studentGrowthRange),
        periodFor(testAttemptsRange),
        periodFor(revenueRange),
      ]);
      const counts = await api.getDashboardExamAttemptCounts(currentPeriod.attemptCounts);
      if (currentRequestId !== requestIdRef.current) return;
      // Publish one complete snapshot. A failed section preserves the previous complete one.
      setStats(statsRes);
      setDbExams(examsRes);
      setDbTests(
        testsRes.map((test) => ({
          ...test,
          attemptsCount: currentPeriod.attemptCounts[test.id] || 0,
        }))
      );
      setDbLeaderboard(lbRes);
      setPeriodData(currentPeriod);
      setChartPeriods({ growth: growthPeriod, attempts: attemptPeriod, revenue: revenuePeriod });
      setExamAttemptCounts(counts);
      setSnapshotLabel(bounds.label);
      setIsStale(false);
    } catch (err: any) {
      if (currentRequestId === requestIdRef.current) {
        console.error('AdminDashboard data fetch failed:', err);
        setLoadError(
          `Failed to load dashboard data. Backend did not respond. ${err?.message || 'Please retry.'}`
        );
        setIsStale(true);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    dateRangePreset,
    appliedCustomStart,
    appliedCustomEnd,
    studentGrowthRange,
    testAttemptsRange,
    revenueRange,
  ]);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  // Handle Preset Click
  const handleSelectPreset = (preset: string) => {
    setCustomDateError('');
    if (preset === 'Custom Range') {
      setShowCustomInputs(true);
      setIsDateOpen(false);
      return;
    }
    setDateRangePreset(preset);
    setStudentGrowthRange(preset);
    setTestAttemptsRange(preset);
    setRevenueRange(preset);
    setShowCustomInputs(false);
    setAppliedCustomStart('');
    setAppliedCustomEnd('');
    setIsDateOpen(false);
  };
  const handleApplyCustomDate = () => {
    try {
      getDateRangeBounds('Custom Range', customStartDate, customEndDate || customStartDate);
    } catch (error) {
      setCustomDateError(error instanceof Error ? error.message : 'Invalid date range');
      return;
    }
    setCustomDateError('');
    setAppliedCustomStart(customStartDate);
    setAppliedCustomEnd(customEndDate || customStartDate);
    setDateRangePreset('Custom Range');
    setStudentGrowthRange('Custom Range');
    setTestAttemptsRange('Custom Range');
    setRevenueRange('Custom Range');
    setIsDateOpen(false);
    setShowCustomInputs(false);
  };

  // ─── 6 TOP KPI METRIC CARDS ───
  const metricCards = useMemo(() => {
    const totalStudents = stats?.totalStudents ?? 0;
    const activeStudents = periodData?.activeStudents ?? 0;
    const testsAttempted = periodData?.testsAttempted ?? 0;
    const questionsSolved = periodData?.questionsAnswered ?? 0;
    const activeSubscriptions = stats?.activeSubscriptions ?? 0;
    const totalRevenue = periodData?.netRevenue ?? 0;

    const studentGrowth = calculatePeriodGrowth(
      periodData?.newStudents || 0,
      periodData?.previous?.newStudents,
      dateRangePreset
    );
    const activeGrowth = calculatePeriodGrowth(
      activeStudents,
      periodData?.previous?.activeStudents,
      dateRangePreset
    );
    const attemptsGrowth = calculatePeriodGrowth(
      testsAttempted,
      periodData?.previous?.testsAttempted,
      dateRangePreset
    );
    const questionsGrowth = calculatePeriodGrowth(
      questionsSolved,
      periodData?.previous?.questionsAnswered,
      dateRangePreset
    );
    const revenueGrowth = calculatePeriodGrowth(
      totalRevenue,
      periodData?.previous?.netRevenue,
      dateRangePreset
    );

    return [
      {
        id: 'total_students',
        label: 'Total Students',
        value: totalStudents.toLocaleString('en-IN'),
        trend: studentGrowth.trendStr,
        isPositive: studentGrowth.isPositive,
        vsText: `All-time students; signup growth ${studentGrowth.vsLabel}`,
        icon: Users,
        iconBg: 'bg-[#EFF6FF] dark:bg-[#1E293B]',
        iconColor: 'text-[#026BFC]',
      },
      {
        id: 'active_students',
        label: 'Active Students',
        value: activeStudents.toLocaleString('en-IN'),
        trend: activeGrowth.trendStr,
        isPositive: activeGrowth.isPositive,
        vsText: activeGrowth.vsLabel,
        icon: User,
        iconBg: 'bg-[#ECFDF5] dark:bg-[#064E3B]/40',
        iconColor: 'text-[#10B981]',
      },
      {
        id: 'tests_attempted',
        label: 'Tests Attempted',
        value: testsAttempted.toLocaleString('en-IN'),
        trend: attemptsGrowth.trendStr,
        isPositive: attemptsGrowth.isPositive,
        vsText: attemptsGrowth.vsLabel,
        icon: FileText,
        iconBg: 'bg-[#F5F3FF] dark:bg-[#4C1D95]/30',
        iconColor: 'text-[#8B5CF6]',
      },
      {
        id: 'questions_solved',
        label: 'Questions Solved',
        value: questionsSolved.toLocaleString('en-IN'),
        trend: questionsGrowth.trendStr,
        isPositive: questionsGrowth.isPositive,
        vsText: questionsGrowth.vsLabel,
        icon: Database,
        iconBg: 'bg-[#FFFBEB] dark:bg-[#78350F]/30',
        iconColor: 'text-[#F59E0B]',
      },
      {
        id: 'active_subscriptions',
        label: 'Active Subscriptions',
        value: activeSubscriptions.toLocaleString('en-IN'),
        trend: 'Active',
        isPositive: null,
        vsText: 'Point-in-time active',
        icon: Crown,
        iconBg: 'bg-[#FFF1F2] dark:bg-[#881337]/30',
        iconColor: 'text-[#F43F5E]',
      },
      {
        id: 'total_revenue',
        label: 'Total Revenue',
        value: `₹${totalRevenue.toLocaleString('en-IN')}`,
        trend: revenueGrowth.trendStr,
        isPositive: revenueGrowth.isPositive,
        vsText: `Net retained revenue; ${revenueGrowth.vsLabel}`,
        icon: IndianRupee,
        iconBg: 'bg-[#EFF6FF] dark:bg-[#1E293B]',
        iconColor: 'text-[#026BFC]',
      },
    ];
  }, [stats, dateRangePreset, periodData]);

  // ─── CHART 1: STUDENT GROWTH DATASET ───
  const studentGrowthData = useMemo(() => chartPeriods?.growth.growthSeries || [], [chartPeriods]);

  const maxGrowthStudents = useMemo(() => {
    const m = Math.max(
      ...studentGrowthData.map((d) => Math.max(d.newStudents, d.activeStudents)),
      0
    );
    return Math.max(m, 10);
  }, [studentGrowthData]);

  // ─── CHART 2: TEST ATTEMPTS DATASET (DYNAMIC SVG PATH) ───
  const testAttemptsData = useMemo(
    () => chartPeriods?.attempts.attemptSeries || [],
    [chartPeriods]
  );

  const maxAttempts = useMemo(() => {
    const m = Math.max(
      ...testAttemptsData.map((d) => Math.max(d.totalAttempts, d.uniqueStudents)),
      0
    );
    return Math.max(m, 10);
  }, [testAttemptsData]);

  // Generate SVG curve points dynamically from actual data
  const attemptsSvgPoints = useMemo(() => {
    const width = 300;
    const height = 120;
    const padX = 25;
    const padY = 20;
    const plotW = width - padX - 15;
    const plotH = height - padY - 20;
    const baselineY = height - 20;

    const n = Math.max(1, testAttemptsData.length - 1);

    const attemptsCoords = testAttemptsData.map((d, i) => {
      const cx = padX + (i / n) * plotW;
      const cy = baselineY - (d.totalAttempts / maxAttempts) * plotH;
      return { cx, cy, val: d.totalAttempts, label: d.label };
    });

    const uniqueCoords = testAttemptsData.map((d, i) => {
      const cx = padX + (i / n) * plotW;
      const cy = baselineY - (d.uniqueStudents / maxAttempts) * plotH;
      return { cx, cy, val: d.uniqueStudents, label: d.label };
    });

    const buildPath = (pts: { cx: number; cy: number }[]) => {
      if (pts.length === 0) return '';
      return pts.reduce(
        (acc, p, idx) => (idx === 0 ? `M ${p.cx},${p.cy}` : `${acc} L ${p.cx},${p.cy}`),
        ''
      );
    };

    const buildAreaPath = (pts: { cx: number; cy: number }[]) => {
      if (pts.length === 0) return '';
      const line = buildPath(pts);
      const lastX = pts[pts.length - 1].cx;
      const firstX = pts[0].cx;
      return `${line} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`;
    };

    return {
      attemptsLine: buildPath(attemptsCoords),
      attemptsArea: buildAreaPath(attemptsCoords),
      attemptsCoords,
      uniqueLine: buildPath(uniqueCoords),
      uniqueArea: buildAreaPath(uniqueCoords),
      uniqueCoords,
      baselineY,
    };
  }, [testAttemptsData, maxAttempts]);

  // ─── CHART 3: REVENUE DATASET ───
  const revenueData = useMemo(() => chartPeriods?.revenue.revenueSeries || [], [chartPeriods]);

  const maxRevenue = useMemo(() => {
    const m = Math.max(...revenueData.map((d) => d.amount), 0);
    return Math.max(m, 1000);
  }, [revenueData]);

  // ─── POPULAR EXAMS DATASET (RANKED TRUTHFULLY BY ATTEMPTS) ───
  const popularExams = useMemo(() => {
    if (!dbExams || dbExams.length === 0) return [];

    const examAttemptsList = dbExams.map((exam) => ({
      exam,
      attemptsCount: examAttemptCounts[exam.id] || 0,
    }));

    // Sort by attempts DESC, then title ASC (stable tie-breaker)
    examAttemptsList.sort((a, b) => {
      if (b.attemptsCount !== a.attemptsCount) {
        return b.attemptsCount - a.attemptsCount;
      }
      return a.exam.title.localeCompare(b.exam.title);
    });

    const totalAllExamsAttempts = examAttemptsList.reduce((acc, e) => acc + e.attemptsCount, 0);

    const colors = [
      { bg: 'bg-blue-900', badgeText: 'text-amber-400' },
      { bg: 'bg-slate-800', badgeText: 'text-slate-200' },
      { bg: 'bg-slate-700', badgeText: 'text-amber-300' },
      { bg: 'bg-red-900', badgeText: 'text-rose-200' },
      { bg: 'bg-pink-800', badgeText: 'text-pink-200' },
    ];

    return examAttemptsList.slice(0, 5).map((item, idx) => {
      const clr = colors[idx % colors.length];
      const pct =
        totalAllExamsAttempts > 0
          ? Math.min(100, Math.round((item.attemptsCount / totalAllExamsAttempts) * 100))
          : 0;

      return {
        id: item.exam.id,
        name: item.exam.title,
        slug: item.exam.slug,
        iconName: item.exam.iconName,
        attempts: `${item.attemptsCount.toLocaleString('en-IN')} attempts`,
        percentage: pct,
        code: (item.exam.title || 'EXAM').split(' ')[0],
        bg: clr.bg,
        badgeText: clr.badgeText,
      };
    });
  }, [dbExams, examAttemptCounts]);

  // ─── MOST ATTEMPTED TESTS DATASET ───
  const mostAttemptedTests = useMemo(() => {
    if (!dbTests || dbTests.length === 0) return [];

    const sortedTests = [...dbTests].sort((a, b) => {
      const countA = a.attemptsCount || 0;
      const countB = b.attemptsCount || 0;
      if (countB !== countA) return countB - countA;
      return (a.title || '').localeCompare(b.title || '');
    });

    const colors = [
      'bg-blue-50 dark:bg-blue-950/60 text-[#026BFC]',
      'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981]',
      'bg-rose-50 dark:bg-rose-950/60 text-[#F43F5E]',
      'bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B]',
      'bg-pink-50 dark:bg-pink-950/60 text-[#EC4899]',
    ];

    return sortedTests.slice(0, 5).map((test, idx) => ({
      id: test.id,
      title: test.title,
      exam: test.examTitle || (test as any).examName || 'Mock Test',
      attempts: `${(test.attemptsCount || 0).toLocaleString('en-IN')} attempts`,
      iconBg: colors[idx % colors.length],
      iconUrl: test.iconUrl,
    }));
  }, [dbTests]);

  // ─── TOP PERFORMING STUDENTS DATASET ───
  const topStudents = useMemo(() => {
    if (!dbLeaderboard || dbLeaderboard.length === 0) return [];
    return dbLeaderboard.slice(0, 5).map((st, idx) => {
      let badge: 'gold' | 'silver' | 'bronze' | 'regular' = 'regular';
      if (idx === 0) badge = 'gold';
      else if (idx === 1) badge = 'silver';
      else if (idx === 2) badge = 'bronze';
      return {
        rank: st.rank || idx + 1,
        name: st.display_name || 'Aspirant',
        location: st.district || 'Not provided',
        score: `${Math.round(st.average_percentage ?? 0)}%`,
        tests: st.tests_count ?? 0,
        badge,
      };
    });
  }, [dbLeaderboard]);

  if (!stats && loadError)
    return (
      <div className="space-y-3">
        <h1>Dashboard</h1>
        <div role="alert">{loadError}. No reporting values are available.</div>
        <button onClick={() => void loadPlatformData()}>Retry</button>
      </div>
    );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── PAGE HEADER: Title + Date Range Picker + Refresh ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            {isStale && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Stale Data
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of your PracticeKoro platform
          </p>
        </div>

        {/* Date Range Selector Pill & Reload */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPlatformData()}
            disabled={isLoading}
            title="Refresh Platform Data"
            className="p-2 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>

          <div className="relative shrink-0">
            <button
              onClick={() => setIsDateOpen(!isDateOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{dateBounds.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isDateOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-lg p-2 z-40 text-xs font-medium animate-in fade-in slide-in-from-top-1">
                {[
                  'Last 7 Days',
                  'Last 14 Days',
                  'Last 30 Days',
                  'This Month',
                  'This Quarter',
                  'All Time',
                  'Custom Range',
                ].map((range) => (
                  <button
                    key={range}
                    onClick={() => handleSelectPreset(range)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-colors',
                      dateRangePreset === range
                        ? 'bg-[#026BFC] text-white font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {range}
                  </button>
                ))}

                {showCustomInputs && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Select Date Interval:
                    </p>
                    <div className="space-y-1">
                      <input
                        type="date"
                        aria-label="Report start date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                      />
                      <input
                        type="date"
                        aria-label="Report end date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                      />
                    </div>
                    <button
                      onClick={handleApplyCustomDate}
                      className="w-full py-1.5 rounded-lg bg-[#026BFC] text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                    >
                      Apply Date Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error notification banner */}
      {loadError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={() => loadPlatformData()}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && <p role="status">Loading authoritative Dashboard data…</p>}
      {isStale && stats && (
        <p className="text-amber-700">
          Showing the last complete snapshot: {snapshotLabel}. Selected filters may not match until
          Retry succeeds.
        </p>
      )}
      {/* ─── 6 TOP KPI METRIC CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    card.iconBg,
                    card.iconColor
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {card.label}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {stats ? card.value : 'Unavailable'}
                  </span>
                  {card.trend && (
                    <span
                      className={cn(
                        'text-xs font-bold inline-flex items-center gap-0.5',
                        card.isPositive === true
                          ? 'text-[#10B981]'
                          : card.isPositive === false
                            ? 'text-rose-500'
                            : 'text-slate-400'
                      )}
                    >
                      {card.isPositive === true && (
                        <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                      )}
                      {card.isPositive === false && (
                        <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                      )}
                      {card.trend}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                  {card.vsText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── REVENUE & GROWTH ANALYTICS (CUSTOM DATE-RANGE CONTROLS) ─── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Revenue & Growth Analytics
              </h2>
              <p className="text-[11px] text-slate-500">
                Inspect net retained revenue, student registrations, and transactions by date
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Custom Range'].map((btn) => (
              <button
                key={btn}
                onClick={() => handleSelectPreset(btn)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors',
                  dateRangePreset === btn
                    ? 'bg-[#026BFC] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Interval Input Fields */}
        {(showCustomInputs || dateRangePreset === 'Custom Range') && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Select Date Interval:
            </span>
            <input
              type="date"
              aria-label="Report start date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              aria-label="Report end date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
            <button
              onClick={handleApplyCustomDate}
              className="px-3 py-1 rounded-lg bg-[#026BFC] text-white font-bold hover:bg-blue-600 transition-colors"
            >
              Apply Date Filter
            </button>
          </div>
        )}
      </div>

      {customDateError && (
        <div role="alert" className="text-red-700">
          {customDateError}
        </div>
      )}
      {/* ─── 3 MIDDLE CHARTS (STUDENT GROWTH, TEST ATTEMPTS, REVENUE) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CHART 1: Student Growth */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Student Growth
              </h3>
              <div className="relative">
                <button
                  onClick={() =>
                    setStudentGrowthRange(
                      studentGrowthRange === 'Last 30 Days'
                        ? 'Last 14 Days'
                        : studentGrowthRange === 'Last 14 Days'
                          ? 'Last 7 Days'
                          : 'Last 30 Days'
                    )
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  <span>{studentGrowthRange}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#026BFC]" />
                <span>New Students</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#93C5FD]" />
                <span>Active Students</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="mt-4 pt-2">
            <div className="relative h-44 w-full">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
                <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  <span>{maxGrowthStudents.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  <span>{Math.round(maxGrowthStudents * 0.66).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  <span>{Math.round(maxGrowthStudents * 0.33).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-0.5">
                  <span>0</span>
                </div>
              </div>

              {/* Bars Columns */}
              <div className="absolute inset-0 pl-7 flex items-end justify-between gap-1.5 pb-5">
                {studentGrowthData.map((item, idx) => {
                  const newHeightPercent = Math.min(
                    100,
                    (item.newStudents / maxGrowthStudents) * 100
                  );
                  const activeHeightPercent = Math.min(
                    100,
                    (item.activeStudents / maxGrowthStudents) * 100
                  );
                  const isHovered = hoveredGrowthIndex === idx;

                  return (
                    <div
                      key={item.label + idx}
                      onMouseEnter={() => setHoveredGrowthIndex(idx)}
                      onMouseLeave={() => setHoveredGrowthIndex(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-10 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] py-1 px-2 rounded shadow-md z-30 whitespace-nowrap">
                          {item.label}: {item.newStudents} new / {item.activeStudents} active
                        </div>
                      )}

                      {/* Dual Bars Container */}
                      <div className="w-full max-w-[14px] flex items-end justify-center gap-0.5 h-full">
                        <div
                          style={{ height: `${newHeightPercent}%` }}
                          className="w-1.5 bg-[#026BFC] rounded-t-xs transition-all duration-300 group-hover:brightness-110 min-h-0"
                        />
                        <div
                          style={{ height: `${activeHeightPercent}%` }}
                          className="w-1.5 bg-[#93C5FD] rounded-t-xs transition-all duration-300 group-hover:brightness-110 min-h-0"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="absolute bottom-0 inset-x-0 pl-7 flex justify-between text-[9px] text-slate-400 font-medium">
                {studentGrowthData.map((item, idx) => (
                  <span key={item.label + idx}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: Test Attempts (Truthful SVG Line Chart) */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Test Attempts
              </h3>
              <div className="relative">
                <button
                  onClick={() =>
                    setTestAttemptsRange(
                      testAttemptsRange === 'Last 30 Days'
                        ? 'Last 14 Days'
                        : testAttemptsRange === 'Last 14 Days'
                          ? 'Last 7 Days'
                          : 'Last 30 Days'
                    )
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  <span>{testAttemptsRange}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#026BFC]" />
                <span>Total Attempts</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Unique Students</span>
              </div>
            </div>
          </div>

          {/* Dynamic SVG Dual Line Chart */}
          <div className="mt-4 pt-2">
            <div className="relative h-44 w-full">
              {/* Y-Axis Labels & Grid */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  {maxAttempts.toLocaleString('en-IN')}
                </div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  {Math.round(maxAttempts * 0.66).toLocaleString('en-IN')}
                </div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  {Math.round(maxAttempts * 0.33).toLocaleString('en-IN')}
                </div>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5">0</div>
              </div>

              {/* Line Paths SVG */}
              <div className="absolute inset-0 pl-6 pb-5">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 300 120"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#026BFC" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#026BFC" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.20" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area: Total Attempts */}
                  {attemptsSvgPoints.attemptsArea && (
                    <path d={attemptsSvgPoints.attemptsArea} fill="url(#blueGradient)" />
                  )}
                  {/* Total Attempts Line */}
                  {attemptsSvgPoints.attemptsLine && (
                    <path
                      d={attemptsSvgPoints.attemptsLine}
                      fill="none"
                      stroke="#026BFC"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Gradient Area: Unique Students */}
                  {attemptsSvgPoints.uniqueArea && (
                    <path d={attemptsSvgPoints.uniqueArea} fill="url(#emeraldGradient)" />
                  )}
                  {/* Unique Students Line */}
                  {attemptsSvgPoints.uniqueLine && (
                    <path
                      d={attemptsSvgPoints.uniqueLine}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Dynamic Data Points */}
                  {attemptsSvgPoints.attemptsCoords.map((p, idx) => (
                    <circle
                      key={`blue-${idx}`}
                      cx={p.cx}
                      cy={p.cy}
                      r="3.5"
                      fill="#026BFC"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-5 transition-all"
                      onMouseEnter={() => setHoveredAttemptIndex(idx)}
                      onMouseLeave={() => setHoveredAttemptIndex(null)}
                    />
                  ))}

                  {attemptsSvgPoints.uniqueCoords.map((p, idx) => (
                    <circle
                      key={`green-${idx}`}
                      cx={p.cx}
                      cy={p.cy}
                      r="3"
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>

                {/* Tooltip on hovered point */}
                {hoveredAttemptIndex !== null && testAttemptsData[hoveredAttemptIndex] && (
                  <div
                    style={{
                      left: `${attemptsSvgPoints.attemptsCoords[hoveredAttemptIndex]?.cx || 0}px`,
                      top: `${(attemptsSvgPoints.attemptsCoords[hoveredAttemptIndex]?.cy || 20) - 30}px`,
                    }}
                    className="absolute bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] py-1 px-2 rounded shadow-md z-30 whitespace-nowrap -translate-x-1/2 pointer-events-none"
                  >
                    {testAttemptsData[hoveredAttemptIndex].label}:{' '}
                    {testAttemptsData[hoveredAttemptIndex].totalAttempts} attempts /{' '}
                    {testAttemptsData[hoveredAttemptIndex].uniqueStudents} students
                  </div>
                )}
              </div>

              {/* X-Axis Labels */}
              <div className="absolute bottom-0 inset-x-0 pl-6 flex justify-between text-[9px] text-slate-400 font-medium">
                {testAttemptsData.map((item, idx) => (
                  <span key={item.label + idx}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: Revenue (Truthful Dynamic Bar Chart) */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Revenue
              </h3>
              <div className="relative">
                <button
                  onClick={() =>
                    setRevenueRange(
                      revenueRange === 'Last 30 Days'
                        ? 'Last 14 Days'
                        : revenueRange === 'Last 14 Days'
                          ? 'Last 7 Days'
                          : 'Last 30 Days'
                    )
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  <span>{revenueRange}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Purple Vertical Bar Chart */}
          <div className="mt-4 pt-2">
            <div className="relative h-44 w-full">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  ₹{maxRevenue >= 1000 ? `${Math.round(maxRevenue / 1000)}K` : maxRevenue}
                </div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  ₹
                  {Math.round(maxRevenue * 0.66) >= 1000
                    ? `${Math.round((maxRevenue * 0.66) / 1000)}K`
                    : Math.round(maxRevenue * 0.66)}
                </div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  ₹
                  {Math.round(maxRevenue * 0.33) >= 1000
                    ? `${Math.round((maxRevenue * 0.33) / 1000)}K`
                    : Math.round(maxRevenue * 0.33)}
                </div>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5">₹0</div>
              </div>

              {/* Bars Columns with Dynamic Tooltip */}
              <div className="absolute inset-0 pl-7 flex items-end justify-between gap-1 pb-5">
                {revenueData.map((item, idx) => {
                  const heightPercent = Math.min(100, (item.amount / maxRevenue) * 100);
                  const isHighlighted = hoveredRevenueIndex === idx;

                  return (
                    <div
                      key={item.label + idx}
                      onMouseEnter={() => setHoveredRevenueIndex(idx)}
                      onMouseLeave={() => setHoveredRevenueIndex(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Active tooltip badge on hovered column */}
                      {isHighlighted && (
                        <div className="absolute -top-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-md z-30 text-center whitespace-nowrap">
                          <p className="text-[9px] text-slate-400 leading-tight">{item.label}</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={cn(
                          'w-2 sm:w-2.5 rounded-t-xs transition-all duration-200 min-h-0',
                          isHighlighted
                            ? 'bg-[#8B5CF6] ring-2 ring-purple-300 dark:ring-purple-700'
                            : 'bg-[#C4B5FD] dark:bg-[#6D28D9]/60 hover:bg-[#A78BFA]'
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="absolute bottom-0 inset-x-0 pl-7 flex justify-between text-[9px] text-slate-400 font-medium">
                {revenueData.map((item, idx) => (
                  <span key={item.label + idx}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM GRID ROW 1: MOST POPULAR EXAMS, MOST ATTEMPTED TESTS, TOP PERFORMING STUDENTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Most Popular Exams */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Most Popular Exams
              </h3>
              <Link
                to="/admin/exams"
                className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <span className="text-sm">→</span>
              </Link>
            </div>

            <div className="space-y-4 mt-4">
              {popularExams.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No exams found.</div>
              ) : (
                popularExams.map((exam, index) => (
                  <div key={exam.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-3 text-center">
                        {index + 1}
                      </span>
                      <ExamEmblemBadge
                        title={exam.name}
                        slug={exam.slug}
                        iconName={exam.iconName}
                        className="w-8 h-8 rounded-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {exam.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{exam.attempts}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 sm:w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, Math.max(0, exam.percentage))}%` }}
                          className="h-full bg-[#026BFC] rounded-full transition-all duration-300"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-7 text-right">
                        {exam.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Most Attempted Tests */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Most Attempted Tests
              </h3>
              <Link
                to="/admin/mock-tests"
                className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <span className="text-sm">→</span>
              </Link>
            </div>

            <div className="space-y-3.5 mt-4">
              {mostAttemptedTests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No attempted tests yet.
                </div>
              ) : (
                mostAttemptedTests.map((test, index) => (
                  <div key={test.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-3 text-center">
                        {index + 1}
                      </span>
                      {test.iconUrl ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
                          <img
                            src={test.iconUrl}
                            alt={test.title}
                            className="w-full h-full object-contain rounded-md"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                            test.iconBg
                          )}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {test.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{test.exam}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {test.attempts}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Performing Students */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Top Performing Students
              </h3>
              <Link
                to="/admin/rankings"
                className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <span className="text-sm">→</span>
              </Link>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    <th className="font-medium pb-2 w-7">#</th>
                    <th className="font-medium pb-2">Name</th>
                    <th className="font-medium pb-2">Location</th>
                    <th className="font-medium pb-2 text-center">Avg. Score</th>
                    <th className="font-medium pb-2 text-right">Tests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {topStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No student performance records yet.
                      </td>
                    </tr>
                  ) : (
                    topStudents.map((st) => (
                      <tr key={st.rank} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5">
                          {st.badge === 'gold' && (
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 font-bold flex items-center justify-center text-[10px]">
                              1
                            </span>
                          )}
                          {st.badge === 'silver' && (
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold flex items-center justify-center text-[10px]">
                              2
                            </span>
                          )}
                          {st.badge === 'bronze' && (
                            <span className="w-5 h-5 rounded-full bg-amber-200/70 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 font-bold flex items-center justify-center text-[10px]">
                              3
                            </span>
                          )}
                          {st.badge === 'regular' && (
                            <span className="text-slate-400 font-semibold text-center block w-5">
                              {st.rank}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                          {st.name}
                        </td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{st.location}</td>
                        <td className="py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {st.score}
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {st.tests}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
