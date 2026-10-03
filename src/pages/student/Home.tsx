import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
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
  Search,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import type { PopularExamCard } from '@/types';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { ExamSelectorModal } from '@/components/student/ExamSelectorModal';

interface OutletContextType {
  onToggleMobileSidebar?: () => void;
  onToggleCollapse?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const { selectedExam, setSelectedExam } = useExam();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const outletContext = useOutletContext<OutletContextType>() || {};

  // State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

  // In-progress attempt for Continue Practice section
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

  // 5. Popular Test Series from the published Admin Panel catalog
  const { data: studentSeries = [] } = useQuery({
    queryKey: ['student-test-series'],
    queryFn: () => api.getStudentTestSeries(),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Real-time banner, live test & popular exams sync
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

  // Formatted date string for live test (matching _formatLiveTestDate in home_screen.dart)
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

  // -------------------------------------------------------------
  // 4 Core Practice Action Cards (Exact 1:1 match to home_screen.dart:719)
  // -------------------------------------------------------------
  const coreCards = [
    {
      title: 'Audio Book',
      subtitle: 'Listen & Learn',
      route: '/audio-books',
      shadowColor: 'rgba(0, 91, 212, 0.28)',
      arrowColor: '#0052D4',
      gradient: 'from-[#00A2FF] to-[#0052D4]',
      icon: Headphones,
    },
    {
      title: 'Saved Questions',
      subtitle: 'Review Bookmarks',
      route: '/saved-questions',
      shadowColor: 'rgba(5, 150, 105, 0.28)',
      arrowColor: '#059669',
      gradient: 'from-[#2DD878] to-[#059669]',
      icon: Bookmark,
    },
    {
      title: 'Rank',
      subtitle: 'Track Your Position',
      route: '/rank',
      shadowColor: 'rgba(249, 115, 22, 0.28)',
      arrowColor: '#EA580C',
      gradient: 'from-[#FBBF24] via-[#F97316] to-[#EA580C]',
      icon: Trophy,
    },
    {
      title: 'Live Tests',
      subtitle: 'Join & Compete',
      route: activeLiveTest?.testId ? `/live-test/${activeLiveTest.testId}` : '/live-test',
      shadowColor: 'rgba(225, 29, 72, 0.28)',
      arrowColor: '#BE123C',
      gradient: 'from-[#FB7185] via-[#E11D48] to-[#BE123C]',
      icon: Radio,
    },
  ];

  // 4. Popular Exams (Admin-configured and ordered)
  const popularExams = useMemo(() => {
    return popularExamsCards
      .filter((card) => card.isActive !== false)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [popularExamsCards]);

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
      subtitle: series.description || series.examTitle || 'Test Series',
      route: `/test-series/${series.id}`,
    }));

  // 6. Continue Practice only shows a real unfinished attempt
  const practiceItems = useMemo(() => {
    if (!inProgressAttempt) return [];
    const answered = (inProgressAttempt.correctCount || 0) + (inProgressAttempt.wrongCount || 0);
    const total = Math.max(answered, inProgressAttempt.totalQuestions || 0);
    const progress = total > 0 ? Math.min(1, answered / total) : 0;
    return [{
      examBadge: selectedExam?.title?.replace(/ 202\d/, '') || 'Active Exam',
      examColor: '#0066FF', badgeBg: '#E0EDFF',
      testName: inProgressAttempt.testTitle || 'Test in progress', subject: 'Continue your test',
      completedQuestions: answered, totalQuestions: total, progressPercent: progress,
      emblem: '/images/exams/emblem_series_wbp.png', accentColor: '#0066FF', buttonColor: '#0066FF',
      bgGradient: 'from-[#EAF2FF] to-[#DBEBFF]', trackColor: '#BFDBFE',
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

  // Dynamic Current Date for Today's Info (e.g., 02 Oct 2026)
  const todayDateString = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  return (
    <div className="space-y-3.5 sm:space-y-4 select-none">
      {/* ========================================================================= */}
      {/* 1. PRACTICEKORO BRAND HEADER (Exact 1:1 match to home_screen.dart:383)   */}
      {/* ========================================================================= */}
      <header className="p-2.5 sm:p-3 rounded-[20px] bg-[#E0EFFE] dark:bg-blue-950/50 border border-[#D4E7FC] dark:border-blue-900/60 shadow-[0_3px_10px_rgba(11,31,91,0.03)] flex items-center justify-between gap-2.5 transition-all">
        {/* Left: Mobile hamburger menu toggle + Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* On mobile screens, hamburger button opens StudentSidebar */}
          <button
            type="button"
            onClick={outletContext.onToggleMobileSidebar}
            className="lg:hidden w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 text-[#0B1F5B] dark:text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* App Icon */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[11px] bg-gradient-to-br from-[#0877FF] to-[#0B1F5B] p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <img
              src="/images/logo.png"
              alt="PracticeKoro"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Brand Title: Practice (Navy #0B1F5B) Koro (Blue #0877FF) */}
          <div className="flex items-center min-w-0">
            <span className="text-[18px] sm:text-[21.5px] font-black tracking-[-0.4px] text-[#0B1F5B] dark:text-white leading-none">
              Practice<span className="text-[#0877FF]">Koro</span>
            </span>
          </div>
        </div>

        {/* Right Actions: Search + Notification ('3') + Divider + Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search Button */}
          <button
            type="button"
            onClick={() => {
              setIsSearchModalOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-white dark:bg-slate-800 text-[#0B1F5B] dark:text-slate-200 flex items-center justify-center shadow-xs hover:border-[#0877FF]/40 transition-colors cursor-pointer"
            title="Search exams and tests"
            aria-label="Search"
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0B1F5B] dark:text-slate-200" />
          </button>

          {/* Notification Button with red '3' badge */}
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-white dark:bg-slate-800 text-[#0B1F5B] dark:text-slate-200 flex items-center justify-center shadow-xs hover:border-[#0877FF]/40 transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0B1F5B] dark:text-slate-200" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              3
            </span>
          </button>

          {/* Thin Vertical Divider */}
          <div className="w-[1px] h-5 sm:h-6 bg-[#BFDBFE] dark:bg-blue-800 mx-0.5" />

          {/* Existing Student Avatar */}
          <Link
            to="/profile"
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full border-1.5 border-white dark:border-slate-700 shadow-xs overflow-hidden bg-[#0877FF] shrink-0 block"
            title="Candidate Profile"
          >
            <img
              src={user?.avatarUrl || '/images/student_avatar_hd.png'}
              alt={user?.fullName || 'Student'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/student_avatar_hd.png';
              }}
            />
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO BANNER CAROUSEL (Exact 1:1 match to home_screen.dart:642)         */}
      {/* ========================================================================= */}
      <section className="relative w-full rounded-[20px] overflow-hidden shadow-xs border border-[#E2ECF8] dark:border-slate-800 bg-[#D9EEFF] dark:bg-slate-900 group select-none">
        <div
          className="relative w-full aspect-[438/200] cursor-pointer"
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
            className="w-full h-full object-fill transition-opacity duration-300"
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
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs z-20"
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs z-20"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
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
      {/* 3. 4 CORE PRACTICE ACTION CARDS (Exact 1:1 match to home_screen.dart:719) */}
      {/* ========================================================================= */}
      <section>
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {coreCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.route}
                className="relative aspect-square rounded-[16px] overflow-hidden group shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 block"
                style={{
                  boxShadow: `0 4px 10px ${card.shadowColor}`,
                }}
              >
                <div
                  className={cn(
                    'relative w-full h-full rounded-[16px] bg-gradient-to-br flex flex-col justify-between p-2 text-white overflow-hidden',
                    card.gradient
                  )}
                >
                  {/* Ambient top-left circle shape */}
                  <div className="absolute -left-4 -top-4 w-14 h-14 rounded-full bg-white/10 pointer-events-none" />

                  {/* Watermark graphic bottom-right */}
                  <div className="absolute -right-2 -bottom-2 opacity-15 pointer-events-none text-white">
                    <Icon className="w-9 h-9" />
                  </div>

                  {/* Center Column: Top Icon + Title + Subtitle */}
                  <div className="flex flex-col items-center text-center z-10 my-auto">
                    {idx === 0 ? (
                      // Audio Book: White squircle tile with blue icon inside
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[9px] bg-white text-[#0066FF] flex items-center justify-center shadow-xs mb-1">
                        <Icon className="w-4 h-4 text-[#0066FF]" />
                      </div>
                    ) : idx === 1 ? (
                      // Saved Questions: Direct white bookmark icon
                      <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center mb-1 text-white">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    ) : idx === 2 ? (
                      // Rank: White squircle tile with an orange trophy icon
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[9px] bg-white text-[#F97316] flex items-center justify-center shadow-xs mb-1">
                        <Icon className="w-4 h-4 text-[#F97316]" />
                      </div>
                    ) : (
                      // Live Tests: Radio waves broadcast icon
                      <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center mb-1 text-white">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    )}

                    <h3 className="text-[10px] sm:text-[11px] font-black tracking-tight leading-tight text-white truncate max-w-full">
                      {card.title}
                    </h3>
                    <p className="text-[7.5px] sm:text-[8.5px] text-white/90 font-medium leading-tight mt-0.5 truncate max-w-full">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Circular chevron right button at bottom center */}
                  <div className="flex justify-center z-10 shrink-0">
                    <div
                      className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white flex items-center justify-center shadow-xs"
                      style={{ color: card.arrowColor }}
                    >
                      <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LIVE TEST CARD (Exact 1:1 match to home_screen.dart:998)               */}
      {/* ========================================================================= */}
      {activeLiveTest && (
        <section className="relative overflow-hidden rounded-[24px] border border-[#E2EAF4] bg-[#F8FAFD] dark:bg-slate-900/90 p-3.5 sm:p-4 text-slate-900 dark:text-white shadow-[0_6px_20px_rgba(8,119,255,0.07)]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Left Column: Exam/Test Logo (Circular Container with White Ring and Glow) */}
            <div className="relative shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-full p-1 bg-white shadow-[0_4px_16px_rgba(8,119,255,0.18)] border-2 border-white ring-1 ring-blue-100 flex items-center justify-center overflow-hidden">
              <img
                src={activeLiveTest?.logo || activeLiveTest?.examLogo || '/images/exams/logo_wbp.png'}
                alt={activeLiveTest?.title || 'Live Test Exam'}
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                }}
              />
            </div>

            {/* Middle Column: Badge, Title, Date, Meta */}
            <div className="space-y-1 min-w-0 flex-1">
              {/* Red Live Test Badge */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF0033] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>LIVE TEST</span>
              </div>

              {/* Test Title */}
              <h3 className="text-sm sm:text-base font-black text-[#07194A] dark:text-white tracking-tight leading-tight line-clamp-1">
                {activeLiveTest?.title || 'WBP Constable Weekly Test'}
              </h3>

              {/* Date & Time Row */}
              <div className="flex items-center gap-1.5 text-xs text-[#5B6E88] dark:text-slate-400 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <span className="truncate">{formattedLiveDate || 'Sat, 28 Sep • 10:00 AM'}</span>
              </div>

              {/* Meta Row: Questions & Duration */}
              <div className="flex items-center gap-2 text-xs text-[#5B6E88] dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#64748B] shrink-0" />
                  <span>{activeLiveTest?.totalQuestions ?? 100} Qs</span>
                </div>
                <span className="text-[#CBD5E1]">|</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#64748B] shrink-0" />
                  <span>{activeLiveTest?.durationMinutes ?? 90} Mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Countdown boxes on left, Join Now on right */}
          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#E2EAF4] dark:border-slate-800">
            {/* Real-time Countdown Boxes (3 Boxes: Days, Hours, Mins) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-[#EDF4FD] dark:bg-slate-800 border border-[#D6E4F7] dark:border-slate-700 flex flex-col items-center justify-center shadow-xs">
                <span className="text-sm sm:text-base font-black text-[#07194A] dark:text-white leading-tight">
                  {countdownDays}
                </span>
                <span className="text-[9px] font-medium text-[#708099] dark:text-slate-400">
                  Days
                </span>
              </div>
              <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-[#EDF4FD] dark:bg-slate-800 border border-[#D6E4F7] dark:border-slate-700 flex flex-col items-center justify-center shadow-xs">
                <span className="text-sm sm:text-base font-black text-[#07194A] dark:text-white leading-tight">
                  {countdownHours}
                </span>
                <span className="text-[9px] font-medium text-[#708099] dark:text-slate-400">
                  Hours
                </span>
              </div>
              <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-[#EDF4FD] dark:bg-slate-800 border border-[#D6E4F7] dark:border-slate-700 flex flex-col items-center justify-center shadow-xs">
                <span className="text-sm sm:text-base font-black text-[#07194A] dark:text-white leading-tight">
                  {countdownMinutes}
                </span>
                <span className="text-[9px] font-medium text-[#708099] dark:text-slate-400">
                  Mins
                </span>
              </div>
            </div>

            {/* Join Now CTA */}
            <Link
              to={activeLiveTest?.testId ? `/live-test/${activeLiveTest.testId}` : '/live-test'}
              className="inline-flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 rounded-full bg-[#0877FF] hover:bg-[#0066FF] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              <span>Join Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. POPULAR EXAMS SECTION (Exact 1:1 match to home_screen.dart:1562)        */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl select-none">🔥</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Popular Exams
            </h2>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#2563EB] hover:underline"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>

        {/* Carousel / Grid: exact 1.55 aspect ratio */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2">
          {popularExams.map((exam) => (
            <Link
              key={exam.id}
              to={exam.route || (exam.slug || exam.examId ? `/exams/${exam.slug || exam.examId}` : '/test-series')}
              className="relative block shrink-0 snap-start w-[270px] sm:w-auto aspect-[1.55] rounded-[24px] overflow-hidden hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 group select-none shadow-md"
              style={{
                background: `linear-gradient(135deg, ${exam.cardGradientStart || '#0084FF'}, ${exam.cardGradientEnd || '#0048C6'})`,
                boxShadow: `0 10px 24px -4px ${exam.cardGradientStart || '#0084FF'}55`,
              }}
            >
              {exam.cardBgImage && (
                <img
                  src={exam.cardBgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              {/* Saturated fade gradient from transparent top to rich bottom color */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, transparent 0%, transparent 28%, ${exam.cardGradientStart || '#0084FF'}99 62%, ${exam.cardGradientEnd || '#0048C6'}fa 100%)`,
                }}
              />

              {/* Upper-Center Glowing Circular Emblem Badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                <div className="relative w-12 h-12 rounded-full flex items-center justify-center p-1.5 backdrop-blur-xs border-2 border-white/50 bg-white/20 shadow-[0_0_18px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform duration-300">
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
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Title (Left-aligned above bottom row) */}
              <div className="absolute left-4.5 right-4.5 bottom-11 pointer-events-none">
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  {exam.title}
                </h3>
              </div>

              {/* Card Bottom Row: Calendar + Test Count on Left, Circular White Arrow on Right */}
              <div className="absolute left-4.5 right-4.5 bottom-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 text-white">
                  <Calendar className="w-3.5 h-3.5 text-white/95 shrink-0 stroke-[2.2]" />
                  <span className="text-xs font-bold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                    {exam.testsCount || exam.cardBadge || '100+ Tests'}
                  </span>
                </div>
                <div
                  className="w-8.5 h-8.5 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/25 group-hover:scale-110 active:scale-95 transition-all duration-200 shrink-0 pointer-events-auto"
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
      {/* 6. POPULAR TEST SERIES SECTION (Exact 1:1 match to home_screen.dart:1800) */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">👑</span>
            <h2 className="text-base sm:text-lg font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Popular Test Series
            </h2>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0877FF] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {popularSeries.map((series, idx) => (
            <Link
              key={idx}
              to={series.route}
              className="relative p-3 rounded-[18px] border border-white/85 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] flex items-center justify-between overflow-hidden group"
            >
              {/* Pastel background image */}
              <div className="absolute inset-0 opacity-80 dark:opacity-20 pointer-events-none">
                <img
                  src={series.bgImage}
                  alt=""
                  className="w-full h-full object-cover object-right"
                />
              </div>

              {/* Card Contents: Single Horizontal Row */}
              <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                {/* Large Emblem */}
                <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                  <img
                    src={series.emblem}
                    alt=""
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Badge + Title + Subtitle */}
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'inline-block px-2 py-0.2 rounded-full text-[9px] font-black tracking-tight mb-0.5',
                      series.badgeBg
                    )}
                  >
                    {series.badge}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-[#0B1F5B] dark:text-white leading-tight truncate">
                    {series.title}
                  </h4>
                  <p className="text-[10.5px] font-semibold text-[#5B6B86] dark:text-slate-400 mt-0.5 truncate">
                    {series.subtitle}
                  </p>
                </div>
              </div>

              {/* White circular arrow button */}
              <div
                className="relative z-10 w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform"
                style={{ color: series.arrowColor }}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONTINUE PRACTICE SECTION (Exact 1:1 match to home_screen.dart:2100)   */}
      {/* ========================================================================= */}
      {practiceItems.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00E676] to-[#00C853] text-white flex items-center justify-center shadow-xs shrink-0">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0B1F5B] dark:text-white tracking-tight">
                Continue Practice
              </h2>
            </div>
            <Link
              to="/practice"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0877FF] hover:underline"
            >
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {practiceItems.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'relative p-3.5 rounded-[18px] border border-white bg-gradient-to-br shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden',
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
                <div className="relative z-10 flex items-start justify-between gap-3 mb-2.5">
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-block px-2 py-0.2 rounded-lg text-[9px] font-bold tracking-tight mb-1"
                      style={{ backgroundColor: item.badgeBg, color: item.examColor }}
                    >
                      {item.examBadge}
                    </span>
                    <h4 className="text-sm font-black text-[#0B1F5B] dark:text-white leading-tight truncate">
                      {item.testName}
                    </h4>
                    <p className="text-[10.5px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
                      {item.subject}
                    </p>
                  </div>

                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    <img
                      src={item.emblem}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Progress Count & Bar */}
                <div className="relative z-10 mb-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-semibold text-[#334155] dark:text-slate-300">
                      {item.completedQuestions}/{item.totalQuestions} questions
                    </span>
                    <span
                      className="text-[10.5px] font-black"
                      style={{ color: item.accentColor }}
                    >
                      {Math.round(item.progressPercent * 100)}%
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
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
                  className="relative z-10 w-full py-2 rounded-xl text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  style={{
                    backgroundColor: item.buttonColor,
                    boxShadow: `0 4px 10px ${item.buttonColor}40`,
                  }}
                >
                  <span>Continue Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. TOP PERFORMERS (Exact 1:1 match to home_screen.dart:2600)              */}
      {/* ========================================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img
              src="/images/performer_trophy.png"
              alt=""
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h2 className="text-base sm:text-lg font-black text-[#07194A] dark:text-white tracking-tight">
              Top Performers
            </h2>
          </div>
          <Link
            to="/rank"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0066FF] hover:underline"
          >
            <span>View Leaderboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {topPerformers.map((p) => (
            <div
              key={p.rank}
              className={cn(
                'relative aspect-square rounded-[18px] border border-white dark:border-slate-800 bg-gradient-to-br p-2.5 shadow-2xs hover:shadow-xs transition-all flex flex-col items-center justify-center text-center overflow-hidden',
                p.bgGradient
              )}
            >
              {/* Top-Left Rank Rosette Medal Badge */}
              <div className="absolute top-1.5 left-1.5 w-6 h-6">
                <img
                  src={p.badge}
                  alt={`Rank ${p.rank}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Avatar */}
              <div className="relative w-11 h-11 mb-1">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white shadow-xs"
                />
              </div>

              {/* Student Name */}
              <h4 className="text-[11px] sm:text-xs font-extrabold text-[#07194A] dark:text-white truncate max-w-full leading-tight">
                {p.name}
              </h4>

              {/* Score in rank color */}
              <span
                className="text-xs sm:text-sm font-black my-0.5"
                style={{ color: p.rankColor }}
              >
                {p.score}
              </span>

              {/* Exam Tag */}
              <span className="inline-block px-1.5 py-0.2 rounded-full bg-[#EDF2F7] dark:bg-slate-800 text-[#4B617E] dark:text-slate-300 text-[8.5px] font-semibold truncate max-w-full mb-0.5">
                {p.exam}
              </span>

              {/* Tests Attempted Pill */}
              <div
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold',
                  p.pillBg,
                  p.pillTextColor
                )}
              >
                <Crosshair className="w-2.5 h-2.5" />
                <span className="truncate">{p.testsAttempted}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TODAY'S INFO & MOTIVATIONAL QUOTE (Exact match to home_screen.dart:3100)*/}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-1">
        {/* Today's Info */}
        <div className="p-3.5 rounded-[20px] bg-[#F1F6FE] dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <img
                src="/images/today_info_sunrise.png"
                alt=""
                className="w-7 h-7 object-contain rounded-lg"
              />
              <div>
                <h3 className="text-sm font-black text-[#07194A] dark:text-white leading-tight">
                  Today's Info
                </h3>
                <p className="text-[10px] text-[#5A6E85] dark:text-slate-400 font-medium">
                  Learn something new everyday
                </p>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#0066FF] dark:text-blue-400 text-[10px] font-bold border border-[#DBEAFE] dark:border-slate-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{todayDateString}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 flex items-center gap-3 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-[#EDF5FF] dark:bg-slate-700 flex items-center justify-center shrink-0">
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
              <p className="text-xs font-bold text-[#07194A] dark:text-white leading-snug">
                {String(dailyContent.factText || 'Practice consistent mock tests to achieve your target cut-off marks.')}
              </p>
              <div className="mt-1.5">
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md bg-[#EBF3FF] dark:bg-slate-700 text-[#0066FF] dark:text-blue-400 text-[10px] font-bold hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{String(dailyContent.subjectName || dailyContent.factSource || 'General Studies')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="relative p-3.5 rounded-[20px] bg-[#FFF2F6] dark:bg-slate-900 border border-[#FADBE8] dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 mb-2.5">
            <img
              src="/images/quote_target_3d.png"
              alt=""
              className="w-7 h-7 object-contain rounded-lg"
            />
            <div>
              <h3 className="text-sm font-black text-[#07194A] dark:text-white leading-tight">
                Motivational Quote
              </h3>
              <p className="text-[10px] text-[#5A6E85] dark:text-slate-400 font-medium">
                Stay inspired, keep going
              </p>
            </div>
          </div>

          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[#FFF6F8] to-[#FDECEF] dark:from-slate-800 dark:to-slate-800/80 border border-[#FCDCE8] dark:border-slate-700 overflow-hidden shadow-2xs">
            {/* Mountain Summit illustration */}
            <img
              src="/images/quote_mountain_summit.png"
              alt=""
              className="absolute right-0 bottom-0 h-20 object-contain pointer-events-none opacity-85"
            />

            <div className="relative z-10 pr-12">
              <span className="text-2xl font-serif text-[#F43F5E] font-black leading-none block -mb-1">
                “
              </span>
              <p className="text-xs font-bold text-[#07194A] dark:text-white leading-relaxed">
                {String(dailyContent.quoteText || 'Success is the sum of small efforts, repeated day in and day out.')}
              </p>
              <p className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 mt-1.5">
                {dailyContent.quoteAuthor ? `— ${String(dailyContent.quoteAuthor)}` : '— Robert Collier'}
              </p>
            </div>

            <div className="relative z-10 pt-2">
              <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[#BE123C] dark:text-rose-300 text-[9.5px] font-black">
                Target Exam: {String(dailyContent.targetExam || selectedExam?.title || 'WBP Constable')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. PRO PASS BANNER (For non-pro students)                                 */}
      {/* ========================================================================= */}
      {!isPro && (
        <section className="relative rounded-[20px] bg-gradient-to-r from-[#0B1F44] via-[#0138A8] to-[#0158FC] text-white p-4 overflow-hidden shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                </div>
                <h3 className="text-sm font-black text-white">
                  Upgrade to <span className="text-amber-300">PracticeKoro Pro</span>
                </h3>
              </div>
              <p className="text-[11px] text-blue-100 font-medium leading-snug">
                Get unlimited access to all exams, 120+ mock tests, PYQs and statewide rankings.
              </p>
            </div>

            <Link
              to="/subscription"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#0158FC] text-xs font-black shadow-sm shrink-0 active:scale-95 transition-all"
            >
              <span>Get Pro Pass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* LIVE SEARCH MODAL (Matching _openLiveSearchModal in home_screen.dart:115)   */}
      {/* ========================================================================= */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-[#0B1F5B] dark:text-white">
                Search Exams & Tests
              </h3>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative my-3">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0877FF]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mock tests, exams, subjects..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-[#0B1F5B] dark:text-white focus:outline-none focus:border-[#0877FF]"
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
              {popularExams
                .filter(
                  (e) =>
                    !searchQuery ||
                    e.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((exam) => (
                  <Link
                    key={exam.id}
                    to={exam.route || `/exams/${exam.slug || exam.examId || ''}`}
                    onClick={() => setIsSearchModalOpen(false)}
                    className="p-2.5 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between transition-colors block"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#0B1F5B] dark:text-white">
                        {exam.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {exam.testsCount || 'Mock Tests & Practice'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL / POPOVER */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#0877FF]" />
                <h3 className="text-sm font-black text-[#0B1F5B] dark:text-white">
                  Notifications
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotifOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-2">
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800">
                <h4 className="text-xs font-bold text-[#0B1F5B] dark:text-white">
                  3 new exam updates available
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  New mock tests and statewide rank updates for your target exam.
                </p>
              </div>
            </div>
          </div>
        </div>
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
