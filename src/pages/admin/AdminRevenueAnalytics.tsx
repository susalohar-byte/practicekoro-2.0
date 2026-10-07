import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Tag,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Search,
  AlertCircle,
  Trophy,
  Target,
  HelpCircle,
  CheckSquare2,
  UserCheck,
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
  BookOpen,
  Layers,
  ArrowUpRight,
  BarChart3,
  Award,
} from 'lucide-react';
import type { DateRangePreset, AdminPaymentRow, PlatformAnalyticsData } from '@/types';
import { cn } from '@/lib/utils';

export const AdminRevenueAnalytics: React.FC = () => {
  const [preset, setPreset] = useState<DateRangePreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [analyticsData, setAnalyticsData] = useState<PlatformAnalyticsData | null>(null);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Student Leaderboard / Rank Modal State
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankSearchQuery, setRankSearchQuery] = useState('');
  const [rankCurrentPage, setRankCurrentPage] = useState(1);
  const pageSize = 10;

  // Transactions State
  const [transactionSearch, setTransactionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>(
    'all'
  );

  const loadAllAnalytics = useCallback(
    async (selectedPreset: DateRangePreset, start?: string, end?: string) => {
      try {
        setIsLoading(true);
        const [overview, paymentsData] = await Promise.all([
          api.getPlatformAnalyticsOverview(
            selectedPreset,
            selectedPreset === 'custom' ? start : undefined,
            selectedPreset === 'custom' ? end : undefined
          ),
          api.getAllAdminPayments(),
        ]);

        setAnalyticsData(overview);
        setPayments(paymentsData || []);
      } catch (err) {
        console.error('Failed to load platform analytics:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (preset !== 'custom') {
      loadAllAnalytics(preset);
    }
  }, [loadAllAnalytics, preset]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    setPreset('custom');
    loadAllAnalytics('custom', customStartDate, customEndDate);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllAnalytics(preset, customStartDate, customEndDate);
  };

  // Filtered student rankings for Rank modal
  const filteredRankings = useMemo(() => {
    if (!analyticsData?.studentRankings) return [];
    const query = rankSearchQuery.trim().toLowerCase();
    if (!query) return analyticsData.studentRankings;

    return analyticsData.studentRankings.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        String(s.rank).includes(query)
    );
  }, [analyticsData?.studentRankings, rankSearchQuery]);

  // Paginated rankings
  const totalRankPages = Math.max(1, Math.ceil(filteredRankings.length / pageSize));
  const paginatedRankings = useMemo(() => {
    const startIndex = (rankCurrentPage - 1) * pageSize;
    return filteredRankings.slice(startIndex, startIndex + pageSize);
  }, [filteredRankings, rankCurrentPage]);

  // Reset page when search changes
  useEffect(() => {
    setRankCurrentPage(1);
  }, [rankSearchQuery]);

  // Filter payments within transaction search
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (transactionSearch.trim()) {
        const q = transactionSearch.toLowerCase();
        return (
          p.studentName?.toLowerCase().includes(q) ||
          p.studentEmail?.toLowerCase().includes(q) ||
          p.orderId?.toLowerCase().includes(q) ||
          p.planTitle?.toLowerCase().includes(q) ||
          p.gateway?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, statusFilter, transactionSearch]);

  // CSV Export helper
  const exportToCsv = (
    filename: string,
    headers: string[],
    rows: (string | number | undefined | null)[][]
  ) => {
    const escapeCell = (cell: any): string => {
      if (cell == null) return '""';
      const str = String(cell);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvRows = [
      headers.map(escapeCell).join(','),
      ...rows.map((r) => r.map(escapeCell).join(',')),
    ];
    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Student Rankings CSV
  const handleExportRankingsCsv = () => {
    if (!analyticsData?.studentRankings) return;
    const headers = [
      'Rank',
      'Name',
      'Email',
      'Total Tests',
      'Questions Attempted',
      'Accuracy (%)',
      'Total Score',
    ];
    const rows = analyticsData.studentRankings.map((s) => [
      `#${s.rank}`,
      s.name,
      s.email,
      s.totalTests,
      s.questionsAttempted,
      `${s.accuracy}%`,
      s.totalScore,
    ]);
    exportToCsv(
      `PracticeKoro_Student_Rankings_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  // Export Revenue Report CSV
  const handleExportRevenueCsv = () => {
    const headers = [
      'Transaction ID',
      'Student Name',
      'Student Email',
      'Plan Title',
      'Amount (INR)',
      'Gateway',
      'Status',
      'Date & Time (IST)',
    ];

    const rows = filteredPayments.map((p) => [
      p.orderId || p.razorpayOrderId || p.id,
      p.studentName,
      p.studentEmail,
      p.planTitle || 'Pro Subscription',
      p.amount,
      p.gateway || 'Razorpay',
      p.status,
      new Date(p.createdAt || p.created_at || Date.now()).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      }),
    ]);

    exportToCsv(
      `PracticeKoro_Revenue_Transactions_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  const presetOptions: { id: DateRangePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* ─── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <span>Analytics & Reports</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Platform Intelligence
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Student Performance, Question Insights & Financial Analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={cn('w-4 h-4', (isLoading || isRefreshing) && 'animate-spin')} />
          </button>
          <button
            onClick={() => setIsRankModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>Student Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs across Subscriptions, Coupons, Revenue */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <Link
          to="/admin/subscriptions"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <CreditCard className="w-4 h-4 text-indigo-500" />
          <span>Subscriptions & Aspirants</span>
        </Link>
        <Link
          to="/admin/coupons"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Tag className="w-4 h-4 text-amber-500" />
          <span>Coupons & Discounts</span>
        </Link>
        <Link
          to="/admin/revenue-analytics"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-600 text-white shadow-xs"
        >
          <TrendingUp className="w-4 h-4 text-emerald-300" />
          <span>Revenue Analytics & Ledger</span>
        </Link>
      </div>

      {/* ─── Date Range Selector Bar ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Filter Timeframe:</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {presetOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPreset(opt.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                preset === opt.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <form
            onSubmit={handleApplyCustomRange}
            className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800"
          >
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* ─── SECTION 1: STUDENT PERFORMANCE ─────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Student Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aspirant engagement, tests completed, overall accuracy and rankings
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRankModalOpen(true)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Rankings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* 1. Total Students */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Students
              </span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : (analyticsData?.studentPerformance.totalStudents ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Registered Aspirants</p>
          </div>

          {/* 2. Active Students */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Students
              </span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {isLoading
                ? '...'
                : (analyticsData?.studentPerformance.activeStudents ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Attempted Tests</p>
          </div>

          {/* 3. Tests Attempted */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tests Attempted
              </span>
              <CheckSquare2 className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : (analyticsData?.studentPerformance.testsAttempted ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Full & Sectional Mocks</p>
          </div>

          {/* 4. Questions Answered */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Questions Solved
              </span>
              <HelpCircle className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : (analyticsData?.studentPerformance.questionsAnswered ?? 0).toLocaleString(
                    'en-IN'
                  )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Total Question Responses</p>
          </div>

          {/* 5. Overall Accuracy */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Overall Accuracy
              </span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
              <span>
                {isLoading ? '...' : `${analyticsData?.studentPerformance.overallAccuracy ?? 0}%`}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Platform Average</p>
          </div>

          {/* 6. Clickable Rank Metric Card */}
          <div
            onClick={() => setIsRankModalOpen(true)}
            className="group cursor-pointer rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 hover:border-amber-500 transition-all hover:shadow-md hover:shadow-amber-500/10 active:scale-[0.98] relative overflow-hidden"
            title="Click to view complete student rankings list"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Rank & Leaderboard
              </span>
              <ArrowUpRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white truncate">
              {isLoading
                ? '...'
                : analyticsData?.studentPerformance.topStudent
                  ? `#1 ${analyticsData.studentPerformance.topStudent.name.split(' ')[0]}`
                  : 'Top Ranks'}
            </div>
            <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <span>Click to view all ranks ({analyticsData?.studentRankings.length || 0})</span>
            </p>
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              Performance Trend (Daily Tests & Accuracy)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Last 7 Active Days</span>
          </div>

          {/* Simple Clean Bar/Timeline Visualizer */}
          <div className="grid grid-cols-7 gap-2 pt-2">
            {analyticsData?.studentPerformance.performanceTrend.map((pt, idx) => {
              const maxTests = Math.max(
                10,
                ...(analyticsData?.studentPerformance.performanceTrend.map(
                  (p) => p.attemptsCount
                ) || [10])
              );
              const heightPct = Math.min(
                100,
                Math.max(15, Math.round((pt.attemptsCount / maxTests) * 100))
              );

              return (
                <div key={idx} className="flex flex-col items-center gap-2 text-center group">
                  <div className="h-28 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1.5 flex flex-col justify-end items-center relative border border-slate-100 dark:border-slate-800/60">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-9 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                      {pt.attemptsCount} tests • {pt.averageAccuracy}% acc
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg transition-all group-hover:brightness-110"
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate w-full">
                    {pt.label}
                  </div>
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white -mt-1">
                    {pt.attemptsCount} tests
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: QUESTION & TOPIC INSIGHTS ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Question & Topic Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identify failure-prone questions, weakest syllabus topics, and low-accuracy subjects
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Most Wrong Questions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Most Wrong Questions
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50">
                  Highest Failure %
                </span>
              </div>

              <div className="space-y-3">
                {analyticsData?.questionInsights.mostWrongQuestions.map((q, idx) => (
                  <div
                    key={q.questionId || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {q.questionBengaliText || q.questionText}
                      </p>
                      <span className="shrink-0 text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-md">
                        {q.failureRate}% Fail
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {q.subjectName}
                      </span>
                      <span>•</span>
                      <span className="truncate">{q.chapterName}</span>
                      <span>•</span>
                      <span>{q.totalAttempts} attempts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Weakest Topics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weakest Topics
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                  Needs Focus
                </span>
              </div>

              <div className="space-y-3.5">
                {analyticsData?.questionInsights.weakestTopics.map((t, idx) => (
                  <div key={t.chapterId || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {t.chapterName}
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {t.accuracyRate}% Acc
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, t.accuracyRate))}%` }}
                        className={cn(
                          'h-full rounded-full',
                          t.accuracyRate < 45 ? 'bg-rose-500' : 'bg-amber-500'
                        )}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="truncate">{t.subjectName}</span>
                      <span>{t.totalQuestionsAttempted} questions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Weakest Subjects */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weakest Subjects
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-900/50">
                  Subject Benchmark
                </span>
              </div>

              <div className="space-y-3.5">
                {analyticsData?.questionInsights.weakestSubjects.map((s, idx) => (
                  <div key={s.subjectId || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {s.subjectName}
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {s.accuracyRate}% Acc
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(5, s.accuracyRate))}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Overall attempts</span>
                      <span>{s.totalQuestionsAttempted} answered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: REVENUE ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue & Subscriptions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gross collections, active subscription passes, and payment transactions
              </p>
            </div>
          </div>

          <button
            onClick={handleExportRevenueCsv}
            disabled={filteredPayments.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Revenue 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : `₹${(analyticsData?.revenue.totalRevenue ?? 0).toLocaleString('en-IN')}`}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">All-time Gross Income</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Monthly Revenue
              </span>
              <Calendar className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : `₹${(analyticsData?.revenue.monthlyRevenue ?? 0).toLocaleString('en-IN')}`}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Current Calendar Month</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paid Students
              </span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {isLoading
                ? '...'
                : (analyticsData?.revenue.paidStudents ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Converted Subscribers</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Subscriptions
              </span>
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {isLoading
                ? '...'
                : (analyticsData?.revenue.activeSubscriptions ?? 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Live Student Passes</p>
          </div>
        </div>

        {/* Revenue Trend Visualizer */}
        {analyticsData?.revenue.revenueTrend && analyticsData.revenue.revenueTrend.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Revenue Trend Over Time
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Selected Window</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
              {analyticsData.revenue.revenueTrend.map((pt, idx) => {
                const maxRev = Math.max(
                  100,
                  ...(analyticsData.revenue.revenueTrend.map((p) => p.amount) || [100])
                );
                const heightPct = Math.min(
                  100,
                  Math.max(10, Math.round((pt.amount / maxRev) * 100))
                );

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 text-center group">
                    <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl p-1.5 flex flex-col justify-end items-center relative border border-slate-100 dark:border-slate-800/60">
                      <div className="absolute -top-9 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                        ₹{pt.amount.toLocaleString('en-IN')} ({pt.transactions} orders)
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-lg transition-all group-hover:brightness-110"
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate w-full">
                      {pt.label}
                    </div>
                    <div className="text-[10px] font-bold text-slate-900 dark:text-white -mt-1">
                      ₹{pt.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transactions Table Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Payment Transactions ({filteredPayments.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Order / ID</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Plan</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No payment records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.slice(0, 15).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {p.orderId || p.razorpayOrderId || p.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {p.studentName || 'Student Candidate'}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.studentEmail}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                        {p.planTitle || 'Pro Subscription'}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                        ₹{p.amount}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                            p.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : p.status === 'pending'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(p.createdAt || p.created_at || Date.now()).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE RANK / STUDENT LEADERBOARD MODAL ──────────── */}
      {isRankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-3 sm:p-5">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Student Leaderboard & Rankings</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {filteredRankings.length} Students
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Platform ranking calculated from test attempts, accuracy percentage, and total
                    scores
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportRankingsCsv}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Export Rankings CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
                <button
                  onClick={() => setIsRankModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, email, or rank..."
                  value={rankSearchQuery}
                  onChange={(e) => setRankSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {rankSearchQuery && (
                  <button
                    onClick={() => setRankSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                Page {rankCurrentPage} of {totalRankPages}
              </div>
            </div>

            {/* Modal Rankings Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-center">Total Tests</th>
                    <th className="px-4 py-3 text-center">Questions Solved</th>
                    <th className="px-4 py-3 text-center">Accuracy</th>
                    <th className="px-4 py-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRankings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                        No students found matching "{rankSearchQuery}".
                      </td>
                    </tr>
                  ) : (
                    paginatedRankings.map((student) => {
                      const isTop1 = student.rank === 1;
                      const isTop2 = student.rank === 2;
                      const isTop3 = student.rank === 3;

                      return (
                        <tr
                          key={student.userId}
                          className={cn(
                            'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors',
                            isTop1 && 'bg-amber-500/5',
                            isTop2 && 'bg-slate-400/5',
                            isTop3 && 'bg-orange-500/5'
                          )}
                        >
                          {/* Rank */}
                          <td className="px-4 py-3">
                            {isTop1 ? (
                              <span className="inline-flex items-center gap-1 font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                <Award className="w-3.5 h-3.5 text-amber-500" /> #1
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center gap-1 font-black text-slate-500 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg">
                                <Award className="w-3.5 h-3.5 text-slate-400" /> #2
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center gap-1 font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg">
                                <Award className="w-3.5 h-3.5 text-orange-500" /> #3
                              </span>
                            ) : (
                              <span className="font-bold text-slate-500 dark:text-slate-400 px-1">
                                #{student.rank}
                              </span>
                            )}
                          </td>

                          {/* Student Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{student.name}</span>
                                  {student.isPro && (
                                    <span
                                      className="p-0.5 rounded bg-amber-400 text-white shadow-xs"
                                      title="Pro Subscriber"
                                    >
                                      <Crown className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {student.email}
                          </td>

                          {/* Total Tests */}
                          <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                            {student.totalTests}
                          </td>

                          {/* Questions Solved */}
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                            {student.questionsAttempted}
                          </td>

                          {/* Accuracy */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md font-extrabold text-[11px]',
                                student.accuracy >= 70
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : student.accuracy >= 45
                                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                              )}
                            >
                              {student.accuracy}%
                            </span>
                          </td>

                          {/* Score */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono font-black text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                              {student.totalScore}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Pagination Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredRankings.length === 0 ? 0 : (rankCurrentPage - 1) * pageSize + 1}{' '}
                to {Math.min(filteredRankings.length, rankCurrentPage * pageSize)} of{' '}
                {filteredRankings.length} aspirants
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRankCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={rankCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                  {rankCurrentPage} / {totalRankPages}
                </span>
                <button
                  onClick={() => setRankCurrentPage((p) => Math.min(totalRankPages, p + 1))}
                  disabled={rankCurrentPage === totalRankPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
