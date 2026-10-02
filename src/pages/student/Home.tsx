import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { api } from '@/services/api';

export const Home: React.FC = () => {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dynamic Banners
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

  const { data: userAttempts = [] } = useQuery({
    queryKey: ['home-user-attempts', user?.id],
    queryFn: () => (user?.id ? api.getUserAttempts(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const inProgressAttempt = userAttempts.find((a) => a.status === 'in_progress');

  // Real-time sync
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

  // Onboarding Modal
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // 4 Core Practice Cards
  const coreActions = [
    {
      title: 'Mock Test',
      subtitle: 'Full Test Experience',
      image: '/images/card_mock_test.png',
      route: '/test-series',
      gradient: 'from-[#00A2FF] to-[#0052D4]',
      shadow: 'shadow-[0_4px_12px_rgba(0,82,212,0.28)]',
    },
    {
      title: 'Topic Practice',
      subtitle: 'Chapter-wise',
      image: '/images/card_topic_practice.png',
      route: '/practice',
      gradient: 'from-[#2DD878] to-[#059669]',
      shadow: 'shadow-[0_4px_12px_rgba(5,150,105,0.28)]',
    },
    {
      title: 'Previous Year',
      subtitle: 'Real Exam Questions',
      image: '/images/card_previous_year.png',
      route: '/practice?tab=pyqs',
      gradient: 'from-[#FBBF24] via-[#F97316] to-[#EA580C]',
      shadow: 'shadow-[0_4px_12px_rgba(234,88,12,0.28)]',
    },
    {
      title: 'Live Tests',
      subtitle: 'Join & Compete',
      image: '/images/card_live_tests.png',
      route: '/test-series',
      gradient: 'from-[#FB7185] via-[#E11D48] to-[#BE123C]',
      shadow: 'shadow-[0_4px_12px_rgba(190,18,60,0.28)]',
    },
  ];

  // 3 Popular Exams
  const popularExams = [
    {
      title: 'WBP Constable',
      testsCount: '120+ Tests',
      image: '/images/exam_wbp_card.png',
      route: '/test-series',
      gradient: 'from-[#00A2FF] to-[#0052D4]',
    },
    {
      title: 'KP Constable',
      testsCount: '100+ Tests',
      image: '/images/exam_kp_card.png',
      route: '/test-series',
      gradient: 'from-[#A855F7] to-[#6D28D9]',
    },
    {
      title: 'SSC GD',
      testsCount: '150+ Tests',
      image: '/images/exam_ssc_card.png',
      route: '/test-series',
      gradient: 'from-[#F97316] to-[#DC2626]',
    },
  ];

  // 3 Popular Test Series
  const popularSeries = [
    {
      title: 'WBP Constable',
      subtitle: 'Test Series 2026',
      badge: '🔥 Bestseller',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_wbp_bg.png',
      emblem: '/images/exams/emblem_series_wbp.png',
      route: '/test-series',
    },
    {
      title: 'KP Constable',
      subtitle: 'Test Series 2026',
      badge: '⭐ Most Popular',
      badgeBg: 'bg-[#FEF3C7] text-[#B45309]',
      bgImage: '/images/series_kp_bg.png',
      emblem: '/images/exams/emblem_series_kp.png',
      route: '/test-series',
    },
    {
      title: 'SSC GD',
      subtitle: 'Test Series 2026',
      badge: '🔥 Bestseller',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_ssc_bg.png',
      emblem: '/images/exams/emblem_series_ssc.png',
      route: '/test-series',
    },
  ];

  // Continue Practice Items
  const continueItems = [
    ...(inProgressAttempt
      ? [
          {
            examBadge: 'Current In-Progress',
            testName: inProgressAttempt.testTitle || 'Mock Test',
            subject: 'Continue where you left off',
            completed:
              (inProgressAttempt.correctCount || 0) + (inProgressAttempt.wrongCount || 0),
            total: Math.max(
              1,
              (inProgressAttempt.correctCount || 0) +
                (inProgressAttempt.wrongCount || 0) +
                (inProgressAttempt.skippedCount || 0)
            ),
            emblem: '/images/exams/emblem_series_wbp.png',
            bgImage: '/images/series_wbp_bg.png',
            badgeBg: 'bg-[#E0EDFF] text-[#0066FF]',
            btnColor: 'bg-[#0066FF]',
            route: `/exams/${inProgressAttempt.testId}/runner?attemptId=${inProgressAttempt.id}`,
          },
        ]
      : []),
    {
      examBadge: 'WBP Constable',
      testName: 'Mock Test 12',
      subject: 'General Knowledge',
      completed: 7,
      total: 20,
      emblem: '/images/exams/emblem_series_wbp.png',
      bgImage: '/images/series_wbp_bg.png',
      badgeBg: 'bg-[#E0EDFF] text-[#0066FF]',
      btnColor: 'bg-[#0066FF]',
      route: '/test-series',
    },
    {
      examBadge: 'KP Constable',
      testName: 'Mock Test 08',
      subject: 'Reasoning',
      completed: 12,
      total: 25,
      emblem: '/images/exams/emblem_series_kp.png',
      bgImage: '/images/series_kp_bg.png',
      badgeBg: 'bg-[#F0E5FA] text-[#6B21A8]',
      btnColor: 'bg-[#6B21A8]',
      route: '/test-series',
    },
    {
      examBadge: 'SSC GD',
      testName: 'Practice Set 05',
      subject: 'Mathematics',
      completed: 10,
      total: 30,
      emblem: '/images/exams/emblem_series_ssc.png',
      bgImage: '/images/series_ssc_bg.png',
      badgeBg: 'bg-[#FFE5DA] text-[#EA580C]',
      btnColor: 'bg-[#EA580C]',
      route: '/practice',
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
    <div className="space-y-4 sm:space-y-5">
      {/* ========================================================= */}
      {/* 1. HERO BANNER (Aspect Ratio 438/200)                     */}
      {/* ========================================================= */}
      <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-[#E2ECF8] dark:border-slate-800 bg-[#D9EEFF] dark:bg-slate-900 group select-none">
        {banners.length > 0 && banners[currentSlide]?.imageUrl ? (
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
              }
            }}
          >
            <img
              src={banners[currentSlide].imageUrl}
              alt={banners[currentSlide].title || 'Hero Banner'}
              className="w-full h-full object-fill object-center"
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
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div
            onClick={() => navigate('/practice')}
            className="w-full aspect-[438/200] cursor-pointer relative"
          >
            <img
              src="/images/home_hero_banner.png"
              alt="Practice Smart - Get Closer to Your Dream Job"
              className="w-full h-full object-fill object-center"
              onError={(e) => {
                e.currentTarget.src = '/images/exam_hero_banner.png';
              }}
            />
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 2. 4 CORE PRACTICE ACTION CARDS                           */}
      {/* ========================================================= */}
      <section className="grid grid-cols-4 gap-2 sm:gap-3.5">
        {coreActions.map((card, idx) => (
          <Link
            key={idx}
            to={card.route}
            className={`relative aspect-[221/224] rounded-2xl sm:rounded-2xl overflow-hidden ${card.shadow} hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 group block`}
          >
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-full object-fill"
              onError={(e) => {
                // Fallback vector card
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Fallback decorative elements if image fails or transparent */}
            <div className="absolute inset-0 bg-gradient-to-br -z-10 from-blue-600 to-indigo-700" />
          </Link>
        ))}
      </section>

      {/* ========================================================= */}
      {/* 3. LIVE TEST CARD                                         */}
      {/* ========================================================= */}
      <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF4EE] to-[#F3F8FF] dark:from-slate-900 dark:to-slate-800 border border-[#E5ECF8] dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EF233C] text-white text-[10px] font-black uppercase tracking-wider mb-2">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>LIVE TEST</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0B1F5B] dark:text-white tracking-tight">
              {activeLiveTest?.title || 'WBP Constable Weekly Test'}
            </h3>
          </div>

          {/* Countdown Boxes */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <div className="w-9 h-11 bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-2xs">
              <span className="text-[13px] font-black text-[#0B1F5B] dark:text-white leading-tight">
                {countdownDays}
              </span>
              <span className="text-[8px] font-semibold text-slate-500">Days</span>
            </div>
            <div className="w-9 h-11 bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-2xs">
              <span className="text-[13px] font-black text-[#0B1F5B] dark:text-white leading-tight">
                {countdownHours}
              </span>
              <span className="text-[8px] font-semibold text-slate-500">Hours</span>
            </div>
            <div className="w-9 h-11 bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-2xs">
              <span className="text-[13px] font-black text-[#0B1F5B] dark:text-white leading-tight">
                {countdownMinutes}
              </span>
              <span className="text-[8px] font-semibold text-slate-500">Mins</span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5ECF8]/70 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-[#20366F] dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#20366F] dark:text-blue-400" />
              <span>Sat, 28 Sep • 10:00 AM</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{activeLiveTest?.totalQuestions || 100} Questions</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{activeLiveTest?.durationMinutes || 90} Minutes</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[#0877FF] font-bold">All India Rank</span>
          </div>

          <Link
            to="/test-series"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0877FF] hover:bg-[#0066FF] text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
          >
            <span>Join Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. POPULAR EXAMS                                          */}
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

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {popularExams.map((exam, idx) => (
            <Link
              key={idx}
              to={exam.route}
              className="relative aspect-[3/2] rounded-2xl overflow-hidden shadow-[0_4px_10px_rgba(11,31,91,0.10)] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 group block bg-slate-200 dark:bg-slate-800"
            >
              <img
                src={exam.image}
                alt={exam.title}
                className="w-full h-full object-fill"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Glossy overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-transparent pointer-events-none" />
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. POPULAR TEST SERIES                                    */}
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
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible">
          {popularSeries.map((series, idx) => (
            <Link
              key={idx}
              to={series.route}
              className="relative min-w-[240px] sm:min-w-0 p-4 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between overflow-hidden group"
            >
              {/* Background monument image */}
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <img
                  src={series.bgImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-10 flex items-start justify-between mb-3">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1.5 ${series.badgeBg}`}
                  >
                    {series.badge}
                  </span>
                  <h4 className="text-base font-black text-[#0B1F5B] dark:text-white leading-tight">
                    {series.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {series.subtitle}
                  </p>
                </div>
                <img
                  src={series.emblem}
                  alt=""
                  className="w-12 h-12 object-contain shrink-0"
                />
              </div>

              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <span className="text-xs font-bold text-[#0877FF] group-hover:underline">
                  Explore Series
                </span>
                <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-[#0877FF]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CONTINUE PRACTICING                                     */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00E676] to-[#00C853] flex items-center justify-center shadow-xs">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0B1F5B] dark:text-white tracking-tight">
              Continue Practice
            </h2>
          </div>
          <Link
            to="/practice"
            className="text-xs sm:text-sm font-bold text-[#0877FF] hover:underline flex items-center gap-1"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible">
          {continueItems.slice(0, 3).map((item, idx) => {
            const pct = Math.round((item.completed / item.total) * 100);
            return (
              <div
                key={idx}
                className="relative min-w-[250px] sm:min-w-0 p-4 rounded-2xl border border-white dark:border-slate-800 bg-[#F1F6FE] dark:bg-slate-900 shadow-sm flex flex-col justify-between overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-lg text-[9.5px] font-bold mb-1 ${item.badgeBg}`}
                    >
                      {item.examBadge}
                    </span>
                    <h4 className="text-sm font-black text-[#0B1F5B] dark:text-white truncate">
                      {item.testName}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      {item.subject}
                    </p>
                  </div>
                  <img
                    src={item.emblem}
                    alt=""
                    className="w-10 h-10 object-contain shrink-0"
                  />
                </div>

                <div className="space-y-1.5 my-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      {item.completed}/{item.total} questions
                    </span>
                    <span className="text-[#0877FF]">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#0877FF] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <Link
                  to={item.route}
                  className={`mt-1 w-full py-1.5 px-3 rounded-xl ${item.btnColor} text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all`}
                >
                  <span>Continue Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. TOP PERFORMERS                                         */}
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
            to="/results"
            className="text-xs sm:text-sm font-bold text-[#0877FF] hover:underline flex items-center gap-1"
          >
            <span>View Leaderboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {topPerformers.map((p) => (
            <div
              key={p.rank}
              className={`relative aspect-square rounded-2xl p-3 sm:p-4 bg-gradient-to-br ${p.bgGradient} dark:from-slate-900 dark:to-slate-800 border border-white dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center overflow-hidden`}
            >
              {/* Rosette Medal Badge in Top-Left */}
              <img
                src={p.badge}
                alt={`Rank ${p.rank}`}
                className="absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />

              {/* Avatar with Wreath */}
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
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black my-1 ${p.scoreBg}`}
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
      {/* 8. TODAY'S INFO & MOTIVATIONAL QUOTE                      */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Today's Info */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F1F6FE] dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 shadow-xs flex flex-col justify-between">
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
                <p className="text-[11px] text-slate-500 font-medium">
                  Learn something new everyday
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0066FF] text-[11px] font-bold border border-blue-100 dark:border-slate-700 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>01 Oct 2026</span>
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
        <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF6F8] to-[#FDECEF] dark:from-slate-900 dark:to-slate-800 border border-[#FCDCE8] dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden">
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
              Target Exam: 2026
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. BOTTOM PRO PASS BANNER                                  */}
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
                Get unlimited access to all exams, mock tests, PYQ, and statewide rankings.
              </p>
            </div>

            <Link
              to="/subscription"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#0158FC] text-xs font-black shadow-sm shrink-0 active:scale-95 transition-all"
            >
              <span>Get Pro Pass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Tour Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};
