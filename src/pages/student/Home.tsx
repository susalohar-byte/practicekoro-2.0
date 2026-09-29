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
} from 'lucide-react';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

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
  const [liveClock, setLiveClock] = useState(Date.now());
  const [isHovered, setIsHovered] = useState(false);
  const { data: liveTest } = useQuery({ queryKey: ['home-live-test'], queryFn: () => api.getFeaturedLiveTest(), refetchInterval: 30000 });
  const { data: featuredSeries = [] } = useQuery({ queryKey: ['home-featured-series'], queryFn: () => api.getFeaturedTestSeries(), refetchInterval: 60000 });
  useEffect(() => { const id = window.setInterval(() => setLiveClock(Date.now()), 1000); return () => window.clearInterval(id); }, []);

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

  // Real-time synchronization for banner changes
  useEffect(() => {
    const unsubscribe = bannerService.subscribeToBannerUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      queryClient.refetchQueries({ queryKey: ['hero-banners'] });
    });
    return () => unsubscribe();
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

  // Subject list matching screenshot
  const subjects = [
    {
      id: 'math',
      title: 'Mathematics',
      questions: '1,240 Questions',
      color: 'bg-blue-600 text-white',
      symbol: '∑',
    },
    {
      id: 'reasoning',
      title: 'Reasoning',
      questions: '960 Questions',
      color: 'bg-rose-500 text-white',
      symbol: '🎗',
    },
    {
      id: 'gk',
      title: 'General Knowledge',
      questions: '1,520 Questions',
      color: 'bg-emerald-500 text-white',
      symbol: '🌐',
    },
    {
      id: 'english',
      title: 'English',
      questions: '1,010 Questions',
      color: 'bg-purple-600 text-white',
      symbol: 'A',
    },
    {
      id: 'bengali',
      title: 'Bengali',
      questions: '820 Questions',
      color: 'bg-amber-500 text-white',
      symbol: 'অ',
    },
    {
      id: 'computer',
      title: 'Computer Awareness',
      questions: '640 Questions',
      color: 'bg-sky-500 text-white',
      symbol: '💻',
    },
    {
      id: 'current-affairs',
      title: 'Current Affairs',
      questions: '420 Questions',
      color: 'bg-pink-500 text-white',
      symbol: '📅',
    },
    {
      id: 'environment',
      title: 'Environment',
      questions: '310 Questions',
      color: 'bg-teal-500 text-white',
      symbol: '🌱',
    },
  ];

  // Recommended tests
  const recommendedTests = [
    {
      id: 'rec-1',
      title: 'WBP Constable Full Mock Test 01',
      badge: 'Popular',
      badgeType: 'orange',
      questions: '100 Questions',
      duration: '90 Minutes',
      lang: 'Online CBT',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      id: 'rec-2',
      title: 'WBSSC Group D Previous Year Paper',
      badge: 'New',
      badgeType: 'blue',
      questions: '100 Questions',
      duration: '90 Minutes',
      lang: 'Online CBT',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      id: 'rec-3',
      title: 'General Knowledge Practice Set',
      badge: 'Trending',
      badgeType: 'rose',
      questions: '50 Questions',
      duration: '30 Minutes',
      lang: 'Online CBT',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
  ];

  // Recent mock test history
  const recentTests = [
    {
      id: 'rt-1',
      title: 'WBP Constable - Mock 03',
      date: '10 Sep 2026',
      score: 72,
      total: 100,
      color: 'text-blue-600 border-blue-500',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'rt-2',
      title: 'SSC GD - Mock 02',
      date: '08 Sep 2026',
      score: 81,
      total: 100,
      color: 'text-purple-600 border-purple-500',
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'rt-3',
      title: 'WBSSC Group D - Mock 01',
      date: '05 Sep 2026',
      score: 68,
      total: 100,
      color: 'text-emerald-600 border-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'rt-4',
      title: 'General Knowledge - Test 04',
      date: '02 Sep 2026',
      score: 76,
      total: 100,
      color: 'text-rose-600 border-rose-500',
      iconBg: 'bg-rose-50 text-rose-600',
    },
    {
      id: 'rt-5',
      title: 'Maths - Topic Test 12',
      date: '30 Aug 2026',
      score: 84,
      total: 100,
      color: 'text-teal-600 border-teal-500',
      iconBg: 'bg-blue-50 text-blue-600',
    },
  ];

  // Leaderboard data
  const leaderboardEntries = [
    { rank: 1, name: 'Ananya P.', score: '98.6%', icon: '👑', isUser: false },
    { rank: 2, name: 'Rohit S.', score: '97.2%', icon: '🥈', isUser: false },
    { rank: 3, name: 'Sayon D.', score: '96.8%', icon: '🥉', isUser: false },
    { rank: 4, name: 'Priya M.', score: '96.1%', icon: '4', isUser: false },
    { rank: 5, name: 'Arindam D.', score: '95.4%', icon: '5', isUser: false },
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
            <div className="text-2xl font-black text-slate-900 dark:text-white">12</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tests Taken</div>
          </div>
        </div>

        {/* Questions Practiced */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">342</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Questions Practiced</div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">78%</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accuracy</div>
          </div>
        </div>

        {/* Day Streak */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/60">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">7</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Day Streak</div>
          </div>
        </div>
      </div>

      {/* 3. CONTINUE YOUR TEST (Midnight Navy Banner) */}
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
                WBP Constable 2024 Prelims Official Paper
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mb-4">
                Attempted 45/100 questions • 55 minutes remaining
              </p>
              <div className="flex items-center gap-3">
                <Link
                  to="/exams"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0158FC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/30 active:scale-95"
                >
                  <span>Resume Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/exams')}
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
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
              </div>
              <span className="text-xs font-bold text-slate-300">45%</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-blue-200 font-serif italic">"Finish what you started!"</p>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE TEST */}
      {liveTest && (() => {
        const start = new Date(liveTest.scheduledStartAt).getTime();
        const end = new Date(liveTest.scheduledEndAt).getTime();
        const isLive = liveClock >= start && liveClock <= end;
        const diff = Math.max(0, start - liveClock);
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return (
          <Link to="/live-test" className="block rounded-3xl bg-gradient-to-br from-[#063585] to-[#0158FC] p-5 text-white shadow-lg shadow-blue-500/10 hover:shadow-xl transition">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-red-500 px-3 py-1 text-[10px] font-black uppercase">{isLive ? 'Live Now' : 'Live Test'}</span>
                <h3 className="mt-3 text-lg font-black">{liveTest.title}</h3>
                <p className="mt-1 text-xs text-blue-100">{new Date(liveTest.scheduledStartAt).toLocaleString()} · {liveTest.test?.totalQuestions || 0} Questions · {liveTest.durationMinutes} Minutes</p>
              </div>
              <div className="flex items-center gap-2">
                {!isLive && <><span className="rounded-xl bg-white/10 px-3 py-2 text-center"><b className="block text-lg">{String(days).padStart(2,'0')}</b><small className="text-[9px]">DAYS</small></span><span className="rounded-xl bg-white/10 px-3 py-2 text-center"><b className="block text-lg">{String(hours).padStart(2,'0')}</b><small className="text-[9px]">HRS</small></span><span className="rounded-xl bg-white/10 px-3 py-2 text-center"><b className="block text-lg">{String(mins).padStart(2,'0')}</b><small className="text-[9px]">MIN</small></span></>}
                <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-[#0158FC]">{isLive ? 'Join Now' : 'Register'} <ArrowRight className="h-4 w-4"/></span>
              </div>
            </div>
          </Link>
        );
      })()}

      {/* QUICK STUDY TOOLS */}
      <div>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Study Tools</h3></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Weak Topics','Focus & improve','/practice',Target,'bg-blue-50 text-[#0158FC]'],
            ['Flashcards','Quick revision','/quick-revision',Sparkles,'bg-rose-50 text-rose-600'],
            ['Study Notes','Short & exam ready','/practice',BookOpen,'bg-violet-50 text-violet-600'],
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
            <Link key={series.id} to={`/test-series/${series.slug || series.id}`} className="group min-w-[190px] rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-[#EFF5FB] p-2"><img src={series.iconUrl || '/logo-icon.png'} alt="" className="h-full w-full object-contain"/></div>
                <div className="min-w-0"><h4 className="text-xs font-black leading-tight text-slate-900 group-hover:text-[#0158FC]">{series.title}</h4><p className="mt-1 text-[10px] font-semibold text-slate-500">{series.examTitle || 'Test Series'}</p></div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-400"/>
              </div>
            </Link>
          ))}
          {!featuredSeries.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Featured test series will appear here after Admin publishes them.</div>}
        </div>
      </div>

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
            Mock Tests
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
            PYQ
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
                onClick={() => navigate('/exams')}
                className="w-full py-2.5 rounded-xl bg-[#0158FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
              >
                <span>Start Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
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
                  strokeDashoffset="55.2" // 78% accuracy
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">78%</span>
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
                <span className="font-bold text-slate-900 dark:text-white">342</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Incorrect
                </span>
                <span className="font-bold text-slate-900 dark:text-white">78</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  Skipped
                </span>
                <span className="font-bold text-slate-900 dark:text-white">20</span>
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
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Mathematics</span>
                  <span className="text-slate-900 dark:text-white font-bold">82%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Reasoning</span>
                  <span className="text-slate-900 dark:text-white font-bold">78%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">General Knowledge</span>
                  <span className="text-slate-900 dark:text-white font-bold">68%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">English</span>
                  <span className="text-slate-900 dark:text-white font-bold">71%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '71%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Bengali</span>
                  <span className="text-slate-900 dark:text-white font-bold">70%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
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
                    to="/results"
                    className="text-xs font-semibold text-[#0158FC] dark:text-blue-400 hover:underline"
                  >
                    View Result
                  </Link>
                </div>
              </div>
            ))}
          </div>
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

            {leaderboardEntries.map((item) => (
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
            ))}

            {/* User Row Highlight */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 mt-3">
              <span className="w-8 font-black text-blue-700 dark:text-blue-400">#147</span>
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
              <span className="font-black text-blue-700 dark:text-blue-400">78.3%</span>
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
