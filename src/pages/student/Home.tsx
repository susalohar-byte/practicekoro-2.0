import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { StudentNavbar } from '@/components/layout/StudentNavbar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { bannerService } from '@/services/bannerService';
import { getBannerTheme as getSharedBannerTheme } from '@/utils/bannerTheme';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  FileText,
  Flame,
  CheckCircle2,
  BookOpen,
  Target,
  BarChart3,
  Clock,
  Sparkles,
  Smartphone,
  Headphones,
  Trophy,
} from 'lucide-react';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { api } from '@/services/api';

const resolvePopularSeriesEmblem = (series: {
  iconUrl?: string | null;
  examId?: string | null;
  title: string;
  examTitle?: string | null;
}) => {
  if (series.iconUrl && series.iconUrl.trim().length > 0) {
    return series.iconUrl.trim();
  }
  const combined = `${series.examId || ''} ${series.title || ''} ${series.examTitle || ''}`.toLowerCase();
  if (combined.includes('wbp') || combined.includes('constable') || combined.includes('police') || combined.includes('kp')) {
    return '/images/exams/emblem_wbp.png';
  }
  if (combined.includes('wbpsc') || combined.includes('clerkship') || combined.includes('wbcs') || combined.includes('misc') || combined.includes('food')) {
    return '/images/exams/emblem_wbpsc.png';
  }
  if (combined.includes('rail') || combined.includes('rrb') || combined.includes('ntpc') || combined.includes('group d') || combined.includes('group-d')) {
    return '/images/exams/emblem_railway.png';
  }
  if (combined.includes('tet') || combined.includes('teach') || combined.includes('primary')) {
    return '/images/exams/emblem_tet.png';
  }
  if (combined.includes('wbssc') || combined.includes('slst') || combined.includes('school')) {
    return '/images/exams/emblem_wbssc.png';
  }
  if (combined.includes('ssc') || combined.includes('cgl') || combined.includes('chsl') || combined.includes('gd')) {
    return '/images/exams/emblem_ssc.png';
  }
  return '/logo-icon-circle.png';
};

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const { onToggleMobileSidebar } = useOutletContext<{
    onToggleMobileSidebar: () => void;
    onToggleCollapse: () => void;
    isSidebarCollapsed: boolean;
  }>();

  // Dynamic Banners (cached query with audience targeting and static fallback)
  const queryClient = useQueryClient();
  const audience = isPro ? 'pro' : 'free';
  const { data: banners = [] } = useQuery({
    queryKey: ['hero-banners', audience],
    queryFn: () => bannerService.getActiveBanners({ audience, placement: 'home_hero' }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Real-time tick for countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: activeLiveTest } = useQuery({
    queryKey: ['active-live-test'],
    queryFn: () => api.getActiveLiveTest(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const { data: popularTestSeries = [] } = useQuery({
    queryKey: ['popular-test-series'],
    queryFn: () => api.getPopularTestSeries(),
    staleTime: 30000,
  });

  const { data: userAttempts = [] } = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const completedAttempts = userAttempts.filter((a) => a.status === 'completed');
  const inProgressAttempt = userAttempts.find((a) => a.status === 'in_progress');
  const testsTakenCount = completedAttempts.length;
  const totalCorrectCount = completedAttempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
  const totalWrongCount = completedAttempts.reduce((sum, a) => sum + (a.wrongCount || 0), 0);
  const questionsPracticedCount = totalCorrectCount + totalWrongCount;
  const overallAccuracyPct =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) /
            completedAttempts.length
        )
      : 0;
  const activeStreakDays = (() => {
    if (completedAttempts.length === 0) return 0;
    const uniqueDays = new Set(
      completedAttempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
    );
    return uniqueDays.size;
  })();

  const liveStartAt = activeLiveTest?.startAt || activeLiveTest?.scheduledStartTime;
  const startTime = liveStartAt ? new Date(liveStartAt).getTime() : Date.now() + 300000000;
  const durationMs = (activeLiveTest?.durationMinutes || 90) * 60 * 1000;
  const endTime = startTime + durationMs;

  const isLiveNow = activeLiveTest?.status === 'live' || (currentTime >= startTime && currentTime <= endTime);
  const isEnded = activeLiveTest?.status === 'ended' || (currentTime > endTime && activeLiveTest?.status !== 'upcoming');
  const isUpcoming = !isLiveNow && !isEnded;

  const timeDiff = Math.max(0, startTime - currentTime);
  const countdownDays = String(Math.floor(timeDiff / (1000 * 60 * 60 * 24))).padStart(2, '0');
  const countdownHours = String(Math.floor((timeDiff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const countdownMinutes = String(Math.floor((timeDiff / (1000 * 60)) % 60)).padStart(2, '0');
  const countdownSeconds = String(Math.floor((timeDiff / 1000) % 60)).padStart(2, '0');

  // Keep slide index within valid bounds whenever active banners change
  useEffect(() => {
    if (banners.length > 0 && currentSlide >= banners.length) {
      setCurrentSlide(0);
    }
  }, [banners.length, currentSlide]);

  // Mobile Touch Swipe Handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    setIsHovered(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsHovered(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  // Onboarding Modal State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleOpenTour = () => setIsOnboardingOpen(true);
    window.addEventListener('pk_open_onboarding', handleOpenTour);
    return () => window.removeEventListener('pk_open_onboarding', handleOpenTour);
  }, []);

  // Real-time synchronization for banner and live test changes
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

  // Auto rotation every 5s when not hovered or touched
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

  // Time-based greeting with fallback to Candidate
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const displayName = user?.fullName?.split(' ')[0]?.toUpperCase() || 'CANDIDATE';

  // Subject categories for practice
  const subjects = [
    {
      id: 'math',
      title: 'Mathematics',
      questions: 'Topic Practice',
      color: 'bg-blue-600 text-white',
      symbol: '∑',
    },
    {
      id: 'reasoning',
      title: 'Reasoning',
      questions: 'Topic Practice',
      color: 'bg-rose-500 text-white',
      symbol: '🎗',
    },
    {
      id: 'gk',
      title: 'General Knowledge',
      questions: 'Topic Practice',
      color: 'bg-emerald-500 text-white',
      symbol: '🌐',
    },
    {
      id: 'english',
      title: 'English',
      questions: 'Topic Practice',
      color: 'bg-purple-600 text-white',
      symbol: 'A',
    },
    {
      id: 'bengali',
      title: 'Bengali',
      questions: 'Topic Practice',
      color: 'bg-amber-500 text-white',
      symbol: 'অ',
    },
    {
      id: 'computer',
      title: 'Computer Awareness',
      questions: 'Topic Practice',
      color: 'bg-sky-500 text-white',
      symbol: '💻',
    },
    {
      id: 'current-affairs',
      title: 'Current Affairs',
      questions: 'Topic Practice',
      color: 'bg-pink-500 text-white',
      symbol: '📅',
    },
    {
      id: 'environment',
      title: 'Environment',
      questions: 'Topic Practice',
      color: 'bg-teal-500 text-white',
      symbol: '🌱',
    },
  ];

  // Theme styles come from the shared banner theme map (also used by the
  // admin live preview) — see src/utils/bannerTheme.ts.
  const getBannerTheme = (theme?: string) => getSharedBannerTheme(theme);

  const getPillIcon = (name: string, iconClass: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('topic') || lower.includes('practice')) return <Target className={iconClass} />;
    if (lower.includes('pyq') || lower.includes('previous') || lower.includes('question')) return <BookOpen className={iconClass} />;
    if (lower.includes('solution') || lower.includes('correct')) return <CheckCircle2 className={iconClass} />;
    if (lower.includes('rank') || lower.includes('analysis') || lower.includes('score')) return <BarChart3 className={iconClass} />;
    if (lower.includes('exam') || lower.includes('mock') || lower.includes('test')) return <FileText className={iconClass} />;
    return <Sparkles className={iconClass} />;
  };

  return (
    <div className="pk-reference-shell space-y-5 pt-2 sm:pt-3">
      {/* Top Bar: Search, Theme, Bell, Profile — embedded directly into the page (no sticky header) */}
      <StudentNavbar embedded onToggleMobileSidebar={onToggleMobileSidebar} />

      {/* 1. DYNAMIC HERO BANNER CAROUSEL */}
      {banners.length > 0 && (() => {
        const activeBanners = banners;
        const banner = activeBanners[currentSlide] || activeBanners[0];
        const theme = getBannerTheme(banner.themeGradient);
        const formattedBadge = (banner.badgeText || '')
          .replace('{GREETING}', getGreeting())
          .replace('{USER}', displayName);

        const isTextOverlay = banner.bannerType === 'text_overlay';

        if (!isTextOverlay && banner.imageUrl) {
          const isExternalLink = banner.primaryCtaLink?.startsWith('http');
          const destination = banner.primaryCtaLink || '/exams';

          return (
            <div
              className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-slate-200/80 dark:border-slate-800 transition-all duration-300 group bg-slate-100 dark:bg-slate-900 select-none"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* App Tour Trigger */}
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-md text-white border border-white/20 text-[10.5px] font-bold shadow-md hover:bg-slate-900/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Watch App Tour"
              >
                <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
                <span>App Tour</span>
              </button>

              {/* Clickable Full Banner Image with Responsive Aspect Ratio */}
              {isExternalLink ? (
                <a
                  href={destination}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => bannerService.trackBannerClick(banner.id)}
                  className="block w-full overflow-hidden cursor-pointer"
                  aria-label={banner.title}
                >
                  <picture>
                    {banner.mobileImageUrl && (
                      <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />
                    )}
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      loading={currentSlide === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = '/images/exam_hero_banner.png';
                      }}
                      className="w-full aspect-[16/7] sm:aspect-[21/8] md:aspect-[3/1] object-cover object-center rounded-2xl sm:rounded-3xl transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                  </picture>
                </a>
              ) : (
                <Link
                  to={destination}
                  onClick={() => bannerService.trackBannerClick(banner.id)}
                  className="block w-full overflow-hidden cursor-pointer"
                  aria-label={banner.title}
                >
                  <picture>
                    {banner.mobileImageUrl && (
                      <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />
                    )}
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      loading={currentSlide === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = '/images/exam_hero_banner.png';
                      }}
                      className="w-full aspect-[16/7] sm:aspect-[21/8] md:aspect-[3/1] object-cover object-center rounded-2xl sm:rounded-3xl transition-transform duration-500 group-hover:scale-[1.01]"
                    />
                  </picture>
                </Link>
              )}

              {/* Carousel Controls */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      prevSlide();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-700 dark:text-slate-200 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Previous banner"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      nextSlide();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-700 dark:text-slate-200 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Next banner"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/40 backdrop-blur-md">
                    {activeBanners.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentSlide(i);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          i === currentSlide ? 'w-6 bg-white shadow-xs' : 'w-2 bg-white/60 hover:bg-white'
                        }`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        }

        return (
          <div
            className={`relative rounded-3xl ${theme.cardBg} border p-6 sm:p-8 lg:p-9 pb-8 sm:pb-9 overflow-hidden shadow-xs transition-colors duration-500 group min-h-[305px] md:h-[325px] flex flex-col justify-between`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="max-w-3xl relative z-10">
              {/* Greeting Badge & App Tour Trigger */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {formattedBadge && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${theme.badge} border text-[11px] font-black tracking-wider uppercase shadow-2xs`}>
                    <span>{formattedBadge}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs hover:bg-blue-50 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Watch App Tour"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 animate-spin-slow" />
                  <span>App Tour</span>
                </button>
              </div>

              {/* Heading */}
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-slate-900 tracking-tight leading-[1.2] mb-2.5">
                {banner.title}
                {banner.highlightWord && (
                  <>
                    <br />
                    <span className={theme.highlightText}>{banner.highlightWord}</span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              {banner.subtitle && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium mb-5 max-w-lg leading-relaxed line-clamp-2">
                  {banner.subtitle}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                {banner.primaryCtaText && (
                  <Link
                    to={banner.primaryCtaLink || '/exams'}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${theme.primaryBtn} text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98]`}
                  >
                    <span>{banner.primaryCtaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                {banner.secondaryCtaText && (
                  <Link
                    to={banner.secondaryCtaLink || '/exams'}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl ${theme.secondaryBtn} text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-[0.98]`}
                  >
                    <span>{banner.secondaryCtaText}</span>
                  </Link>
                )}
              </div>

              {/* Feature Badges Row - Single line */}
              {banner.featurePills && banner.featurePills.length > 0 && (
                <div className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-700 pt-1 pb-3 overflow-x-auto scrollbar-none max-w-full">
                  {banner.featurePills.map((pill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/80 shadow-2xs whitespace-nowrap shrink-0"
                    >
                      {getPillIcon(pill, `w-3.5 h-3.5 ${theme.pillIcon}`)} {pill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Carousel Controls (When multiple active banners exist) */}
            {activeBanners.length > 1 && (
              <>
                {/* Prev Arrow */}
                <button
                  type="button"
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Next Arrow */}
                <button
                  type="button"
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
                  aria-label="Next banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dots Navigation */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/20 backdrop-blur-md">
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentSlide ? 'w-6 bg-white shadow-xs' : 'w-2 bg-white/60 hover:bg-white'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* 2. 4 VIBRANT KPI STAT CARDS (Stitch Bento Grid) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Tests Taken */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-[0_6px_20px_-10px_rgba(1,88,252,0.08)] hover:shadow-md hover:border-blue-300/80 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tests Taken</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0158FC]/10 text-[#0158FC] dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {testsTakenCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Completed</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#0158FC] dark:text-blue-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0158FC]" />
            <span>Synced with My Results</span>
          </div>
        </div>

        {/* 2. Questions Practiced */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-[0_6px_20px_-10px_rgba(16,185,129,0.08)] hover:shadow-md hover:border-emerald-300/80 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Questions Practiced</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {questionsPracticedCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Solved</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalCorrectCount} Correct Answers</span>
          </div>
        </div>

        {/* 3. Overall Accuracy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-[0_6px_20px_-10px_rgba(124,58,237,0.08)] hover:shadow-md hover:border-violet-300/80 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Accuracy</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {overallAccuracyPct}%
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Net</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{overallAccuracyPct >= 75 ? 'High Accuracy Tier' : 'Keep Practicing Daily'}</span>
          </div>
        </div>

        {/* 4. Day Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-[0_6px_20px_-10px_rgba(245,158,11,0.08)] hover:shadow-md hover:border-amber-300/80 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Day Streak</span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-amber-500/20" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {activeStreakDays}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Days Active</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
            <span>🔥</span>
            <span>{activeStreakDays > 0 ? 'Momentum Active!' : 'Start Today’s Streak'}</span>
          </div>
        </div>
      </section>

      {/* 3. BENTO ROW: LIVE TEST SPOTLIGHT & CONTINUE IN-PROGRESS TEST */}
      {(activeLiveTest || inProgressAttempt) && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LIVE TEST CARD (Synced with Mobile UI & Supabase) */}
          {activeLiveTest && (
            <div
              className={`${
                inProgressAttempt ? 'lg:col-span-7' : 'lg:col-span-12'
              } rounded-3xl bg-gradient-to-br from-[#0B1F44] via-[#0F2557] to-[#0138A8] text-white p-5 sm:p-6 shadow-xl border border-blue-400/20 relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="absolute -right-16 -top-16 w-52 h-52 bg-[#0198FD]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  {/* Status badge */}
                  {isLiveNow ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black tracking-wider uppercase shadow-sm shadow-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      LIVE NOW
                    </div>
                  ) : isEnded ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/90 text-slate-200 text-[11px] font-black tracking-wider uppercase">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      LIVE TEST ENDED
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black tracking-wider uppercase shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                      UPCOMING LIVE TEST
                    </div>
                  )}

                  {/* Countdown timer boxes: only show if isUpcoming */}
                  {isUpcoming && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <div className="px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white font-mono tabular-nums">
                        <span className="font-extrabold text-sm">{countdownDays}</span>{' '}
                        <span className="text-[10px] text-blue-200">d</span>
                      </div>
                      <span className="text-blue-300 font-bold">:</span>
                      <div className="px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white font-mono tabular-nums">
                        <span className="font-extrabold text-sm">{countdownHours}</span>{' '}
                        <span className="text-[10px] text-blue-200">h</span>
                      </div>
                      <span className="text-blue-300 font-bold">:</span>
                      <div className="px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white font-mono tabular-nums">
                        <span className="font-extrabold text-sm">{countdownMinutes}</span>{' '}
                        <span className="text-[10px] text-blue-200">m</span>
                      </div>
                      <span className="text-blue-300 font-bold">:</span>
                      <div className="px-2.5 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 font-mono tabular-nums">
                        <span className="font-extrabold text-sm">{countdownSeconds}</span>{' '}
                        <span className="text-[10px] text-amber-200">s</span>
                      </div>
                    </div>
                  )}
                  {isLiveNow && (
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-300 animate-pulse">
                      <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
                      <span>Active Examination in Progress</span>
                    </div>
                  )}
                </div>

                <h4 className="text-lg sm:text-xl font-black text-white mb-3 tracking-tight leading-snug">
                  {activeLiveTest.title}
                </h4>

                <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-100 mb-5 flex-wrap">
                  <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
                    ⏱️ {activeLiveTest.durationMinutes} Mins
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
                    📝 {activeLiveTest.totalQuestions} Questions
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
                    🏆 {activeLiveTest.totalMarks} Marks
                  </span>
                  {activeLiveTest.rankingEnabled && (
                    <span className="px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center gap-1.5 text-amber-300 font-bold">
                      🎖️ Statewide Ranking
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
                <div className="text-xs font-bold text-blue-100 flex items-center gap-1.5">
                  👥{' '}
                  <span>
                    {(activeLiveTest.enrolledCount ?? 0).toLocaleString()} Students{' '}
                    {isEnded ? 'Participated' : isLiveNow ? 'Competing Now' : 'Registered'}
                  </span>
                </div>
                {isLiveNow ? (
                  <Link
                    to={`/live-test`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-black transition-all shadow-md shadow-rose-500/30 active:scale-95"
                  >
                    <span>Join Live Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : isEnded ? (
                  <Link
                    to={`/live-test`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 active:scale-95"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>View Result & Ranking</span>
                  </Link>
                ) : (
                  <Link
                    to={`/live-test`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0158FC] hover:bg-blue-50 text-xs font-black transition-all shadow-md active:scale-95"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* CONTINUE YOUR TEST (Only shown if user has a real in_progress attempt) */}
          {inProgressAttempt && (() => {
            const answeredCount =
              (inProgressAttempt.correctCount || 0) + (inProgressAttempt.wrongCount || 0);
            const totalQuestions = Math.max(
              1,
              answeredCount + (inProgressAttempt.skippedCount || 0)
            );
            const progressPct = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));
            return (
              <div
                className={`${
                  activeLiveTest ? 'lg:col-span-5' : 'lg:col-span-12'
                } rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-[0_8px_30px_-12px_rgba(1,88,252,0.1)] flex flex-col justify-between relative overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-[11px] font-black uppercase tracking-wider">
                      IN PROGRESS
                    </span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0158FC]" />
                      Continue Your Test
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0158FC]/15 to-[#0198FD]/10 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#0158FC]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {inProgressAttempt.testTitle || 'Mock Test'}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        Attempted {answeredCount}/{totalQuestions} questions
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Completion Progress</span>
                      <span className="text-[#0158FC] dark:text-blue-400 tabular-nums">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0158FC] to-[#0198FD] rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0158FC] to-[#0198FD] hover:from-[#0047cc] hover:to-[#0158FC] text-white text-xs font-extrabold transition-all shadow-md shadow-blue-500/25 active:scale-95"
                  >
                    <span>Resume Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate(`/exams/${inProgressAttempt.testId}`)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* 4. POPULAR TEST SERIES (Controlled dynamically by Admin isPopular flag) */}
      {popularTestSeries.length > 0 && (
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>🔥</span> Popular Test Series
            </h3>
            <Link
              to="/test-series"
              className="text-xs font-extrabold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              See All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
            {popularTestSeries.map((series) => {
              const emblem = resolvePopularSeriesEmblem(series);
              const isBrandLogo = emblem.includes('logo-icon');
              return (
                <Link
                  key={series.id}
                  to={`/test-series/${series.slug || series.id}`}
                  className="group flex min-w-[250px] sm:min-w-0 items-center gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:border-[#0158FC]/50 hover:shadow-md active:scale-[0.99]"
                >
                  {isBrandLogo ? (
                    <img
                      src="/logo-icon.png"
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-xs"
                      onError={(event) => {
                        event.currentTarget.src = '/logo-icon-circle.png';
                      }}
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-blue-100 dark:border-slate-700 bg-[#EFF5FB] dark:bg-slate-800 p-1.5 shadow-2xs flex items-center justify-center">
                      <img
                        src={emblem}
                        alt=""
                        className="h-full w-full rounded-xl object-contain"
                        onError={(event) => {
                          event.currentTarget.src = '/logo-icon.png';
                        }}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-xs sm:text-sm font-black leading-snug text-slate-900 dark:text-white group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors">
                      {series.title}
                    </h4>
                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {series.examTitle || 'Test Series'}
                    </p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-[#0158FC] dark:text-blue-400 transition-colors group-hover:bg-[#0158FC] group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. PRACTICE BY SUBJECT (8 Subject Bento Cards) */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-[0_6px_24px_-12px_rgba(1,88,252,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Practice by Subject
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Master chapter-wise concepts & boost accuracy across key exam subjects
            </p>
          </div>
          <Link
            to="/practice"
            className="text-xs font-extrabold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
          >
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subjects.map((subj) => (
            <Link
              key={subj.id}
              to={`/practice?subject=${subj.id}`}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFF] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-800 hover:border-[#0158FC]/40 hover:shadow-sm transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-xs shrink-0 ${subj.color}`}
                >
                  {subj.symbol}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors truncate">
                    {subj.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {subj.questions}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#0158FC] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* PRO UPGRADE BANNER (Bottom Banner) - Only shown to free students */}
      {!isPro && (
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0B1F44] via-[#0138A8] to-[#0158FC] text-white p-6 sm:p-8 overflow-hidden shadow-lg">
          <div className="absolute -right-12 -top-12 w-56 h-56 bg-[#0198FD]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Upgrade to <span className="text-amber-300">PracticeKoro Pro</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-blue-100">
                Get unlimited access to all exams, mock tests, PYQ, topic practice and detailed solutions.
              </p>

              {/* Checklist */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> All Exams
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Unlimited Tests
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Detailed Solutions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-300" /> Web + Mobile App
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-amber-300" /> Priority Support
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto">
              <Link
                to="/subscription"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-[#0158FC] text-sm font-black shadow-md transition-all"
              >
                <span>Upgrade Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-blue-200 font-medium">
                Start your success journey today!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Animated Onboarding Tour Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          try {
            localStorage.setItem('pk_onboarded', 'true');
          } catch {
            // ignore
          }
          setIsOnboardingOpen(false);
        }}
      />
    </div>
  );
};
