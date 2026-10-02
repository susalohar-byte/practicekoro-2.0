import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { bannerService } from '@/services/bannerService';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  ArrowRight,
  Radio,
  Play,
  BookOpen,
  Trophy,
  Target,
  Flame,
  CheckCircle2,
  TrendingUp,
  Zap,
  FileText,
  Calculator,
  Brain,
  Globe,
  Languages,
  PenTool,
  Edit3,
} from 'lucide-react';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { ExamSelectorModal } from '@/components/student/ExamSelectorModal';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const { selectedExam, setSelectedExam } = useExam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const studentName = user?.fullName?.split(' ')[0] || 'Aspirant';

  // Real-time tick for countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Dynamic Hero Banners
  const audience = isPro ? 'pro' : 'free';
  const { data: banners = [] } = useQuery({
    queryKey: ['hero-banners', audience],
    queryFn: () => bannerService.getActiveBanners({ audience, placement: 'home_hero' }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // 2. Active Live Test
  const { data: activeLiveTest } = useQuery({
    queryKey: ['active-live-test'],
    queryFn: () => api.getActiveLiveTest(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  // 3. User Attempts
  const { data: userAttempts = [] } = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Calculate Metrics from real student attempts
  const completedAttempts = useMemo(
    () => userAttempts.filter((a) => a.status === 'completed'),
    [userAttempts]
  );

  const inProgressAttempt = useMemo(
    () => userAttempts.find((a) => a.status === 'in_progress'),
    [userAttempts]
  );

  const totalCompletedTests = completedAttempts.length;

  const avgAccuracy = useMemo(() => {
    if (completedAttempts.length === 0) return 0;
    const sum = completedAttempts.reduce((acc, a) => acc + (a.accuracy || 0), 0);
    return Math.round(sum / completedAttempts.length);
  }, [completedAttempts]);

  const avgScore = useMemo(() => {
    if (completedAttempts.length === 0) return 0;
    const sum = completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
    return Math.round((sum / completedAttempts.length) * 10) / 10;
  }, [completedAttempts]);

  const streakDays = useMemo(() => {
    if (!completedAttempts || completedAttempts.length === 0) return 1;
    const dates = new Set(
      completedAttempts
        .map((a) => {
          const d = a.endTime || a.startTime || a.createdAt;
          return d ? new Date(d).toISOString().slice(0, 10) : null;
        })
        .filter(Boolean)
    );
    return Math.max(1, dates.size);
  }, [completedAttempts]);

  // Real-time banner & live test sync
  useEffect(() => {
    const unsubscribeBanners = bannerService.subscribeToBannerUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      queryClient.refetchQueries({ queryKey: ['hero-banners'] });
    });
    const unsubscribeLiveTests =
      typeof api.subscribeToLiveTestUpdates === 'function'
        ? api.subscribeToLiveTestUpdates(() => {
            queryClient.invalidateQueries({ queryKey: ['active-live-test'] });
            queryClient.refetchQueries({ queryKey: ['active-live-test'] });
          })
        : () => {};
    return () => {
      unsubscribeBanners();
      unsubscribeLiveTests();
    };
  }, [queryClient]);

  // Live test countdown
  const liveStartAt = activeLiveTest?.startAt || activeLiveTest?.scheduledStartTime;
  const startTime = liveStartAt ? new Date(liveStartAt).getTime() : Date.now() + 172800000;
  const timeDiff = Math.max(0, startTime - currentTime);
  const countdownDays = String(Math.floor(timeDiff / (1000 * 60 * 60 * 24))).padStart(2, '0');
  const countdownHours = String(Math.floor((timeDiff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const countdownMinutes = String(Math.floor((timeDiff / (1000 * 60)) % 60)).padStart(2, '0');
  const countdownSeconds = String(Math.floor((timeDiff / 1000) % 60)).padStart(2, '0');

  // Slide rotation
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isHovered]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // 4 Core Practice Hub Cards
  const coreActions = [
    {
      title: 'Mock Test',
      subtitle: 'Full Test Experience',
      badge: '120+ Tests',
      description: 'Real exam simulation with timer & All-Bengal Rank',
      image: '/images/card_mock_test.png',
      route: '/test-series',
      icon: FileText,
      gradient: 'from-[#00A2FF] to-[#0052D4]',
      glow: 'shadow-[0_8px_20px_rgba(0,82,212,0.22)]',
      border: 'border-blue-400/30',
    },
    {
      title: 'Topic Practice',
      subtitle: 'Chapter-wise Drills',
      badge: '30+ Subjects',
      description: 'Master every subject with instant Bengali explanations',
      image: '/images/card_topic_practice.png',
      route: '/practice',
      icon: Zap,
      gradient: 'from-[#2DD878] to-[#059669]',
      glow: 'shadow-[0_8px_20px_rgba(5,150,105,0.22)]',
      border: 'border-emerald-400/30',
    },
    {
      title: 'Previous Year',
      subtitle: 'Real Exam Papers',
      badge: '2018–2025',
      description: 'Solved questions from official West Bengal & SSC exams',
      image: '/images/card_previous_year.png',
      route: '/practice?tab=pyqs',
      icon: BookOpen,
      gradient: 'from-[#FBBF24] via-[#F97316] to-[#EA580C]',
      glow: 'shadow-[0_8px_20px_rgba(234,88,12,0.22)]',
      border: 'border-amber-400/30',
    },
    {
      title: 'Live Tests',
      subtitle: 'Join & Compete',
      badge: 'Statewide Rank',
      description: 'Compete in scheduled exams with statewide leaderboard',
      image: '/images/card_live_tests.png',
      route: '/test-series',
      icon: Radio,
      gradient: 'from-[#FB7185] via-[#E11D48] to-[#BE123C]',
      glow: 'shadow-[0_8px_20px_rgba(190,18,60,0.22)]',
      border: 'border-rose-400/30',
    },
  ];

  // Subject Shortcuts
  const quickSubjects = [
    {
      id: 'math',
      name: 'Mathematics',
      bengaliName: 'গণিত',
      chapters: '30 Chapters',
      color: 'bg-blue-50 text-[#0877FF] border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
      icon: Calculator,
      route: '/practice?subject=math',
    },
    {
      id: 'reasoning',
      name: 'Reasoning',
      bengaliName: 'জিআই ও রিজনিং',
      chapters: '25 Chapters',
      color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800',
      icon: Brain,
      route: '/practice?subject=reasoning',
    },
    {
      id: 'gk',
      name: 'General Knowledge',
      bengaliName: 'সাধারণ জ্ঞান ও কারেন্ট অ্যাফেয়ার্স',
      chapters: '35 Chapters',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800',
      icon: Globe,
      route: '/practice?subject=gk',
    },
    {
      id: 'science',
      name: 'General Science',
      bengaliName: 'সাধারণ বিজ্ঞান',
      chapters: '20 Chapters',
      color: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/50 dark:border-sky-800',
      icon: Sparkles,
      route: '/practice?subject=science',
    },
    {
      id: 'english',
      name: 'English Language',
      bengaliName: 'ইংরেজি',
      chapters: '18 Chapters',
      color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800',
      icon: Languages,
      route: '/practice?subject=english',
    },
    {
      id: 'bengali',
      name: 'Bengali Language',
      bengaliName: 'বাংলা ব্যাকরণ ও সাহিত্য',
      chapters: '15 Chapters',
      color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800',
      icon: PenTool,
      route: '/practice?subject=bengali',
    },
  ];

  // Popular Exams
  const popularExams = [
    {
      title: 'WBP Constable',
      subtitle: 'West Bengal Police 2026',
      testsCount: '120+ Tests',
      badge: 'Hot Recruitment',
      image: '/images/exam_wbp_card.png',
      route: '/exams/wbp-constable',
      gradient: 'from-blue-600 to-indigo-700',
    },
    {
      title: 'KP Constable',
      subtitle: 'Kolkata Police 2026',
      testsCount: '100+ Tests',
      badge: 'Popular',
      image: '/images/exam_kp_card.png',
      route: '/exams/kp-constable',
      gradient: 'from-purple-600 to-violet-800',
    },
    {
      title: 'SSC GD Constable',
      subtitle: 'Central Paramilitary',
      testsCount: '150+ Tests',
      badge: 'Bestseller',
      image: '/images/exam_ssc_card.png',
      route: '/exams/ssc-gd',
      gradient: 'from-amber-600 to-rose-700',
    },
  ];

  // Popular Test Series
  const popularSeries = [
    {
      title: 'WBP Constable',
      subtitle: 'Complete Mock Test Series 2026',
      badge: '🔥 Bestseller',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_wbp_bg.png',
      emblem: '/images/exams/emblem_series_wbp.png',
      testsCount: '120 Full Tests',
      freeMocks: '5 Free Tests',
      route: '/test-series',
    },
    {
      title: 'KP Constable',
      subtitle: 'Prelims & Mains Test Series 2026',
      badge: '⭐ Most Popular',
      badgeBg: 'bg-[#FEF3C7] text-[#B45309]',
      bgImage: '/images/series_kp_bg.png',
      emblem: '/images/exams/emblem_series_kp.png',
      testsCount: '100 Full Tests',
      freeMocks: '3 Free Tests',
      route: '/test-series',
    },
    {
      title: 'SSC GD Constable',
      subtitle: 'Bilingual (Bengali & English)',
      badge: '🔥 All Shifts Solved',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_ssc_bg.png',
      emblem: '/images/exams/emblem_series_ssc.png',
      testsCount: '150 Full Tests',
      freeMocks: '5 Free Tests',
      route: '/test-series',
    },
  ];

  // Top Performers
  const topPerformers = [
    {
      rank: 1,
      name: 'Rahul Das',
      score: '94%',
      exam: 'WBP Constable',
      tests: '32 Tests Attempted',
      avatar: '/images/performer_rahul.png',
      badge: '/images/performer_badge_1.png',
      bgGradient: 'from-[#FFFDF5] to-[#FFF7E8]',
      scoreBg: 'bg-[#FEE8CE] text-[#9A3412]',
    },
    {
      rank: 2,
      name: 'Amit Kumar',
      score: '92%',
      exam: 'KP Constable',
      tests: '28 Tests Attempted',
      avatar: '/images/performer_amit.png',
      badge: '/images/performer_badge_2.png',
      bgGradient: 'from-[#F4F8FD] to-[#E9F3FE]',
      scoreBg: 'bg-[#DBEAFE] text-[#1D4ED8]',
    },
    {
      rank: 3,
      name: 'Sneha Roy',
      score: '89%',
      exam: 'SSC GD',
      tests: '25 Tests Attempted',
      avatar: '/images/performer_sneha.png',
      badge: '/images/performer_badge_3.png',
      bgGradient: 'from-[#FFF7F2] to-[#FDECE3]',
      scoreBg: 'bg-[#FFE5DA] text-[#9A3412]',
    },
    {
      rank: 4,
      name: 'Priya Sharma',
      score: '86%',
      exam: 'WBP Constable',
      tests: '22 Tests Attempted',
      avatar: '/images/performer_priya.png',
      badge: '/images/performer_badge_4.png',
      bgGradient: 'from-[#F2FBF6] to-[#E4F8EE]',
      scoreBg: 'bg-[#D1FAE5] text-[#065F46]',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-7 selection:bg-[#0877FF]/20 selection:text-[#0877FF]">
      {/* ========================================================= */}
      {/* 1. WELCOME GREETING & TARGET EXAM BAR                     */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-[#F7FAFF] to-[#EDF4FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-[#DBE7FA] dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-400/10 via-sky-400/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400">
                {greeting},
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
                {studentName} 👋
              </h1>
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>PRO PASS</span>
                </span>
              ) : (
                <Link
                  to="/subscription"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0877FF] dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
                >
                  <span>FREE ASPIRANT</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Every practice test you solve brings you one step closer to recruitment.
            </p>

            {/* Aspirant Status Chips */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              {/* Target Exam Pill */}
              <button
                type="button"
                onClick={() => setIsExamModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-[#CDE0FC] dark:border-slate-700 text-[#0877FF] dark:text-blue-300 font-bold hover:border-[#0877FF] hover:bg-blue-50/50 dark:hover:bg-slate-700 transition-all shadow-2xs group cursor-pointer"
                title="Change Primary Target Exam"
              >
                <Target className="w-3.5 h-3.5 text-[#0877FF] group-hover:scale-110 transition-transform" />
                <span>Target: {selectedExam?.title || 'WBP Constable 2026'}</span>
                <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-[#0877FF]" />
              </button>

              {/* Study Streak Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 font-bold shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{streakDays} Day Streak</span>
              </div>

              {/* District location */}
              {user?.district && (
                <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                  <span>📍 {user.district}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Header CTA Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/test-series"
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0877FF] to-[#0158FC] hover:from-[#0066FF] hover:to-[#0142C2] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Take Mock Test</span>
            </Link>
            <Link
              to="/practice?tab=pyqs"
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0B1F5B] dark:text-white border border-[#D0DEF2] dark:border-slate-700 text-xs sm:text-sm font-bold shadow-2xs active:scale-95 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#0877FF]" />
              <span>Solve PYQs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. PREP SNAPSHOT METRIC CARDS (4 Responsive Cards)        */}
      {/* ========================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Tests Attempted */}
        <Link
          to="/results"
          className="group p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 hover:border-blue-400/60 shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              Tests Attempted
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0877FF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-[#0B1F5B] dark:text-white">
              {totalCompletedTests}
            </span>
            <span className="text-xs text-slate-400">completed</span>
          </div>
          <p className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1">
            <span>Target: 50+ Mocks</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>

        {/* Metric 2: Average Accuracy */}
        <Link
          to="/results"
          className="group p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 hover:border-emerald-400/60 shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              Avg Accuracy
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'text-xl sm:text-2xl font-black',
                avgAccuracy >= 75
                  ? 'text-emerald-600'
                  : avgAccuracy >= 50
                  ? 'text-[#0877FF]'
                  : avgAccuracy > 0
                  ? 'text-amber-600'
                  : 'text-[#0B1F5B] dark:text-white'
              )}
            >
              {totalCompletedTests > 0 ? `${avgAccuracy}%` : '--%'}
            </span>
            <span className="text-xs text-slate-400">accuracy</span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold mt-1 truncate">
            {avgAccuracy >= 80 ? '🌟 Excellent precision' : 'Aim for 80%+ accuracy'}
          </p>
        </Link>

        {/* Metric 3: Average Points */}
        <Link
          to="/results"
          className="group p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 hover:border-purple-400/60 shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-[#0B1F5B] dark:text-white">
              {totalCompletedTests > 0 ? `${avgScore}` : '--'}
            </span>
            <span className="text-xs text-slate-400">points</span>
          </div>
          <p className="text-[10.5px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
            Across submitted tests
          </p>
        </Link>

        {/* Metric 4: Test Series Rank */}
        <Link
          to="/rank"
          className="group p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 hover:border-amber-400/60 shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              Series Standing
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-600">
              {totalCompletedTests > 0 ? '#18' : '--'}
            </span>
            <span className="text-xs text-slate-400">in series</span>
          </div>
          <p className="text-[10.5px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <span>View Leaderboard</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </Link>
      </section>

      {/* ========================================================= */}
      {/* 3. IN-PROGRESS / RESUME PRACTICE ALERT (IF ANY)            */}
      {/* ========================================================= */}
      {inProgressAttempt && (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-[#F5F8FF] to-white dark:from-slate-900 dark:to-slate-800 border-2 border-[#0877FF]/40 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#0877FF] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
                <Play className="w-5 h-5 fill-white ml-0.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0877FF] dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                    TEST IN PROGRESS
                  </span>
                  <span className="text-xs text-slate-400">• Resume where you stopped</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#0B1F5B] dark:text-white mt-0.5">
                  {inProgressAttempt.testTitle || 'Full Length Mock Test'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {(inProgressAttempt.correctCount || 0) + (inProgressAttempt.wrongCount || 0)}{' '}
                  questions answered so far
                </p>
              </div>
            </div>

            <Link
              to={`/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0877FF] hover:bg-[#0066FF] text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0"
            >
              <span>Resume Test Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. HERO BANNER CAROUSEL (Aspect Ratio & Clean Controls)    */}
      {/* ========================================================= */}
      {banners.length > 0 && banners[currentSlide]?.imageUrl ? (
        <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-[#E2ECF8] dark:border-slate-800 bg-[#D9EEFF] dark:bg-slate-900 group select-none">
          <div
            className="relative w-full aspect-[438/180] sm:aspect-[438/150] cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              const b = banners[currentSlide];
              if (b) {
                bannerService.trackBannerClick(b.id);
                if (b.primaryCtaLink?.startsWith('http')) {
                  window.open(b.primaryCtaLink, '_blank');
                } else {
                  navigate(b.primaryCtaLink || '/practice');
                }
              }
            }}
          >
            <img
              src={banners[currentSlide].imageUrl}
              alt={banners[currentSlide].title || 'Hero Banner'}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.currentTarget.src = '/images/home_hero_banner.png';
              }}
            />

            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-800 dark:text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs z-20"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-800 dark:text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs z-20"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Carousel Pagination Dots */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/50 backdrop-blur-xs z-20">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSlide(idx);
                      }}
                      className={cn(
                        'h-1.5 rounded-full transition-all cursor-pointer',
                        currentSlide === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                      )}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}

      {/* ========================================================= */}
      {/* 5. 4 CORE PRACTICE ACTION CARDS                           */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Practice Modes
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Choose your prep style
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {coreActions.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.route}
                className={cn(
                  'group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300',
                  'bg-gradient-to-br text-white hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]',
                  card.gradient,
                  card.glow
                )}
              >
                {/* Decorative background circle */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[9.5px] font-black uppercase tracking-wider text-white border border-white/25">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-white/85 font-semibold mt-0.5">
                    {card.subtitle}
                  </p>
                  <p className="text-[10px] text-white/75 font-medium mt-1 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
                  <span>Start Practice</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. SUBJECT-WISE QUICK PRACTICE JUMP BAR                   */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Subject Drills
            </h2>
          </div>
          <Link
            to="/practice"
            className="text-xs sm:text-sm font-bold text-[#0877FF] hover:underline flex items-center gap-1"
          >
            <span>All Subjects</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {quickSubjects.map((sub) => {
            const Icon = sub.icon;
            return (
              <Link
                key={sub.id}
                to={sub.route}
                className="group p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 hover:border-[#0877FF]/50 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform',
                    sub.color
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-[#0B1F5B] dark:text-white truncate max-w-full">
                  {sub.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-full mt-0.5">
                  {sub.bengaliName}
                </p>
                <span className="mt-1 text-[9px] font-bold text-[#0877FF]">
                  {sub.chapters}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. LIVE TEST CARD (Elevated with Countdown)               */}
      {/* ========================================================= */}
      <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF4EE] via-[#FFF9F5] to-[#F1F6FF] dark:from-slate-900 dark:to-slate-800 border border-[#FCDCCE] dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EF233C] text-white text-[10px] font-black uppercase tracking-wider">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>ALL-BENGAL LIVE EXAM</span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              {activeLiveTest?.title || 'WBP Constable Statewide Weekly Mock Test'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Compete live with thousands of aspirants across 23 districts of West Bengal.
            </p>
          </div>

          {/* Real-time Countdown Timer */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="w-12 h-13 bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-2xs">
              <span className="text-sm font-black text-[#0B1F5B] dark:text-white leading-tight">
                {countdownDays}
              </span>
              <span className="text-[9px] font-bold text-slate-500">Days</span>
            </div>
            <div className="w-12 h-13 bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-2xs">
              <span className="text-sm font-black text-[#0B1F5B] dark:text-white leading-tight">
                {countdownHours}
              </span>
              <span className="text-[9px] font-bold text-slate-500">Hours</span>
            </div>
            <div className="w-12 h-13 bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-2xs">
              <span className="text-sm font-black text-[#0B1F5B] dark:text-white leading-tight">
                {countdownMinutes}
              </span>
              <span className="text-[9px] font-bold text-slate-500">Mins</span>
            </div>
            <div className="w-12 h-13 bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-2xs">
              <span className="text-sm font-black text-[#EF233C] leading-tight">
                {countdownSeconds}
              </span>
              <span className="text-[9px] font-bold text-slate-500">Sec</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5ECF8] dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#20366F] dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0877FF]" />
              <span>Sat, 28 Sep • 10:00 AM</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{activeLiveTest?.totalQuestions || 100} Questions</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{activeLiveTest?.durationMinutes || 90} Minutes</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-emerald-600 font-bold">Negative Marking (-0.25)</span>
          </div>

          <Link
            to="/test-series"
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#0877FF] hover:bg-[#0066FF] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <span>Register & Enter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. POPULAR TEST SERIES GRID                                */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Popular Test Series
            </h2>
          </div>
          <Link
            to="/test-series"
            className="text-xs sm:text-sm font-bold text-[#0877FF] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {popularSeries.map((series, idx) => (
            <Link
              key={idx}
              to={series.route}
              className="relative p-4 sm:p-5 rounded-2xl border border-[#E2ECF8] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between overflow-hidden group"
            >
              {/* Subtle background monument graphic */}
              <div className="absolute inset-0 opacity-15 dark:opacity-10 group-hover:opacity-25 transition-opacity">
                <img
                  src={series.bgImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black mb-1.5 ${series.badgeBg}`}
                  >
                    {series.badge}
                  </span>
                  <h4 className="text-base font-black text-[#0B1F5B] dark:text-white leading-tight truncate">
                    {series.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {series.subtitle}
                  </p>
                </div>
                <img
                  src={series.emblem}
                  alt=""
                  className="w-12 h-12 object-contain shrink-0 group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="relative z-10 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-semibold mb-3">
                <span className="flex items-center gap-1 text-[#0877FF] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {series.testsCount}
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">{series.freeMocks}</span>
                <span>•</span>
                <span>বাংলা ও English</span>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-extrabold text-[#0877FF] group-hover:underline">
                  Explore Tests
                </span>
                <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0877FF] flex items-center justify-center group-hover:bg-[#0877FF] group-hover:text-white transition-all shadow-2xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. POPULAR EXAMS CAROUSEL / GRID                          */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Popular Exams
            </h2>
          </div>
          <Link
            to="/test-series"
            className="text-xs sm:text-sm font-bold text-[#0877FF] hover:underline flex items-center gap-1"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {popularExams.map((exam, idx) => (
            <Link
              key={idx}
              to={exam.route}
              className="relative aspect-[3/1.8] sm:aspect-[3/2] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 group block bg-slate-200 dark:bg-slate-800"
            >
              <img
                src={exam.image}
                alt={exam.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Glossy overlay with text */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-4 flex flex-col justify-end text-white">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  {exam.badge}
                </span>
                <h4 className="text-base font-black leading-tight mt-0.5">
                  {exam.title}
                </h4>
                <div className="flex items-center justify-between mt-1 text-xs text-white/80">
                  <span>{exam.testsCount}</span>
                  <span className="text-[#00A2FF] font-bold flex items-center gap-0.5">
                    Explore <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. TOP PERFORMERS & LEADERBOARD SPOTLIGHT                 */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Top Performers
            </h2>
          </div>
          <Link
            to="/rank"
            className="text-xs sm:text-sm font-bold text-[#0877FF] hover:underline flex items-center gap-1"
          >
            <span>View Full Leaderboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {topPerformers.map((p) => (
            <div
              key={p.rank}
              className={`relative aspect-square rounded-2xl p-3 sm:p-4 bg-gradient-to-br ${p.bgGradient} dark:from-slate-900 dark:to-slate-800 border border-white/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center overflow-hidden hover:shadow-md transition-all`}
            >
              {/* Medal Badge */}
              <img
                src={p.badge}
                alt={`Rank ${p.rank}`}
                className="absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />

              {/* Avatar */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-1.5">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white shadow-xs"
                />
              </div>

              <h4 className="text-xs sm:text-sm font-black text-[#0B1F5B] dark:text-white truncate max-w-full">
                {p.name}
              </h4>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black my-1 ${p.scoreBg}`}
              >
                {p.score}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-full">
                {p.exam}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                {p.tests}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. TODAY'S INFO & MOTIVATIONAL QUOTE                     */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        {/* Today's Info */}
        <div className="h-full p-4 sm:p-5 rounded-2xl bg-[#F1F6FE] dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/today_info_sunrise.png"
                alt=""
                className="w-8 h-8 object-contain"
              />
              <div>
                <h3 className="text-base font-black text-[#07194A] dark:text-white">
                  Today's Info
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Learn something new everyday
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0066FF] dark:text-blue-400 text-[11px] font-bold border border-blue-100 dark:border-slate-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>02 Oct 2026</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-[#E2ECF8] dark:border-slate-700 flex items-center gap-3">
            <img
              src="/images/today_info_book_circle.png"
              alt=""
              className="w-11 h-11 object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-bold text-[#07194A] dark:text-white leading-snug">
                ভারতের সংবিধান ২৬ জানুয়ারি ১৯৫০ সালে গৃহীত হয় এবং সেদিনই কার্যকর হয়।
              </p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF3FF] dark:bg-slate-700 text-[#0066FF] dark:text-blue-400 text-[10.5px] font-bold">
                <BookOpen className="w-3 h-3" />
                <span>Indian Polity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="h-full relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF6F8] to-[#FDECEF] dark:from-slate-900 dark:to-slate-800 border border-[#FCDCE8] dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden">
          <img
            src="/images/quote_mountain_summit.png"
            alt=""
            className="absolute right-0 bottom-0 h-28 object-contain pointer-events-none opacity-80"
          />

          <div className="relative z-10 mb-2">
            <span className="text-2xl font-serif text-[#F43F5E] font-black leading-none">
              “
            </span>
            <p className="text-xs sm:text-[13px] font-bold text-[#07194A] dark:text-white leading-relaxed pr-16 mt-1">
              ছোট ছোট প্রচেষ্টার যোগফলই বড় সাফল্য, তাই প্রতিদিন একটু একটু করে এগিয়ে চলুন।
            </p>
            <p className="text-[11px] font-extrabold text-[#F43F5E] mt-2">
              — রবার্ট কলিয়ার
            </p>
          </div>

          <div className="relative z-10 pt-2 flex items-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[#BE123C] dark:text-rose-300 text-[10px] font-black">
              Target Exam: {selectedExam?.title || '2026 Recruitment'}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 12. BOTTOM PRO PASS UPGRADE BANNER                        */}
      {/* ========================================================= */}
      {!isPro && (
        <section className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0B1F44] via-[#0138A8] to-[#0158FC] text-white p-5 sm:p-6 overflow-hidden shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Upgrade to <span className="text-amber-300">PracticeKoro Pro</span>
                </h3>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Get unlimited access to all exams, 500+ mock tests, PYQ with Bengali explanations, and statewide rankings.
              </p>
            </div>

            <Link
              to="/subscription"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#0158FC] text-xs font-black shadow-sm shrink-0 active:scale-95 transition-all"
            >
              <span>Get Pro Pass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Tour & Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => setIsOnboardingOpen(false)}
      />

      {/* Primary Target Exam Selector Modal */}
      <ExamSelectorModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        mode="choose"
        onExamSelected={(exam) => {
          setSelectedExam(exam);
          setIsExamModalOpen(false);
        }}
      />
    </div>
  );
};
