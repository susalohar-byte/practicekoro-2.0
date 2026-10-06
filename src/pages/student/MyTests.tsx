import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  BarChart3,
  FileText,
  Trophy,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Calculator,
  Brain,
  FlaskConical,
  Shield,
} from 'lucide-react';
import type { TestAttempt } from '@/types';
import { cn } from '@/lib/utils';

// ==========================================
// TYPES & DATA
// ==========================================
type FilterTab = 'Overview' | 'Mock Tests' | 'Test Series' | 'Practice Tests' | 'Live Tests';
type MetricView = 'Marks' | 'Percentage';
type TimeRange = 'Last 3 Months' | 'This Month' | 'This Year' | 'All Time';

interface SubjectItem {
  title: string;
  scored: number;
  total: number;
  percentage: number;
  iconBg: string;
  iconColor: string;
  icon?: React.ComponentType<{ className?: string }>;
  symbol?: string;
  symbolBg?: string;
  progressColor: string;
  badgeBg: string;
  badgeTextColor: string;
}

interface RecentTestItem {
  id: string;
  testId?: string;
  title: string;
  type: string;
  questionsCount: string;
  date: string;
  percentage: number;
  scored: number;
  total: number;
  emblemType: 'wbssc_red' | 'kp_crest' | 'ssc_red' | 'generic';
  scoreBg: string;
  scoreColor: string;
  isRealAttempt?: boolean;
}

interface SeriesResultItem {
  id: string;
  title: string;
  totalTests: number;
  completedTests: number;
  status: string;
  isCompleted: boolean;
  avgScore: number;
  emblemType: 'wbssc_red' | 'kp_crest' | 'ssc_red';
  scoreBg: string;
  scoreColor: string;
}

export const MyTests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('Overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('Last 3 Months');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricView>('Marks');
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [seriesResults, setSeriesResults] = useState<SeriesResultItem[]>([]);
  const [, setLoading] = useState(true);

  // Load user attempts
  const loadAttempts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getUserAttempts(user.id);
      setAttempts(data || []);
    } catch (err) {
      console.error('Failed to load user attempts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  useEffect(() => {
    let active = true;
    api.getStudentTestSeries().then(async (series) => {
      const reports = await Promise.all(series.map(async (item) => {
        try {
          const analytics = await api.getTestSeriesAnalytics(item.id);
          return { item, analytics };
        } catch (error) {
          console.error(`Failed to load results for test series ${item.id}:`, error);
          return { item, analytics: null };
        }
      }));
      if (!active) return;
      setSeriesResults(reports.map(({ item, analytics }, index) => {
        const title = item.title.toLowerCase();
        const emblemType: SeriesResultItem['emblemType'] = title.includes('kp')
          ? 'kp_crest'
          : title.includes('ssc')
            ? 'ssc_red'
            : 'wbssc_red';
        const completedTests = analytics?.testsAttempted ?? 0;
        const totalTests = analytics?.totalTests ?? item.testCount ?? item.testsCount ?? 0;
        const avgScore = Math.round(analytics?.averageScorePercent ?? 0);
        const color = index % 2 === 0 ? 'text-[#026BFC]' : 'text-[#10B981]';
        return {
          id: item.id,
          title: item.title,
          totalTests,
          completedTests,
          status: completedTests === 0 ? 'Not Started' : completedTests >= totalTests ? 'Completed' : 'In Progress',
          isCompleted: completedTests > 0 && completedTests >= totalTests,
          avgScore,
          emblemType,
          scoreBg: index % 2 === 0 ? 'bg-[#EFF6FF]' : 'bg-[#ECFDF5]',
          scoreColor: color,
        };
      }));
    }).catch((error) => {
      console.error('Failed to load student test series:', error);
      if (active) setSeriesResults([]);
    });
    return () => { active = false; };
  }, []);

  const subjectPerformance = useMemo<SubjectItem[]>(() => {
    const grouped = new Map<string, { scored: number; total: number; count: number }>();
    attempts.filter((attempt) => attempt.status === 'completed' && attempt.subjectName)
      .forEach((attempt) => {
        const current = grouped.get(attempt.subjectName!) || { scored: 0, total: 0, count: 0 };
        current.scored += attempt.score || 0;
        current.total += attempt.totalMarks || 0;
        current.count += 1;
        grouped.set(attempt.subjectName!, current);
      });
    const themes = [
      { iconBg: 'bg-[#EBF3FF]', iconColor: 'text-[#2563EB]', progressColor: 'bg-[#10B981]', badgeBg: 'bg-[#ECFDF5]', badgeTextColor: 'text-[#10B981]', icon: BookOpen },
      { iconBg: 'bg-[#E6F8EE]', iconColor: 'text-[#16A34A]', progressColor: 'bg-[#026BFC]', badgeBg: 'bg-[#EFF6FF]', badgeTextColor: 'text-[#026BFC]', icon: Calculator },
      { iconBg: 'bg-[#FFE4E6]', iconColor: 'text-[#E11D48]', progressColor: 'bg-[#EF4444]', badgeBg: 'bg-[#FFF1F2]', badgeTextColor: 'text-[#EF4444]', icon: Brain },
      { iconBg: 'bg-[#FEF3C7]', iconColor: 'text-[#D97706]', progressColor: 'bg-[#026BFC]', badgeBg: 'bg-[#EFF6FF]', badgeTextColor: 'text-[#026BFC]', icon: FlaskConical },
    ];
    return Array.from(grouped.entries()).map(([title, scores], index) => {
      const percentage = scores.total > 0 ? Math.round((scores.scored / scores.total) * 100) : 0;
      return {
        title,
        scored: Math.round(scores.scored),
        total: Math.round(scores.total),
        percentage,
        ...themes[index % themes.length],
      };
    });
  }, [attempts]);

  // Derived Performance Metrics
  const computedMetrics = useMemo(() => {
    const completedAttempts = attempts.filter((attempt) => attempt.status === 'completed');
    const totalAttempts = completedAttempts.length;
    let sumCorrect = 0;
    let sumWrong = 0;
    let sumSkipped = 0;
    let sumTimeSec = 0;
    let sumAcc = 0;

    completedAttempts.forEach((a) => {
      sumCorrect += a.correctCount || 0;
      sumWrong += a.wrongCount || 0;
      sumSkipped += a.skippedCount || 0;
      sumTimeSec += a.timeSpentSeconds || 0;
      sumAcc += a.accuracy || 0;
    });

    const totalQuestions = sumCorrect + sumWrong + sumSkipped;
    const avgAcc = totalAttempts > 0 ? Math.round(sumAcc / totalAttempts) : 0;
    const hours = Math.round(sumTimeSec / 3600);
    const timeSpentStr = hours > 0 ? `${hours}h` : `${Math.round(sumTimeSec / 60)}m`;
    const chronological = [...completedAttempts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const improvement = chronological.length > 1
      ? Math.round((chronological[chronological.length - 1].accuracy || 0) - (chronological[0].accuracy || 0))
      : 0;
    const latestRank = [...completedAttempts].reverse().find((attempt) => attempt.rank)?.rank;

    return {
      accuracy: avgAcc,
      correct: sumCorrect.toLocaleString('en-IN'),
      wrong: sumWrong.toLocaleString('en-IN'),
      skipped: sumSkipped.toLocaleString('en-IN'),
      timeSpent: timeSpentStr,
      totalTests: totalAttempts,
      totalQuestions: totalQuestions.toLocaleString('en-IN'),
      rank: latestRank ? `#${latestRank}` : '—',
      improvement: `${improvement > 0 ? '+' : ''}${improvement}%`,
    };
  }, [attempts]);

  // Recent tests are drawn only from this student's saved attempts.
  const recentTestsList = useMemo<RecentTestItem[]>(() => {
    return attempts.filter((attempt) => attempt.status === 'completed').slice(0, 10).map((a) => {
      const pct = Math.round(a.accuracy || (a.score / (a.totalMarks || 100)) * 100);
      let emblem: RecentTestItem['emblemType'] = 'wbssc_red';
      const titleLower = (a.testTitle || '').toLowerCase();
      if (titleLower.includes('kp') || titleLower.includes('kolkata')) {
        emblem = 'kp_crest';
      } else if (titleLower.includes('ssc')) {
        emblem = 'ssc_red';
      }

      let scoreBg = 'bg-[#EFF6FF]';
      let scoreColor = 'text-[#026BFC]';
      if (pct >= 70) {
        scoreBg = 'bg-[#ECFDF5]';
        scoreColor = 'text-[#10B981]';
      } else if (pct < 50) {
        scoreBg = 'bg-[#FFF1F2]';
        scoreColor = 'text-[#EF4444]';
      }

      const d = new Date(a.createdAt);
      const dateStr = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      return {
        id: a.id,
        testId: a.testId,
        title: a.testTitle || 'Mock Test',
        type: a.testType === 'pyq' ? 'Previous Year Paper' : 'Full Length Test',
        questionsCount: `${a.totalQuestions || (a.correctCount || 0) + (a.wrongCount || 0) + (a.skippedCount || 0)} Questions`,
        date: dateStr,
        percentage: pct,
        scored: Math.round(a.score),
        total: a.totalMarks || 0,
        emblemType: emblem,
        scoreBg,
        scoreColor,
        isRealAttempt: true,
      };
    });
  }, [attempts]);

  // Filter Pills list matching App
  const filters: FilterTab[] = [
    'Overview',
    'Mock Tests',
    'Test Series',
    'Practice Tests',
    'Live Tests',
  ];

  // Helper to render exam emblem matching App
  const renderEmblem = (type: string) => {
    switch (type) {
      case 'kp_crest':
        return (
          <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#3B1D9E] to-[#1E0B6E] border-[1.8px] border-[#C4B5FD] flex items-center justify-center shadow-xs">
            <div className="w-[30px] h-[30px] rounded-full border border-white/60 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
        );
      case 'ssc_red':
        return (
          <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#EF233C] to-[#B91C1C] border-[1.5px] border-[#FECDD3] p-1.5 flex items-center justify-center shadow-xs">
            <img
              src="/images/exams/emblem_ssc.png"
              alt="SSC"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );
      case 'wbssc_red':
      default:
        return (
          <div className="w-[46px] h-[46px] rounded-full overflow-hidden flex items-center justify-center">
            <img
              src="/images/exams/emblem_wbssc.png"
              alt="WBSSC"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = '/images/exams/wbp_police.png';
              }}
            />
          </div>
        );
    }
  };

  const handleTestClick = (item: RecentTestItem) => {
    if (item.isRealAttempt && item.testId) {
      navigate(`/exams/${item.testId}/results/${item.id}`);
    } else {
      navigate('/test-series');
    }
  };

  return (
    <div className="space-y-4 pb-12 font-sans select-none">
      {/* ── 1. SCREEN TITLE & SUBTITLE (APP 1:1) ── */}
      <div>
        <h1 className="text-[28px] font-black text-[#051A43] dark:text-white tracking-[-0.6px] leading-[1.15]">
          Results
        </h1>
        <p className="text-[12.5px] font-medium text-[#64748B] dark:text-slate-400 mt-1">
          Track your performance and improve
        </p>
      </div>

      {/* ── 2. FILTER PILLS (APP 1:1) ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#026BFC] text-white shadow-md shadow-[#026BFC]/25 border border-[#026BFC]'
                  : 'bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 border border-[#E2ECF8] dark:border-slate-800 hover:border-blue-200'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* ── 3 & 4. PERFORMANCE CARDS (Desktop 2-column grid in Overview) ── */}
      {(selectedFilter === 'Overview' ||
        selectedFilter === 'Mock Tests' ||
        selectedFilter === 'Practice Tests') && (
        <div
          className={cn(
            'grid gap-4 sm:gap-5 items-stretch',
            selectedFilter === 'Overview' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          )}
        >
          {/* ── 3. TOTAL PERFORMANCE CARD (APP 1:1) ── */}
          {(selectedFilter === 'Overview' || selectedFilter === 'Mock Tests') && (
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 sm:p-5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_3px_10px_rgba(11,31,91,0.03)] space-y-4 h-full flex flex-col justify-between">
          {/* Header Row: Title & Subtitle + Time Dropdown */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17.5px] font-black text-[#051A43] dark:text-white tracking-[-0.3px]">
                Total Performance
              </h2>
              <p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5">
                Based on {computedMetrics.totalTests} tests across all exams
              </p>
            </div>

            {/* Time Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 text-[#051A43] dark:text-slate-200 text-[11px] font-bold shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-[#051A43] dark:text-slate-300" />
                <span>{selectedTimeRange}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#051A43] dark:text-slate-300" />
              </button>

              {isTimeDropdownOpen && (
                <div className="absolute right-0 top-8 z-30 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-[#E2ECF8] dark:border-slate-700 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  {(['Last 3 Months', 'This Month', 'This Year', 'All Time'] as TimeRange[]).map(
                    (range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => {
                          setSelectedTimeRange(range);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 ${
                          selectedTimeRange === range
                            ? 'text-[#026BFC] font-bold bg-blue-50/50 dark:bg-slate-700/50'
                            : 'text-[#475569] dark:text-slate-300'
                        }`}
                      >
                        {range}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Accuracy Donut Ring + 4 Colored Stat Badges */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            {/* 72% Accuracy Donut Ring */}
            <div className="relative w-[90px] h-[90px] shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#E2ECF8"
                  strokeWidth="3.6"
                  className="dark:stroke-slate-800"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#026BFC"
                  strokeWidth="3.6"
                  strokeDasharray={`${(computedMetrics.accuracy / 100) * 88} 100`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[18px] font-black text-[#051A43] dark:text-white tracking-[-0.5px] leading-tight">
                  {computedMetrics.accuracy}%
                </span>
                <span className="text-[8.5px] font-semibold text-[#64748B] dark:text-slate-400 leading-[1.1]">
                  Overall
                  <br />
                  Accuracy
                </span>
              </div>
            </div>

            {/* 4 Colored Stat Tiles in responsive row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 w-full">
              {/* Correct */}
              <div className="bg-[#ECFDF5] dark:bg-emerald-950/40 rounded-xl py-2 px-1.5 text-center flex flex-col items-center">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] mb-1" />
                <span className="text-[13px] font-black text-[#051A43] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.correct}
                </span>
                <span className="text-[9px] font-semibold text-[#059669] dark:text-emerald-400 mt-0.5">
                  Correct
                </span>
              </div>

              {/* Wrong */}
              <div className="bg-[#FFF1F2] dark:bg-rose-950/40 rounded-xl py-2 px-1.5 text-center flex flex-col items-center">
                <XCircle className="w-4 h-4 text-[#EF4444] mb-1" />
                <span className="text-[13px] font-black text-[#051A43] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.wrong}
                </span>
                <span className="text-[9px] font-semibold text-[#DC2626] dark:text-rose-400 mt-0.5">
                  Wrong
                </span>
              </div>

              {/* Skipped */}
              <div className="bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl py-2 px-1.5 text-center flex flex-col items-center">
                <MinusCircle className="w-4 h-4 text-[#64748B] mb-1" />
                <span className="text-[13px] font-black text-[#051A43] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.skipped}
                </span>
                <span className="text-[9px] font-semibold text-[#64748B] dark:text-slate-400 mt-0.5">
                  Skipped
                </span>
              </div>

              {/* Time Spent */}
              <div className="bg-[#EFF6FF] dark:bg-blue-950/40 rounded-xl py-2 px-1.5 text-center flex flex-col items-center">
                <Clock className="w-4 h-4 text-[#026BFC] mb-1" />
                <span className="text-[13px] font-black text-[#051A43] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.timeSpent}
                </span>
                <span className="text-[9px] font-semibold text-[#026BFC] dark:text-blue-400 mt-0.5">
                  Time Spent
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#EDF2F7] dark:border-slate-800 pt-3" />

          {/* Bottom Summary Metric Row (Total Tests | Total Questions | Rank | Improvement) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total Tests */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 text-[#026BFC]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-black text-[#051A43] dark:text-white truncate">
                  {computedMetrics.totalTests}
                </div>
                <div className="text-[9px] font-medium text-[#64748B] dark:text-slate-400 truncate">
                  Total Tests
                </div>
              </div>
            </div>

            {/* Total Questions */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-[#026BFC]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-black text-[#051A43] dark:text-white truncate">
                  {computedMetrics.totalQuestions}
                </div>
                <div className="text-[9px] font-medium text-[#64748B] dark:text-slate-400 truncate">
                  Total Questions
                </div>
              </div>
            </div>

            {/* Your Rank */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-black text-[#051A43] dark:text-white truncate">
                  {computedMetrics.rank}
                </div>
                <div className="text-[9px] font-medium text-[#64748B] dark:text-slate-400 truncate">
                  Your Rank
                </div>
              </div>
            </div>

            {/* Improvement */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-black text-[#10B981] truncate">
                  {computedMetrics.improvement}
                </div>
                <div className="text-[9px] font-medium text-[#64748B] dark:text-slate-400 truncate">
                  Improvement
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. SUBJECT-WISE PERFORMANCE CARD (APP 1:1) ── */}
      {(selectedFilter === 'Overview' || selectedFilter === 'Practice Tests') && (
        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 sm:p-5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_3px_10px_rgba(11,31,91,0.03)] space-y-3.5 h-full flex flex-col justify-between">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="text-[17.5px] font-black text-[#051A43] dark:text-white tracking-[-0.3px]">
              Subject-wise Performance
            </h2>

            {/* Metric Toggle */}
            <button
              type="button"
              onClick={() => setSelectedMetric(selectedMetric === 'Marks' ? 'Percentage' : 'Marks')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 text-[#051A43] dark:text-slate-200 text-[11px] font-bold shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>{selectedMetric}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#051A43] dark:text-slate-300" />
            </button>
          </div>

          {/* Subject Rows */}
          <div className="space-y-3">
            {subjectPerformance.map((sub) => {
              const progressPct = Math.round((sub.scored / sub.total) * 100);
              return (
                <div
                  key={sub.title}
                  className="flex items-center gap-2.5 sm:gap-3 py-1 group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-1 rounded-xl transition-colors cursor-pointer"
                  onClick={() => navigate('/practice')}
                >
                  {/* Left Icon or Symbol */}
                  <div
                    className={`w-8 h-8 rounded-lg ${sub.iconBg} dark:bg-slate-800 flex items-center justify-center shrink-0`}
                  >
                    {sub.symbol ? (
                      <div
                        className={`w-5 h-5 rounded-[5px] ${sub.symbolBg} text-white flex items-center justify-center text-[11px] font-black leading-none`}
                      >
                        {sub.symbol}
                      </div>
                    ) : sub.icon ? (
                      <sub.icon className={`w-[17px] h-[17px] ${sub.iconColor}`} />
                    ) : null}
                  </div>

                  {/* Title */}
                  <div className="w-24 sm:w-32 shrink-0 truncate">
                    <span className="text-xs font-extrabold text-[#051A43] dark:text-white truncate block">
                      {sub.title}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex-1 h-[5px] bg-[#E2ECF8] dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${sub.progressColor} rounded-full transition-all duration-500`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Score Fraction */}
                  <div className="w-12 text-right shrink-0">
                    <span className="text-[10.5px] font-semibold text-[#475569] dark:text-slate-300">
                      {selectedMetric === 'Marks' ? `${sub.scored} / ${sub.total}` : `${sub.percentage}%`}
                    </span>
                  </div>

                  {/* Percentage Pill */}
                  <div
                    className={`w-11 py-0.5 rounded-md ${sub.badgeBg} dark:bg-slate-800 text-center shrink-0`}
                  >
                    <span className={`text-[11px] font-black ${sub.badgeTextColor}`}>
                      {sub.percentage}%
                    </span>
                  </div>

                  {/* Right chevron circle */}
                  <div className="w-5 h-5 rounded-full bg-[#EFF6FF] dark:bg-slate-800 flex items-center justify-center text-[#026BFC] shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
            {subjectPerformance.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-500">Subject performance appears after you complete tests with subject data.</p>
            )}
          </div>
        </div>
      )}
      </div>
      )}

      {/* ── 5. RECENT TESTS SECTION (APP 1:1) ── */}
      {(selectedFilter === 'Overview' ||
        selectedFilter === 'Mock Tests' ||
        selectedFilter === 'Live Tests') && (
        <div className="space-y-3 pt-1">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-black text-[#051A43] dark:text-white tracking-[-0.4px]">
              Recent Tests
            </h2>
            <button
              type="button"
              onClick={() => setSelectedFilter('Mock Tests')}
              className="flex items-center gap-1 text-[12.5px] font-bold text-[#026BFC] hover:underline cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {recentTestsList.map((test) => (
              <div
                key={test.id}
                onClick={() => handleTestClick(test)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_2px_8px_rgba(11,31,91,0.03)] hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex items-center gap-3 cursor-pointer group"
              >
                {/* Emblem */}
                <div className="shrink-0">{renderEmblem(test.emblemType)}</div>

                {/* Middle info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-black text-[#051A43] dark:text-white tracking-[-0.2px] truncate group-hover:text-[#026BFC] transition-colors">
                    {test.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5">
                    <FileText className="w-2.5 h-2.5 text-[#64748B]" />
                    <span className="truncate">
                      {test.type} • {test.questionsCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5">
                    <Calendar className="w-2.5 h-2.5 text-[#64748B]" />
                    <span>{test.date}</span>
                  </div>
                </div>

                {/* Score badge */}
                <div className={`px-2.5 py-1 rounded-xl ${test.scoreBg} dark:bg-slate-800 text-center shrink-0`}>
                  <div className={`text-[13.5px] font-black ${test.scoreColor} leading-tight`}>
                    {test.percentage}%
                  </div>
                  <div className="text-[9.5px] font-semibold text-[#64748B] dark:text-slate-400">
                    {test.scored} / {test.total}
                  </div>
                </div>

                {/* Circular Chevron */}
                <div className="w-6 h-6 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#026BFC] flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. TEST SERIES RESULTS SECTION (APP 1:1) ── */}
      {(selectedFilter === 'Overview' || selectedFilter === 'Test Series') && (
        <div className="space-y-3 pt-2">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-5 h-5 text-[#051A43] dark:text-white" />
              <h2 className="text-[18px] font-black text-[#051A43] dark:text-white tracking-[-0.4px]">
                Test Series Results
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/test-series')}
              className="flex items-center gap-1 text-[12.5px] font-bold text-[#026BFC] hover:underline cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Series Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {seriesResults.map((series) => {
              const progressPct = Math.round((series.completedTests / series.totalTests) * 100);
              return (
                <div
                  key={series.id}
                  onClick={() => navigate(`/test-series/${series.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_2px_8px_rgba(11,31,91,0.03)] hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex items-center gap-3 cursor-pointer group"
                >
                  {/* Left Emblem */}
                  <div className="shrink-0">{renderEmblem(series.emblemType)}</div>

                  {/* Middle Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-black text-[#051A43] dark:text-white tracking-[-0.2px] truncate group-hover:text-[#026BFC] transition-colors">
                      {series.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[9.5px] font-semibold text-[#64748B] dark:text-slate-400 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5 text-[#64748B]" />
                        {series.totalTests} Tests
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-[#10B981]">
                        <Trophy className="w-2.5 h-2.5" />
                        {series.completedTests} Completed
                      </span>
                      <span>•</span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          series.isCompleted ? 'text-[#10B981]' : 'text-[#026BFC]'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {series.status}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-[#E2ECF8] dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            series.isCompleted ? 'bg-[#10B981]' : 'bg-[#026BFC]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[9.5px] font-semibold text-[#64748B] dark:text-slate-400 shrink-0">
                        {series.completedTests} / {series.totalTests}
                      </span>
                    </div>
                  </div>

                  {/* Right Avg Score Badge */}
                  <div className={`px-2.5 py-1 rounded-xl ${series.scoreBg} dark:bg-slate-800 text-center shrink-0`}>
                    <div className={`text-[13.5px] font-black ${series.scoreColor} leading-tight`}>
                      {series.avgScore}%
                    </div>
                    <div className="text-[9px] font-semibold text-[#64748B] dark:text-slate-400">
                      Avg. Score
                    </div>
                  </div>

                  {/* Circular Chevron */}
                  <div className="w-6 h-6 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#026BFC] flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
            {seriesResults.length === 0 && (
              <p className="col-span-full py-4 text-center text-xs text-slate-500">No published test series are available yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
