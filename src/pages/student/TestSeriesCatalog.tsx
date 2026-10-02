import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Search,
  ArrowRight,
  X,
  FileText,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { TestSeries } from '@/types';

const FILTERS = [
  'All Exams',
  'State Exams',
  'Central Exams',
  'Teaching',
  'Railway',
  'Police',
];

// Emblem and gradient mapping based on series data
function getSeriesVisuals(series: TestSeries): {
  emblem: string;
  gradient: string;
  category: string;
  fullMocks: number;
  topicTests: number;
  pyqs: number;
} {
  const title = (series.title || '').toLowerCase();
  const exam = (series.examTitle || '').toLowerCase();
  const cat = (series.examCategory || '').toLowerCase();
  const combined = `${title} ${exam} ${cat}`;

  const total = series.testsCount ?? series.testCount ?? 20;
  const fullMocks = Math.max(5, Math.round(total * 0.5));
  const topicTests = Math.max(3, Math.round(total * 0.3));
  const pyqs = Math.max(2, total - fullMocks - topicTests);

  if (combined.includes('wbp') || combined.includes('police') || combined.includes('constable')) {
    if (combined.includes('kp') || combined.includes('kolkata')) {
      return {
        emblem: '/images/exams/emblem_series_kp.png',
        gradient: 'from-[#EDE9FE] to-[#DDD6FE]',
        category: 'Police',
        fullMocks,
        topicTests,
        pyqs,
      };
    }
    return {
      emblem: '/images/exams/emblem_series_wbp.png',
      gradient: 'from-[#FFF7E6] to-[#FDE8C4]',
      category: 'Police',
      fullMocks,
      topicTests,
      pyqs,
    };
  }
  if (combined.includes('ssc') || combined.includes('cgl') || combined.includes('gd')) {
    return {
      emblem: '/images/exams/emblem_series_ssc.png',
      gradient: 'from-[#FEE2E2] to-[#FECACA]',
      category: 'Central Exams',
      fullMocks,
      topicTests,
      pyqs,
    };
  }
  if (combined.includes('rail') || combined.includes('ntpc') || combined.includes('group d')) {
    return {
      emblem: '/images/exams/emblem_railway.png',
      gradient: 'from-[#EFF6FF] to-[#DBEAFE]',
      category: 'Railway',
      fullMocks,
      topicTests,
      pyqs,
    };
  }
  if (combined.includes('tet') || combined.includes('teach') || combined.includes('primary')) {
    return {
      emblem: '/images/exams/emblem_tet.png',
      gradient: 'from-[#FEF3C7] to-[#FDE68A]',
      category: 'Teaching',
      fullMocks,
      topicTests,
      pyqs,
    };
  }
  if (combined.includes('wbssc') || combined.includes('slst')) {
    return {
      emblem: '/images/exams/emblem_wbssc.png',
      gradient: 'from-[#ECFDF5] to-[#D1FAE5]',
      category: 'State Exams',
      fullMocks,
      topicTests,
      pyqs,
    };
  }

  return {
    emblem: series.iconUrl || '/images/exams/emblem_wbp.png',
    gradient: 'from-[#EFF6FF] to-[#DBEAFE]',
    category: 'State Exams',
    fullMocks,
    topicTests,
    pyqs,
  };
}

export const TestSeriesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<'Popular' | 'Most Tests' | 'A-Z'>('Popular');

  useEffect(() => {
    let mounted = true;
    async function loadTestSeries() {
      try {
        setLoading(true);
        const data = await api.getStudentTestSeries();
        if (mounted) {
          setSeriesList(data);
        }
      } catch (err) {
        console.error('Failed to load test series:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadTestSeries();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedFilter = FILTERS[selectedFilterIndex];

  // Filter series based on category pill and search query
  const filteredList = useMemo(() => {
    return seriesList.filter((series) => {
      const { category } = getSeriesVisuals(series);
      const matchesCategory =
        selectedFilterIndex === 0 ||
        (selectedFilter === 'State Exams' &&
          (category === 'State Exams' || category === 'Teaching')) ||
        (selectedFilter === 'Central Exams' && category === 'Central Exams') ||
        (selectedFilter === 'Railway' && category === 'Railway') ||
        (selectedFilter === 'Police' && category === 'Police') ||
        (selectedFilter === 'Teaching' && category === 'Teaching');

      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === '' ||
        series.title.toLowerCase().includes(query) ||
        (series.examTitle || '').toLowerCase().includes(query) ||
        (series.description || '').toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [seriesList, selectedFilterIndex, selectedFilter, searchQuery]);

  // Sort list
  const sortedList = useMemo(() => {
    const list = [...filteredList];
    if (selectedSort === 'Most Tests') {
      list.sort(
        (a, b) => (b.testsCount ?? b.testCount ?? 0) - (a.testsCount ?? a.testCount ?? 0)
      );
    } else if (selectedSort === 'A-Z') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [filteredList, selectedSort]);

  // 3 Popular Test Series for the top carousel
  const popularSeries = [
    {
      id: 'wbp_constable_2026',
      title: 'WBP Constable',
      subtitle: 'Test Series 2026',
      badge: '🔥 Bestseller',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_wbp_bg.png',
      emblem: '/images/exams/emblem_series_wbp.png',
    },
    {
      id: 'kp_constable_2026',
      title: 'KP Constable',
      subtitle: 'Test Series 2026',
      badge: '⭐ Most Popular',
      badgeBg: 'bg-[#FEF3C7] text-[#B45309]',
      bgImage: '/images/series_kp_bg.png',
      emblem: '/images/exams/emblem_series_kp.png',
    },
    {
      id: 'ssc_gd_2026',
      title: 'SSC GD',
      subtitle: 'Test Series 2026',
      badge: '🔥 Bestseller',
      badgeBg: 'bg-[#FFEDD5] text-[#C2410C]',
      bgImage: '/images/series_ssc_bg.png',
      emblem: '/images/exams/emblem_series_ssc.png',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── 1. PAGE HEADER (TITLE, SUBTITLE & CATEGORY PILLS) ── */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-black text-[#07194A] dark:text-white tracking-tight leading-tight">
          Test Series
        </h1>
        <p className="text-xs sm:text-[13px] text-[#52648A] dark:text-slate-400 font-medium mt-1">
          Choose the right test series and boost your preparation
        </p>

        {/* Category Filter Pills (App-style horizontal scroll) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-3.5 scrollbar-none">
          {FILTERS.map((filter, idx) => {
            const isSelected = selectedFilterIndex === idx;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilterIndex(idx)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0066FF] text-white shadow-sm shadow-blue-500/25'
                    : 'bg-white dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#0066FF]/40'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. SEARCH & FILTER SECTION (App PKSearchFilterBar) ── */}
      <div className="space-y-2">
        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-800 rounded-2xl shadow-2xs px-3.5 py-2.5">
          <Search className="w-4 h-4 text-[#0066FF] shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test series (e.g. WBP, SSC, TET...)"
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search feedback pill */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-[#0066FF] font-bold">
              <span>Results for "{searchQuery}"</span>
              <span className="text-[#07194A] dark:text-white">({filteredList.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ── 3. POPULAR TEST SERIES CAROUSEL ── */}
      {selectedFilterIndex === 0 && !searchQuery.trim() && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h2 className="text-base sm:text-lg font-black text-[#07194A] dark:text-white tracking-tight">
                Popular Test Series
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                document.getElementById('all-test-series')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              <span>See All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible">
            {popularSeries.map((series, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const match = seriesList.find((s) =>
                    s.title.toLowerCase().includes(series.title.toLowerCase())
                  );
                  if (match) {
                    navigate(`/test-series/${match.slug || match.id}`);
                  }
                }}
                className="relative min-w-[240px] sm:min-w-0 p-4 rounded-2xl border border-white/60 dark:border-slate-800 bg-white/80 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col justify-between overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                  <img src={series.bgImage} alt="" className="w-full h-full object-cover" />
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
                  <img src={series.emblem} alt="" className="w-12 h-12 object-contain shrink-0" />
                </div>

                <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <span className="text-xs font-bold text-[#0066FF] group-hover:underline">
                    Explore Series
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-[#0066FF]">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. ALL TEST SERIES LIST (App TestSeriesCard) ── */}
      <section id="all-test-series" className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-[#07194A] dark:text-white tracking-tight">
              All Test Series
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0066FF] text-xs font-bold">
              {sortedList.length}
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="bg-transparent text-[#0066FF] font-bold outline-none cursor-pointer"
            >
              <option value="Popular">Popular</option>
              <option value="Most Tests">Most Tests</option>
              <option value="A-Z">A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-[#E8EEF7] dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : sortedList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              No test series found matching your criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedFilterIndex(0);
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-1.5 rounded-full bg-[#0066FF] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {sortedList.map((series) => {
              const { emblem, gradient, fullMocks, topicTests, pyqs } = getSeriesVisuals(series);
              return (
                <div
                  key={series.id}
                  onClick={() => navigate(`/test-series/${series.slug || series.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8EEF7] dark:border-slate-800 p-3.5 sm:p-4 shadow-[0_3px_10px_rgba(7,25,74,0.035)] hover:shadow-lg hover:-translate-y-0.5 hover:border-[#0066FF]/50 transition-all duration-200 cursor-pointer flex items-center gap-3 sm:gap-4 group"
                >
                  {/* Square Exam Emblem Icon with soft gradient (66px) */}
                  <div
                    className={`w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-xl bg-gradient-to-br ${gradient} p-2 flex items-center justify-center shrink-0 border border-white dark:border-slate-700 shadow-2xs`}
                  >
                    <img
                      src={emblem}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/logo-icon.png';
                      }}
                    />
                  </div>

                  {/* Content Column */}
                  <div className="min-w-0 flex-1">
                    {/* Top Row: Title + Full Syllabus Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-[15px] font-extrabold text-[#07194A] dark:text-white truncate group-hover:text-[#0066FF] transition-colors">
                        {series.title}
                      </h3>
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-[#0066FF] text-[10px] font-bold">
                        Full Syllabus
                      </span>
                    </div>

                    {/* Subtitle */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {series.description || 'Latest pattern • Chapter-wise & full length mock tests'}
                    </p>

                    {/* Bottom Row: 3 Stat Chips + View Button */}
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EEF5FF] dark:bg-blue-950/40 text-[#0066FF] dark:text-blue-400 text-[10.5px] font-bold shrink-0">
                          <FileText className="w-3 h-3" />
                          <span>{fullMocks} Full Mock</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EDF8F2] dark:bg-emerald-950/40 text-[#10B981] dark:text-emerald-400 text-[10.5px] font-bold shrink-0">
                          <BookOpen className="w-3 h-3" />
                          <span>{topicTests} Topic</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FFF7ED] dark:bg-amber-950/40 text-[#F59E0B] dark:text-amber-400 text-[10.5px] font-bold shrink-0">
                          <HelpCircle className="w-3 h-3" />
                          <span>{pyqs} PYQ</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/test-series/${series.slug || series.id}`);
                        }}
                        className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EFF6FF] dark:bg-slate-800 text-[#0066FF] hover:bg-[#0066FF] hover:text-white dark:hover:bg-[#0066FF] dark:hover:text-white text-xs font-bold transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
