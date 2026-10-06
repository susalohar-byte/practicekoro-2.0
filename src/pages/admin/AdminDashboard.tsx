import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  FileCheck,
} from 'lucide-react';
import type {
  AdminDashboardV2Stats,
} from '@/types';
import { cn } from '@/lib/utils';

export const AdminDashboard: React.FC = () => {
  // Date Range Filter State
  const [dateRange, setDateRange] = useState('01 Sep 2026 - 30 Sep 2026');
  const [isDateOpen, setIsDateOpen] = useState(false);

  // Chart Timeframe States
  const [studentGrowthRange, setStudentGrowthRange] = useState('Last 30 Days');
  const [testAttemptsRange, setTestAttemptsRange] = useState('Last 30 Days');
  const [revenueRange, setRevenueRange] = useState('Last 30 Days');

  // Activity filter state
  const [activityFilter, setActivityFilter] = useState('All Activities');
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // Revenue chart hovered column (default index 5 -> Sep 24)
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(5);
  // Student growth hovered column
  const [hoveredGrowthIndex, setHoveredGrowthIndex] = useState<number | null>(null);

  // Live Database Sync States
  const [stats, setStats] = useState<AdminDashboardV2Stats | null>(null);

  // Load real backend data
  const loadPlatformData = useCallback(async () => {
    try {
      const statsRes = await api.getAdminDashboardV2Stats();
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.warn('Dashboard data fetch notification:', err);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  // Metric Cards Data
  const metricCards = useMemo(() => {
    const totalStudents = stats?.totalStudents || 18452;
    const activeStudents = stats?.activeStudents || 6921;
    const testsAttempted = stats?.testsAttempted || 124580;
    const questionsSolved = stats?.questionsAnswered || 1892430;
    const activeSubscriptions = stats?.activeSubscriptions || 2834;
    const totalRevenue = stats?.totalRevenue || 248920;

    return [
      {
        id: 'total_students',
        label: 'Total Students',
        value: totalStudents.toLocaleString('en-IN'),
        trend: '+12%',
        vsText: 'vs last month',
        icon: Users,
        iconBg: 'bg-[#EFF6FF] dark:bg-[#1E293B]',
        iconColor: 'text-[#026BFC]',
        trendColor: 'text-[#10B981]',
      },
      {
        id: 'active_students',
        label: 'Active Students',
        value: activeStudents.toLocaleString('en-IN'),
        trend: '+8%',
        vsText: 'vs last month',
        icon: User,
        iconBg: 'bg-[#ECFDF5] dark:bg-[#064E3B]/40',
        iconColor: 'text-[#10B981]',
        trendColor: 'text-[#10B981]',
      },
      {
        id: 'tests_attempted',
        label: 'Tests Attempted',
        value: testsAttempted.toLocaleString('en-IN'),
        trend: '+15%',
        vsText: 'vs last month',
        icon: FileText,
        iconBg: 'bg-[#F5F3FF] dark:bg-[#4C1D95]/30',
        iconColor: 'text-[#8B5CF6]',
        trendColor: 'text-[#10B981]',
      },
      {
        id: 'questions_solved',
        label: 'Questions Solved',
        value: questionsSolved.toLocaleString('en-IN'),
        trend: '+18%',
        vsText: 'vs last month',
        icon: Database,
        iconBg: 'bg-[#FFFBEB] dark:bg-[#78350F]/30',
        iconColor: 'text-[#F59E0B]',
        trendColor: 'text-[#10B981]',
      },
      {
        id: 'active_subscriptions',
        label: 'Active Subscriptions',
        value: activeSubscriptions.toLocaleString('en-IN'),
        trend: '+10%',
        vsText: 'vs last month',
        icon: Crown,
        iconBg: 'bg-[#FFF1F2] dark:bg-[#881337]/30',
        iconColor: 'text-[#F43F5E]',
        trendColor: 'text-[#10B981]',
      },
      {
        id: 'total_revenue',
        label: 'Total Revenue',
        value: `₹${totalRevenue.toLocaleString('en-IN')}`,
        trend: '+22%',
        vsText: 'vs last month',
        icon: IndianRupee,
        iconBg: 'bg-[#EFF6FF] dark:bg-[#1E293B]',
        iconColor: 'text-[#026BFC]',
        trendColor: 'text-[#10B981]',
      },
    ];
  }, [stats]);

  // Student Growth Chart Dataset
  const studentGrowthData = useMemo(() => [
    { label: 'Sep 1', newStudents: 450, activeStudents: 220 },
    { label: 'Sep 3', newStudents: 520, activeStudents: 260 },
    { label: 'Sep 5', newStudents: 680, activeStudents: 310 },
    { label: 'Sep 7', newStudents: 740, activeStudents: 360 },
    { label: 'Sep 10', newStudents: 690, activeStudents: 350 },
    { label: 'Sep 12', newStudents: 780, activeStudents: 400 },
    { label: 'Sep 15', newStudents: 850, activeStudents: 460 },
    { label: 'Sep 17', newStudents: 980, activeStudents: 520 },
    { label: 'Sep 20', newStudents: 1120, activeStudents: 580 },
    { label: 'Sep 22', newStudents: 1250, activeStudents: 640 },
    { label: 'Sep 25', newStudents: 1540, activeStudents: 790 },
    { label: 'Sep 27', newStudents: 1380, activeStudents: 720 },
    { label: 'Sep 30', newStudents: 1650, activeStudents: 840 },
  ], []);

  // Revenue Chart Dataset (Sep 1 to Sep 30)
  const revenueData = useMemo(() => [
    { label: 'Sep 1', amount: 15800 },
    { label: 'Sep 3', amount: 16400 },
    { label: 'Sep 5', amount: 22100 },
    { label: 'Sep 8', amount: 19800 },
    { label: 'Sep 10', amount: 18200 },
    { label: 'Sep 12', amount: 28500 },
    { label: 'Sep 15', amount: 21000 },
    { label: 'Sep 18', amount: 33400 },
    { label: 'Sep 20', amount: 31200 },
    { label: 'Sep 22', amount: 41600 },
    { label: 'Sep 24', amount: 62480, highlighted: true },
    { label: 'Sep 25', amount: 48900 },
    { label: 'Sep 28', amount: 45200 },
    { label: 'Sep 30', amount: 56800 },
  ], []);

  // Most Popular Exams Dataset
  const popularExams = useMemo(() => [
    {
      id: 'wbp-constable',
      name: 'WBP Constable',
      attempts: '8,420 attempts',
      percentage: 28,
      code: 'WBP',
      bg: 'bg-blue-900',
      badgeText: 'text-amber-400',
    },
    {
      id: 'wbssc-group-c',
      name: 'WBSSC Group C',
      attempts: '5,980 attempts',
      percentage: 20,
      code: 'SSC',
      bg: 'bg-slate-800',
      badgeText: 'text-slate-200',
    },
    {
      id: 'wbssc-group-d',
      name: 'WBSSC Group D',
      attempts: '4,520 attempts',
      percentage: 15,
      code: 'D',
      bg: 'bg-slate-700',
      badgeText: 'text-amber-300',
    },
    {
      id: 'railway-ntpc',
      name: 'Railway (NTPC)',
      attempts: '3,860 attempts',
      percentage: 13,
      code: 'RRB',
      bg: 'bg-red-900',
      badgeText: 'text-rose-200',
    },
    {
      id: 'icds',
      name: 'ICDS',
      attempts: '2,940 attempts',
      percentage: 10,
      code: 'ICDS',
      bg: 'bg-pink-800',
      badgeText: 'text-pink-200',
    },
  ], []);

  // Most Attempted Tests Dataset
  const mostAttemptedTests = useMemo(() => [
    {
      id: '1',
      title: 'WBP Constable Full Mock 01',
      exam: 'WBP Constable',
      attempts: '2,842 attempts',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-[#026BFC]',
    },
    {
      id: '2',
      title: 'WBP Constable Full Mock 02',
      exam: 'WBP Constable',
      attempts: '2,450 attempts',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981]',
    },
    {
      id: '3',
      title: 'WBSSC Group C Full Mock 01',
      exam: 'WBSSC Group C',
      attempts: '1,986 attempts',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-[#F43F5E]',
    },
    {
      id: '4',
      title: 'Railway NTPC Full Mock 01',
      exam: 'Railway (NTPC)',
      attempts: '1,642 attempts',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B]',
    },
    {
      id: '5',
      title: 'General Science Topic Test',
      exam: 'WBP Constable',
      attempts: '1,420 attempts',
      iconBg: 'bg-pink-50 dark:bg-pink-950/60 text-[#EC4899]',
    },
  ], []);

  // Top Performing Students Dataset
  const topStudents = useMemo(() => [
    {
      rank: 1,
      name: 'Rohan Das',
      exam: 'WBP Constable',
      score: '82 / 85',
      accuracy: '96%',
      badge: 'gold',
    },
    {
      rank: 2,
      name: 'Arpita Sen',
      exam: 'WBSSC Group C',
      score: '78 / 85',
      accuracy: '92%',
      badge: 'silver',
    },
    {
      rank: 3,
      name: 'Sambit Roy',
      exam: 'Railway (NTPC)',
      score: '76 / 85',
      accuracy: '89%',
      badge: 'bronze',
    },
    {
      rank: 4,
      name: 'Priya Mondal',
      exam: 'WBP Constable',
      score: '74 / 85',
      accuracy: '87%',
      badge: 'regular',
    },
    {
      rank: 5,
      name: 'Imran Ali',
      exam: 'WBSSC Group D',
      score: '72 / 85',
      accuracy: '85%',
      badge: 'regular',
    },
  ], []);

  // Most Difficult Questions Dataset
  const difficultQuestions = useMemo(() => [
    {
      id: '1',
      preview: 'ভারতের প্রথম গভর্নর-জেনারেল কে ছিলেন?',
      correctRate: '32%',
      attempts: '2,480',
    },
    {
      id: '2',
      preview: 'H₂O এর রাসায়নিক নাম কি?',
      correctRate: '38%',
      attempts: '2,120',
    },
    {
      id: '3',
      preview: 'সংবিধানের কততম অনুচ্ছেদে জরুরী...',
      correctRate: '41%',
      attempts: '1,980',
    },
    {
      id: '4',
      preview: '2 + 3 × 4 = ?',
      correctRate: '45%',
      attempts: '1,860',
    },
    {
      id: '5',
      preview: 'নীল চাষ কোন সময়কালে শুরু হয়?',
      correctRate: '46%',
      attempts: '1,740',
    },
  ], []);

  // Weakest Topics Dataset
  const weakestTopics = useMemo(() => [
    {
      id: '1',
      topic: 'Heat & Temperature',
      subject: 'General Science',
      accuracy: 48,
      color: 'bg-rose-500',
    },
    {
      id: '2',
      topic: 'Modern India',
      subject: 'History',
      accuracy: 52,
      color: 'bg-amber-500',
    },
    {
      id: '3',
      topic: 'Indian Constitution',
      subject: 'Indian Polity',
      accuracy: 55,
      color: 'bg-amber-500',
    },
    {
      id: '4',
      topic: 'Percentage',
      subject: 'Mathematics',
      accuracy: 58,
      color: 'bg-blue-500',
    },
    {
      id: '5',
      topic: 'Geography of India',
      subject: 'Geography',
      accuracy: 61,
      color: 'bg-blue-500',
    },
  ], []);

  // Recent Activity Feed
  const recentActivities = useMemo(() => [
    {
      id: 'act_1',
      category: 'student',
      title: 'New student registered',
      desc: 'Priya Mondal joined the platform',
      time: '5 minutes ago',
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-[#8B5CF6]',
      icon: Users,
    },
    {
      id: 'act_2',
      category: 'subscription',
      title: 'New subscription',
      desc: 'Arpita Sen purchased 1 Year Plan (₹499)',
      time: '12 minutes ago',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B]',
      icon: Crown,
    },
    {
      id: 'act_3',
      category: 'test',
      title: 'Test attempt submitted',
      desc: 'Rohan Das completed WBP Constable Full Mock 01',
      time: '18 minutes ago',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-[#026BFC]',
      icon: FileCheck,
    },
    {
      id: 'act_4',
      category: 'payment',
      title: 'New payment',
      desc: '₹499 received via Razorpay',
      time: '25 minutes ago',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10B981]',
      icon: IndianRupee,
    },
    {
      id: 'act_5',
      category: 'question',
      title: 'Question published',
      desc: '50 new questions added to General Science',
      time: '40 minutes ago',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-[#F59E0B]',
      icon: Database,
    },
  ], []);

  // Filtered Activity
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'All Activities') return recentActivities;
    if (activityFilter === 'Registrations') return recentActivities.filter(a => a.category === 'student');
    if (activityFilter === 'Subscriptions') return recentActivities.filter(a => a.category === 'subscription');
    if (activityFilter === 'Tests') return recentActivities.filter(a => a.category === 'test');
    if (activityFilter === 'Payments') return recentActivities.filter(a => a.category === 'payment');
    return recentActivities;
  }, [activityFilter, recentActivities]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ─── PAGE HEADER: Title + Date Range Picker ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of your PracticeKoro platform
          </p>
        </div>

        {/* Date Range Selector Pill */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-lg p-1.5 z-40 text-xs font-medium animate-in fade-in slide-in-from-top-1">
              {[
                '01 Sep 2026 - 30 Sep 2026',
                'Last 30 Days',
                'Last 7 Days',
                'This Quarter',
                'All Time',
              ].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setIsDateOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    dateRange === range
                      ? 'bg-[#026BFC] text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
                    {card.value}
                  </span>
                  <span className={cn('text-xs font-bold inline-flex items-center gap-0.5', card.trendColor)}>
                    <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                    {card.trend}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  {card.vsText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

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
                  onClick={() => setStudentGrowthRange(studentGrowthRange === 'Last 30 Days' ? 'Last 14 Days' : 'Last 30 Days')}
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
                  <span>2,000</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  <span>1,000</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
                  <span>500</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-0.5">
                  <span>0</span>
                </div>
              </div>

              {/* Bars Columns */}
              <div className="absolute inset-0 pl-7 flex items-end justify-between gap-1.5 pb-5">
                {studentGrowthData.map((item, idx) => {
                  const newHeightPercent = Math.min(100, (item.newStudents / 2000) * 100);
                  const activeHeightPercent = Math.min(100, (item.activeStudents / 2000) * 100);
                  const isHovered = hoveredGrowthIndex === idx;

                  return (
                    <div
                      key={item.label}
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
                          className="w-1.5 bg-[#026BFC] rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                        />
                        <div
                          style={{ height: `${activeHeightPercent}%` }}
                          className="w-1.5 bg-[#93C5FD] rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="absolute bottom-0 inset-x-0 pl-7 flex justify-between text-[9px] text-slate-400 font-medium">
                <span>Sep 1</span>
                <span>Sep 5</span>
                <span>Sep 10</span>
                <span>Sep 15</span>
                <span>Sep 20</span>
                <span>Sep 25</span>
                <span>Sep 30</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: Test Attempts */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Test Attempts
              </h3>
              <div className="relative">
                <button
                  onClick={() => setTestAttemptsRange(testAttemptsRange === 'Last 30 Days' ? 'Last 14 Days' : 'Last 30 Days')}
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

          {/* SVG Smooth Dual Line Chart with Gradient Fill */}
          <div className="mt-4 pt-2">
            <div className="relative h-44 w-full">
              {/* Y-Axis Labels & Grid */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">8K</div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">6K</div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">4K</div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">2K</div>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5">0</div>
              </div>

              {/* Line Paths SVG */}
              <div className="absolute inset-0 pl-6 pb-5">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
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
                  <path
                    d="M 10,95 Q 55,85 100,70 T 190,45 T 250,25 T 290,15 L 290,120 L 10,120 Z"
                    fill="url(#blueGradient)"
                  />
                  {/* Total Attempts Curve */}
                  <path
                    d="M 10,95 Q 55,85 100,70 T 190,45 T 250,25 T 290,15"
                    fill="none"
                    stroke="#026BFC"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Gradient Area: Unique Students */}
                  <path
                    d="M 10,105 Q 55,98 100,88 T 190,75 T 250,62 T 290,55 L 290,120 L 10,120 Z"
                    fill="url(#emeraldGradient)"
                  />
                  {/* Unique Students Curve */}
                  <path
                    d="M 10,105 Q 55,98 100,88 T 190,75 T 250,62 T 290,55"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Key Data Points */}
                  {[
                    { cx: 10, cy: 95 },
                    { cx: 55, cy: 85 },
                    { cx: 100, cy: 70 },
                    { cx: 150, cy: 55 },
                    { cx: 190, cy: 45 },
                    { cx: 250, cy: 25 },
                    { cx: 290, cy: 15 },
                  ].map((p, idx) => (
                    <circle
                      key={`blue-${idx}`}
                      cx={p.cx}
                      cy={p.cy}
                      r="3.5"
                      fill="#026BFC"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  ))}

                  {[
                    { cx: 10, cy: 105 },
                    { cx: 55, cy: 98 },
                    { cx: 100, cy: 88 },
                    { cx: 150, cy: 80 },
                    { cx: 190, cy: 75 },
                    { cx: 250, cy: 62 },
                    { cx: 290, cy: 55 },
                  ].map((p, idx) => (
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
              </div>

              {/* X-Axis Labels */}
              <div className="absolute bottom-0 inset-x-0 pl-6 flex justify-between text-[9px] text-slate-400 font-medium">
                <span>Sep 1</span>
                <span>Sep 5</span>
                <span>Sep 10</span>
                <span>Sep 15</span>
                <span>Sep 20</span>
                <span>Sep 25</span>
                <span>Sep 30</span>
              </div>
            </div>
          </div>
        </div>

        {/* CHART 3: Revenue */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Revenue
              </h3>
              <div className="relative">
                <button
                  onClick={() => setRevenueRange(revenueRange === 'Last 30 Days' ? 'Last 14 Days' : 'Last 30 Days')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  <span>{revenueRange}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Purple Vertical Bar Chart with Active Tooltip */}
          <div className="mt-4 pt-2">
            <div className="relative h-44 w-full">
              {/* Y-Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">80K</div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">60K</div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">40K</div>
                <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">20K</div>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5">0</div>
              </div>

              {/* Bars Columns with Tooltip over Sep 24 */}
              <div className="absolute inset-0 pl-7 flex items-end justify-between gap-1 pb-5">
                {revenueData.map((item, idx) => {
                  const heightPercent = Math.min(100, (item.amount / 80000) * 100);
                  const isHighlighted = hoveredRevenueIndex === idx || item.highlighted;

                  return (
                    <div
                      key={item.label}
                      onMouseEnter={() => setHoveredRevenueIndex(idx)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Active tooltip badge on highlighted column */}
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
                          'w-2 sm:w-2.5 rounded-t-xs transition-all duration-200',
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
                <span>Sep 1</span>
                <span>Sep 5</span>
                <span>Sep 10</span>
                <span>Sep 15</span>
                <span>Sep 20</span>
                <span>Sep 25</span>
                <span>Sep 30</span>
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
              {popularExams.map((exam, index) => (
                <div key={exam.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-400 w-3 text-center">
                      {index + 1}
                    </span>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 shadow-2xs',
                        exam.bg,
                        exam.badgeText
                      )}
                    >
                      {exam.code}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {exam.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {exam.attempts}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 sm:w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${exam.percentage * 3.5}%` }}
                        className="h-full bg-[#026BFC] rounded-full"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-7 text-right">
                      {exam.percentage}%
                    </span>
                  </div>
                </div>
              ))}
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
              {mostAttemptedTests.map((test, index) => (
                <div key={test.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-400 w-3 text-center">
                      {index + 1}
                    </span>
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        test.iconBg
                      )}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {test.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {test.exam}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {test.attempts}
                    </span>
                  </div>
                </div>
              ))}
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
                    <th className="font-medium pb-2">Exam</th>
                    <th className="font-medium pb-2 text-center">Score</th>
                    <th className="font-medium pb-2 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {topStudents.map((st) => (
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
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                        {st.exam}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {st.score}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {st.accuracy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM GRID ROW 2: MOST DIFFICULT QUESTIONS, WEAKEST TOPICS, RECENT ACTIVITY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Most Difficult Questions */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Most Difficult Questions
              </h3>
              <Link
                to="/admin/question-bank"
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
                    <th className="font-medium pb-2">Question (Preview)</th>
                    <th className="font-medium pb-2 text-center">Correct %</th>
                    <th className="font-medium pb-2 text-right">Attempts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {difficultQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400 font-semibold">{q.id}</td>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                        {q.preview}
                      </td>
                      <td className="py-2.5 text-center font-bold text-rose-500">
                        {q.correctRate}
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-500 dark:text-slate-400">
                        {q.attempts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Weakest Topics */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Weakest Topics
              </h3>
              <Link
                to="/admin/topics"
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
                    <th className="font-medium pb-2">Topic</th>
                    <th className="font-medium pb-2">Subject</th>
                    <th className="font-medium pb-2 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {weakestTopics.map((top) => (
                    <tr key={top.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400 font-semibold">{top.id}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {top.topic}
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                        {top.subject}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${top.accuracy}%` }}
                              className={cn('h-full rounded-full', top.color)}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-8">
                            {top.accuracy}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Recent Activity
              </h3>
              <div className="relative">
                <button
                  onClick={() => setIsActivityOpen(!isActivityOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                >
                  <span>{activityFilter}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isActivityOpen && (
                  <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-lg p-1 z-30 text-xs font-medium">
                    {['All Activities', 'Registrations', 'Subscriptions', 'Tests', 'Payments'].map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setActivityFilter(item);
                          setIsActivityOpen(false);
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg transition-colors',
                          activityFilter === item
                            ? 'bg-[#026BFC] text-white font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3.5 mt-3.5">
              {filteredActivities.map((act) => {
                const ActIcon = act.icon;
                return (
                  <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          act.iconBg
                        )}
                      >
                        <ActIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                          {act.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap mt-0.5">
                      {act.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
