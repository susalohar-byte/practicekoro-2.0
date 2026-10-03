import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Play,
  BookOpen,
  Trophy,
} from 'lucide-react';
import type { PopularExamCard } from '@/types';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { ExamSelectorModal } from '@/components/student/ExamSelectorModal';

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const { selectedExam, setSelectedExam } = useExam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  // Hero banner state
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

  // 3. User Attempts for Continue Practice
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

  // 4. Dynamic Popular Exams Cards (Admin-controllable)
  const { data: popularExamsCards = [] } = useQuery<PopularExamCard[]>({
    queryKey: ['popular-exams'],
    queryFn: () => api.getPopularExams(),
    staleTime: 60000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // 5. Popular Test Series from the published catalog
  const { data: studentSeries = [] } = useQuery({
    queryKey: ['student-test-series'],
    queryFn: () => api.getStudentTestSeries(),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Real-time synchronization
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
    const unsubscribeCatalog = api.subscribeToStudentCatalogUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['student-test-series'] });
    });
    const unsubscribePopularExams = api.subscribeToPopularExamUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['popular-exams'] });
    });

    const handleExamsUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['popular-exams'] });
      queryClient.refetchQueries({ queryKey: ['popular-exams'] });
    };
    window.addEventListener('practicekoro:exams_updated', handleExamsUpdated);

    return () => {
      unsubscribeBanners();
      unsubscribeLiveTests();
      unsubscribeCatalog();
      unsubscribePopularExams();
      window.removeEventListener('practicekoro:exams_updated', handleExamsUpdated);
    };
  }, [queryClient]);

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

  // 4 Core Practice Action Cards (Compact, tactile tiles)
  const coreCards = [
    {
      title: 'Audio Book',
      subtitle: 'Listen & Learn',
      route: '/audio-books',
      shadowColor: 'rgba(0, 91, 212, 0.18)',
      arrowColor: '#0052D4',
      gradient: 'from-[#00A2FF] to-[#0052D4]',
      icon: Headphones,
    },
    {
      title: 'Saved Questions',
      subtitle: 'Bookmarks',
      route: '/saved-questions',
      shadowColor: 'rgba(5, 150, 105, 0.18)',
      arrowColor: '#059669',
      gradient: 'from-[#2DD878] to-[#059669]',
      icon: Bookmark,
    },
    {
      title: 'Rank',
      subtitle: 'Leaderboard',
      route: '/rank',
      shadowColor: 'rgba(249, 115, 22, 0.18)',
      arrowColor: '#EA580C',
      gradient: 'from-[#FBBF24] via-[#F97316] to-[#EA580C]',
      icon: Trophy,
    },
    {
      title: 'Live Tests',
      subtitle: 'Compete Live',
      route: activeLiveTest?.testId ? `/live-test/${activeLiveTest.testId}` : '/live-test',
      shadowColor: 'rgba(225, 29, 72, 0.18)',
      arrowColor: '#BE123C',
      gradient: 'from-[#FB7185] via-[#E11D48] to-[#BE123C]',
      icon: Radio,
    },
  ];

  // Popular Exams sorted
  const popularExams = useMemo(() => {
    return popularExamsCards
      .filter((card) => card.isActive !== false)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [popularExamsCards]);

  // Popular Test Series with themed styling
  const seriesThemes = [
    { badge: '🔥 Bestseller', badgeBg: 'bg-[#FFEDD5] text-[#C2410C]', bgImage: '/images/series_wbp_bg.png', emblem: '/images/exams/emblem_series_wbp.png', arrowColor: '#0877FF' },
    { badge: '⭐ Popular', badgeBg: 'bg-[#FEF3C7] text-[#B45309]', bgImage: '/images/series_kp_bg.png', emblem: '/images/exams/emblem_series_kp.png', arrowColor: '#7C3AED' },
    { badge: '🔥 Hot Series', badgeBg: 'bg-[#FFEDD5] text-[#C2410C]', bgImage: '/images/series_ssc_bg.png', emblem: '/images/exams/emblem_series_ssc.png', arrowColor: '#EA580C' },
  ];
  const popularSeries = studentSeries
    .filter((series) => series.isPopular)
    .slice(0, 3)
    .map((series, index) => ({
      ...seriesThemes[index % seriesThemes.length],
      title: series.title,
      subtitle: series.description || series.examTitle || 'Mock Tests & Solutions',
      route: `/test-series/${series.id}`,
    }));

  // Continue Practice Items
  const practiceItems = useMemo(() => {
    if (!inProgressAttempt) return [];
    const answered = (inProgressAttempt.correctCount || 0) + (inProgressAttempt.wrongCount || 0);
    const total = Math.max(answered, inProgressAttempt.totalQuestions || 0);
    const progress = total > 0 ? Math.min(1, answered / total) : 0;
    return [{
      examBadge: selectedExam?.title?.replace(/ 202\d/, '') || 'Active Exam',
      examColor: '#0066FF',
      badgeBg: '#E0EDFF',
      testName: inProgressAttempt.testTitle || 'Test in progress',
      completedQuestions: answered,
      totalQuestions: total,
      progressPercent: progress,
      emblem: '/images/exams/emblem_series_wbp.png',
      route: `/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`,
    }];
  }, [inProgressAttempt, selectedExam]);

  // Leaderboard data
  const { data: leaderboardRows = [] } = useQuery({
    queryKey: ['home-leaderboard'],
    queryFn: () => api.getAppLeaderboard('west_bengal'),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const { data: dailyContent = {} } = useQuery({
    queryKey: ['student-daily-content'],
    queryFn: () => api.getDailyContent(),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const performerThemes = [
    { rankColor: '#F59E0B', badgeColor: 'bg-amber-100 text-amber-800' },
    { rankColor: '#0066FF', badgeColor: 'bg-blue-100 text-blue-800' },
    { rankColor: '#EA580C', badgeColor: 'bg-orange-100 text-orange-800' },
    { rankColor: '#059669', badgeColor: 'bg-emerald-100 text-emerald-800' },
  ];

  const topPerformers = leaderboardRows.slice(0, 4).map((row, index) => ({
    rank: Number(row.rank),
    name: row.display_name,
    score: `${Math.round(Number(row.average_percentage) || 0)}%`,
    exam: 'West Bengal',
    testsAttempted: `${Number(row.tests_count) || 0} Tests`,
    avatar: '/images/student_avatar.png',
    badge: `/images/performer_badge_${index + 1}.png`,
    ...performerThemes[index % performerThemes.length],
  }));

  // Dynamic Current Date for Today's Info
  const todayDateString = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const firstName = user?.fullName?.split(' ')[0] || 'Aspirant';

  return (
    <div className="space-y-4 sm:space-y-4.5 select-none pb-10 max-w-6xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. SLIM CANDIDATE BAR (Compact, single-line, non-bulky)                   */}
      {/* ========================================================================= */}
      <div className="px-3.5 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">👋</span>
          <span className="text-xs sm:text-sm font-bold text-[#0B1F5B] dark:text-white truncate">
            Hi, <span className="text-[#0877FF] font-extrabold">{firstName}</span>
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <span className="text-xs text-[#5B6B86] dark:text-slate-400 font-medium hidden sm:inline truncate">
            Targeting: <strong className="text-slate-800 dark:text-slate-200">{selectedExam?.title || 'West Bengal Exams'}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExamModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F1F5FC] dark:bg-slate-800 hover:bg-[#E0EFFE] text-[#0877FF] text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Change Target</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO BANNER (Compact, letterbox aspect ratio, no oversized block)      */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-2xl overflow-hidden shadow-2xs border border-slate-200/80 dark:border-slate-800 bg-[#D9EEFF] dark:bg-slate-900 group select-none">
        <div
          className="relative w-full h-36 sm:h-44 md:h-48 lg:h-52 cursor-pointer"
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
            } else {
              navigate('/practice');
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

          {/* Navigation Chevrons on Hover */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs z-20"
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs z-20"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Pagination Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/50 backdrop-blur-xs z-20">
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
                      currentSlide === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
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
      {/* 3. 4 CORE PRACTICE ACTION CARDS (Sleek, compact, tactile tiles)            */}
      {/* ========================================================================= */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {coreCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.route}
                className="relative rounded-xl sm:rounded-2xl overflow-hidden group shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 block"
                style={{
                  boxShadow: `0 4px 12px ${card.shadowColor}`,
                }}
              >
                <div
                  className={cn(
                    'relative w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-br flex flex-col justify-between p-3 sm:p-3.5 text-white overflow-hidden min-h-[82px] sm:min-h-[92px]',
                    card.gradient
                  )}
                >
                  {/* Subtle watermark */}
                  <div className="absolute -right-1 -bottom-1 opacity-15 pointer-events-none text-white">
                    <Icon className="w-12 h-12" />
                  </div>

                  {/* Top row: Icon + Arrow */}
                  <div className="flex items-center justify-between z-10">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/95 text-[#0B1F5B] flex items-center justify-center shadow-2xs">
                      <Icon
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                        style={{ color: card.arrowColor }}
                      />
                    </div>

                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform"
                      style={{ color: card.arrowColor }}
                    >
                      <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Bottom: Title + Subtitle */}
                  <div className="z-10 mt-2">
                    <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight text-white drop-shadow-2xs truncate">
                      {card.title}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-white/90 font-medium leading-tight mt-0.5 truncate">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE TEST STRIP (Sleek, compact inline banner)                         */}
      {/* ========================================================================= */}
      {activeLiveTest && (
        <section className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-blue-100 dark:border-blue-950/60 bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 p-3 sm:p-3.5 text-slate-900 dark:text-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Logo + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 w-11 h-11 rounded-full p-0.5 bg-white shadow-xs border border-blue-100 flex items-center justify-center overflow-hidden">
              <img
                src={activeLiveTest?.logo || activeLiveTest?.examLogo || '/images/exams/logo_wbp.png'}
                alt={activeLiveTest?.title || 'Live Test Exam'}
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
                </span>
                <span className="text-xs text-[#5B6E88] dark:text-slate-400 font-semibold truncate">
                  {formattedLiveDate || 'Starts Soon'}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-black text-[#07194A] dark:text-white tracking-tight truncate mt-0.5">
                {activeLiveTest?.title || 'All-Bengal Live Mock Test'}
              </h3>
            </div>
          </div>

          {/* Right: Countdown + CTA */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
            {/* Inline Countdown Pills */}
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-black">
                {countdownDays}d
              </span>
              <span className="text-slate-400">:</span>
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-black">
                {countdownHours}h
              </span>
              <span className="text-slate-400">:</span>
              <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-black">
                {countdownMinutes}m
              </span>
            </div>

            <Link
              to={activeLiveTest?.testId ? `/live-test/${activeLiveTest.testId}` : '/live-test'}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#0877FF] hover:bg-[#0066FF] text-white text-xs font-extrabold shadow-xs active:scale-95 transition-all"
            >
              <span>Join</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. POPULAR EXAMS SECTION (Compact 4-Card Grid)                            */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base select-none">🔥</span>
            <h2 className="text-sm sm:text-base font-black text-[#0F172A] dark:text-white tracking-tight">
              Popular Exams
            </h2>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-3 h-3 stroke-[2.5]" />
          </Link>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {popularExams.slice(0, 4).map((exam) => (
            <Link
              key={exam.id}
              to={exam.route || (exam.slug || exam.examId ? `/exams/${exam.slug || exam.examId}` : '/test-series')}
              className="relative block h-28 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group select-none shadow-2xs hover:shadow-md"
              style={{
                background: `linear-gradient(135deg, ${exam.cardGradientStart || '#0084FF'}, ${exam.cardGradientEnd || '#0048C6'})`,
              }}
            >
              {exam.cardBgImage && (
                <img
                  src={exam.cardBgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              {/* Overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, transparent 20%, ${exam.cardGradientStart || '#0084FF'}99 55%, ${exam.cardGradientEnd || '#0048C6'}fb 100%)`,
                }}
              />

              {/* Upper-Center Emblem */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center p-1 backdrop-blur-xs border border-white/50 bg-white/20 shadow-xs">
                  {exam.cardEmblemUrl ? (
                    <img
                      src={exam.cardEmblemUrl}
                      alt={exam.title}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>

              {/* Exam Title */}
              <div className="absolute left-3 right-3 bottom-7 pointer-events-none">
                <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight text-white truncate drop-shadow-xs">
                  {exam.title}
                </h3>
              </div>

              {/* Bottom Row */}
              <div className="absolute left-3 right-3 bottom-2 flex items-center justify-between pointer-events-none">
                <span className="text-[10px] sm:text-[11px] font-bold text-white/95 drop-shadow-2xs truncate">
                  {exam.testsCount || exam.cardBadge || '100+ Tests'}
                </span>
                <div
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform pointer-events-auto shrink-0"
                  style={{ color: exam.cardArrowColor || exam.cardGradientStart || '#0877FF' }}
                >
                  <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. POPULAR TEST SERIES SECTION (Compact 3-Card Grid)                      */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base select-none">👑</span>
            <h2 className="text-sm sm:text-base font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Popular Test Series
            </h2>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0877FF] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {popularSeries.map((series, idx) => (
            <Link
              key={idx}
              to={series.route}
              className="relative p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-3 overflow-hidden group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Emblem */}
                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 p-0.5">
                  <img
                    src={series.emblem}
                    alt=""
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'inline-block px-1.5 py-0.2 rounded text-[9px] font-black tracking-tight mb-0.5',
                      series.badgeBg
                    )}
                  >
                    {series.badge}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0B1F5B] dark:text-white leading-tight truncate">
                    {series.title}
                  </h4>
                  <p className="text-[10.5px] font-medium text-[#5B6B86] dark:text-slate-400 mt-0.5 truncate">
                    {series.subtitle}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div
                className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 shadow-2xs flex items-center justify-center shrink-0 group-hover:bg-[#0877FF] group-hover:text-white transition-colors"
                style={{ color: series.arrowColor }}
              >
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONTINUE PRACTICE (Compact progress item)                              */}
      {/* ========================================================================= */}
      {practiceItems.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
              </div>
              <h2 className="text-sm sm:text-base font-black text-[#0B1F5B] dark:text-white tracking-tight">
                Continue Practice
              </h2>
            </div>
            <Link
              to="/practice"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0877FF] hover:underline"
            >
              <span>See All</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {practiceItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-blue-100 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-900 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                      {item.examBadge}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0B1F5B] dark:text-white truncate">
                      {item.testName}
                    </h4>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-[#0877FF] rounded-full"
                        style={{ width: `${Math.round(item.progressPercent * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">
                      {item.completedQuestions}/{item.totalQuestions}
                    </span>
                  </div>
                </div>

                <Link
                  to={item.route}
                  className="px-3 py-1.5 rounded-lg bg-[#0877FF] hover:bg-[#0066FF] text-white text-xs font-bold shrink-0 transition-colors"
                >
                  Resume
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. TOP PERFORMERS (Compact 4-Card Grid)                                   */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm sm:text-base font-black text-[#07194A] dark:text-white tracking-tight">
              Top Performers
            </h2>
          </div>
          <Link
            to="/rank"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0066FF] hover:underline"
          >
            <span>Leaderboard</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {topPerformers.map((p) => (
            <div
              key={p.rank}
              className="relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3 shadow-2xs text-center flex flex-col items-center justify-between min-h-[130px]"
            >
              {/* Top-Left Rank badge */}
              <div className="absolute top-2 left-2 w-5 h-5">
                <img
                  src={p.badge}
                  alt={`Rank ${p.rank}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white shadow-2xs mt-1">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name + Score */}
              <div className="w-full mt-1.5">
                <h4 className="text-xs font-bold text-[#07194A] dark:text-white truncate">
                  {p.name}
                </h4>
                <span
                  className="text-xs sm:text-sm font-black block"
                  style={{ color: p.rankColor }}
                >
                  {p.score}
                </span>
                <span className="text-[9.5px] font-semibold text-slate-400 block truncate">
                  {p.testsAttempted}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TODAY'S INFO & MOTIVATIONAL QUOTE (Compact 2-Column Grid)              */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Today's Info */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/60 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌅</span>
              <h3 className="text-xs sm:text-sm font-black text-[#07194A] dark:text-white">
                Today's Info
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#0066FF] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
              {todayDateString}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">
            {String(dailyContent.factText || 'Practice consistent mock tests daily to maintain speed, accuracy, and cut-off confidence.')}
          </p>

          <div className="mt-2">
            <Link
              to="/practice"
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0066FF] hover:underline"
            >
              <BookOpen className="w-3 h-3" />
              <span>{String(dailyContent.subjectName || dailyContent.factSource || 'General Studies')}</span>
            </Link>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50/60 dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🎯</span>
              <h3 className="text-xs sm:text-sm font-black text-[#07194A] dark:text-white">
                Daily Motivation
              </h3>
            </div>
            <span className="text-[10px] font-bold text-rose-600 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
              {String(dailyContent.targetExam || selectedExam?.title || 'Target Exam')}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic leading-snug">
            “{String(dailyContent.quoteText || 'Success is the sum of small efforts, repeated day in and day out.')}”
          </p>

          <p className="text-[10.5px] font-bold text-slate-400 mt-2">
            {dailyContent.quoteAuthor ? `— ${String(dailyContent.quoteAuthor)}` : '— Robert Collier'}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PRO PASS STRIP (Compact for Free Users)                               */}
      {/* ========================================================================= */}
      {!isPro && (
        <section className="rounded-xl bg-gradient-to-r from-[#0B1F44] to-[#0158FC] text-white p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white">
                Upgrade to <span className="text-amber-300">PracticeKoro Pro</span>
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                Get unlimited access to all exams, 120+ mock tests & statewide rankings.
              </p>
            </div>
          </div>

          <Link
            to="/subscription"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#0158FC] text-xs font-black shadow-xs shrink-0 transition-colors"
          >
            <span>Get Pro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
