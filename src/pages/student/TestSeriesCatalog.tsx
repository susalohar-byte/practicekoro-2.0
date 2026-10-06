import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  Filter,
  ChevronDown,
  Layers,
  FileText,
  FileCheck,
  RotateCcw,
  Lock,
  Crown,
} from 'lucide-react';
import type { TestSeries, Exam } from '@/types';

// Canonical fallback data when database is initializing or offline
const CANONICAL_SERIES_FALLBACK: TestSeries[] = [
  {
    id: 'wbp-constable',
    examId: 'wbp-constable',
    title: 'WBP Constable',
    slug: 'wbp-constable',
    description: 'Complete Test Series',
    examTitle: 'WBP Constable',
    isPremium: false,
    isPopular: true,
    fullMockCount: 12,
    topicTestCount: 48,
    pyqTestCount: 15,
    testCount: 75,
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'railway-ntpc',
    examId: 'railway-ntpc',
    title: 'Railway (NTPC)',
    slug: 'railway-ntpc',
    description: 'Complete Test Series',
    examTitle: 'Railway NTPC',
    isPremium: true,
    isPopular: true,
    fullMockCount: 15,
    topicTestCount: 60,
    pyqTestCount: 25,
    testCount: 100,
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'ssc-mts',
    examId: 'ssc-mts',
    title: 'SSC MTS',
    slug: 'ssc-mts',
    description: 'Complete Test Series',
    examTitle: 'SSC MTS',
    isPremium: true,
    isPopular: false,
    fullMockCount: 8,
    topicTestCount: 28,
    pyqTestCount: 10,
    testCount: 46,
    orderIndex: 3,
    isActive: true,
  },
  {
    id: 'wbssc-group-c',
    examId: 'wbssc-group-c',
    title: 'WBSSC Group C',
    slug: 'wbssc-group-c',
    description: 'Complete Test Series',
    examTitle: 'WBSSC Group C',
    isPremium: true,
    isPopular: false,
    fullMockCount: 10,
    topicTestCount: 32,
    pyqTestCount: 12,
    testCount: 54,
    orderIndex: 4,
    isActive: true,
  },
  {
    id: 'icds',
    examId: 'icds',
    title: 'ICDS',
    slug: 'icds',
    description: 'Complete Test Series',
    examTitle: 'ICDS Supervisor',
    isPremium: false,
    isPopular: false,
    fullMockCount: 8,
    topicTestCount: 20,
    pyqTestCount: 10,
    testCount: 38,
    orderIndex: 5,
    isActive: true,
  },
  {
    id: 'food-si',
    examId: 'food-si',
    title: 'Food SI',
    slug: 'food-si',
    description: 'Complete Test Series',
    examTitle: 'Food SI',
    isPremium: true,
    isPopular: false,
    fullMockCount: 10,
    topicTestCount: 32,
    pyqTestCount: 14,
    testCount: 56,
    orderIndex: 6,
    isActive: true,
  },
];

interface CardTheme {
  gradient: string;
  border: string;
  arrowBg: string;
  emblem: string;
  badge?: {
    text: string;
    bg: string;
    textColor: string;
    icon: string;
  };
}

function resolveCardTheme(title: string, examTitle?: string): CardTheme {
  const combined = `${title} ${examTitle || ''}`.toLowerCase();

  if (combined.includes('wbp') || combined.includes('police') || combined.includes('constable')) {
    return {
      gradient: 'from-[#EFF6FF] to-[#DBEAFE]',
      border: 'border-[#BFDBFE]',
      arrowBg: 'bg-[#1E293B]',
      emblem: '/images/exams/emblem_series_wbp.png',
      badge: {
        text: 'Most Popular',
        bg: 'bg-[#FFEDD5]',
        textColor: 'text-[#C2410C]',
        icon: '👑',
      },
    };
  }
  if (combined.includes('railway') || combined.includes('ntpc') || combined.includes('rrb')) {
    return {
      gradient: 'from-[#FFF1F2] to-[#FFE4E6]',
      border: 'border-[#FECDD3]',
      arrowBg: 'bg-[#E11D48]',
      emblem: '/images/exams/logo_railway.png',
      badge: {
        text: 'Trending Now',
        bg: 'bg-[#FFE4E6]',
        textColor: 'text-[#E11D48]',
        icon: '⚡',
      },
    };
  }
  if (combined.includes('ssc') || combined.includes('mts') || combined.includes('cgl')) {
    return {
      gradient: 'from-[#FEF9C3] to-[#FEF3C7]',
      border: 'border-[#FDE68A]',
      arrowBg: 'bg-[#1E293B]',
      emblem: '/images/exams/emblem_series_ssc.png',
    };
  }
  if (
    combined.includes('group c') ||
    combined.includes('group-c') ||
    combined.includes('group d') ||
    combined.includes('group-d') ||
    combined.includes('wbssc')
  ) {
    return {
      gradient: 'from-[#ECFDF5] to-[#D1FAE5]',
      border: 'border-[#A7F3D0]',
      arrowBg: 'bg-[#10B981]',
      emblem: '/images/exams/emblem_wbssc.png',
    };
  }
  if (combined.includes('icds') || combined.includes('anganwadi')) {
    return {
      gradient: 'from-[#FDF2F8] to-[#FCE7F3]',
      border: 'border-[#FBCFE8]',
      arrowBg: 'bg-[#EC4899]',
      emblem: '/images/exams/emblem_tet.png',
    };
  }
  if (combined.includes('food') || combined.includes('si') || combined.includes('psc') || combined.includes('wbpsc')) {
    return {
      gradient: 'from-[#F5F3FF] to-[#EDE9FE]',
      border: 'border-[#DDD6FE]',
      arrowBg: 'bg-[#7C3AED]',
      emblem: '/images/exams/emblem_wbpsc.png',
    };
  }

  return {
    gradient: 'from-[#F0FDF4] to-[#DCFCE7]',
    border: 'border-[#BBF7D0]',
    arrowBg: 'bg-[#026BFC]',
    emblem: '/images/exams/emblem_series_wbp.png',
  };
}

export const TestSeriesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPro, isAdmin } = useAuth();

  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [examsList, setExamsList] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'Most Popular' | 'Newest' | 'Most Tests' | 'A–Z'>('Most Popular');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Read initial exam filter from URL query
  const examParam = searchParams.get('exam') || '';
  const [selectedExamSlug, setSelectedExamSlug] = useState<string>(examParam);

  useEffect(() => {
    if (examParam !== selectedExamSlug) {
      setSelectedExamSlug(examParam);
    }
  }, [examParam]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [seriesData, examsData] = await Promise.all([
        api.getStudentTestSeries().catch(() => []),
        api.getExams().catch(() => []),
      ]);

      if (seriesData && seriesData.length > 0) {
        setSeriesList(seriesData);
      } else {
        setSeriesList(CANONICAL_SERIES_FALLBACK);
      }

      if (examsData && examsData.length > 0) {
        setExamsList(
          examsData.map((e: Exam) => ({
            id: e.id,
            title: e.title,
            slug: e.slug || e.id,
          }))
        );
      } else {
        setExamsList([
          { id: 'wbp-constable', title: 'WBP Constable', slug: 'wbp-constable' },
          { id: 'railway-ntpc', title: 'Railway (NTPC)', slug: 'railway-ntpc' },
          { id: 'ssc-mts', title: 'SSC MTS', slug: 'ssc-mts' },
          { id: 'wbssc-group-c', title: 'WBSSC Group C', slug: 'wbssc-group-c' },
          { id: 'wbssc-group-d', title: 'WBSSC Group D', slug: 'wbssc-group-d' },
          { id: 'icds', title: 'ICDS', slug: 'icds' },
          { id: 'food-si', title: 'Food SI', slug: 'food-si' },
        ]);
      }
    } catch (err: any) {
      console.error('Failed to load test series catalog:', err);
      setSeriesList(CANONICAL_SERIES_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = api.subscribeToStudentCatalogUpdates(loadData);
    return () => unsubscribe();
  }, []);

  // Filter series based on selected exam and search query
  const filteredList = useMemo(() => {
    return seriesList.filter((series) => {
      // 1. Exam filter
      if (selectedExamSlug) {
        const slug = selectedExamSlug.toLowerCase().replace(/_/g, '-').trim();
        const sId = (series.id || '').toLowerCase();
        const sSlug = (series.slug || '').toLowerCase();
        const sExamId = (series.examId || '').toLowerCase();
        const title = (series.title || '').toLowerCase();
        const examTitle = (series.examTitle || '').toLowerCase();

        let matchesExam = sId === slug || sSlug === slug || sExamId === slug;
        if (!matchesExam) {
          if (slug.includes('wbp') && (sId.includes('wbp') || title.includes('wbp') || examTitle.includes('wbp') || title.includes('police'))) matchesExam = true;
          if (slug.includes('ssc') && (sId.includes('ssc') || title.includes('ssc') || examTitle.includes('ssc'))) matchesExam = true;
          if ((slug.includes('railway') || slug.includes('ntpc')) && (sId.includes('railway') || sId.includes('ntpc') || title.includes('railway') || title.includes('ntpc'))) matchesExam = true;
          if (slug.includes('icds') && (sId.includes('icds') || title.includes('icds') || examTitle.includes('icds'))) matchesExam = true;
          if (slug.includes('food') && (sId.includes('food') || title.includes('food') || examTitle.includes('food'))) matchesExam = true;
        }
        if (!matchesExam) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const title = (series.title || '').toLowerCase();
        const desc = (series.description || '').toLowerCase();
        const exam = (series.examTitle || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || exam.includes(q);
      }

      return true;
    });
  }, [seriesList, selectedExamSlug, searchQuery]);

  // Sort series
  const sortedList = useMemo(() => {
    const list = [...filteredList];
    if (selectedSort === 'Most Popular') {
      list.sort((a, b) => {
        const aPop = a.isPopular ? 1 : 0;
        const bPop = b.isPopular ? 1 : 0;
        if (aPop !== bPop) return bPop - aPop;
        const aCount = (a.fullMockCount ?? 12) + (a.topicTestCount ?? 48) + (a.pyqTestCount ?? 15);
        const bCount = (b.fullMockCount ?? 12) + (b.topicTestCount ?? 48) + (b.pyqTestCount ?? 15);
        return bCount - aCount;
      });
    } else if (selectedSort === 'Newest') {
      list.sort((a, b) => (b.orderIndex ?? 0) - (a.orderIndex ?? 0));
    } else if (selectedSort === 'Most Tests') {
      list.sort((a, b) => {
        const aCount = (a.fullMockCount ?? 12) + (a.topicTestCount ?? 48) + (a.pyqTestCount ?? 15);
        const bCount = (b.fullMockCount ?? 12) + (b.topicTestCount ?? 48) + (b.pyqTestCount ?? 15);
        return bCount - aCount;
      });
    } else if (selectedSort === 'A–Z') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [filteredList, selectedSort]);

  const handleCardClick = (series: TestSeries) => {
    const isPaid = series.isPremium;
    if (isPaid && !isPro && !isAdmin) {
      // User does not have active subscription for paid series -> show paywall
      navigate('/subscription');
    } else {
      // Allowed access -> open Test Series detail directly
      navigate(`/test-series/${series.id}`);
    }
  };

  const handleSelectExam = (slug: string, title?: string) => {
    setSelectedExamSlug(slug);
    setIsFilterDropdownOpen(false);
    if (slug) {
      setSearchParams({ exam: slug, ...(title ? { title } : {}) });
    } else {
      setSearchParams({});
    }
  };

  const selectedExamTitle = useMemo(() => {
    if (!selectedExamSlug) return 'All Exams';
    const found = examsList.find((e) => e.slug === selectedExamSlug || e.id === selectedExamSlug);
    return found ? found.title : selectedExamSlug.replace(/-/g, ' ');
  }, [selectedExamSlug, examsList]);

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-4 py-3 sm:py-5 space-y-4 sm:space-y-5">
      {/* ── 1. TOP NAVIGATION ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Centered Title with Gen-Z Sparkles & Subtitle */}
        <div className="text-center flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5">
            <span className="text-sm">✨</span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B132B] dark:text-white tracking-tight">
              Test Series
            </h1>
            <span className="text-sm">✨</span>
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
            Practice Today, Be Exam Ready !
          </p>
        </div>

        {/* Search Icon Trigger */}
        <button
          onClick={() => searchInputRef.current?.focus()}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer shrink-0"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* ── 2. SEARCH + ALL EXAMS FILTER CONTROL ── */}
      <div className="flex items-center gap-2.5">
        {/* Search Input Field */}
        <div className="relative flex-1 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-3.5 py-2 sm:py-2.5 shadow-2xs focus-within:border-[#026BFC] transition-colors">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test series..."
            className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* "All Exams ⌄" Dropdown Control */}
        <div className="relative" ref={filterDropdownRef}>
          <button
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
            className={`h-10 sm:h-11 px-3 sm:px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              selectedExamSlug
                ? 'bg-[#EFF6FF] border-[#026BFC] text-[#026BFC] dark:bg-blue-950/60'
                : 'bg-[#F1F5F9] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="max-w-[85px] sm:max-w-[130px] truncate">{selectedExamTitle}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Dropdown Menu */}
          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">Filter by Exam</span>
                {selectedExamSlug && (
                  <button
                    onClick={() => handleSelectExam('')}
                    className="text-[11px] font-bold text-[#026BFC] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                <button
                  onClick={() => handleSelectExam('')}
                  className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    !selectedExamSlug ? 'text-[#026BFC] bg-blue-50/60 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>All Exams</span>
                  {!selectedExamSlug && <span className="text-[#026BFC]">✓</span>}
                </button>

                {examsList.map((exam) => {
                  const isSelected = selectedExamSlug === exam.slug || selectedExamSlug === exam.id;
                  return (
                    <button
                      key={exam.id}
                      onClick={() => handleSelectExam(exam.slug, exam.title)}
                      className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                        isSelected ? 'text-[#026BFC] bg-blue-50/60 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{exam.title}</span>
                      {isSelected && <span className="text-[#026BFC]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. GEN-Z MOTIVATIONAL HERO BANNER ── */}
      <section className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-2xs">
        <img
          src="/images/exams/test_series_hero_banner.png"
          alt="Small Tests Big Results - Practice • Analyze • Improve"
          className="w-full h-auto object-cover block"
          onError={(e) => {
            // High quality fallback container if image asset fails to load
            const target = e.currentTarget;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = `
                <div class="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-slate-900 flex items-center justify-between">
                  <div>
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">Small 👑 Tests Big Results</h2>
                    <p class="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">✦ Practice • Analyze • Improve</p>
                    <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">Your Dream Government Job is Closer!</p>
                  </div>
                  <div class="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-amber-500 font-bold text-xl">
                    📚
                  </div>
                </div>
              `;
            }
          }}
        />
      </section>

      {/* ── 4. TEST SERIES HEADER & WORKING SORT ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Dynamic Count */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl sm:text-2xl font-black text-[#026BFC] tracking-tight">
            {sortedList.length}
          </span>
          <span className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white tracking-tight">
            Test Series
          </span>
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortDropdownOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <span className="text-slate-400">⇅</span>
            <span>{selectedSort}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
              {(['Most Popular', 'Newest', 'Most Tests', 'A–Z'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSelectedSort(opt);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    selectedSort === opt ? 'text-[#026BFC] bg-blue-50/60 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{opt}</span>
                  {selectedSort === opt && <span className="text-[#026BFC]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. RESPONSIVE 2-COLUMN GRID (MOBILE) / 3-4 COLUMNS (DESKTOP) ── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
              <div className="flex items-center justify-between pt-1">
                <div className="w-12 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedList.length === 0 ? (
        <div className="py-12 sm:py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">No test series found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            Try another exam or search term.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedExamSlug('');
              setSearchParams({});
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#026BFC] hover:bg-[#0256CA] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {sortedList.map((series) => {
            const theme = resolveCardTheme(series.title, series.examTitle);
            const isPaid = series.isPremium;
            const fullMocks = series.fullMockCount ?? 12;
            const topicTests = series.topicTestCount ?? 48;
            const pyqs = series.pyqTestCount ?? 15;

            return (
              <div
                key={series.id}
                onClick={() => handleCardClick(series)}
                className={`p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br ${theme.gradient} dark:from-slate-900 dark:to-slate-850 border ${theme.border} dark:border-slate-800 shadow-2xs hover:-translate-y-1 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between group active:scale-[0.98] select-none`}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    {/* Badge */}
                    {theme.badge ? (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-black ${theme.badge.bg} ${theme.badge.textColor}`}
                      >
                        <span>{theme.badge.icon}</span>
                        <span>{theme.badge.text}</span>
                      </span>
                    ) : (
                      <span />
                    )}

                    {/* Emblem */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/80 dark:bg-slate-800/80 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img
                        src={theme.emblem}
                        alt={series.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/logo-icon.png';
                        }}
                      />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-1.5 sm:mt-2 truncate tracking-tight group-hover:text-[#026BFC] transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {series.description || 'Complete Test Series'}
                  </p>
                </div>

                {/* Middle: 3 Statistics Columns */}
                <div className="mt-2.5 p-1.5 sm:p-2 rounded-xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 flex items-center justify-between text-center">
                  {/* Full Mocks */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="w-3 h-3 text-[#026BFC] shrink-0" />
                      <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-none">
                        {fullMocks}
                      </span>
                    </div>
                    <span className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                      Full Mocks
                    </span>
                  </div>

                  <div className="w-px h-5 bg-slate-300/60 dark:bg-slate-700/60" />

                  {/* Topic Tests */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-center gap-1">
                      <Layers className="w-3 h-3 text-[#10B981] shrink-0" />
                      <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-none">
                        {topicTests}
                      </span>
                    </div>
                    <span className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                      Topic Tests
                    </span>
                  </div>

                  <div className="w-px h-5 bg-slate-300/60 dark:bg-slate-700/60" />

                  {/* Official PYQs */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-center gap-1">
                      <FileCheck className="w-3 h-3 text-[#8B5CF6] shrink-0" />
                      <span className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-none">
                        {pyqs}
                      </span>
                    </div>
                    <span className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
                      Official PYQs
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Status Badge (Free/Paid ONLY) + Arrow Action Button */}
                <div className="mt-2.5 pt-1.5 flex items-center justify-between">
                  {/* Status Badge: ONLY Free or Paid */}
                  {!isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-[#D1FAE5] text-[#059669] border border-emerald-200">
                      <Crown className="w-2.5 h-2.5" />
                      <span>Free</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black bg-[#FEF3C7] text-[#D97706] border border-amber-200">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Paid</span>
                    </span>
                  )}

                  {/* Circular Arrow Button */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${theme.arrowBg} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
