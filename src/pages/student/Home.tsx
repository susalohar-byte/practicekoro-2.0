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
  Globe2,
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
  return '/logo-icon.png';
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
  const { data: featuredSeries = [] } = useQuery({ queryKey: ['home-featured-series'], queryFn: () => api.getFeaturedTestSeries(), refetchInterval: 60000 });

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

  const { data: allTests = [] } = useQuery({
    queryKey: ['home-all-tests'],
    queryFn: () => api.getTests(),
    staleTime: 60000,
  });

  const { data: platformOverview } = useQuery({
    queryKey: ['home-platform-rankings'],
    queryFn: () => api.getPlatformAnalyticsOverview(),
    staleTime: 60000,
  });

  const completedAttempts = userAttempts.filter((a) => a.status === 'completed');
  const inProgressAttempt = userAttempts.find((a) => a.status === 'in_progress');
  const testsTakenCount = completedAttempts.length;
  const totalCorrectCount = completedAttempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
  const totalWrongCount = completedAttempts.reduce((sum, a) => sum + (a.wrongCount || 0), 0);
  const totalSkippedCount = completedAttempts.reduce((sum, a) => sum + (a.skippedCount || 0), 0);
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

  // Tab state for Recommended section
  const [recommendedTab, setRecommendedTab] = useState<'mock' | 'topic' | 'pyq' | 'progress'>('mock');
  // Tab state for Leaderboard
  const [leaderboardTab, setLeaderboardTab] = useState<'all' | 'wb' | 'friends'>('all');

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

  // Recommended tests derived from real backend tests
  const recommendedTests = allTests
    .filter((t) => {
      if (recommendedTab === 'pyq') return t.testType === 'pyq';
      if (recommendedTab === 'topic') return t.testType === 'topic' || t.testType === 'chapter_mock' || t.testType === 'subject_mock';
      return true;
    })
    .slice(0, 3)
    .map((t, idx) => ({
      id: t.id,
      title: t.title,
      badge: t.testType === 'pyq' ? 'PYQ' : !t.isPremium ? 'Free' : 'Mock Test',
      badgeType: idx % 3 === 0 ? 'orange' : idx % 3 === 1 ? 'blue' : 'rose',
      questions: `${t.totalQuestions || 0} Questions`,
      duration: `${t.durationMinutes || 60} Minutes`,
      lang: 'Online CBT',
      iconBg:
        idx % 2 === 0
          ? 'bg-blue-50 text-blue-600 border-blue-100'
          : 'bg-amber-50 text-amber-600 border-amber-100',
    }));

  // Recent mock test history derived from real completed attempts
  const recentTests = completedAttempts.slice(0, 5).map((att, idx) => {
    const colors = [
      { color: 'text-blue-600 border-blue-500', iconBg: 'bg-blue-50 text-blue-600' },
      { color: 'text-purple-600 border-purple-500', iconBg: 'bg-purple-50 text-purple-600' },
      { color: 'text-emerald-600 border-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600' },
      { color: 'text-rose-600 border-rose-500', iconBg: 'bg-rose-50 text-rose-600' },
      { color: 'text-teal-600 border-teal-500', iconBg: 'bg-blue-50 text-blue-600' },
    ];
    const style = colors[idx % colors.length];
    return {
      id: att.id,
      testId: att.testId,
      title: att.testTitle || 'Mock Test',
      date: new Date(att.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      score: Math.round(att.score || 0),
      total: att.totalMarks || 100,
      color: style.color,
      iconBg: style.iconBg,
    };
  });

  // Leaderboard data from real platform rankings
  const leaderboardEntries = (platformOverview?.studentRankings || []).slice(0, 5).map((r) => ({
    rank: r.rank,
    name: r.name,
    score: `${Math.round(r.accuracy || 0)}%`,
    icon: r.rank === 1 ? '👑' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : String(r.rank),
    isUser: r.userId === user?.id,
  }));
  const userLeaderboardRank =
    (platformOverview?.studentRankings || []).find((r) => r.userId === user?.id)?.rank || null;

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
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-5 sm:pt-3">
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

      {/* 2. STAT CARDS (Row of 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tests Taken */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/60">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{testsTakenCount}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tests Taken</div>
          </div>
        </div>

        {/* Questions Practiced */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{questionsPracticedCount}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Questions Practiced</div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{overallAccuracyPct}%</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accuracy</div>
          </div>
        </div>

        {/* Day Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/60">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{activeStreakDays}</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Day Streak</div>
          </div>
        </div>
      </div>

      {/* LIVE TEST CARD (Synced with Mobile UI & Supabase) */}
      {activeLiveTest && (
        <div className="rounded-3xl bg-[#0F172A] text-white p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            {/* Status badge */}
            {isLiveNow ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE NOW
              </div>
            ) : isEnded ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-black tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                LIVE TEST ENDED
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                UPCOMING LIVE TEST
              </div>
            )}

            {/* Countdown timer boxes: only show if isUpcoming */}
            {isUpcoming && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-white font-mono">
                  <span className="font-extrabold text-sm">{countdownDays}</span> <span className="text-[10px] text-slate-400">Days</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-white font-mono">
                  <span className="font-extrabold text-sm">{countdownHours}</span> <span className="text-[10px] text-slate-400">Hours</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-white font-mono">
                  <span className="font-extrabold text-sm">{countdownMinutes}</span> <span className="text-[10px] text-slate-400">Mins</span>
                </div>
                <span className="text-slate-500 font-bold">:</span>
                <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-white font-mono">
                  <span className="font-extrabold text-sm">{countdownSeconds}</span> <span className="text-[10px] text-slate-400">Secs</span>
                </div>
              </div>
            )}
            {isLiveNow && (
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 animate-pulse">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Active Examination in Progress</span>
              </div>
            )}
          </div>

          <h4 className="text-lg sm:text-xl font-black text-white mb-2 tracking-tight">
            {activeLiveTest.title}
          </h4>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-300 mb-5 flex-wrap">
            <span className="flex items-center gap-1.5">⏱️ {activeLiveTest.durationMinutes} Mins</span>
            <span className="flex items-center gap-1.5">📝 {activeLiveTest.totalQuestions} Questions</span>
            <span className="flex items-center gap-1.5">🏆 {activeLiveTest.totalMarks} Marks</span>
            {activeLiveTest.rankingEnabled && (
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">🎖️ Statewide Ranking</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              👥 <span>{(activeLiveTest.enrolledCount ?? 0).toLocaleString()} Students {isEnded ? 'Participated' : isLiveNow ? 'Competing Now' : 'Registered'}</span>
            </div>
            {isLiveNow ? (
              <Link
                to={`/live-test`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600 text-white text-xs font-black transition-all shadow-md shadow-rose-500/25 active:scale-95 animate-pulse"
              >
                <span>Join Live Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : isEnded ? (
              <Link
                to={`/live-test`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 active:scale-95"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>View Result & Ranking</span>
              </Link>
            ) : (
              <Link
                to={`/live-test`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white text-xs font-black transition-all shadow-md shadow-blue-500/25 active:scale-95"
              >
                <span>Register Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 3. CONTINUE YOUR TEST (Midnight Navy Banner - Only shown if user has a real in_progress attempt) */}
      {inProgressAttempt && (() => {
        const answeredCount = (inProgressAttempt.correctCount || 0) + (inProgressAttempt.wrongCount || 0);
        const totalQuestions = Math.max(1, answeredCount + (inProgressAttempt.skippedCount || 0));
        const progressPct = Math.min(100, Math.round((answeredCount / totalQuestions) * 100));
        return (
          <div className="rounded-3xl bg-[#0c1b3d] text-white p-6 sm:p-7 shadow-lg relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">Continue Your Test</h3>
              <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider">
                IN PROGRESS
              </span>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                    {inProgressAttempt.testTitle || 'Mock Test'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 mb-4">
                    Attempted {answeredCount}/{totalQuestions} questions
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0158FC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/30 active:scale-95"
                    >
                      <span>Resume Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate(`/exams/${inProgressAttempt.testId}`)}
                      className="px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold transition-all active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar and motivational clock script */}
              <div className="w-full lg:w-80 flex flex-col items-end gap-3">
                <div className="w-full flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-300">{progressPct}%</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-200 font-serif italic">"Finish what you started!"</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QUICK STUDY TOOLS */}
      <div>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Study Tools</h3></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['Weak Topics','Focus & improve','/practice',Target,'bg-blue-50 text-[#0158FC]'],
            ['Study Resources','Notes & exam-ready summaries','/practice',BookOpen,'bg-violet-50 text-violet-600'],
          ].map(([title,desc,to,Icon,cls]) => {
            const ToolIcon = Icon as React.ComponentType<{className?:string}>;
            return <Link key={String(title)} to={String(to)} className="rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${String(cls)}`}><ToolIcon className="h-5 w-5"/></div>
              <div><h4 className="text-sm font-black text-slate-900">{String(title)}</h4><p className="text-[11px] text-slate-500">{String(desc)}</p></div><ChevronRight className="ml-auto h-4 w-4 text-slate-400"/>
            </Link>
          })}
        </div>
      </div>

      {/* 4. POPULAR TEST SERIES */}
      <div>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900 dark:text-white">Popular Test Series</h3><Link to="/test-series" className="text-xs font-bold text-[#0158FC] flex items-center gap-1">See All <ChevronRight className="h-4 w-4"/></Link></div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {(featuredSeries.length ? featuredSeries : []).map((series) => (
            <Link key={series.id} to={`/test-series/${series.slug || series.id}`} className="group flex min-w-[220px] items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 rounded-2xl border border-blue-100 bg-[#EFF5FB] p-2 shadow-sm"><img src={resolvePopularSeriesEmblem(series)} alt="" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.src = '/logo-icon.png'; }}/></div>
                <div className="min-w-0 flex-1"><h4 className="line-clamp-2 text-sm font-black leading-snug text-slate-900 group-hover:text-[#0158FC]">{series.title}</h4><p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{series.examTitle || 'Test Series'}</p></div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400"/>
              </div>
            </Link>
          ))}
          {!featuredSeries.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Featured test series will appear here after Admin publishes them.</div>}
        </div>
      </div>

      {/* 🔥 POPULAR TEST SERIES (Controlled dynamically by Admin isPopular flag) */}
      {popularTestSeries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🔥</span> Popular Test Series
            </h3>
            <Link
              to="/test-series"
              className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              See All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
            {popularTestSeries.map((series) => {
              const emblem = resolvePopularSeriesEmblem(series);

              return (
                <Link
                  key={series.id}
                  to={`/test-series/${series.id}`}
                  className="group flex w-[260px] flex-shrink-0 items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-md active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 sm:w-auto"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-[#EFF5FB] p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <img
                      src={emblem}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo-icon.png';
                      }}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h4 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#0158FC] dark:text-white dark:group-hover:text-blue-400">
                      {series.title}
                    </h4>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{series.examTitle || 'Test Series'}</p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0158FC] transition-colors group-hover:bg-[#0158FC] group-hover:text-white dark:bg-slate-800"><ArrowRight className="h-4 w-4" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. PRACTICE BY SUBJECT (8 Subject Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Practice by Subject</h3>
          <Link
            to="/practice"
            className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {subjects.map((subj) => (
            <Link
              key={subj.id}
              to={`/practice?subject=${subj.id}`}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-xs transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs ${subj.color}`}
                >
                  {subj.symbol}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors">
                    {subj.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {subj.questions}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-[#0158FC] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* 6. RECOMMENDED FOR YOU */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recommended for You</h3>
          <Link
            to="/test-series"
            className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          <button
            onClick={() => setRecommendedTab('mock')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              recommendedTab === 'mock'
                ? 'bg-[#0158FC] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Test Series
          </button>
          <button
            onClick={() => setRecommendedTab('topic')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              recommendedTab === 'topic'
                ? 'bg-[#0158FC] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Topic Practice
          </button>
          <button
            onClick={() => setRecommendedTab('pyq')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              recommendedTab === 'pyq'
                ? 'bg-[#0158FC] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Previous Year Questions
          </button>
          <button
            onClick={() => setRecommendedTab('progress')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
              recommendedTab === 'progress'
                ? 'bg-[#0158FC] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Based on Your Progress
          </button>
        </div>

        {/* 3 Recommended Cards */}
        {recommendedTests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-center text-sm text-slate-500">
            No tests available in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedTests.map((test) => (
              <div
                key={test.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${test.iconBg}`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        test.badgeType === 'orange'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : test.badgeType === 'blue'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {test.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 leading-snug">
                    {test.title}
                  </h4>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{test.questions}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{test.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{test.lang}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/exams/${test.id}`)}
                  className="w-full py-2.5 rounded-xl bg-[#0158FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <span>Start Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. YOUR PROGRESS */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Progress</h3>
          <Link
            to="/results"
            className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View Detailed Analytics <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Donut Chart Gauge */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular SVG Donut */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#0158FC"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={String(251.2 * (1 - overallAccuracyPct / 100))}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{overallAccuracyPct}%</span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Overall Accuracy</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Correct
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{totalCorrectCount}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Incorrect
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{totalWrongCount}</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  Skipped
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{totalSkippedCount}</span>
              </div>
            </div>
          </div>

          {/* Subject Wise Performance */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Subject Wise Performance
              </h4>
              <Link to="/results" className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline">
                View All &gt;
              </Link>
            </div>

            <div className="space-y-3">
              {['Mathematics', 'Reasoning', 'General Knowledge', 'English', 'Bengali'].map((subjName, idx) => {
                const pct = completedAttempts.length > 0 ? overallAccuracyPct : 0;
                const barColors = ['bg-blue-600', 'bg-blue-500', 'bg-blue-400', 'bg-blue-500', 'bg-blue-400'];
                return (
                  <div key={subjName}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{subjName}</span>
                      <span className="text-slate-900 dark:text-white font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${barColors[idx]} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 8. TWO COLUMNS: RECENT MOCK TESTS & LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Mock Tests */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Mock Tests</h3>
            <Link
              to="/results"
              className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              See All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentTests.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No mock tests attempted yet. Start your first test to track your progress!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTests.map((test) => (
                <div key={test.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${test.iconBg}`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {test.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{test.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${test.color}`}
                    >
                      {test.score}/{test.total}
                    </span>
                    <Link
                      to={`/exams/${test.testId}/results/${test.id}`}
                      className="text-xs font-semibold text-[#0158FC] dark:text-blue-400 hover:underline"
                    >
                      View Result
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Rank */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rank</h3>
            <Link
              to="/rank"
              className="text-xs font-bold text-[#0158FC] dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              See All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 text-xs font-bold">
            <button
              onClick={() => setLeaderboardTab('all')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                leaderboardTab === 'all'
                  ? 'bg-[#0158FC] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All India
            </button>
            <button
              onClick={() => setLeaderboardTab('wb')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                leaderboardTab === 'wb'
                  ? 'bg-[#0158FC] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              West Bengal
            </button>
            <button
              onClick={() => setLeaderboardTab('friends')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                leaderboardTab === 'friends'
                  ? 'bg-[#0158FC] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Friends
            </button>
          </div>

          {/* Table */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-bold px-3 py-1">
              <span className="w-8">#</span>
              <span className="flex-1">Student</span>
              <span>Score</span>
            </div>

            {leaderboardEntries.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Rankings will appear as students complete mock tests.
              </div>
            ) : (
              leaderboardEntries.map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="w-8 font-bold text-base">{item.icon}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                      {item.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white">{item.score}</span>
                </div>
              ))
            )}

            {/* User Row Highlight */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 mt-3">
              <span className="w-8 font-black text-blue-700 dark:text-blue-400">
                {userLeaderboardRank ? `#${userLeaderboardRank}` : '#-'}
              </span>
              <div className="flex items-center gap-2 flex-1">
                <img
                  src={user?.avatarUrl || '/images/student_avatar.png'}
                  alt="You"
                  className="w-7 h-7 rounded-full object-cover border border-blue-300 dark:border-blue-700"
                  onError={(e) => {
                    e.currentTarget.src = '/images/student_avatar.png';
                  }}
                />
                <span className="font-black text-blue-900 dark:text-blue-200">
                  You ({user?.fullName?.split(' ')[0] || 'Candidate'})
                </span>
              </div>
              <span className="font-black text-blue-700 dark:text-blue-400">{overallAccuracyPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 9. PRO UPGRADE BANNER (Bottom Banner) - Only shown to free students */}
      {!isPro && (
        <div className="relative rounded-3xl bg-gradient-to-r from-[#eef6ff] via-[#e6f2fe] to-[#dbebfe] dark:from-slate-900 dark:via-slate-850 dark:to-indigo-950/60 border border-blue-200/80 dark:border-slate-800 p-6 sm:p-8 overflow-hidden shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#0158FC] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Upgrade to <span className="text-[#0158FC] dark:text-blue-400">PracticeKoro Pro</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Get unlimited access to all exams, mock tests, PYQ, topic practice and detailed solutions.
              </p>

              {/* Checklist */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0158FC] dark:text-blue-400" /> All Exams
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0158FC] dark:text-blue-400" /> Unlimited Tests
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0158FC] dark:text-blue-400" /> Detailed Solutions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#0158FC] dark:text-blue-400" /> Web + Mobile App
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-[#0158FC] dark:text-blue-400" /> Priority Support
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto">
              <Link
                to="/subscription"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0158FC] hover:bg-[#0047cc] text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-all"
              >
                <span>Upgrade Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-slate-500 font-medium">
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
