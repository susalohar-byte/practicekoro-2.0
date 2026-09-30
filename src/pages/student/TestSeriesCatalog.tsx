import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { StudentNavbar } from '@/components/layout/StudentNavbar';
import { api } from '@/services/api';
import {
  Layers,
  Search,
  ArrowRight,
  Award,
  BookOpen,
  Shield,
  Zap,
  TrendingUp,
  FileText,
  Sparkles,
  CheckCircle2,
  Crown,
  X,
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
      bgColor: 'bg-[#EFF6FF] dark:bg-slate-800/80 border-blue-200/70 dark:border-slate-700/60',
    };
  }

  const title = (series.title || '').toLowerCase();
  const exam = (series.examTitle || '').toLowerCase();
  const combined = `${title} ${exam}`;

  if (combined.includes('wbp') || combined.includes('constable') || combined.includes('police')) {
    if (combined.includes('kolkata') || combined.includes('kp')) {
      return {
        emblem: '/images/exams/icon_kolkata_police.png',
        bgColor: 'bg-[#EFF6FF] dark:bg-blue-950/40 border-[#DBEAFE] dark:border-blue-900/60',
      };
    }
    return {
      emblem: '/images/exams/emblem_wbp.png',
      bgColor: 'bg-[#FFF4F0] dark:bg-slate-800/80 border-[#FDE2D7] dark:border-slate-700/60',
    };
  }
  if (combined.includes('wbcs')) {
    return {
      emblem: '/images/exams/wbcs_emblem.png',
      bgColor: 'bg-[#EEF2FF] dark:bg-indigo-950/40 border-[#E0E7FF] dark:border-indigo-900/60',
    };
  }
  if (combined.includes('clerk') || combined.includes('wbpsc') || combined.includes('misc')) {
    return {
      emblem: '/images/exams/emblem_wbpsc.png',
      bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/40 border-[#FEF3C7] dark:border-amber-900/60',
    };
  }
  if (combined.includes('slst') || combined.includes('wbssc') || combined.includes('group d')) {
    return {
      emblem: '/images/exams/emblem_wbssc.png',
      bgColor: 'bg-[#ECFDF5] dark:bg-emerald-950/40 border-[#D1FAE5] dark:border-emerald-900/60',
    };
  }
  if (combined.includes('tet') || combined.includes('teach')) {
    return {
      emblem: '/images/exams/emblem_tet.png',
      bgColor: 'bg-[#FAF5FF] dark:bg-purple-950/40 border-[#F3E8FF] dark:border-purple-900/60',
    };
  }
  if (combined.includes('rail') || combined.includes('ntpc') || combined.includes('rrb')) {
    return {
      emblem: '/images/exams/emblem_railway.png',
      bgColor: 'bg-[#F0F9FF] dark:bg-sky-950/40 border-[#E0F2FE] dark:border-sky-900/60',
    };
  }
  if (combined.includes('ssc') || combined.includes('cgl') || combined.includes('gd') || combined.includes('mts')) {
    return {
      emblem: '/images/exams/emblem_ssc.png',
      bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/40 border-[#FEF3C7] dark:border-amber-900/60',
    };
  }

  return {
    emblem: '/images/exams/emblem_wbp.png',
    bgColor: 'bg-[#EFF6FF] dark:bg-slate-800/80 border-blue-200/70 dark:border-slate-700/60',
  };
}

function SeriesEmblem({ emblem, bgColor }: { emblem: string; bgColor: string }) {
  const isBrandLogo = emblem.includes('logo-icon');
  if (isBrandLogo) {
    return (
      <img
        src="/logo-icon.png"
        alt=""
        className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-xs"
        onError={(event) => {
          event.currentTarget.src = '/logo-icon-circle.png';
        }}
      />
    );
  }

  return (
    <div
      className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border p-1.5 flex items-center justify-center shadow-2xs ${bgColor}`}
    >
      <img
        src={emblem}
        alt=""
        className="h-full w-full rounded-xl object-contain"
        onError={(event) => {
          event.currentTarget.src = '/logo-icon.png';
        }}
      />
    </div>
  );
}

export const TestSeriesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{
    onToggleMobileSidebar?: () => void;
    onToggleCollapse?: () => void;
    isSidebarCollapsed?: boolean;
  }>() || {};

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

        if (
          (activeCategory === 'police' || activeCategory === 'kp') &&
          !(
            combined.includes('police') ||
            combined.includes('wbp') ||
            combined.includes('kp') ||
            combined.includes('constable') ||
            combined.includes('si')
          )
        ) {
          return false;
        }
        if (
          activeCategory === 'ssc' &&
          !(
            combined.includes('ssc') ||
            combined.includes('cgl') ||
            combined.includes('gd') ||
            combined.includes('mts') ||
            combined.includes('chsl') ||
            combined.includes('central')
          )
        ) {
          return false;
        }
        if (
          activeCategory === 'railways' &&
          !(
            combined.includes('rail') ||
            combined.includes('ntpc') ||
            combined.includes('rrb') ||
            combined.includes('group d') ||
            combined.includes('alp')
          )
        ) {
          return false;
        }
        if (
          activeCategory === 'other' &&
          (combined.includes('police') ||
            combined.includes('wbp') ||
            combined.includes('kp') ||
            combined.includes('constable') ||
            combined.includes('si') ||
            combined.includes('ssc') ||
            combined.includes('cgl') ||
            combined.includes('gd') ||
            combined.includes('mts') ||
            combined.includes('chsl') ||
            combined.includes('central') ||
            combined.includes('rail') ||
            combined.includes('ntpc') ||
            combined.includes('rrb') ||
            combined.includes('group d') ||
            combined.includes('alp'))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [seriesList, searchTerm, activeCategory, accessFilter]);

  const totalTestsCount = useMemo(
    () => seriesList.reduce((sum, s) => sum + (s.testsCount ?? s.testCount ?? 0), 0),
    [seriesList]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-10 sm:pt-3 font-sans">
      {/* Top Navbar */}
      <StudentNavbar
        embedded
        showSearch={false}
        onToggleMobileSidebar={outletCtx.onToggleMobileSidebar}
      />

      {/* 1. HERO BANNER WITH INTEGRATED SEARCH & STATS */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1F44] via-[#0138A8] to-[#0158FC] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-blue-900/10 border border-white/10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#0198FD]/30 blur-3xl pointer-events-none" />
        <div className="absolute right-24 -bottom-20 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Complete Preparation</span>
            </div>

            <h1 className="mt-3.5 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Test Series —{' '}
              <span className="text-amber-300">All Exams in One Subscription</span>
            </h1>

            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-blue-100 max-w-xl">
              Full Mock Tests · Chapter-wise Tests · Previous Year Questions · Live Tests ·
              Detailed Bilingual Solutions synced with latest exam patterns.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  document.getElementById('popular-series')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-black text-[#0158FC] shadow-md hover:bg-blue-50 transition-all active:scale-95 cursor-pointer"
              >
                <span>Start Testing</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-blue-100 px-3 py-2 rounded-xl bg-white/10 border border-white/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>
                  {seriesList.length} Series · {totalTestsCount}+ Tests Available
                </span>
              </div>
            </div>
          </div>

          {/* Search Box Card inside Hero */}
          <div className="w-full lg:w-96 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-lg">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-blue-100 mb-2">
              Find Your Exam Series
            </label>
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                aria-label="Search test series"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search WBP, WBPSC, SSC, Railway..."
                className="w-full rounded-xl border border-white/20 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-9 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-300"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-blue-200 font-semibold">Quick:</span>
              {['WBP', 'WBPSC', 'SSC', 'Railway'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchTerm(tag)}
                  className="px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-white font-bold transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. TEST TYPE SHORTCUTS (4 Bento Cards) */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        aria-label="Test type shortcuts"
      >
        {[
          {
            label: 'Full Mock Tests',
            sub: 'Exam-pattern timed CBT',
            icon: FileText,
            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            filter: 'full_mock',
          },
          {
            label: 'Chapter-wise Tests',
            sub: 'Topic & concept mastery',
            icon: BookOpen,
            color: 'bg-[#0158FC]/10 text-[#0158FC] dark:text-blue-400',
            filter: 'topic',
          },
          {
            label: 'Previous Year Questions',
            sub: 'Authentic past papers',
            icon: Award,
            color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
            filter: 'pyq',
          },
          {
            label: 'Live Tests',
            sub: 'All-India & State Rank',
            icon: Zap,
            color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            filter: 'live',
          },
        ].map(({ label, sub, icon: Icon, color, filter }) => (
          <button
            key={label}
            type="button"
            onClick={() =>
              navigate(filter === 'live' ? '/live-test' : `/practice?type=${filter}`)
            }
            className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-left shadow-[0_4px_16px_-8px_rgba(1,88,252,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#0158FC]/40 hover:shadow-md cursor-pointer"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors leading-tight">
                {label}
              </span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {sub}
              </span>
            </div>
          </button>
        ))}
      </section>

      {/* 3. FILTER BAR (Category Pills + Access Filter Toggle) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Category Tabs */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
          aria-label="Filter by exam category"
        >
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0158FC] to-[#0198FD] text-white shadow-sm shadow-blue-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#0158FC]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Access Filter Pills (All / Free / Pro) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(
            [
              { id: 'all', label: 'All Series' },
              { id: 'free', label: 'Free' },
              { id: 'pro', label: 'Pro Pass' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAccessFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                accessFilter === item.id
                  ? 'bg-white dark:bg-slate-900 text-[#0158FC] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. TEST SERIES GRID */}
      <section id="popular-series" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-gradient-to-b from-[#0158FC] to-[#0198FD]" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              🔥 Popular Test Series
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-slate-800 text-[#0158FC] dark:text-blue-400 text-xs font-extrabold">
              {filteredSeries.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setAccessFilter('all');
              setSearchTerm('');
            }}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-[#0158FC] dark:text-blue-400 hover:underline cursor-pointer"
          >
            See All <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs"
              />
            ))}
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
            <Layers className="mx-auto h-10 w-10 text-[#0158FC]" />
            <p className="mt-3 text-base font-black text-slate-900 dark:text-white">
              No Test Series Found
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Try another category or search term.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setAccessFilter('all');
                setSearchTerm('');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0158FC] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filteredSeries.map((series) => {
              const { emblem, bgColor } = getSeriesEmblem(series);
              const totalTests = series.testsCount ?? series.testCount ?? 0;
              return (
                <article
                  key={series.id}
                  className="group rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_6px_24px_-12px_rgba(1,88,252,0.08)] hover:border-[#0158FC]/50 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-4">
                      <SeriesEmblem emblem={emblem} bgColor={bgColor} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {series.isPremium ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              <Crown className="h-3 w-3 fill-amber-500 text-amber-500" />
                              Pro Series
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              Free Access
                            </span>
                          )}
                          {series.isPopular && (
                            <span className="inline-flex items-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              🔥 Popular
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {series.title}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 px-2.5 py-1 font-bold text-[#0158FC] dark:text-blue-300">
                        {totalTests} Tests
                      </span>
                      {series.examTitle && (
                        <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {series.examTitle}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {series.description ||
                        'Full Mock, Chapter-wise, PYQ and Live Tests with detailed solutions.'}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      Bilingual • Latest Pattern
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/test-series/${series.slug || series.id}`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0158FC] to-[#0198FD] hover:from-[#0047cc] hover:to-[#0158FC] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>View Series</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

