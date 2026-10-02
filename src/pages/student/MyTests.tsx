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

const DEFAULT_SUBJECTS: SubjectItem[] = [
  {
    title: 'General Knowledge',
    scored: 18,
    total: 25,
    percentage: 72,
    iconBg: 'bg-[#EBF3FF]',
    iconColor: 'text-[#2563EB]',
    icon: BookOpen,
    progressColor: 'bg-[#10B981]',
    badgeBg: 'bg-[#ECFDF5]',
    badgeTextColor: 'text-[#10B981]',
  },
  {
    title: 'Mathematics',
    scored: 20,
    total: 30,
    percentage: 67,
    iconBg: 'bg-[#E6F8EE]',
    iconColor: 'text-[#16A34A]',
    icon: Calculator,
    progressColor: 'bg-[#0877FF]',
    badgeBg: 'bg-[#EFF6FF]',
    badgeTextColor: 'text-[#0877FF]',
  },
  {
    title: 'Reasoning',
    scored: 12,
    total: 20,
    percentage: 60,
    iconBg: 'bg-[#FFE4E6]',
    iconColor: 'text-[#E11D48]',
    icon: Brain,
    progressColor: 'bg-[#EF4444]',
    badgeBg: 'bg-[#FFF1F2]',
    badgeTextColor: 'text-[#EF4444]',
  },
  {
    title: 'English',
    scored: 16,
    total: 20,
    percentage: 80,
    iconBg: 'bg-[#F3E8FF]',
    iconColor: 'text-[#9333EA]',
    symbol: 'A',
    symbolBg: 'bg-[#9333EA]',
    progressColor: 'bg-[#10B981]',
    badgeBg: 'bg-[#ECFDF5]',
    badgeTextColor: 'text-[#10B981]',
  },
  {
    title: 'General Science',
    scored: 6,
    total: 15,
    percentage: 40,
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    icon: FlaskConical,
    progressColor: 'bg-[#0877FF]',
    badgeBg: 'bg-[#EFF6FF]',
    badgeTextColor: 'text-[#0877FF]',
  },
];

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

const DEFAULT_RECENT_TESTS: RecentTestItem[] = [
  {
    id: 'wbp_mock_01',
    title: 'WBP Constable Mock Test 01',
    type: 'Full Length Test',
    questionsCount: '100 Questions',
    date: '28 Sep 2026',
    percentage: 72,
    scored: 72,
    total: 100,
    emblemType: 'wbssc_red',
    scoreBg: 'bg-[#ECFDF5]',
    scoreColor: 'text-[#10B981]',
  },
  {
    id: 'kp_mock_02',
    title: 'KP Constable Mock Test 02',
    type: 'Full Length Test',
    questionsCount: '100 Questions',
    date: '25 Sep 2026',
    percentage: 65,
    scored: 65,
    total: 100,
    emblemType: 'kp_crest',
    scoreBg: 'bg-[#EFF6FF]',
    scoreColor: 'text-[#0877FF]',
  },
  {
    id: 'ssc_gd_mock_01',
    title: 'SSC GD Mock Test 01',
    type: 'Full Length Test',
    questionsCount: '80 Questions',
    date: '20 Sep 2026',
    percentage: 58,
    scored: 58,
    total: 80,
    emblemType: 'ssc_red',
    scoreBg: 'bg-[#FFF1F2]',
    scoreColor: 'text-[#EF4444]',
  },
];

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

const DEFAULT_SERIES_RESULTS: SeriesResultItem[] = [
  {
    id: 'wbp-constable-2026',
    title: 'WBP Constable Test Series 2026',
    totalTests: 12,
    completedTests: 8,
    status: 'In Progress',
    isCompleted: false,
    avgScore: 68,
    emblemType: 'wbssc_red',
    scoreBg: 'bg-[#EFF6FF]',
    scoreColor: 'text-[#0877FF]',
  },
  {
    id: 'kp-constable-2026',
    title: 'KP Constable Test Series 2026',
    totalTests: 10,
    completedTests: 10,
    status: 'Completed',
    isCompleted: true,
    avgScore: 74,
    emblemType: 'kp_crest',
    scoreBg: 'bg-[#ECFDF5]',
    scoreColor: 'text-[#10B981]',
  },
];

export const MyTests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('Overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('Last 3 Months');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricView>('Marks');
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
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

  // Derived Performance Metrics
  const computedMetrics = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return {
        accuracy: 72,
        correct: '1,254',
        wrong: '356',
        skipped: '190',
        timeSpent: '42h',
        totalTests: 25,
        totalQuestions: '2,480',
        rank: '1,245 / 12,680',
        improvement: '+18%',
      };
    }

    const totalAttempts = attempts.length;
    let sumCorrect = 0;
    let sumWrong = 0;
    let sumSkipped = 0;
    let sumTimeSec = 0;
    let sumAcc = 0;

    attempts.forEach((a) => {
      sumCorrect += a.correctCount || 0;
      sumWrong += a.wrongCount || 0;
      sumSkipped += a.skippedCount || 0;
      sumTimeSec += a.timeSpentSeconds || 0;
      sumAcc += a.accuracy || 0;
    });

    const totalQuestions = sumCorrect + sumWrong + sumSkipped;
    const avgAcc = Math.round(sumAcc / totalAttempts);
    const hours = Math.round(sumTimeSec / 3600);
    const timeSpentStr = hours > 0 ? `${hours}h` : `${Math.round(sumTimeSec / 60)}m`;

    return {
      accuracy: avgAcc > 0 ? avgAcc : 72,
      correct: sumCorrect > 0 ? sumCorrect.toLocaleString('en-IN') : '1,254',
      wrong: sumWrong > 0 ? sumWrong.toLocaleString('en-IN') : '356',
      skipped: sumSkipped > 0 ? sumSkipped.toLocaleString('en-IN') : '190',
      timeSpent: sumTimeSec > 0 ? timeSpentStr : '42h',
      totalTests: totalAttempts,
      totalQuestions: totalQuestions > 0 ? totalQuestions.toLocaleString('en-IN') : '2,480',
      rank: '1,245 / 12,680',
      improvement: '+18%',
    };
  }, [attempts]);

  // Unified Recent Tests (combining real attempts + fallback)
  const recentTestsList = useMemo<RecentTestItem[]>(() => {
    if (attempts.length === 0) {
      return DEFAULT_RECENT_TESTS;
    }

    return attempts.slice(0, 10).map((a) => {
      const pct = Math.round(a.accuracy || (a.score / (a.totalMarks || 100)) * 100);
      let emblem: RecentTestItem['emblemType'] = 'wbssc_red';
      const titleLower = (a.testTitle || '').toLowerCase();
      if (titleLower.includes('kp') || titleLower.includes('kolkata')) {
        emblem = 'kp_crest';
      } else if (titleLower.includes('ssc')) {
        emblem = 'ssc_red';
      }

      let scoreBg = 'bg-[#EFF6FF]';
      let scoreColor = 'text-[#0877FF]';
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
        questionsCount: `${(a.correctCount || 0) + (a.wrongCount || 0) + (a.skippedCount || 0) || 100} Questions`,
        date: dateStr,
        percentage: pct,
        scored: Math.round(a.score),
        total: a.totalMarks || 100,
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
        <h1 className="text-[28px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.6px] leading-[1.15]">
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
                  ? 'bg-[#0877FF] text-white shadow-md shadow-[#0877FF]/25 border border-[#0877FF]'
                  : 'bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 border border-[#E2ECF8] dark:border-slate-800 hover:border-blue-200'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* ── 3. TOTAL PERFORMANCE CARD (APP 1:1) ── */}
      {(selectedFilter === 'Overview' || selectedFilter === 'Mock Tests') && (
        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 sm:p-5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_3px_10px_rgba(11,31,91,0.03)] space-y-4">
          {/* Header Row: Title & Subtitle + Time Dropdown */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17.5px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.3px]">
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 text-[#0B1F5B] dark:text-slate-200 text-[11px] font-bold shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-[#0B1F5B] dark:text-slate-300" />
                <span>{selectedTimeRange}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#0B1F5B] dark:text-slate-300" />
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
                            ? 'text-[#0877FF] font-bold bg-blue-50/50 dark:bg-slate-700/50'
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
                  stroke="#0877FF"
                  strokeWidth="3.6"
                  strokeDasharray={`${(computedMetrics.accuracy / 100) * 88} 100`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[18px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.5px] leading-tight">
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
                <span className="text-[13px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.correct}
                </span>
                <span className="text-[9px] font-semibold text-[#059669] dark:text-emerald-400 mt-0.5">
                  Correct
                </span>
              </div>

              {/* Wrong */}
              <div className="bg-[#FFF1F2] dark:bg-rose-950/40 rounded-xl py-2 px-1.5 text-center flex flex-col items-center">
                <XCircle className="w-4 h-4 text-[#EF4444] mb-1" />
                <span className="text-[13px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.wrong}
                </span>
                <span className="text-[9px] font-semibold text-[#DC2626] dark:text-rose-400 mt-0.5">
                  Wrong
                </span>
              </div>

              {/* Skipped */}
              <div className="bg-[#F1F5F9] dark:bg-slate-800/80 rounded-xl py-2 px-1.5 text-center flex flex-col items-center">
                <MinusCircle className="w-4 h-4 text-[#64748B] mb-1" />
                <span className="text-[13px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.skipped}
                </span>
                <span className="text-[9px] font-semibold text-[#64748B] dark:text-slate-400 mt-0.5">
                  Skipped
                </span>
              </div>

              {/* Time Spent */}
              <div className="bg-[#EFF6FF] dark:bg-blue-950/40 rounded-xl py-2 px-1.5 text-center flex flex-col items-center">
                <Clock className="w-4 h-4 text-[#0877FF] mb-1" />
                <span className="text-[13px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.2px]">
                  {computedMetrics.timeSpent}
                </span>
                <span className="text-[9px] font-semibold text-[#0877FF] dark:text-blue-400 mt-0.5">
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
                <BarChart3 className="w-4 h-4 text-[#0877FF]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-black text-[#0B1F5B] dark:text-white truncate">
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
                <FileText className="w-4 h-4 text-[#0877FF]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-black text-[#0B1F5B] dark:text-white truncate">
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
                <div className="text-[11.5px] font-black text-[#0B1F5B] dark:text-white truncate">
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
        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 sm:p-5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_3px_10px_rgba(11,31,91,0.03)] space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="text-[17.5px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.3px]">
              Subject-wise Performance
            </h2>

            {/* Metric Toggle */}
            <button
              type="button"
              onClick={() => setSelectedMetric(selectedMetric === 'Marks' ? 'Percentage' : 'Marks')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 text-[#0B1F5B] dark:text-slate-200 text-[11px] font-bold shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>{selectedMetric}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#0B1F5B] dark:text-slate-300" />
            </button>
          </div>

          {/* Subject Rows */}
          <div className="space-y-3">
            {DEFAULT_SUBJECTS.map((sub) => {
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
                    <span className="text-xs font-extrabold text-[#0B1F5B] dark:text-white truncate block">
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
                  <div className="w-5 h-5 rounded-full bg-[#EFF6FF] dark:bg-slate-800 flex items-center justify-center text-[#0877FF] shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. RECENT TESTS SECTION (APP 1:1) ── */}
      {(selectedFilter === 'Overview' ||
        selectedFilter === 'Mock Tests' ||
        selectedFilter === 'Live Tests') && (
        <div className="space-y-3 pt-1">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.4px]">
              Recent Tests
            </h2>
            <button
              type="button"
              onClick={() => setSelectedFilter('Mock Tests')}
              className="flex items-center gap-1 text-[12.5px] font-bold text-[#0877FF] hover:underline cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5">
            {recentTestsList.map((test) => (
              <div
                key={test.id}
                onClick={() => handleTestClick(test)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_2px_8px_rgba(11,31,91,0.03)] hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-3 cursor-pointer group"
              >
                {/* Emblem */}
                <div className="shrink-0">{renderEmblem(test.emblemType)}</div>

                {/* Middle info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.2px] truncate group-hover:text-[#0877FF] transition-colors">
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
                <div className="w-6 h-6 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#0877FF] flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
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
              <BarChart3 className="w-5 h-5 text-[#0B1F5B] dark:text-white" />
              <h2 className="text-[18px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.4px]">
                Test Series Results
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/test-series')}
              className="flex items-center gap-1 text-[12.5px] font-bold text-[#0877FF] hover:underline cursor-pointer"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Series Cards */}
          <div className="space-y-2.5">
            {DEFAULT_SERIES_RESULTS.map((series) => {
              const progressPct = Math.round((series.completedTests / series.totalTests) * 100);
              return (
                <div
                  key={series.id}
                  onClick={() => navigate(`/test-series/${series.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_2px_8px_rgba(11,31,91,0.03)] hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-3 cursor-pointer group"
                >
                  {/* Left Emblem */}
                  <div className="shrink-0">{renderEmblem(series.emblemType)}</div>

                  {/* Middle Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-black text-[#0B1F5B] dark:text-white tracking-[-0.2px] truncate group-hover:text-[#0877FF] transition-colors">
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
                          series.isCompleted ? 'text-[#10B981]' : 'text-[#0877FF]'
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
                            series.isCompleted ? 'bg-[#10B981]' : 'bg-[#0877FF]'
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
                  <div className="w-6 h-6 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#0877FF] flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
