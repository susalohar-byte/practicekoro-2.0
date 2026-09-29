import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  Layers,
  Search,
  CheckCircle2,
  Crown,
  Sparkles,
  ArrowRight,
  Award,
  BookOpen,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  FileText,
} from 'lucide-react';
import type { TestSeries } from '@/types';

// Category filter tabs
const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'police', label: 'WBP', icon: Shield },
  { id: 'kp', label: 'KP', icon: Award },
  { id: 'ssc', label: 'SSC', icon: Zap },
  { id: 'railways', label: 'Railway', icon: TrendingUp },
  { id: 'other', label: 'Other', icon: BookOpen },
];

type AccessFilter = 'all' | 'free' | 'pro';

// Emblem mapping based on exam title or category
function getSeriesEmblem(series: TestSeries): { emblem: string; bgColor: string } {
  if (series.iconUrl) {
    return {
      emblem: series.iconUrl,
      bgColor: 'bg-[#FFF4F0] dark:bg-slate-800/80 border-[#FDE2D7] dark:border-slate-700/60',
    };
  }

  const title = (series.title || '').toLowerCase();
  const exam = (series.examTitle || '').toLowerCase();
  const combined = `${title} ${exam}`;

  if (combined.includes('wbp') || combined.includes('constable') || combined.includes('police')) {
    if (combined.includes('kolkata') || combined.includes('kp')) {
      return { emblem: '/images/exams/icon_kolkata_police.png', bgColor: 'bg-[#EFF6FF] dark:bg-blue-950/40 border-[#DBEAFE] dark:border-blue-900/60' };
    }
    return { emblem: '/images/exams/emblem_wbp.png', bgColor: 'bg-[#FFF4F0] dark:bg-slate-800/80 border-[#FDE2D7] dark:border-slate-700/60' };
  }
  if (combined.includes('wbcs')) {
    return { emblem: '/images/exams/wbcs_emblem.png', bgColor: 'bg-[#EEF2FF] dark:bg-indigo-950/40 border-[#E0E7FF] dark:border-indigo-900/60' };
  }
  if (combined.includes('clerk') || combined.includes('wbpsc') || combined.includes('misc')) {
    return { emblem: '/images/exams/emblem_wbpsc.png', bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/40 border-[#FEF3C7] dark:border-amber-900/60' };
  }
  if (combined.includes('slst') || combined.includes('wbssc') || combined.includes('group d')) {
    return { emblem: '/images/exams/emblem_wbssc.png', bgColor: 'bg-[#ECFDF5] dark:bg-emerald-950/40 border-[#D1FAE5] dark:border-emerald-900/60' };
  }
  if (combined.includes('tet') || combined.includes('teach')) {
    return { emblem: '/images/exams/emblem_tet.png', bgColor: 'bg-[#FAF5FF] dark:bg-purple-950/40 border-[#F3E8FF] dark:border-purple-900/60' };
  }
  if (combined.includes('rail') || combined.includes('ntpc') || combined.includes('rrb')) {
    return { emblem: '/images/exams/emblem_railway.png', bgColor: 'bg-[#F0F9FF] dark:bg-sky-950/40 border-[#E0F2FE] dark:border-sky-900/60' };
  }
  if (combined.includes('ssc') || combined.includes('cgl') || combined.includes('gd') || combined.includes('mts')) {
    return { emblem: '/images/exams/emblem_ssc.png', bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/40 border-[#FEF3C7] dark:border-amber-900/60' };
  }

  return { emblem: '/images/exams/emblem_wbp.png', bgColor: 'bg-[#FFF4F0] dark:bg-slate-800/80 border-[#FDE2D7] dark:border-slate-700/60' };
}

export const TestSeriesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { isPro } = useAuth();

  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');

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

  // Filter series based on search, category tab, and access level
  const filteredSeries = useMemo(() => {
    return seriesList.filter((series) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = series.title.toLowerCase().includes(query);
        const matchesExam = (series.examTitle || '').toLowerCase().includes(query);
        const matchesDesc = (series.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesExam && !matchesDesc) return false;
      }

      // Access filter (Free vs Pro Pass)
      if (accessFilter === 'free' && series.isPremium) return false;
      if (accessFilter === 'pro' && !series.isPremium) return false;

      // Category filter
      if (activeCategory !== 'all') {
        const title = (series.title || '').toLowerCase();
        const exam = (series.examTitle || '').toLowerCase();
        const cat = (series.examCategory || '').toLowerCase();
        const combined = `${title} ${exam} ${cat}`;

        if (activeCategory === 'police' && !(combined.includes('police') || combined.includes('wbp') || combined.includes('kp') || combined.includes('constable') || combined.includes('si'))) {
          return false;
        }
        if (activeCategory === 'wbpsc' && !(combined.includes('wbpsc') || combined.includes('wbcs') || combined.includes('clerk') || combined.includes('misc'))) {
          return false;
        }
        if (activeCategory === 'teaching' && !(combined.includes('tet') || combined.includes('slst') || combined.includes('teach') || combined.includes('primary'))) {
          return false;
        }
        if (activeCategory === 'ssc' && !(combined.includes('ssc') || combined.includes('cgl') || combined.includes('gd') || combined.includes('mts') || combined.includes('chsl') || combined.includes('central'))) {
          return false;
        }
        if (activeCategory === 'railways' && !(combined.includes('rail') || combined.includes('ntpc') || combined.includes('rrb') || combined.includes('group d') || combined.includes('alp'))) {
          return false;
        }
      }

      return true;
    });
  }, [seriesList, searchTerm, activeCategory, accessFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const totalSeries = seriesList.length;
    const totalTests = seriesList.reduce((acc, s) => acc + (s.testsCount || s.testCount || 0), 0);
    const freeSeries = seriesList.filter((s) => !s.isPremium).length;
    return { totalSeries, totalTests, freeSeries };
  }, [seriesList]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-24 font-sans transition-colors">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* ── 0. BREADCRUMBS ── */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Home
          </Link>
          <span className="text-slate-300 dark:text-slate-600">&gt;</span>
          <span className="text-slate-800 dark:text-slate-100 font-bold">Test Series</span>
        </div>

        {/* ── 1. HERO BANNER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0158FC] via-[#0b48c2] to-[#1e1b4b] text-white p-6 sm:p-8 lg:p-10 shadow-xl shadow-blue-500/10">
          {/* Subtle decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-100 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>OFFICIAL SYLLABUS SIMULATION 2026</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Test Series for <span className="text-amber-300">Bengal Govt.</span> & Central Exams
            </h1>

            <p className="text-sm sm:text-base text-blue-100/90 font-medium leading-relaxed max-w-2xl">
              All-in-one curated mock packages with Full Mocks, Chapter Drills, and Official PYQs.
              Detailed step-by-step solutions and instant All-Bengal rank prediction.
            </p>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-md">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
                <p className="text-xl sm:text-2xl font-black text-white">{stats.totalSeries}</p>
                <p className="text-[11px] font-bold text-blue-200 mt-0.5 uppercase tracking-wider">Test Series</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
                <p className="text-xl sm:text-2xl font-black text-amber-300">{stats.totalTests}+</p>
                <p className="text-[11px] font-bold text-blue-200 mt-0.5 uppercase tracking-wider">Mock Tests</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center">
                <p className="text-xl sm:text-2xl font-black text-emerald-300">{stats.freeSeries}</p>
                <p className="text-[11px] font-bold text-blue-200 mt-0.5 uppercase tracking-wider">Free Mocks</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. SEARCH & FILTER CONTROLS ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search test series by exam name, paper, or keyword (e.g. WBP, Clerkship, TET)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0158FC] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Access Filter Toggle (All, Free, Pro) */}
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto text-xs font-bold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setAccessFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  accessFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All Series
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter('free')}
                className={`px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 ${
                  accessFilter === 'free'
                    ? 'bg-emerald-500 text-white shadow-xs font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Free Tests
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter('pro')}
                className={`px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 ${
                  accessFilter === 'pro'
                    ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Crown className="w-3 h-3" />
                Pro Pass
              </button>
            </div>
          </div>

          {/* Exam Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? 'bg-[#0158FC] text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. TEST SERIES GRID ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 animate-pulse shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0158FC] dark:text-blue-400 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                No Test Series Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {searchTerm
                  ? `No test series matched your search for "${searchTerm}". Try another keyword or reset filters.`
                  : 'No test series match the selected filter category. Please check other categories.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
                setAccessFilter('all');
              }}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredSeries.map((series) => {
              const { emblem, bgColor } = getSeriesEmblem(series);
              const totalTests = series.testsCount ?? series.testCount ?? 0;
              const fullMocks = series.fullMockCount ?? 0;
              const topicTests = series.topicTestCount ?? 0;
              const pyqs = series.pyqTestCount ?? 0;
              const isLocked = series.isPremium && !isPro;

              return (
                <div
                  key={series.id}
                  onClick={() => navigate(`/test-series/${series.slug || series.id}`)}
                  className="group cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-850 rounded-[28px] border border-slate-200/90 dark:border-slate-800 hover:border-blue-400/60 dark:hover:border-blue-600/60 p-6 sm:p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(1,88,252,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Top Row: Emblem + Access Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl ${bgColor} p-2.5 flex items-center justify-center border shadow-2xs shrink-0 group-hover:scale-105 transition-transform duration-200`}
                      >
                        <img
                          src={emblem}
                          alt={series.title}
                          className="w-full h-full object-contain drop-shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo-icon.png';
                          }}
                        />
                      </div>

                      {series.isPremium ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 font-black text-xs uppercase tracking-wider shrink-0 shadow-2xs">
                          <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>PRO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/25 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase tracking-wider shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>FREE</span>
                        </span>
                      )}
                    </div>

                    {/* Series Title (Small redundant label removed) */}
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors mt-3.5 line-clamp-2">
                      {series.title}
                    </h3>

                    {/* Description preview */}
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed mt-1.5 line-clamp-2">
                      {series.description || 'Official pattern 85-question full mocks and chapter drills.'}
                    </p>

                    {/* Categorized Test Breakdown Chips (Simplified 3-column dock) */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 sm:p-3.5 border border-slate-100 dark:border-slate-800/80 my-4">
                      <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-700/80 text-center">
                        <div className="px-1">
                          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                            {fullMocks}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                            Full Mocks
                          </p>
                        </div>
                        <div className="px-1">
                          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                            {topicTests}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                            Topic Drills
                          </p>
                        </div>
                        <div className="px-1">
                          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                            {pyqs}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                            Official PYQ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Feature highlights (Single tidy line) */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5 pb-1">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Exam Pattern
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        Instant AIR
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        Live Timer
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom / CTA */}
                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0158FC] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block leading-tight">
                          {totalTests} {totalTests === 1 ? 'Test' : 'Tests'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Full Package
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0158FC] hover:bg-[#0047cc] active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 group-hover:translate-x-0.5 transition-all cursor-pointer"
                    >
                      <span>{isLocked ? 'View Series' : 'Explore Series'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
