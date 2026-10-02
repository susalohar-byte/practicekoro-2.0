import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { bannerService } from '@/services/bannerService';
import { api, DEFAULT_POPULAR_EXAMS } from '@/services/api';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  ArrowRight,
  Radio,
  Play,
  FileText,
  BookOpen,
  Crosshair,
  Target,
  Clock,
} from 'lucide-react';
import type { PopularExamCard } from '@/types';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { ExamSelectorModal } from '@/components/student/ExamSelectorModal';

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

    const handleExamsUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['popular-exams'] });
      queryClient.refetchQueries({ queryKey: ['popular-exams'] });
    };
    window.addEventListener('practicekoro:exams_updated', handleExamsUpdated);

    return () => {
      unsubscribeBanners();
      unsubscribeLiveTests();
      window.removeEventListener('practicekoro:exams_updated', handleExamsUpdated);
    };
  }, [queryClient]);

  // Live test countdown calculation
  const liveStartAt = activeLiveTest?.startAt || activeLiveTest?.scheduledStartTime;
  const startTime = liveStartAt ? new Date(liveStartAt).getTime() : Date.now() + 172800000;
  const timeDiff = Math.max(0, startTime - currentTime);
  const countdownDays = String(Math.floor(timeDiff / (1000 * 60 * 60 * 24))).padStart(2, '0');
  const countdownHours = String(Math.floor((timeDiff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
  const countdownMinutes = String(Math.floor((timeDiff / (1000 * 60)) % 60)).padStart(2, '0');
  const countdownSeconds = String(Math.floor((timeDiff / 1000) % 60)).padStart(2, '0');

  // Formatted date string for live test
  const formattedLiveDate = useMemo(() => {
    if (activeLiveTest?.scheduledStartTime || activeLiveTest?.startAt) {
      const d = new Date(activeLiveTest.scheduledStartTime || activeLiveTest.startAt);
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hour24 = d.getHours();
      const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const period = hour24 >= 12 ? 'PM' : 'AM';
      return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} • ${hour12}:${minutes} ${period}`;
    }
    return 'Sat, 28 Sep • 10:00 AM';
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
  // Master Design Data Arrays (Matching home_screen.dart 100%)
  // -------------------------------------------------------------

  // 2. 4 Core Practice Cards
  const coreCards = [
    {
      title: 'Mock Test',
      subtitle: 'Full Test Experience',
      image: '/images/card_mock_test.png',
      route: '/test-series',
      shadowColor: 'rgba(0, 91, 212, 0.28)',
      arrowColor: '#0052D4',
      gradient: 'from-[#00A2FF] to-[#0052D4]',
      icon: FileText,
    },
    {
      title: 'Topic Practice',
      subtitle: 'Chapter-wise',
      image: '/images/card_topic_practice.png',
      route: '/practice',
      shadowColor: 'rgba(5, 150, 105, 0.28)',
      arrowColor: '#059669',
      gradient: 'from-[#2DD878] to-[#059669]',
      icon: Target,
    },
    {
      title: 'Previous Year',
      subtitle: 'Real Exam Questions',
      image: '/images/card_previous_year.png',
      route: '/practice?tab=pyqs',
      shadowColor: 'rgba(249, 115, 22, 0.28)',
      arrowColor: '#EA580C',
      gradient: 'from-[#FBBF24] via-[#F97316] to-[#EA580C]',
      icon: BookOpen,
    },
    {
      title: 'Live Tests',
      subtitle: 'Join & Compete',
      image: '/images/card_live_tests.png',
      route: '/live-test',
      shadowColor: 'rgba(225, 29, 72, 0.28)',
      arrowColor: '#BE123C',
      gradient: 'from-[#FB7185] via-[#E11D48] to-[#BE123C]',
      icon: Radio,
    },
  ];

  // 4. Popular Exams (Dynamic & Admin-customizable)
  const popularExams = useMemo(() => {
    if (popularExamsCards && popularExamsCards.length > 0) {
      const active = popularExamsCards.filter((c) => c.isActive !== false);
      if (active.length > 0) {
        return active.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      }
    }
    return DEFAULT_POPULAR_EXAMS;
  }, [popularExamsCards]);

  // 5. Popular Test Series
  const popularSeries = [
    {
      title: 'WBP Constable',
      subtitle: 'Test Series 2026',
      badge: '🔥 Bestseller',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_wbp_bg.png',
      emblem: '/images/exams/emblem_series_wbp.png',
      arrowColor: '#0877FF',
      route: '/test-series',
    },
    {
      title: 'KP Constable',
      subtitle: 'Test Series 2026',
      badge: '⭐ Most Popular',
      badgeBg: 'bg-[#FEF3C7] text-[#B45309]',
      bgImage: '/images/series_kp_bg.png',
      emblem: '/images/exams/emblem_series_kp.png',
      arrowColor: '#7C3AED',
      route: '/test-series',
    },
    {
      title: 'SSC GD',
      subtitle: 'Test Series 2026',
      badge: '🔥 Bestseller',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_ssc_bg.png',
      emblem: '/images/exams/emblem_series_ssc.png',
      arrowColor: '#EA580C',
      route: '/test-series',
    },
  ];

  // 6. Continue Practice (Static baseline fallback items)
  const defaultPracticeItems = [
    {
      examBadge: 'WBP Constable',
      examColor: '#0066FF',
      badgeBg: '#E0EDFF',
      testName: 'Mock Test 12',
      subject: 'General Knowledge',
      completedQuestions: 7,
      totalQuestions: 20,
      progressPercent: 0.35,
      emblem: '/images/exams/emblem_series_wbp.png',
      accentColor: '#0066FF',
      buttonColor: '#0066FF',
      bgGradient: 'from-[#F1F6FE] to-[#E4EFFF]',
      trackColor: '#D6E4F7',
      bgImage: '/images/series_wbp_bg.png',
      route: '/test-series',
    },
    {
      examBadge: 'KP Constable',
      examColor: '#6B21A8',
      badgeBg: '#F0E5FA',
      testName: 'Mock Test 08',
      subject: 'Reasoning',
      completedQuestions: 12,
      totalQuestions: 25,
      progressPercent: 0.48,
      emblem: '/images/exams/emblem_series_kp.png',
      accentColor: '#6B21A8',
      buttonColor: '#6B21A8',
      bgGradient: 'from-[#F9F4FD] to-[#EFE5FC]',
      trackColor: '#E8DBF8',
      bgImage: '/images/series_kp_bg.png',
      route: '/test-series',
    },
    {
      examBadge: 'SSC GD',
      examColor: '#EA580C',
      badgeBg: '#FFECE0',
      testName: 'Practice Set 05',
      subject: 'Mathematics',
      completedQuestions: 10,
      totalQuestions: 30,
      progressPercent: 0.33,
      emblem: '/images/exams/emblem_series_ssc.png',
      accentColor: '#EA580C',
      buttonColor: '#EA580C',
      bgGradient: 'from-[#FFF6F0] to-[#FEEADF]',
      trackColor: '#FCDDCE',
      bgImage: '/images/series_ssc_bg.png',
      route: '/test-series',
    },
  ];

  // Merge real in-progress attempt if available
  const practiceItems = useMemo(() => {
    if (!inProgressAttempt) return defaultPracticeItems;
    const answered = (inProgressAttempt.correctCount || 0) + (inProgressAttempt.wrongCount || 0);
    const total = 100;
    const progress = Math.min(1, Math.max(0.05, answered / total));

    const resumeItem = {
      examBadge: selectedExam?.title?.replace(/ 202\d/, '') || 'Active Exam',
      examColor: '#0066FF',
      badgeBg: '#E0EDFF',
      testName: inProgressAttempt.testTitle || 'Mock Test (In Progress)',
      subject: 'Live Attempt',
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
    };

    return [resumeItem, defaultPracticeItems[0], defaultPracticeItems[1]];
  }, [inProgressAttempt, selectedExam]);

  // 7. Top Performers (Matching _buildTopPerformersSection 100%)
  const topPerformers = [
    {
      rank: 1,
      name: 'Rahul Das',
      score: '94%',
      exam: 'WBP Constable',
      testsAttempted: '32 Tests Attempted',
      avatar: '/images/performer_rahul.png',
      badge: '/images/performer_badge_1.png',
      rankColor: '#F59E0B',
      rankBadgeBg: '#FFF0D6',
      bgGradient: 'from-[#FFFDF5] to-[#FFF7E8]',
      pillBg: 'bg-[#FEE8CE]',
      pillTextColor: 'text-[#9A3412]',
    },
    {
      rank: 2,
      name: 'Amit Kumar',
      score: '92%',
      exam: 'KP Constable',
      testsAttempted: '28 Tests Attempted',
      avatar: '/images/performer_amit.png',
      badge: '/images/performer_badge_2.png',
      rankColor: '#0066FF',
      rankBadgeBg: '#E0EDFF',
      bgGradient: 'from-[#F4F8FD] to-[#E9F3FE]',
      pillBg: 'bg-[#DBEAFE]',
      pillTextColor: 'text-[#1D4ED8]',
    },
    {
      rank: 3,
      name: 'Sneha Roy',
      score: '89%',
      exam: 'SSC GD',
      testsAttempted: '25 Tests Attempted',
      avatar: '/images/performer_sneha.png',
      badge: '/images/performer_badge_3.png',
      rankColor: '#EA580C',
      rankBadgeBg: '#FFECE0',
      bgGradient: 'from-[#FFF7F2] to-[#FDECE3]',
      pillBg: 'bg-[#FFE5DA]',
      pillTextColor: 'text-[#9A3412]',
    },
    {
      rank: 4,
      name: 'Priya Sharma',
      score: '86%',
      exam: 'WBP Constable',
      testsAttempted: '22 Tests Attempted',
      avatar: '/images/performer_priya.png',
      badge: '/images/performer_badge_4.png',
      rankColor: '#059669',
      rankBadgeBg: '#D1FAE5',
      bgGradient: 'from-[#F2FBF6] to-[#E4F8EE]',
      pillBg: 'bg-[#D1FAE5]',
      pillTextColor: 'text-[#065F46]',
    },
  ];

  // Dynamic Current Date for Today's Info (e.g., 02 Oct 2026)
  const todayDateString = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 selection:bg-[#0877FF]/20 selection:text-[#0877FF]">
      {/* ========================================================= */}
      {/* 1. HERO BANNER CAROUSEL (Mobile App Master 1:1)            */}
      {/* ========================================================= */}
      <section className="relative w-full rounded-[20px] sm:rounded-3xl overflow-hidden shadow-xs border border-[#E2ECF8] dark:border-slate-800 bg-[#D9EEFF] dark:bg-slate-900 group select-none">
        <div
          className="relative w-full aspect-[438/180] sm:aspect-[438/150] lg:aspect-[438/140] cursor-pointer"
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

      {/* ========================================================= */}
      {/* 2. 4 CORE PRACTICE ACTION CARDS (100% Crisp Vector UI)    */}
      {/* ========================================================= */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {coreCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.route}
                className="relative aspect-[221/224] rounded-[18px] overflow-hidden group shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 block"
                style={{
                  boxShadow: `0 8px 18px ${card.shadowColor}`,
                }}
              >
                {/* 100% Crisp Vector Card UI (Matches Mobile App & Reference UI 1:1) */}
                <div
                  className={cn(
                    'relative w-full h-full rounded-[18px] bg-gradient-to-br flex flex-col justify-between p-3 sm:p-3.5 text-white overflow-hidden',
                    card.gradient
                  )}
                >
                  {/* Ambient abstract wave / circular glow top-left */}
                  <div className="absolute -left-5 -top-5 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />

                  {/* Watermark graphic bottom-right */}
                  <div className="absolute -right-2 -bottom-2 opacity-15 pointer-events-none text-white">
                    <Icon className="w-12 h-12" />
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-col items-center text-center z-10">
                    {idx === 0 ? (
                      // Mock Test: White squircle tile with blue icon inside
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white text-[#0066FF] flex items-center justify-center shadow-md mb-1.5">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    ) : idx === 1 ? (
                      // Topic Practice: Direct white target crosshairs icon
                      <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center mb-1.5 text-white">
                        <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                    ) : idx === 2 ? (
                      // Previous Year: White folded sheet with orange horizontal lines
                      <div className="w-9 h-11 sm:w-10 sm:h-12 bg-white rounded-l-md rounded-br-md rounded-tr-xl shadow-md p-1.5 flex flex-col justify-center gap-1 mb-1">
                        <div className="w-3.5 h-1 bg-[#F97316] rounded-xs" />
                        <div className="w-5 h-1 bg-[#F97316] rounded-xs" />
                      </div>
                    ) : (
                      // Live Tests: Radio waves broadcast icon
                      <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center mb-1.5 text-white">
                        <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                    )}
                    <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight text-white">
                      {card.title}
                    </h3>
                    <p className="text-[9.5px] sm:text-[11px] text-white/90 font-medium mt-0.5 leading-tight">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Circular arrow button near bottom center */}
                  <div className="flex justify-center z-10">
                    <div
                      className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm"
                      style={{ color: card.arrowColor }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. LIVE TEST CARD (Dark Navy Elevated with Real Countdown) */}
      {/* ========================================================= */}
      <section className="rounded-[22px] bg-[#012452] p-4 sm:p-5 lg:p-6 text-white shadow-[0_6px_20px_rgba(1,36,82,0.28)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Column: Badge, Title, Date, Meta */}
          <div className="space-y-2.5 min-w-0">
            {/* Red Live Test Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FD0424] text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE TEST</span>
            </div>

            {/* Test Title */}
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight leading-snug">
              {activeLiveTest?.title || 'WBP Constable Statewide Weekly Mock Test'}
            </h3>

            {/* Date Row */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#C7D7E9] font-semibold">
              <Calendar className="w-4 h-4 text-[#8FA9C8] shrink-0" />
              <span>{formattedLiveDate}</span>
            </div>

            {/* Meta Row: Questions & Minutes */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#C7D7E9] font-medium pt-0.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#8FA9C8]" />
                <span>{activeLiveTest?.totalQuestions || 100} Questions</span>
              </div>
              <span className="w-[1.2px] h-3.5 bg-[#264C7A]" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#8FA9C8]" />
                <span>{activeLiveTest?.durationMinutes || 90} Minutes</span>
              </div>
            </div>
          </div>

          {/* Right Column: Countdown blocks on top, Join Now button below */}
          <div className="flex flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t border-[#143964] lg:border-none">
            {/* Real-time Countdown Boxes */}
            <div className="flex items-center gap-2">
              <div className="w-12 sm:w-14 h-13 sm:h-14 rounded-xl bg-[#143964] flex flex-col items-center justify-center shadow-inner">
                <span className="text-base sm:text-lg font-black text-white leading-tight">
                  {countdownDays}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-[#8FA9C8]">
                  Days
                </span>
              </div>
              <div className="w-12 sm:w-14 h-13 sm:h-14 rounded-xl bg-[#143964] flex flex-col items-center justify-center shadow-inner">
                <span className="text-base sm:text-lg font-black text-white leading-tight">
                  {countdownHours}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-[#8FA9C8]">
                  Hours
                </span>
              </div>
              <div className="w-12 sm:w-14 h-13 sm:h-14 rounded-xl bg-[#143964] flex flex-col items-center justify-center shadow-inner">
                <span className="text-base sm:text-lg font-black text-white leading-tight">
                  {countdownMinutes}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-[#8FA9C8]">
                  Mins
                </span>
              </div>
              <div className="w-12 sm:w-14 h-13 sm:h-14 rounded-xl bg-[#143964] flex flex-col items-center justify-center shadow-inner">
                <span className="text-base sm:text-lg font-black text-[#FD0424] leading-tight">
                  {countdownSeconds}
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-medium text-[#8FA9C8]">
                  Sec
                </span>
              </div>
            </div>

            {/* Join Now CTA */}
            <Link
              to={activeLiveTest?.testId ? `/exams/${activeLiveTest.testId}/runner` : '/test-series'}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#006BFE] hover:bg-[#0058D0] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all w-full sm:w-auto"
            >
              <span>Join Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. POPULAR EXAMS SECTION (Master 1:1)                      */}
      {/* ========================================================= */}
      <section className="space-y-3 sm:space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Popular Exams
            </h2>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0877FF] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
          {popularExams.map((exam, idx) => (
            <Link
              key={exam.id || idx}
              to={exam.route || '/test-series'}
              className="relative aspect-[3/2] rounded-[20px] sm:rounded-[22px] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 group block"
              style={{
                background: `linear-gradient(135deg, ${exam.cardGradientStart || '#0084FF'}, ${exam.cardGradientEnd || '#0048C6'})`,
              }}
            >
              {/* Clean backdrop artwork (monument, officer, glowing pedestal) */}
              {exam.cardBgImage && (
                <img
                  src={exam.cardBgImage}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
              )}

              {/* Glassy Surface Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/16 via-white/5 to-transparent pointer-events-none" />

              {/* Crisp Center-Top Emblem / Icon (Razor-sharp vector badge) */}
              {exam.cardEmblemUrl && (
                <div className="absolute top-[33%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 flex items-center justify-center pointer-events-none">
                  <img
                    src={exam.cardEmblemUrl}
                    alt={exam.title}
                    className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)] group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Razor-sharp vector typography & button overlay (100% Crisp Vector UI) */}
              <div className="absolute inset-0 p-3.5 sm:p-4.5 flex flex-col justify-end text-white pointer-events-none">
                {/* Exam Title (Crisp native vector text - Controllable from Admin) */}
                <h3 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight mb-2.5 sm:mb-3">
                  {exam.title}
                </h3>

                {/* Bottom Row: Calendar tests count + Arrow circle button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <span>{exam.cardBadge || exam.testsCount}</span>
                  </div>
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-md pointer-events-auto group-hover:scale-110 transition-transform"
                    style={{ color: exam.cardArrowColor || '#0066FF' }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. POPULAR TEST SERIES SECTION (Master 1:1)               */}
      {/* ========================================================= */}
      <section className="space-y-3 sm:space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Popular Test Series
            </h2>
          </div>
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0877FF] hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
          {popularSeries.map((series, idx) => (
            <Link
              key={idx}
              to={series.route}
              className="relative p-3.5 sm:p-4 rounded-[18px] border border-white/85 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 active:scale-[0.99] flex items-center justify-between overflow-hidden group"
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
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
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
                      'inline-block px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black tracking-tight mb-1',
                      series.badgeBg
                    )}
                  >
                    {series.badge}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-[#0B1F5B] dark:text-white leading-tight truncate">
                    {series.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs font-semibold text-[#5B6B86] dark:text-slate-400 mt-0.5 truncate">
                    {series.subtitle}
                  </p>
                </div>
              </div>

              {/* White circular arrow button */}
              <div
                className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform"
                style={{ color: series.arrowColor }}
              >
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CONTINUE PRACTICE SECTION (Master 1:1)                 */}
      {/* ========================================================= */}
      <section className="space-y-3 sm:space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Green Circular Play Icon */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00E676] to-[#00C853] text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
          {practiceItems.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                'relative p-3.5 sm:p-4 rounded-[18px] border border-white bg-gradient-to-br shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden',
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

              {/* Top Row: Badge + Test Name + Subject (Left) & Emblem (Right) */}
              <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block px-2 py-0.5 rounded-lg text-[9.5px] sm:text-[10px] font-bold tracking-tight mb-1"
                    style={{ backgroundColor: item.badgeBg, color: item.examColor }}
                  >
                    {item.examBadge}
                  </span>
                  <h4 className="text-sm sm:text-[15px] font-black text-[#0B1F5B] dark:text-white leading-tight truncate">
                    {item.testName}
                  </h4>
                  <p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
                    {item.subject}
                  </p>
                </div>

                {/* Full Unclipped Emblem */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
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
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-[#334155] dark:text-slate-300">
                    {item.completedQuestions}/{item.totalQuestions} questions
                  </span>
                  <span
                    className="text-[11px] font-black"
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

      {/* ========================================================= */}
      {/* 7. TOP PERFORMERS (Master 1:1 Square Cards)                */}
      {/* ========================================================= */}
      <section className="space-y-3 sm:space-y-3.5">
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
            <h2 className="text-lg sm:text-xl font-black text-[#07194A] dark:text-white tracking-tight">
              Top Performers
            </h2>
          </div>
          <Link
            to="/rank"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0066FF] hover:underline"
          >
            <span>View Leaderboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {topPerformers.map((p) => (
            <div
              key={p.rank}
              className={cn(
                'relative aspect-square rounded-[18px] sm:rounded-[22px] border border-white dark:border-slate-800 bg-gradient-to-br p-3 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center overflow-hidden',
                p.bgGradient
              )}
            >
              {/* Top-Left Rank Rosette Medal Badge */}
              <div className="absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8">
                <img
                  src={p.badge}
                  alt={`Rank ${p.rank}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Avatar with Laurel Wreath */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-1">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white shadow-xs"
                />
              </div>

              {/* Student Name */}
              <h4 className="text-xs sm:text-[13.5px] font-extrabold text-[#07194A] dark:text-white truncate max-w-full leading-tight">
                {p.name}
              </h4>

              {/* Score in rank color */}
              <span
                className="text-sm sm:text-base font-black my-0.5"
                style={{ color: p.rankColor }}
              >
                {p.score}
              </span>

              {/* Exam Tag */}
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#EDF2F7] dark:bg-slate-800 text-[#4B617E] dark:text-slate-300 text-[9px] sm:text-[10px] font-semibold truncate max-w-full mb-1">
                {p.exam}
              </span>

              {/* Tests Attempted Pill */}
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-bold',
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

      {/* ========================================================= */}
      {/* 8. TODAY'S INFO & MOTIVATIONAL QUOTE (Master 1:1)          */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5 items-stretch">
        {/* Today's Info */}
        <div className="h-full p-4 sm:p-5 rounded-[22px] bg-[#F1F6FE] dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/today_info_sunrise.png"
                alt=""
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl"
              />
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#07194A] dark:text-white leading-tight">
                  Today's Info
                </h3>
                <p className="text-[11px] sm:text-xs text-[#5A6E85] dark:text-slate-400 font-medium">
                  Learn something new everyday
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#0066FF] dark:text-blue-400 text-[11px] sm:text-[11.5px] font-bold border border-[#DBEAFE] dark:border-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayDateString}</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 flex items-center gap-3.5 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#EDF5FF] dark:bg-slate-700 flex items-center justify-center shrink-0">
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
              <p className="text-xs sm:text-[13.5px] font-bold text-[#07194A] dark:text-white leading-snug">
                ভারতের সংবিধান ২৬ জানুয়ারি ১৯৫০ সালে গৃহীত হয় এবং সেদিনই কার্যকর হয়।
              </p>
              <div className="mt-2">
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#EBF3FF] dark:bg-slate-700 text-[#0066FF] dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Indian Polity</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="h-full relative p-4 sm:p-5 rounded-[22px] bg-[#FFF2F6] dark:bg-slate-900 border border-[#FADBE8] dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/quote_target_3d.png"
                alt=""
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl"
              />
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#07194A] dark:text-white leading-tight">
                  Motivational Quote
                </h3>
                <p className="text-[11px] sm:text-xs text-[#5A6E85] dark:text-slate-400 font-medium">
                  Stay inspired, keep going
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#FFF6F8] to-[#FDECEF] dark:from-slate-800 dark:to-slate-800/80 border border-[#FCDCE8] dark:border-slate-700 overflow-hidden shadow-2xs">
            {/* Mountain Summit illustration */}
            <img
              src="/images/quote_mountain_summit.png"
              alt=""
              className="absolute right-0 bottom-0 h-24 sm:h-28 object-contain pointer-events-none opacity-85"
            />

            <div className="relative z-10 pr-14">
              <span className="text-2xl sm:text-3xl font-serif text-[#F43F5E] font-black leading-none block -mb-1">
                “
              </span>
              <p className="text-xs sm:text-[13.5px] font-bold text-[#07194A] dark:text-white leading-relaxed">
                ছোট ছোট প্রচেষ্টার যোগফলই বড় সাফল্য, তাই প্রতিদিন একটু একটু করে এগিয়ে চলুন।
              </p>
              <p className="text-[11px] sm:text-xs font-bold text-[#64748B] dark:text-slate-400 mt-2">
                — রবার্ট কলিয়ার
              </p>
            </div>

            <div className="relative z-10 pt-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[#BE123C] dark:text-rose-300 text-[10px] font-black">
                Target Exam: {selectedExam?.title || 'WBP Constable 2026'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. PRO PASS BANNER (For non-pro students)                  */}
      {/* ========================================================= */}
      {!isPro && (
        <section className="relative rounded-[22px] sm:rounded-3xl bg-gradient-to-r from-[#0B1F44] via-[#0138A8] to-[#0158FC] text-white p-5 sm:p-6 overflow-hidden shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Upgrade to <span className="text-amber-300">PracticeKoro Pro</span>
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-blue-100 font-medium leading-relaxed">
                Get unlimited access to all exams, 500+ mock tests, PYQ with Bengali explanations, and statewide rankings.
              </p>
            </div>

            <Link
              to="/subscription"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-[#0158FC] text-xs sm:text-sm font-black shadow-sm shrink-0 active:scale-95 transition-all"
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
