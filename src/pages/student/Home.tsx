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
  Calendar,
  Sparkles,
  ArrowRight,
  Bookmark,
  Headphones,
  Radio,
  Play,
  FileText,
  BookOpen,
  Crosshair,
  Trophy,
  Clock,
  Crown,
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

  // 4 Core Practice Action Cards (Exact match to Mobile App UI features)
  const coreCards = [
    {
      title: 'Audio Book',
      subtitle: 'Listen & Learn',
      route: '/audio-books',
      shadowColor: 'rgba(0, 91, 212, 0.22)',
      arrowColor: '#0052D4',
      gradient: 'from-[#00A2FF] to-[#0052D4]',
      icon: Headphones,
      badge: 'Audio',
    },
    {
      title: 'Saved Questions',
      subtitle: 'Review Bookmarks',
      route: '/saved-questions',
      shadowColor: 'rgba(5, 150, 105, 0.22)',
      arrowColor: '#059669',
      gradient: 'from-[#2DD878] to-[#059669]',
      icon: Bookmark,
      badge: 'Revise',
    },
    {
      title: 'Rank',
      subtitle: 'Track Your Position',
      route: '/rank',
      shadowColor: 'rgba(249, 115, 22, 0.22)',
      arrowColor: '#EA580C',
      gradient: 'from-[#FBBF24] via-[#F97316] to-[#EA580C]',
      icon: Trophy,
      badge: 'Top 100',
    },
    {
      title: 'Live Tests',
      subtitle: 'Join & Compete',
      route: activeLiveTest?.testId ? `/live-test/${activeLiveTest.testId}` : '/live-test',
      shadowColor: 'rgba(225, 29, 72, 0.22)',
      arrowColor: '#BE123C',
      gradient: 'from-[#FB7185] via-[#E11D48] to-[#BE123C]',
      icon: Radio,
      badge: 'Live',
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
    { badge: '⭐ Most Popular', badgeBg: 'bg-[#FEF3C7] text-[#B45309]', bgImage: '/images/series_kp_bg.png', emblem: '/images/exams/emblem_series_kp.png', arrowColor: '#7C3AED' },
    { badge: '🔥 Bestseller', badgeBg: 'bg-[#FFEDD5] text-[#C2410C]', bgImage: '/images/series_ssc_bg.png', emblem: '/images/exams/emblem_series_ssc.png', arrowColor: '#EA580C' },
  ];
  const popularSeries = studentSeries
    .filter((series) => series.isPopular)
    .slice(0, 3)
    .map((series, index) => ({
      ...seriesThemes[index % seriesThemes.length],
      title: series.title,
      subtitle: series.description || series.examTitle || 'Comprehensive Mock Tests & Analysis',
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
      examColor: '#0066FF', badgeBg: '#E0EDFF',
      testName: inProgressAttempt.testTitle || 'Test in progress',
      subject: 'Continue your active mock test',
      completedQuestions: answered,
      totalQuestions: total,
      progressPercent: progress,
      emblem: '/images/exams/emblem_series_wbp.png',
      accentColor: '#0066FF',
      buttonColor: '#0066FF',
      bgGradient: 'from-[#EAF2FF] to-[#DBEBFF]',
      trackColor: '#BFDBFE',
      bgImage: '/images/series_wbp_bg.png',
      route: `/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`,
      isRealResume: true,
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
    { rankColor: '#F59E0B', bgGradient: 'from-[#FFFDF5] to-[#FFF7E8]', pillBg: 'bg-[#FEE8CE]', pillTextColor: 'text-[#9A3412]' },
    { rankColor: '#0066FF', bgGradient: 'from-[#F4F8FD] to-[#E9F3FE]', pillBg: 'bg-[#DBEAFE]', pillTextColor: 'text-[#1D4ED8]' },
    { rankColor: '#EA580C', bgGradient: 'from-[#FFF7F2] to-[#FDECE3]', pillBg: 'bg-[#FFE5DA]', pillTextColor: 'text-[#9A3412]' },
    { rankColor: '#059669', bgGradient: 'from-[#F2FBF6] to-[#E4F8EE]', pillBg: 'bg-[#D1FAE5]', pillTextColor: 'text-[#065F46]' },
  ];

  const topPerformers = leaderboardRows.slice(0, 4).map((row, index) => ({
    rank: Number(row.rank),
    name: row.display_name,
    score: `${Math.round(Number(row.average_percentage) || 0)}%`,
    exam: 'West Bengal',
    testsAttempted: `${Number(row.tests_count) || 0} Tests Attempted`,
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
    <div className="space-y-6 sm:space-y-7 select-none pb-12">
      {/* ========================================================================= */}
      {/* 1. CANDIDATE GREETING & TARGET EXAM STRIP (Desktop & Laptop Friendly)      */}
      {/* ========================================================================= */}
      <section className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-r from-[#E0EFFE] via-[#EBF4FE] to-[#F3F8FF] dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-[#D4E7FC] dark:border-blue-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        {/* Left: Greeting + Candidate Status */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#0877FF] to-[#0B1F5B] p-0.5 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
            <img
              src="/images/logo.png"
              alt="PracticeKoro"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight leading-tight truncate">
                Welcome back, <span className="text-[#0877FF]">{firstName}</span>! 👋
              </h1>
              {isPro && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[10px] font-black tracking-wider uppercase border border-amber-400/30">
                  <Crown className="w-3 h-3 fill-amber-500" /> PRO
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#5B6B86] dark:text-slate-400 font-medium mt-0.5 truncate">
              Ready to practice today? Stay consistent to achieve your target rank.
            </p>
          </div>
        </div>

        {/* Right: Target Exam Switcher Button */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsExamModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#BFDBFE] dark:border-slate-700 hover:border-[#0877FF] text-xs font-bold text-[#0B1F5B] dark:text-white shadow-xs hover:shadow-sm transition-all group cursor-pointer"
            title="Switch Target Exam"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[#5B6B86] dark:text-slate-400">Target:</span>
            <span className="text-[#0877FF] font-extrabold truncate max-w-[160px] sm:max-w-[200px]">
              {selectedExam?.title || 'Choose Target Exam'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0877FF] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. HERO BANNER CAROUSEL (Desktop/Laptop Bounded Height & Smooth Hover)   */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-[24px] overflow-hidden shadow-sm border border-[#E2ECF8] dark:border-slate-800 bg-[#D9EEFF] dark:bg-slate-900 group select-none">
        <div
          className="relative w-full h-[180px] sm:h-[220px] md:h-[260px] lg:h-[290px] xl:h-[310px] cursor-pointer"
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

          {/* Desktop Hover Navigation Chevrons */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-800 dark:text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs z-20"
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-800 dark:text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs z-20"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Carousel Pagination Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-xs z-20">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={cn(
                      'h-1.5 sm:h-2 rounded-full transition-all cursor-pointer',
                      currentSlide === idx ? 'w-5 sm:w-6 bg-white' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
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
      {/* 3. 4 CORE PRACTICE ACTION CARDS (Desktop Responsive Grid & Typography)   */}
      {/* ========================================================================= */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
          {coreCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.route}
                className="relative rounded-[22px] overflow-hidden group shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 block min-h-[135px] sm:min-h-[150px] lg:min-h-[165px]"
                style={{
                  boxShadow: `0 8px 20px ${card.shadowColor}`,
                }}
              >
                <div
                  className={cn(
                    'relative w-full h-full rounded-[22px] bg-gradient-to-br flex flex-col justify-between p-4 sm:p-5 text-white overflow-hidden',
                    card.gradient
                  )}
                >
                  {/* Ambient top-left circle shape */}
                  <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

                  {/* Watermark graphic bottom-right */}
                  <div className="absolute -right-3 -bottom-3 opacity-15 pointer-events-none text-white group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-16 h-16 sm:w-20 sm:h-20" />
                  </div>

                  {/* Top Row: Icon Container + Circular Arrow Pill */}
                  <div className="flex items-center justify-between z-10">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[14px] bg-white text-[#0B1F5B] flex items-center justify-center shadow-xs">
                      <Icon
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        style={{ color: card.arrowColor }}
                      />
                    </div>

                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 group-hover:bg-white flex items-center justify-center shadow-xs group-hover:translate-x-0.5 transition-transform"
                      style={{ color: card.arrowColor }}
                    >
                      <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Bottom Row: Title + Subtitle */}
                  <div className="z-10 mt-4 sm:mt-5">
                    <h3 className="text-sm sm:text-base lg:text-lg font-black tracking-tight leading-tight text-white drop-shadow-xs">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-xs lg:text-sm text-white/90 font-medium leading-tight mt-1">
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
      {/* 4. LIVE TEST HERO CARD (Desktop Wide Two-Column Layout)                   */}
      {/* ========================================================================= */}
      {activeLiveTest && (
        <section className="relative overflow-hidden rounded-[24px] border border-[#E2EAF4] dark:border-slate-800 bg-gradient-to-r from-[#F8FAFD] via-white to-[#F0F6FF] dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/30 p-4 sm:p-6 text-slate-900 dark:text-white shadow-md hover:shadow-lg transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8">
            {/* Left Column: Test Logo, Badges, Title, Meta */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              {/* Exam Logo with glowing ring */}
              <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-white shadow-md border-2 border-white ring-2 ring-blue-100 dark:ring-blue-900/50 flex items-center justify-center overflow-hidden">
                <img
                  src={activeLiveTest?.logo || activeLiveTest?.examLogo || '/images/exams/logo_wbp.png'}
                  alt={activeLiveTest?.title || 'Live Test Exam'}
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                  }}
                />
              </div>

              {/* Information */}
              <div className="space-y-1.5 min-w-0 flex-1">
                {/* Red Pulse Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF0033] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>ALL-BENGAL LIVE TEST</span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg lg:text-xl font-black text-[#07194A] dark:text-white tracking-tight leading-snug line-clamp-1">
                  {activeLiveTest?.title || 'WBP Constable Statewide Mock Challenge'}
                </h3>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#5B6E88] dark:text-slate-400 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0877FF] shrink-0" />
                    <span>{formattedLiveDate || 'Sat, 28 Sep • 10:00 AM'}</span>
                  </div>
                  <span className="text-[#CBD5E1] dark:text-slate-600 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#64748B] shrink-0" />
                    <span>{activeLiveTest?.totalQuestions ?? 100} Questions</span>
                  </div>
                  <span className="text-[#CBD5E1] dark:text-slate-600 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#64748B] shrink-0" />
                    <span>{activeLiveTest?.durationMinutes ?? 90} Mins</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Countdown boxes + Join CTA */}
            <div className="flex items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E2EAF4] dark:border-slate-800">
              {/* Countdown boxes */}
              <div className="flex items-center gap-2">
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-[#EDF4FD] dark:bg-slate-800 border border-[#D6E4F7] dark:border-slate-700 flex flex-col items-center justify-center shadow-xs">
                  <span className="text-sm sm:text-lg font-black text-[#07194A] dark:text-white leading-tight">
                    {countdownDays}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#708099] dark:text-slate-400">
                    Days
                  </span>
                </div>
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-[#EDF4FD] dark:bg-slate-800 border border-[#D6E4F7] dark:border-slate-700 flex flex-col items-center justify-center shadow-xs">
                  <span className="text-sm sm:text-lg font-black text-[#07194A] dark:text-white leading-tight">
                    {countdownHours}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#708099] dark:text-slate-400">
                    Hours
                  </span>
                </div>
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-[#EDF4FD] dark:bg-slate-800 border border-[#D6E4F7] dark:border-slate-700 flex flex-col items-center justify-center shadow-xs">
                  <span className="text-sm sm:text-lg font-black text-[#07194A] dark:text-white leading-tight">
                    {countdownMinutes}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#708099] dark:text-slate-400">
                    Mins
                  </span>
                </div>
              </div>

              {/* Join Button */}
              <Link
                to={activeLiveTest?.testId ? `/live-test/${activeLiveTest.testId}` : '/live-test'}
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-3 rounded-full bg-[#0877FF] hover:bg-[#0066FF] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-500/25 active:scale-95 transition-all shrink-0"
              >
                <span>Join Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. POPULAR EXAMS SECTION (Desktop 3 or 4 Columns Grid)                     */}
      {/* ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl select-none">🔥</span>
            <div>
              <h2 className="text-base sm:text-xl font-black text-[#0F172A] dark:text-white tracking-tight leading-tight">
                Popular Exams
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium hidden sm:block">
                Choose your dream exam to access tailored mock tests and PYQs
              </p>
            </div>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>

        {/* Responsive Grid: 1 col on mobile, 2 on sm, 3 on lg, 4 on xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {popularExams.map((exam) => (
            <Link
              key={exam.id}
              to={exam.route || (exam.slug || exam.examId ? `/exams/${exam.slug || exam.examId}` : '/test-series')}
              className="relative block aspect-[16/10] sm:aspect-[1.55] rounded-[24px] overflow-hidden hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] transition-all duration-300 group select-none shadow-md"
              style={{
                background: `linear-gradient(135deg, ${exam.cardGradientStart || '#0084FF'}, ${exam.cardGradientEnd || '#0048C6'})`,
                boxShadow: `0 10px 24px -4px ${exam.cardGradientStart || '#0084FF'}44`,
              }}
            >
              {exam.cardBgImage && (
                <img
                  src={exam.cardBgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              {/* Gradient overlay for clear contrast */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, transparent 25%, ${exam.cardGradientStart || '#0084FF'}99 60%, ${exam.cardGradientEnd || '#0048C6'}fb 100%)`,
                }}
              />

              {/* Upper-Center Glowing Circular Emblem Badge */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center p-1.5 backdrop-blur-xs border-2 border-white/60 bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.45)] group-hover:scale-105 transition-transform duration-300">
                  {exam.cardEmblemUrl ? (
                    <img
                      src={exam.cardEmblemUrl}
                      alt={exam.title}
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: exam.cardGradientStart || '#0877FF' }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Title */}
              <div className="absolute left-4.5 right-4.5 bottom-12 pointer-events-none">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  {exam.title}
                </h3>
              </div>

              {/* Card Bottom Row: Calendar + Test Count on Left, Circular White Arrow on Right */}
              <div className="absolute left-4.5 right-4.5 bottom-3.5 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 text-white">
                  <Calendar className="w-4 h-4 text-white/95 shrink-0 stroke-[2.2]" />
                  <span className="text-xs sm:text-sm font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {exam.testsCount || exam.cardBadge || '100+ Tests'}
                  </span>
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/25 group-hover:scale-110 active:scale-95 transition-all duration-200 shrink-0 pointer-events-auto"
                  style={{ color: exam.cardArrowColor || exam.cardGradientStart || '#0877FF' }}
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. POPULAR TEST SERIES SECTION (Desktop 3-Column Responsive Grid)         */}
      {/* ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl select-none">👑</span>
            <div>
              <h2 className="text-base sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight leading-tight">
                Popular Test Series
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium hidden sm:block">
                Complete mock test series prepared with latest syllabus and exam patterns
              </p>
            </div>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0877FF] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Columns Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {popularSeries.map((series, idx) => (
            <Link
              key={idx}
              to={series.route}
              className="relative p-4 sm:p-5 rounded-[22px] border border-[#E2EAF8] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between overflow-hidden group min-h-[140px]"
            >
              {/* Pastel background image watermark */}
              <div className="absolute inset-0 opacity-80 dark:opacity-20 pointer-events-none">
                <img
                  src={series.bgImage}
                  alt=""
                  className="w-full h-full object-cover object-right"
                />
              </div>

              {/* Card Contents */}
              <div className="relative z-10 flex items-start justify-between gap-3">
                <span
                  className={cn(
                    'inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight',
                    series.badgeBg
                  )}
                >
                  {series.badge}
                </span>

                {/* White circular arrow button */}
                <div
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0 group-hover:bg-[#0877FF] group-hover:text-white transition-all"
                  style={{ color: series.arrowColor }}
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-3.5 mt-3">
                {/* Large Emblem */}
                <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 p-1">
                  <img
                    src={series.emblem}
                    alt=""
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Title + Subtitle */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-black text-[#0B1F5B] dark:text-white leading-tight truncate">
                    {series.title}
                  </h4>
                  <p className="text-xs font-semibold text-[#5B6B86] dark:text-slate-400 mt-1 line-clamp-2">
                    {series.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONTINUE PRACTICE SECTION (Desktop Grid)                               */}
      {/* ========================================================================= */}
      {practiceItems.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E676] to-[#00C853] text-white flex items-center justify-center shadow-xs shrink-0">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight leading-tight">
                Continue Practice
              </h2>
            </div>
            <Link
              to="/practice"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0877FF] hover:underline"
            >
              <span>See All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {practiceItems.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'relative p-4 sm:p-5 rounded-[22px] border border-white dark:border-slate-800 bg-gradient-to-br shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden',
                  item.bgGradient
                )}
              >
                {/* Background Silhouette */}
                {item.bgImage && (
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <img
                      src={item.bgImage}
                      alt=""
                      className="w-full h-full object-cover object-right"
                    />
                  </div>
                )}

                {/* Top Row: Badge + Test Name + Subject & Emblem */}
                <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-lg text-[9.5px] font-bold tracking-tight mb-1"
                      style={{ backgroundColor: item.badgeBg, color: item.examColor }}
                    >
                      {item.examBadge}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-[#0B1F5B] dark:text-white leading-tight truncate">
                      {item.testName}
                    </h4>
                    <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
                      {item.subject}
                    </p>
                  </div>

                  <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                    <img
                      src={item.emblem}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Progress Count & Bar */}
                <div className="relative z-10 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-xs font-semibold text-[#334155] dark:text-slate-300">
                      {item.completedQuestions}/{item.totalQuestions} questions completed
                    </span>
                    <span
                      className="text-xs font-black"
                      style={{ color: item.accentColor }}
                    >
                      {Math.round(item.progressPercent * 100)}%
                    </span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: item.trackColor }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(item.progressPercent * 100)}%`,
                        backgroundColor: item.accentColor,
                      }}
                    />
                  </div>
                </div>

                {/* Continue Test CTA */}
                <Link
                  to={item.route}
                  className="relative z-10 w-full py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
                  style={{
                    backgroundColor: item.buttonColor,
                    boxShadow: `0 4px 12px ${item.buttonColor}40`,
                  }}
                >
                  <span>Continue Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. TOP PERFORMERS (Desktop 4-Column Balanced Grid)                         */}
      {/* ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/images/performer_trophy.png"
              alt=""
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h2 className="text-base sm:text-xl font-black text-[#07194A] dark:text-white tracking-tight leading-tight">
                Top Performers
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium hidden sm:block">
                All-Bengal leaderboard toppers based on comprehensive mock tests
              </p>
            </div>
          </div>
          <Link
            to="/rank"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0066FF] hover:underline"
          >
            <span>View Full Rank</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Cards across on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {topPerformers.map((p) => (
            <div
              key={p.rank}
              className={cn(
                'relative rounded-[22px] border border-white dark:border-slate-800 bg-gradient-to-br p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center justify-between text-center overflow-hidden min-h-[200px]',
                p.bgGradient
              )}
            >
              {/* Top-Left Rank Rosette Medal Badge */}
              <div className="absolute top-2.5 left-2.5 w-7 h-7 sm:w-8 sm:h-8">
                <img
                  src={p.badge}
                  alt={`Rank ${p.rank}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Avatar with Ring */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2 mt-1">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-amber-100 dark:ring-amber-900/40"
                />
              </div>

              {/* Student Name */}
              <h4 className="text-xs sm:text-sm font-extrabold text-[#07194A] dark:text-white truncate max-w-full leading-tight">
                {p.name}
              </h4>

              {/* Score in rank color */}
              <span
                className="text-sm sm:text-base font-black my-1"
                style={{ color: p.rankColor }}
              >
                {p.score}
              </span>

              {/* Exam Tag */}
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#EDF2F7] dark:bg-slate-800 text-[#4B617E] dark:text-slate-300 text-[9px] sm:text-[10px] font-semibold truncate max-w-full mb-1.5">
                {p.exam}
              </span>

              {/* Tests Attempted Pill */}
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold',
                  p.pillBg,
                  p.pillTextColor
                )}
              >
                <Crosshair className="w-3 h-3" />
                <span className="truncate">{p.testsAttempted}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TODAY'S INFO & MOTIVATIONAL QUOTE (Side-by-Side 2-Column Desktop Grid) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-1">
        {/* Today's Info */}
        <div className="p-4 sm:p-5 rounded-[22px] bg-[#F1F6FE] dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/today_info_sunrise.png"
                  alt=""
                  className="w-8 h-8 object-contain rounded-lg"
                />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#07194A] dark:text-white leading-tight">
                    Today's Info
                  </h3>
                  <p className="text-[11px] text-[#5A6E85] dark:text-slate-400 font-medium">
                    Learn something new everyday
                  </p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#0066FF] dark:text-blue-400 text-xs font-bold border border-[#DBEAFE] dark:border-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{todayDateString}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 flex items-start gap-3.5 shadow-2xs mt-3">
              <div className="w-11 h-11 rounded-full bg-[#EDF5FF] dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <img
                  src="/images/today_info_book_circle.png"
                  alt=""
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-[#07194A] dark:text-white leading-relaxed">
                  {String(dailyContent.factText || 'Practice consistent mock tests to achieve your target cut-off marks and boost your accuracy.')}
                </p>
                <div className="mt-2.5">
                  <Link
                    to="/practice"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EBF3FF] dark:bg-slate-700 text-[#0066FF] dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{String(dailyContent.subjectName || dailyContent.factSource || 'General Studies')}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="relative p-4 sm:p-5 rounded-[22px] bg-[#FFF2F6] dark:bg-slate-900 border border-[#FADBE8] dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src="/images/quote_target_3d.png"
                alt=""
                className="w-8 h-8 object-contain rounded-lg"
              />
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#07194A] dark:text-white leading-tight">
                  Motivational Quote
                </h3>
                <p className="text-[11px] text-[#5A6E85] dark:text-slate-400 font-medium">
                  Stay inspired, keep going
                </p>
              </div>
            </div>

            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#FFF6F8] to-[#FDECEF] dark:from-slate-800 dark:to-slate-800/80 border border-[#FCDCE8] dark:border-slate-700 overflow-hidden shadow-2xs mt-3">
              {/* Mountain Summit illustration */}
              <img
                src="/images/quote_mountain_summit.png"
                alt=""
                className="absolute right-0 bottom-0 h-24 object-contain pointer-events-none opacity-85"
              />

              <div className="relative z-10 pr-14">
                <span className="text-3xl font-serif text-[#F43F5E] font-black leading-none block -mb-1">
                  “
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#07194A] dark:text-white leading-relaxed">
                  {String(dailyContent.quoteText || 'Success is the sum of small efforts, repeated day in and day out.')}
                </p>
                <p className="text-xs font-bold text-[#64748B] dark:text-slate-400 mt-2">
                  {dailyContent.quoteAuthor ? `— ${String(dailyContent.quoteAuthor)}` : '— Robert Collier'}
                </p>
              </div>

              <div className="relative z-10 pt-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[#BE123C] dark:text-rose-300 text-[10px] font-black">
                  Target Exam: {String(dailyContent.targetExam || selectedExam?.title || 'WBP Constable')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PRO PASS BANNER (Panoramic Desktop View for Free Users)               */}
      {/* ========================================================================= */}
      {!isPro && (
        <section className="relative rounded-[24px] bg-gradient-to-r from-[#0B1F44] via-[#0138A8] to-[#0158FC] text-white p-5 sm:p-7 overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Upgrade to <span className="text-amber-300">PracticeKoro Pro</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
                Unlock unlimited access to all exams, 120+ mock tests, previous year solved papers, detailed AI analytics, and statewide merit rankings.
              </p>
            </div>

            <Link
              to="/subscription"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-blue-50 text-[#0158FC] text-xs sm:text-sm font-black shadow-md shrink-0 active:scale-95 transition-all self-start md:self-auto"
            >
              <span>Get Pro Pass</span>
              <ArrowRight className="w-4 h-4" />
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
