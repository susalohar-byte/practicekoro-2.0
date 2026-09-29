import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { api } from '@/services/api';
import {
  Filter,
  CheckCircle2,
  Trophy,
  Flame,
  Target,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Calculator,
  Brain,
  Languages,
  Laptop,
  ArrowRight,
  RotateCcw,
  MoreVertical,
  TrendingUp,
  Clock,
  Eye,
  Sparkles,
} from 'lucide-react';
import type { TestAttempt } from '@/types';

/* ───────────────────────── types ───────────────────────── */
type TestTypeFilter = 'all' | 'mock' | 'topic' | 'pyq' | 'custom';
type SubjectTab = 'subject' | 'topic' | 'exam';

interface UnifiedTestRow {
  id: string;
  testId: string;
  testName: string;
  exam: string;
  type: 'Mock Test' | 'Topic Test' | 'PYQ' | 'Custom Practice';
  date: string;
  score: string;
  scoreVal: number;
  totalMarks: number;
  accuracy: number;
  time: string;
  timeSpentSeconds: number;
  isRealAttempt: boolean;
  status: 'completed' | 'in_progress';
  iconColor: 'blue' | 'purple' | 'green' | 'rose' | 'amber';
}

/* ───────────────────────── helpers ───────────────────────── */
const ICON_COLOR_MAP: Record<UnifiedTestRow['iconColor'], string> = {
  blue: 'bg-blue-500 dark:bg-blue-600',
  purple: 'bg-purple-500 dark:bg-purple-600',
  green: 'bg-emerald-500 dark:bg-emerald-600',
  rose: 'bg-rose-500 dark:bg-rose-600',
  amber: 'bg-amber-500 dark:bg-amber-600',
};

const TYPE_BADGE: Record<
  UnifiedTestRow['type'],
  string
> = {
  'Mock Test':
    'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40',
  'Topic Test':
    'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
  PYQ: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40',
  'Custom Practice':
    'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/40',
};

const FILTER_PILLS: { key: TestTypeFilter; label: string }[] = [
  { key: 'all', label: 'All Tests' },
  { key: 'mock', label: 'Mock Tests' },
  { key: 'topic', label: 'Topic Tests' },
  { key: 'pyq', label: 'PYQ' },
  { key: 'custom', label: 'Custom' },
];

const SUBJECT_DEFS = [
  { name: 'General Knowledge', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', Icon: BookOpen },
  { name: 'Mathematics', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', Icon: Calculator },
  { name: 'Reasoning', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', Icon: Brain },
  { name: 'English', color: 'bg-purple-500', textColor: 'text-purple-600 dark:text-purple-400', Icon: Languages },
  { name: 'Bengali', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', Icon: Languages },
  { name: 'Computer Awareness', color: 'bg-sky-500', textColor: 'text-sky-600 dark:text-sky-400', Icon: Laptop },
];

/* ───────────────────── pagination helpers ───────────────────── */
function buildPageNumbers(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'dots')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push('dots');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('dots');
  pages.push(total);
  return pages;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export const MyTests: React.FC = () => {
  const { user } = useAuth();
  const { selectedExam } = useExam();
  const navigate = useNavigate();

  /* ── state ── */
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [testTypeFilter, setTestTypeFilter] = useState<TestTypeFilter>('all');
  const [timeframe, setTimeframe] = useState<string>('This Year');
  const [subjectTab, setSubjectTab] = useState<SubjectTab>('subject');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  /* close menus on outside click */
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  /* ── fetch ── */
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

  /* ── unified rows ── */
  const allTestRows = useMemo<UnifiedTestRow[]>(() => {
    if (!attempts || attempts.length === 0) return [];

    return attempts.map((a, idx) => {
      let typeStr: UnifiedTestRow['type'] = 'Mock Test';
      if (a.testType === 'pyq') typeStr = 'PYQ';
      else if (
        a.testType === 'topic' ||
        a.testType === 'chapter_mock' ||
        a.testType === 'subject_mock'
      )
        typeStr = 'Topic Test';

      const colors: UnifiedTestRow['iconColor'][] = ['blue', 'purple', 'green', 'rose', 'amber'];
      const iconColor = colors[idx % colors.length];
      const mins = Math.floor(a.timeSpentSeconds / 60);
      const secs = a.timeSpentSeconds % 60;
      const timeStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
      const d = new Date(a.createdAt);
      const dateFormatted = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      return {
        id: a.id,
        testId: a.testId,
        testName: a.testTitle || 'Mock Test',
        exam: a.examTitle || selectedExam?.title || 'Mock Exam',
        type: typeStr,
        date: dateFormatted,
        score: `${Math.round(a.score)}/${a.totalMarks || 100}`,
        scoreVal: a.score,
        totalMarks: a.totalMarks || 100,
        accuracy: Math.round(a.accuracy || 0),
        time: timeStr,
        timeSpentSeconds: a.timeSpentSeconds,
        isRealAttempt: true,
        status: a.status === 'in_progress' ? 'in_progress' : 'completed',
        iconColor,
      };
    });
  }, [attempts, selectedExam]);

  /* ── metrics ── */
  const metrics = useMemo(() => {
    const totalAttempted = attempts.length;
    let computedQuestions = 0;
    let computedAccuracy = 0;
    let bestScoreVal = 0;
    let bestTotalMarks = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;

    if (attempts.length > 0) {
      totalCorrect = attempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
      totalWrong = attempts.reduce((sum, a) => sum + (a.wrongCount || 0), 0);
      totalSkipped = attempts.reduce((sum, a) => sum + (a.skippedCount || 0), 0);
      computedQuestions = totalCorrect + totalWrong + totalSkipped;
      const sumAcc = attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0);
      computedAccuracy = Math.round(sumAcc / attempts.length);
      attempts.forEach((a) => {
        if ((a.score || 0) >= bestScoreVal) {
          bestScoreVal = Math.round(a.score || 0);
          bestTotalMarks = a.totalMarks || 100;
        }
      });
    }

    const uniqueDays = new Set(
      attempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
    );

    return {
      testsAttempted: totalAttempted,
      totalQuestions: computedQuestions.toLocaleString('en-IN'),
      avgAccuracy: computedAccuracy,
      bestScore: attempts.length > 0 ? `${bestScoreVal}/${bestTotalMarks}` : '0/0',
      dayStreak: uniqueDays.size,
      totalCorrect: totalCorrect.toLocaleString('en-IN'),
      totalWrong: totalWrong.toLocaleString('en-IN'),
      totalSkipped: totalSkipped.toLocaleString('en-IN'),
    };
  }, [attempts]);

  /* ── filter + paginate ── */
  const filteredRows = useMemo(() => {
    if (testTypeFilter === 'all') return allTestRows;
    const map: Record<string, UnifiedTestRow['type']> = {
      mock: 'Mock Test',
      topic: 'Topic Test',
      pyq: 'PYQ',
      custom: 'Custom Practice',
    };
    return allTestRows.filter((r) => r.type === map[testTypeFilter]);
  }, [allTestRows, testTypeFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  const pageNumbers = useMemo(() => buildPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  /* ── navigation ── */
  const handleRowClick = (row: UnifiedTestRow) => {
    if (row.isRealAttempt) {
      if (row.status === 'in_progress') {
        navigate(`/exams/${row.testId}/runner?attemptId=${row.id}`);
      } else {
        navigate(`/exams/${row.testId}/results/${row.id}`);
      }
    } else {
      navigate(`/exams/${row.testId}`);
    }
  };

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20 font-sans transition-colors">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* ── 0. BREADCRUMB + TITLE ── */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <Link
                  to="/"
                  className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  Home
                </Link>
                <span className="text-slate-300 dark:text-slate-600 font-normal">&gt;</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">Results</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Your <span className="text-[#0158FC] dark:text-blue-400">Results</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Track your performance, identify strengths, and work on weak areas.
              </p>
            </div>

            {/* ── 1. HERO BANNER ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/80 to-sky-50 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-blue-950/30 border border-blue-100/80 dark:border-blue-800/30 p-5 sm:p-6 shadow-sm dark:shadow-blue-950/10">
              {/* Decorative blurred circle */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                {/* Filter pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {FILTER_PILLS.map((pill) => (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => {
                        setTestTypeFilter(pill.key);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-full text-xs sm:text-[13px] font-bold transition-all duration-200 ${
                        testTypeFilter === pill.key
                          ? 'bg-[#0158FC] dark:bg-blue-600 text-white shadow-md shadow-blue-500/25 dark:shadow-blue-800/30 scale-[1.02]'
                          : 'bg-white/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/60 border border-blue-100/60 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-slate-600'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Illustration */}
                <div className="shrink-0 hidden sm:flex justify-end md:pr-1">
                  <img
                    src="/images/results_hero_illustration.png"
                    alt="Analyse, Improve, Succeed"
                    className="h-24 sm:h-28 md:h-32 object-contain pointer-events-none drop-shadow select-none"
                  />
                </div>
              </div>
            </div>

            {/* ── 2. METRIC CARDS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                {
                  label: 'Tests Attempted',
                  value: metrics.testsAttempted,
                  Icon: FileText,
                  iconBg: 'bg-blue-50 dark:bg-blue-900/30',
                  iconColor: 'text-[#0158FC] dark:text-blue-400',
                },
                {
                  label: 'Total Questions',
                  value: metrics.totalQuestions,
                  Icon: CheckCircle2,
                  iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
                  iconColor: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  label: 'Avg. Accuracy',
                  value: `${metrics.avgAccuracy}%`,
                  Icon: Target,
                  iconBg: 'bg-rose-50 dark:bg-rose-900/30',
                  iconColor: 'text-rose-500 dark:text-rose-400',
                },
                {
                  label: 'Best Score',
                  value: metrics.bestScore,
                  Icon: BarChart3,
                  iconBg: 'bg-purple-50 dark:bg-purple-900/30',
                  iconColor: 'text-purple-600 dark:text-purple-400',
                },
                {
                  label: 'Day Streak',
                  value: metrics.dayStreak,
                  Icon: Flame,
                  iconBg: 'bg-amber-50 dark:bg-amber-900/30',
                  iconColor: 'text-amber-500 dark:text-amber-400',
                  extra: 'col-span-2 sm:col-span-1',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-slate-900/20 flex items-center gap-3 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 group ${card.extra || ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <card.Icon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black text-slate-900 dark:text-white leading-none">
                      {card.value}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 truncate">
                      {card.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 3. TEST HISTORY ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-slate-900/20 overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#0158FC] dark:text-blue-400" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Test History
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTestTypeFilter('all');
                    setCurrentPage(1);
                  }}
                  title="Reset filters"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* ── Desktop table (hidden on mobile) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wide">
                      <th className="py-3 px-5 font-semibold">Test Name</th>
                      <th className="py-3 px-4 font-semibold">Exam</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Score</th>
                      <th className="py-3 px-4 font-semibold">Accuracy</th>
                      <th className="py-3 px-4 font-semibold">Time</th>
                      <th className="py-3 px-5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-16 text-center text-slate-400 dark:text-slate-500 font-medium"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            <span>No tests found matching your criteria.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => {
                        const accGood = row.accuracy >= 70;
                        const accClass = accGood
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';

                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                            onClick={() => handleRowClick(row)}
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm ${ICON_COLOR_MAP[row.iconColor]}`}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors truncate max-w-[220px]">
                                  {row.testName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                              {row.exam}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${TYPE_BADGE[row.type]}`}
                              >
                                {row.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                              {row.date}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-black text-slate-900 dark:text-white">
                              {row.score}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${accClass}`}
                              >
                                {row.accuracy}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                              {row.time}
                            </td>
                            <td
                              className="py-3.5 px-5 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleRowClick(row)}
                                  className="px-3 py-1 rounded-lg text-xs font-bold text-[#0158FC] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </button>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(
                                        openActionMenuId === row.id ? null : row.id
                                      );
                                    }}
                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                  {openActionMenuId === row.id && (
                                    <div
                                      className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 py-1.5 z-30 text-left"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          if (row.isRealAttempt) {
                                            navigate(
                                              `/exams/${row.testId}/solutions/${row.id}`
                                            );
                                          } else {
                                            navigate(`/exams/${row.testId}`);
                                          }
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-2 transition-colors"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-[#0158FC] dark:text-blue-400" />
                                        View Solutions
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          navigate(`/exams/${row.testId}`);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-2 transition-colors"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                        Re-attempt
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list (visible on mobile only) ── */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedRows.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 dark:text-slate-500 font-medium px-4">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No tests found matching your criteria.
                  </div>
                ) : (
                  paginatedRows.map((row) => {
                    const accGood = row.accuracy >= 70;
                    return (
                      <div
                        key={row.id}
                        className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer active:bg-slate-100 dark:active:bg-slate-800/60"
                        onClick={() => handleRowClick(row)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5 ${ICON_COLOR_MAP[row.iconColor]}`}
                          >
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {row.testName}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_BADGE[row.type]}`}
                              >
                                {row.type}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                {row.exam}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              <span className="font-black text-slate-900 dark:text-white text-sm">
                                {row.score}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  accGood
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}
                              >
                                {row.accuracy}%
                              </span>
                              <span>{row.time}</span>
                              <span className="text-slate-400 dark:text-slate-500">{row.date}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-3" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Pagination ── */}
              {filteredRows.length > 0 && (
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div>
                    Showing{' '}
                    {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                    {Math.min(currentPage * pageSize, filteredRows.length)} of{' '}
                    {filteredRows.length} tests
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {pageNumbers.map((pn, idx) =>
                      pn === 'dots' ? (
                        <span
                          key={`dots-${idx}`}
                          className="px-1 text-slate-400 dark:text-slate-600 select-none"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={pn}
                          type="button"
                          onClick={() => setCurrentPage(pn)}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                            currentPage === pn
                              ? 'bg-[#0158FC] dark:bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pn}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── 4. BOTTOM CTA BANNER ── */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50/80 to-sky-50 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-blue-950/20 border border-blue-100/80 dark:border-blue-800/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Trophy className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                    Consistency Creates Champions
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                    {metrics.testsAttempted > 0
                      ? `You've attempted ${metrics.testsAttempted} tests so far. Keep up the great work!`
                      : 'Attempt your first mock test today to start tracking your progress!'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="shrink-0 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0158FC] dark:text-blue-400 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl border border-blue-100 dark:border-slate-700 shadow-sm inline-flex items-center gap-1.5 transition-colors self-end sm:self-auto"
              >
                Go to Practice
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

        {/* ── 5. PERFORMANCE ANALYTICS & INSIGHTS (Moved below main content) ── */}
        <div className="space-y-5 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Performance Analytics
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Detailed breakdown of your accuracy, subject mastery, and state-wide rank standing.
              </p>
            </div>
          </div>

          {/* Row 1: Performance Overview & Subject Performance (2 columns on lg) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* ── PERFORMANCE OVERVIEW ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Performance Overview
                </h3>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#0158FC] cursor-pointer shadow-sm"
                >
                  <option value="This Year">This Year</option>
                  <option value="All Time">All Time</option>
                  <option value="This Month">This Month</option>
                  <option value="This Week">This Week</option>
                </select>
              </div>

              {/* Donut + Legend */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient
                        id="performanceDonutGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#00C5FF" />
                        <stop offset="100%" stopColor="#0158FC" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#performanceDonutGrad)"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={
                        2 * Math.PI * 40 * (1 - metrics.avgAccuracy / 100)
                      }
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                      {metrics.avgAccuracy}%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight">
                      Overall
                      <br />
                      Accuracy
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm font-semibold w-full sm:w-auto sm:min-w-[190px]">
                  {[
                    { label: 'Correct', value: metrics.totalCorrect, dot: 'bg-emerald-500' },
                    { label: 'Incorrect', value: metrics.totalWrong, dot: 'bg-rose-500' },
                    { label: 'Unattempted', value: metrics.totalSkipped, dot: 'bg-slate-400 dark:bg-slate-600' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SUBJECT PERFORMANCE ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Subject Performance
                </h3>
                <Link
                  to="/practice"
                  className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline"
                >
                  View All
                </Link>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
                {(['subject', 'topic', 'exam'] as SubjectTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSubjectTab(tab)}
                    className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                      subjectTab === tab
                        ? 'bg-[#0158FC] dark:bg-blue-600 text-white shadow-sm'
                        : 'hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    By {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Subject bars */}
              <div className="space-y-3 pt-1">
                {SUBJECT_DEFS.map((subj) => {
                  const pct = attempts.length > 0 ? metrics.avgAccuracy : 0;
                  return (
                    <div key={subj.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md ${subj.color} text-white flex items-center justify-center shrink-0`}
                          >
                            <subj.Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {subj.name}
                          </span>
                        </div>
                        <span className={`font-extrabold ${subj.textColor}`}>{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${subj.color} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Your Rank, Keep Going, and Motivational Quote (3 columns on md/lg) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* ── YOUR RANK CARD ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Your Rank</h3>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                    {allTestRows[0]?.testName || 'Attempt a mock test to see your rank'}
                  </p>
                </div>
                <Link
                  to="/rank"
                  className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline"
                >
                  Leaderboard
                </Link>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                      {attempts[0]?.rank ? `# ${attempts[0].rank}` : '# -'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                      {attempts.length > 0 ? 'Based on completed tests' : 'No rank recorded yet'}
                    </p>
                  </div>
                </div>

                {attempts.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100/80 dark:border-emerald-700/40 rounded-xl px-3.5 py-2 text-right shrink-0">
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Active</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Keep practicing!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── KEEP GOING CARD ── */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/80 to-sky-50 dark:from-blue-950/40 dark:via-slate-900/50 dark:to-blue-950/30 border border-blue-100/80 dark:border-blue-800/30 p-5 sm:p-6 relative overflow-hidden shadow-sm flex flex-col justify-between space-y-4">
              <div className="relative z-10 pr-20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="w-4 h-4 text-[#0158FC] dark:text-blue-400" />
                  <h3 className="text-sm sm:text-base font-black text-[#0158FC] dark:text-blue-400">
                    Keep Going!
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-snug">
                  Consistency today creates bigger results tomorrow.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/practice')}
                  className="mt-3 bg-[#0158FC] dark:bg-blue-600 hover:bg-[#0047D4] dark:hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
                >
                  Keep Practicing
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <img
                src="/images/results_growth_chart.png"
                alt="Growth chart"
                className="absolute right-2 bottom-2 w-24 h-20 object-contain pointer-events-none select-none drop-shadow-sm dark:opacity-60"
              />
            </div>

            {/* ── MOTIVATIONAL QUOTE CARD ── */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/80 to-sky-50 dark:from-blue-950/40 dark:via-slate-900/50 dark:to-blue-950/30 border border-blue-100/80 dark:border-blue-800/30 p-5 sm:p-6 relative overflow-hidden shadow-sm flex flex-col justify-between space-y-4">
              <div className="relative z-10 pr-20">
                <Sparkles className="w-5 h-5 text-[#0158FC] dark:text-blue-400 mb-2" />
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 italic leading-relaxed">
                  &ldquo;Progress, not perfection, leads to success.&rdquo;
                </p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2.5">
                  — PracticeKoro
                </p>
              </div>
              <img
                src="/images/streak_mountain_summit.jpg"
                alt="Mountain Summit"
                className="absolute right-0 bottom-0 w-28 h-24 object-cover object-bottom pointer-events-none opacity-80 dark:opacity-40 select-none rounded-tl-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
