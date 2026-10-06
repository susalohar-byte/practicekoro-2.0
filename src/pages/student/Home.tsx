import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { bannerService } from '@/services/bannerService';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  Bookmark,
  Headphones,
  Radio,
  Trophy,
  FileText,
  Target,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Flame,
  Layers,
  Award,
} from 'lucide-react';
import type { PopularTestSeriesCard } from '@/types';
import { OnboardingModal } from '@/components/student/OnboardingModal';

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const { selectedExam } = useExam();
  const navigate = useNavigate();

  // Modal state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Hero banner slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Real-time tick for countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Dynamic Hero Banners (Admin-controlled)
  const audience = isPro ? 'pro' : 'free';
  const { data: banners = [] } = useQuery({
    queryKey: ['hero-banners', audience],
    queryFn: () => bannerService.getActiveBanners({ audience, placement: 'home_hero' }),
    staleTime: 30000,
  });

  // 2. Active Live Test
  const { data: activeLiveTest } = useQuery({
    queryKey: ['active-live-test'],
    queryFn: () => api.getActiveLiveTest(),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // 3. User Attempts for Continue Practice & Performance
  const { data: userAttempts = [] } = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const inProgressAttempt = useMemo(
    () => userAttempts.find((a) => a.status === 'in_progress'),
    [userAttempts]
  );

  const completedAttempts = useMemo(
    () => userAttempts.filter((a) => a.status === 'completed'),
    [userAttempts]
  );

  // Calculated user stats
  const performanceStats = useMemo(() => {
    if (completedAttempts.length === 0) {
      return {
        completedCount: 0,
        averageAccuracy: 78,
        totalQuestionsAnswered: 0,
      };
    }
    const totalAcc = completedAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0);
    const avgAcc = Math.round(totalAcc / completedAttempts.length);
    const totalQs = completedAttempts.reduce(
      (sum, a) => sum + (a.correctCount || 0) + (a.wrongCount || 0),
      0
    );
    return {
      completedCount: completedAttempts.length,
      averageAccuracy: avgAcc,
      totalQuestionsAnswered: totalQs,
    };
  }, [completedAttempts]);

  // 4. Dynamic Popular Test Series Cards
  const { data: popularTestSeriesCards = [] } = useQuery<PopularTestSeriesCard[]>({
    queryKey: ['popular-test-series-showcase'],
    queryFn: () => api.getPopularTestSeriesCards(),
    staleTime: 60000,
  });

  // Leaderboard data
  const { data: leaderboardRows = [] } = useQuery({
    queryKey: ['home-leaderboard'],
    queryFn: () => api.getAppLeaderboard('west_bengal'),
    staleTime: 60000,
  });

  // Live test countdown calculation
  const liveStartAt = activeLiveTest?.startAt || activeLiveTest?.scheduledStartTime;
  const startTime = liveStartAt ? new Date(liveStartAt).getTime() : Date.now();
  const timeDiff = Math.max(0, startTime - currentTime);
  const countdownDays = String(Math.floor(timeDiff / (1000 * 60 * 60 * 24))).padStart(2, '0');
  const countdownHours = String(Math.floor((timeDiff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const countdownMinutes = String(Math.floor((timeDiff / (1000 * 60)) % 60)).padStart(2, '0');

  // Formatted date string for live test
  const formattedLiveDate = useMemo(() => {
    if (activeLiveTest?.scheduledStartTime || activeLiveTest?.startAt) {
      const d = new Date(activeLiveTest.scheduledStartTime || activeLiveTest.startAt);
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hour24 = d.getHours();
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const period = hour24 >= 12 ? 'PM' : 'AM';
      const weekdayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      return `${weekdays[weekdayIndex]}, ${d.getDate()} ${months[d.getMonth()]} • ${hour12}:${minutes} ${period}`;
    }
    return '';
  }, [activeLiveTest]);

  // Slide rotation for Hero Banner
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

  // 4 Core Practice Action Tiles
  const coreCards = [
    {
      title: 'Audio Books',
      subtitle: 'Listen & Learn Syllabus',
      route: '/audio-books',
      icon: Headphones,
      badge: 'New',
      badgeColor: 'bg-blue-50 text-[#026BFC] border-blue-200',
    },
    {
      title: 'Saved Questions',
      subtitle: 'High-Yield Bookmarks',
      route: '/saved-questions',
      icon: Bookmark,
      badge: 'Revision',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'State Leaderboard',
      subtitle: 'All-Bengal Ranking',
      route: '/rank',
      icon: Trophy,
      badge: 'Top 100',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Topic Practice',
      subtitle: 'Speed & Accuracy Drills',
      route: '/practice',
      icon: Zap,
      badge: 'Daily',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  // Popular Test Series sorted
  const popularSeries = useMemo(() => {
    const active = popularTestSeriesCards
      .filter((card) => card.isActive !== false)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    if (active.length > 0) return active;

    return [
      {
        id: 'wbp-constable',
        title: 'WBP Constable',
        badgeText: 'Most Popular',
        fullMockCount: 12,
        topicTestCount: 48,
        pyqTestCount: 15,
        route: '/test-series?exam=wbp-constable&title=WBP%20Constable',
        cardLogoUrl: '/images/exams/emblem_series_wbp.png',
      },
      {
        id: 'railway-ntpc',
        title: 'Railway (NTPC)',
        badgeText: 'Trending Now',
        fullMockCount: 15,
        topicTestCount: 60,
        pyqTestCount: 25,
        route: '/test-series?exam=railway-ntpc&title=Railway%20NTPC',
        cardLogoUrl: '/images/exams/logo_railway.png',
      },
      {
        id: 'ssc-mts',
        title: 'SSC MTS',
        badgeText: undefined,
        fullMockCount: 18,
        topicTestCount: 32,
        pyqTestCount: 14,
        route: '/test-series?exam=ssc-mts&title=SSC%20MTS',
        cardLogoUrl: '/images/exams/emblem_series_ssc.png',
      },
      {
        id: 'wbssc-group-c',
        title: 'WBSSC Group C',
        badgeText: undefined,
        fullMockCount: 10,
        topicTestCount: 35,
        pyqTestCount: 12,
        route: '/test-series?exam=wbssc-group-c&title=WBSSC%20Group%20C',
        cardLogoUrl: '/images/exams/emblem_wbssc.png',
      },
    ] as PopularTestSeriesCard[];
  }, [popularTestSeriesCards]);

  const topPerformers = leaderboardRows.slice(0, 4).map((row) => ({
    rank: Number(row.rank),
    name: row.display_name,
    score: `${Math.round(Number(row.average_percentage) || 0)}%`,
    testsAttempted: `${Number(row.tests_count) || 0} Tests`,
    avatar: '/images/student_avatar.png',
  }));

  return (
    <div className="w-full space-y-5 select-none pb-12">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE DASHBOARD HEADER                                              */}
      {/* ========================================================================= */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Welcome back,
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#051A43] dark:text-white tracking-tight">
              {user?.fullName?.split(' ')[0] || 'Susanta'} 👋
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#026BFC] border border-[#DBEAFE] dark:bg-blue-950/40 dark:border-blue-800">
              <Sparkles className="w-3 h-3 text-[#026BFC]" />
              {selectedExam?.title || 'WBP Constable'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Target Goal: 1 Full Mock & 20 Topic Practice Questions today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#026BFC] hover:text-[#026BFC] transition-colors shadow-2xs"
          >
            <span>Change Target Exam</span>
          </Link>
          <Link
            to="/subscription"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#026BFC] hover:bg-[#0256CA] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPro ? 'Pro Active' : 'Upgrade to Pro'}</span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PRIMARY ACTION FOCUS CARD: WHAT SHOULD I DO NEXT?                     */}
      {/* ========================================================================= */}
      <section>
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#026BFC] border border-blue-200 text-[11px] font-bold">
              <Target className="w-3 h-3" />
              <span>Recommended Next Step</span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-[#051A43] dark:text-white tracking-tight">
              {inProgressAttempt
                ? `Resume: ${inProgressAttempt.testTitle || 'Test in Progress'}`
                : `${selectedExam?.title || 'WBP Constable'} Official Mock Test #03`}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {inProgressAttempt
                ? 'You have an incomplete test attempt. Complete it now to receive your statewide rank and performance analysis.'
                : 'Based on your recent syllabus coverage, attempting this full mock test will strengthen your exam readiness and timing.'}
            </p>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                60 Mins
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                85 Marks
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Instant Solutions
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
            <Link
              to={
                inProgressAttempt
                  ? `/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`
                  : '/test-series'
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#026BFC] hover:bg-[#0256CA] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
            >
              <span>{inProgressAttempt ? 'Resume Test Now' : 'Start Mock Test'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/practice"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors border border-slate-200/60 dark:border-slate-700"
            >
              <span>Practice by Chapter</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROMOTIONAL HERO BANNER (Directly after Focus Section)                 */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-xl overflow-hidden shadow-2xs border border-slate-200 dark:border-slate-800 bg-[#D9EEFF] dark:bg-slate-900 group select-none">
        <div
          className="relative w-full h-32 sm:h-40 md:h-44 cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            const b = banners[currentSlide];
            if (b) {
              bannerService.trackBannerClick(b.id);
              if (b.primaryCtaLink?.startsWith('http')) {
                window.open(b.primaryCtaLink, '_blank');
              } else {
                navigate(b.primaryCtaLink || '/test-series');
              }
            } else {
              navigate('/test-series');
            }
          }}
        >
          <img
            src={banners[currentSlide]?.imageUrl || '/images/home_hero_banner.png'}
            alt={banners[currentSlide]?.title || 'PracticeKoro Hero Banner'}
            className="w-full h-full object-cover object-center transition-opacity duration-300"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs z-20"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs z-20"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/60 backdrop-blur-xs z-20">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={cn(
                      'h-1 rounded-full transition-all cursor-pointer',
                      currentSlide === idx ? 'w-3.5 bg-white' : 'w-1 bg-white/50 hover:bg-white/80'
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE TEST STRIP (Directly after Banner)                                */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-r from-rose-50/60 via-white to-rose-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 p-3.5 text-slate-900 dark:text-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0 w-10 h-10 rounded-lg bg-white shadow-2xs border border-rose-200 dark:border-rose-900/40 flex items-center justify-center overflow-hidden p-1">
            <img
              src={activeLiveTest?.logo || activeLiveTest?.examLogo || '/images/exams/logo_wbp.png'}
              alt={activeLiveTest?.title || 'Live Test Exam'}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE NOW
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
                {formattedLiveDate || 'Scheduled Today • 8:00 PM'}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-[#051A43] dark:text-white tracking-tight truncate mt-0.5">
              {activeLiveTest?.title || 'WBP Constable Mega Live Mock #1'}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-black">
              {countdownDays}d
            </span>
            <span className="text-slate-400">:</span>
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-black">
              {countdownHours}h
            </span>
            <span className="text-slate-400">:</span>
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-black">
              {countdownMinutes}m
            </span>
          </div>

          <Link
            to={activeLiveTest?.testId ? `/live-test/${activeLiveTest.testId}` : '/test-series'}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <span>Join Live Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. 4 REVISION & ACTION TILES                                              */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {coreCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.route}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#026BFC]/60 transition-all duration-150 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#026BFC] flex items-center justify-center group-hover:bg-[#026BFC] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold border', card.badgeColor)}>
                  {card.badge}
                </span>
              </div>

              <div className="mt-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white tracking-tight truncate">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {card.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* 6. MY PERFORMANCE SUMMARY: HOW AM I PERFORMING?                           */}
      {/* ========================================================================= */}
      <section className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#026BFC]" />
            <h2 className="text-xs sm:text-sm font-black text-[#051A43] dark:text-white tracking-tight">
              My Preparation Performance
            </h2>
          </div>
          <Link
            to="/results"
            className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-1"
          >
            <span>Detailed Analytics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Tests Attempted
            </span>
            <span className="text-lg sm:text-xl font-black text-[#051A43] dark:text-white mt-0.5 block">
              {performanceStats.completedCount} / 50 Tests
            </span>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2 overflow-hidden">
              <div
                className="h-full bg-[#026BFC] rounded-full"
                style={{ width: `${Math.min(100, (performanceStats.completedCount / 50) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Average Accuracy
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {performanceStats.averageAccuracy}%
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">
              Target benchmark: &gt;80%
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Questions Solved
            </span>
            <span className="text-lg sm:text-xl font-black text-[#051A43] dark:text-white mt-0.5 block">
              {performanceStats.totalQuestionsAnswered} Questions
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-1 block">
              Across all topics & mocks
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. POPULAR TEST SERIES: HORIZONTAL CAROUSEL (media_1791277830724.png)     */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-black tracking-tight text-[#0F172A] dark:text-white">
              Popular <span className="text-[#026BFC]">Test Series</span>
            </h2>
          </div>
          <Link
            to="/test-series"
            className="text-xs font-bold text-[#026BFC] hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <span className="text-sm">→</span>
          </Link>
        </div>

        {/* Responsive Single Horizontal Carousel */}
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0">
          {popularSeries.map((series) => {
            const targetId = series.testSeriesId || series.id;
            const title = series.title || 'Mock Test Series';
            const tLower = title.toLowerCase();

            // Card styling themes matching media_1791277830724.png
            let gradient = 'bg-gradient-to-br from-[#065F46] to-[#022C22]';
            let borderColor = 'border-[#047857]';
            let bgAsset = '/images/exams/bg_wbpsc.png';
            let emblemAsset = series.cardLogoUrl || '/images/exams/emblem_wbssc.png';
            let chevronColor = 'text-[#10B981]';
            let isDark = true;
            let badgeText = series.badgeText;
            let badgeBg = 'bg-black/35 text-[#6EE7B7]';

            if (tLower.includes('wbp') || tLower.includes('police') || tLower.includes('constable')) {
              gradient = 'bg-gradient-to-br from-[#0052D4] to-[#0A2E6E]';
              borderColor = 'border-[#1E40AF]';
              bgAsset = '/images/exams/bg_wbp.png';
              emblemAsset = series.cardLogoUrl || '/images/exams/emblem_series_wbp.png';
              chevronColor = 'text-[#0052D4]';
              isDark = true;
              badgeText = badgeText || 'Most Popular';
              badgeBg = 'bg-black/35 text-amber-300';
            } else if (tLower.includes('railway') || tLower.includes('ntpc') || tLower.includes('rrb')) {
              gradient = 'bg-gradient-to-br from-[#7F1D1D] to-[#450A0A]';
              borderColor = 'border-[#991B1B]';
              bgAsset = '/images/exams/bg_railway.png';
              emblemAsset = series.cardLogoUrl || '/images/exams/logo_railway.png';
              chevronColor = 'text-[#DC2626]';
              isDark = true;
              badgeText = badgeText || 'Trending Now';
              badgeBg = 'bg-black/35 text-rose-200';
            } else if (tLower.includes('ssc') || tLower.includes('mts')) {
              gradient = 'bg-gradient-to-br from-[#FFF4DC] to-[#FCE39E]';
              borderColor = 'border-[#FDE68A]';
              bgAsset = '/images/exams/bg_ssc.png';
              emblemAsset = series.cardLogoUrl || '/images/exams/emblem_series_ssc.png';
              chevronColor = 'text-[#D97706]';
              isDark = false;
              badgeBg = 'bg-amber-100 text-amber-800';
            }

            const fullMocks = series.fullMockCount ?? 12;
            const topicTests = series.topicTestCount ?? 48;
            const pyqTests = series.pyqTestCount ?? 15;

            return (
              <div
                key={series.id}
                onClick={() => {
                  if (series.route) {
                    navigate(series.route);
                  } else {
                    navigate(`/test-series/${targetId}`);
                  }
                }}
                className={cn(
                  'relative shrink-0 snap-start rounded-2xl border p-2.5 sm:p-3 cursor-pointer shadow-sm overflow-hidden transition-transform duration-150 active:scale-[0.98] select-none',
                  'w-[calc(50vw-22px)] min-w-[172px] max-w-[210px] sm:w-[220px] sm:min-w-[220px] md:w-[245px] md:min-w-[245px] lg:w-[260px] lg:min-w-[260px]',
                  'h-[128px] sm:h-[132px] flex flex-col justify-between',
                  gradient,
                  borderColor
                )}
              >
                {/* Background artwork on right side with soft fade */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none opacity-60 mix-blend-screen bg-cover bg-no-repeat bg-right"
                  style={{
                    backgroundImage: `url(${bgAsset})`,
                    maskImage: 'linear-gradient(to left, black 40%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 100%)',
                  }}
                />

                {/* Top Row: Emblem + Title & Badge + Chevron Button */}
                <div className="relative z-10 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg p-1 shrink-0 flex items-center justify-center',
                        isDark ? 'bg-white/15' : 'bg-white/70'
                      )}
                    >
                      <img
                        src={emblemAsset}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/logo-icon.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      {badgeText && (
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider leading-tight mb-0.5',
                            badgeBg
                          )}
                        >
                          {badgeText}
                        </span>
                      )}
                      <h3
                        className={cn(
                          'text-xs sm:text-[13px] font-black truncate leading-tight',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {title}
                      </h3>
                    </div>
                  </div>

                  {/* Circular Chevron Arrow Button */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-xs shrink-0 flex items-center justify-center">
                    <ChevronRight className={cn('w-3.5 h-3.5 stroke-[2.5]', chevronColor)} />
                  </div>
                </div>

                {/* Bottom Translucent Stats Strip */}
                <div
                  className={cn(
                    'relative z-10 rounded-lg px-1.5 py-1 flex items-center justify-between text-center',
                    isDark ? 'bg-black/40 text-white' : 'bg-white/75 text-slate-800'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <FileText className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                      <span className="text-[11px] font-black leading-none">{fullMocks}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 block truncate leading-tight mt-0.5">
                      Full Mocks
                    </span>
                  </div>

                  <div className="w-px h-3.5 bg-slate-400/25" />

                  <div className="flex-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <Layers className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-black leading-none">{topicTests}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 block truncate leading-tight mt-0.5">
                      Topic Tests
                    </span>
                  </div>

                  <div className="w-px h-3.5 bg-slate-400/25" />

                  <div className="flex-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <Award className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                      <span className="text-[11px] font-black leading-none">{pyqTests}</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 block truncate leading-tight mt-0.5">
                      Official PYQs
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. STATEWIDE TOP PERFORMERS & DAILY STUDY TIP                             */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Top Performers */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white">
                West Bengal Leaderboard
              </h3>
            </div>
            <Link to="/rank" className="text-xs font-bold text-[#026BFC] hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {topPerformers.map((p) => (
              <div
                key={p.rank}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2"
              >
                <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {p.rank}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">{p.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Study Tip */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                💡
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white">
                Daily Preparation Tip
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mt-1.5">
              Focus on negative marking prevention during the first 30 minutes of your mock test. Skip questions with less than 60% certainty and return to them during your second pass.
            </p>
          </div>

          <div className="pt-2.5 mt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Accuracy is the key to ranking</span>
            <Link to="/practice" className="text-[#026BFC] font-bold hover:underline">
              Practice Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Onboarding modal */}
      {isOnboardingOpen && (
        <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      )}
    </div>
  );
};
