import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useExam } from '@/context/ExamContext';
import {
  ChevronRight,
  Layers,
  ArrowRight,
  GraduationCap,
  Train,
  Award,
  Shield,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exam } from '@/types';

interface EnrichedExam {
  exam: Exam;
  meta: {
    category: string;
    subCategory: string;
    badge?: 'Popular' | 'Trending' | 'New';
    mockTestsText: string;
    questionsText: string;
    emblem: string;
    bgColor: string;
    sectionId: string;
    sectionTitle: string;
    sectionSubtitle: string;
    sectionIcon: 'wb' | 'central' | 'teaching' | 'railway' | 'civil' | 'police' | 'generic';
  };
}

/**
 * Dynamically resolves metadata for any exam directly from the database and Admin Panel.
 * Uses exact exam.category stored in the database without artificial remapping.
 */
function enrichExam(exam: Exam): EnrichedExam {
  const id = (exam.id || '').toLowerCase();
  const title = (exam.title || '').toLowerCase();
  const category = (exam.category || 'WB Police (WBP / KP)').trim();
  const catLower = category.toLowerCase();

  // 1. Department Emblem & Background Color
  let emblem = '/images/exams/emblem_wbpsc.png';
  let bgColor = 'bg-[#FFF9E6] dark:bg-amber-950/40';

  if (id.includes('wbp-constable') || (title.includes('wbp') && title.includes('constable'))) {
    emblem = '/images/exams/emblem_wbp.png';
    bgColor = 'bg-[#FFF0F2] dark:bg-rose-950/40';
  } else if (id.includes('kp') || title.includes('kolkata')) {
    emblem = '/images/exams/icon_kolkata_police.png';
    bgColor = 'bg-[#EFF6FF] dark:bg-blue-950/40';
  } else if (id.includes('wbcs') || title.includes('wbcs')) {
    emblem = '/images/exams/wbcs_emblem.png';
    bgColor = 'bg-[#EFF6FF] dark:bg-blue-950/40';
  } else if (id.includes('clerk') || title.includes('clerk') || id.includes('wbpsc')) {
    emblem = '/images/exams/emblem_wbpsc.png';
    bgColor = 'bg-[#FFF9E6] dark:bg-amber-950/40';
  } else if (id.includes('group-d') || title.includes('group d') || id.includes('wbssc-group')) {
    emblem = '/images/exams/emblem_wbssc.png';
    bgColor = 'bg-[#FFF0F2] dark:bg-rose-950/40';
  } else if (id.includes('slst') || title.includes('slst') || id.includes('wbssc')) {
    emblem = '/images/exams/emblem_wbssc.png';
    bgColor = 'bg-[#FFF0F2] dark:bg-rose-950/40';
  } else if (title.includes('tet') || catLower.includes('teach')) {
    emblem = '/images/exams/emblem_tet.png';
    bgColor = 'bg-[#FFF0F2] dark:bg-rose-950/40';
  } else if (title.includes('railway') || title.includes('rrb') || catLower.includes('rail')) {
    emblem = '/images/exams/emblem_railway.png';
    bgColor = 'bg-[#FFF0F2] dark:bg-rose-950/40';
  } else if (title.includes('ssc') || catLower.includes('ssc') || catLower.includes('central')) {
    emblem = '/images/exams/emblem_ssc.png';
    bgColor = 'bg-[#FFF8ED] dark:bg-amber-950/40';
  }

  // If a custom logo/icon was uploaded or configured by Admin, prioritize it
  if (
    exam.iconName &&
    (exam.iconName.startsWith('http') ||
      exam.iconName.startsWith('data:') ||
      exam.iconName.startsWith('/') ||
      exam.iconName.startsWith('blob:'))
  ) {
    emblem = exam.iconName;
  }

  // 2. Badges (aligned with reference design & significance)
  let badge: 'Popular' | 'Trending' | 'New' | undefined = undefined;
  if (id.includes('group-d') || title.includes('group d')) {
    badge = 'Popular';
  } else if (id.includes('wbp-constable') || title.includes('wbp constable')) {
    badge = 'Trending';
  } else if (id.includes('wbssc-slst') || title.includes('slst')) {
    badge = 'New';
  } else if (id.includes('ssc-cgl') || title.includes('cgl')) {
    badge = 'Popular';
  } else if (id.includes('wbcs') || title.includes('wbcs')) {
    badge = 'Popular';
  } else if (title.includes('primary tet')) {
    badge = 'Popular';
  } else if (exam.orderIndex === 1) {
    badge = 'Popular';
  }

  // 3. Section Grouping based on exact Admin Panel category
  const slugKey = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sectionId = slugKey;

  // Title formatting: clean display for standardized categories
  let sectionTitle = category;
  if (catLower === 'west bengal' || catLower === 'state govt' || catLower === 'state government') {
    sectionTitle = 'West Bengal Government Exams';
  } else if (catLower === 'central' || catLower === 'central govt' || catLower === 'central government') {
    sectionTitle = 'Central Government Exams';
  } else if (catLower === 'teaching') {
    sectionTitle = 'Teaching Exams';
  } else if (catLower === 'railway' || catLower === 'railways') {
    sectionTitle = 'Railway Exams';
  } else if (catLower === 'police') {
    sectionTitle = 'Police Recruitment Exams';
  } else if (!catLower.includes('(') && !catLower.endsWith('exams')) {
    sectionTitle = `${category} Exams`;
  }

  // Contextual Subtitles for Admin Categories
  let sectionSubtitle = `Curated mock tests and syllabus practice for ${category}.`;
  let sectionIcon: EnrichedExam['meta']['sectionIcon'] = 'generic';

  if (catLower.includes('police') || catLower.includes('wbp') || catLower.includes('kp')) {
    sectionSubtitle = 'West Bengal Police, Kolkata Police & law enforcement recruitment tests.';
    sectionIcon = 'police';
  } else if (
    catLower.includes('wbpsc') ||
    catLower.includes('clerk') ||
    catLower.includes('wbcs') ||
    catLower.includes('civil')
  ) {
    sectionSubtitle = 'West Bengal Civil Service (Executive) & state administrative examinations.';
    sectionIcon = 'civil';
  } else if (catLower.includes('teach') || catLower.includes('tet') || catLower.includes('slst')) {
    sectionSubtitle = 'For a career in teaching and school education.';
    sectionIcon = 'teaching';
  } else if (catLower.includes('ssc') || catLower.includes('central')) {
    sectionSubtitle = 'Prepare for major central government competitive exams.';
    sectionIcon = 'central';
  } else if (catLower.includes('rail') || catLower.includes('rrb')) {
    sectionSubtitle = 'Railway Recruitment Board (NTPC, Group D, ALP) examinations.';
    sectionIcon = 'railway';
  } else if (
    catLower.includes('west bengal') ||
    catLower.includes('state govt') ||
    catLower.includes('state government') ||
    catLower.includes('wb')
  ) {
    sectionSubtitle = 'Popular exams for West Bengal state government jobs.';
  } else if (catLower.includes('defence')) {
    sectionSubtitle = 'Armed forces and defence recruitment examination series.';
    sectionIcon = 'police';
  } else if (catLower.includes('banking')) {
    sectionSubtitle = 'Banking recruitment and financial services mock test packages.';
    sectionIcon = 'generic';
  }

  // 4. Test & Question Metrics (Dynamic from DB, with graceful fallback to reference specs)
  const testCount = exam.testsCount ?? 0;
  const qCount = exam.questionsCount ?? 0;

  let mockTestsText = '10+';
  let questionsText = '500+';

  if (testCount > 0) {
    mockTestsText = `${testCount}+`;
  } else if (id.includes('group-d')) {
    mockTestsText = '25+';
  } else if (id.includes('wbp') || title.includes('wbp')) {
    mockTestsText = '15+';
  } else if (id.includes('clerkship') || title.includes('clerk')) {
    mockTestsText = '20+';
  } else if (title.includes('tet')) {
    mockTestsText = '12+';
  } else if (title.includes('slst')) {
    mockTestsText = '10+';
  } else if (title.includes('cgl') || title.includes('gd')) {
    mockTestsText = '25+';
  } else if (title.includes('mts')) {
    mockTestsText = '15+';
  } else if (title.includes('railway') || title.includes('ntpc')) {
    mockTestsText = '18+';
  } else if (title.includes('wbcs')) {
    mockTestsText = '15+';
  } else if (title.includes('kolkata') || id.includes('kp')) {
    mockTestsText = '12+';
  }

  if (qCount > 0) {
    questionsText = `${qCount.toLocaleString()}+`;
  } else if (id.includes('group-d')) {
    questionsText = '1,200+';
  } else if (id.includes('wbp') || title.includes('wbp')) {
    questionsText = '980+';
  } else if (id.includes('clerkship') || title.includes('clerk')) {
    questionsText = '1,500+';
  } else if (title.includes('tet')) {
    questionsText = '800+';
  } else if (title.includes('slst')) {
    questionsText = '600+';
  } else if (title.includes('gd')) {
    questionsText = '2,000+';
  } else if (title.includes('cgl')) {
    questionsText = '1,800+';
  } else if (title.includes('mts')) {
    questionsText = '1,200+';
  } else if (title.includes('railway') || title.includes('ntpc')) {
    questionsText = '1,600+';
  } else if (title.includes('wbcs')) {
    questionsText = '1,200+';
  } else if (title.includes('kolkata') || id.includes('kp')) {
    questionsText = '800+';
  }

  return {
    exam,
    meta: {
      category,
      subCategory: category,
      badge,
      mockTestsText,
      questionsText,
      emblem,
      bgColor,
      sectionId,
      sectionTitle,
      sectionSubtitle,
      sectionIcon,
    },
  };
}

type SortKey = 'popularity' | 'name' | 'tests' | 'questions';

export const ExamsCatalog: React.FC = () => {
  const { exams, setSelectedExam, loading } = useExam();
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('popularity');

  // Handle exam selection
  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam);
    navigate(`/exams/${exam.slug || exam.id}`);
  };

  // Only take real, active exams returned from the database
  const enrichedExams = useMemo(() => {
    return exams.filter((exam) => exam.isActive !== false).map(enrichExam);
  }, [exams]);

  // Group real database exams into categorized sections matching Admin Panel categories
  const sections = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        categoryName: string;
        title: string;
        subtitle: string;
        icon: EnrichedExam['meta']['sectionIcon'];
        exams: EnrichedExam[];
      }
    >();

    enrichedExams.forEach((item) => {
      const secId = item.meta.sectionId;
      if (!map.has(secId)) {
        map.set(secId, {
          id: secId,
          categoryName: item.meta.category,
          title: item.meta.sectionTitle,
          subtitle: item.meta.sectionSubtitle,
          icon: item.meta.sectionIcon,
          exams: [],
        });
      }
      map.get(secId)!.exams.push(item);
    });

    return Array.from(map.values());
  }, [enrichedExams]);

  // Dynamic filter pills computed purely from active categories in the database
  const filterPills = useMemo(() => {
    const list: { key: string; label: string; count: number }[] = [
      { key: 'all', label: 'All Exams', count: enrichedExams.length },
    ];

    sections.forEach((sec) => {
      list.push({
        key: sec.categoryName,
        label: sec.categoryName,
        count: sec.exams.length,
      });
    });

    return list;
  }, [enrichedExams, sections]);

  // Filtered & sorted exams list (category filter only — search lives on Home)
  const filteredAndSortedExams = useMemo(() => {
    const matches = enrichedExams.filter(({ meta }) => {
      const matchesFilter = selectedFilter === 'all' || meta.category === selectedFilter;

      return matchesFilter;
    });

    matches.sort((a, b) => {
      if (sortBy === 'name') {
        return a.exam.title.localeCompare(b.exam.title);
      }
      if (sortBy === 'tests') {
        return (b.exam.testsCount ?? 0) - (a.exam.testsCount ?? 0);
      }
      if (sortBy === 'questions') {
        return (b.exam.questionsCount ?? 0) - (a.exam.questionsCount ?? 0);
      }
      // Popularity default: badges first, then order_index
      const getPriority = (meta: EnrichedExam['meta']) => {
        if (meta.badge === 'Popular') return 3;
        if (meta.badge === 'Trending') return 2;
        if (meta.badge === 'New') return 1;
        return 0;
      };
      const diff = getPriority(b.meta) - getPriority(a.meta);
      if (diff !== 0) return diff;
      return (a.exam.orderIndex || 0) - (b.exam.orderIndex || 0);
    });

    return matches;
  }, [enrichedExams, selectedFilter, sortBy]);

  // Helper to render an individual exam card with full readability and zero truncation
  const renderExamCard = (item: EnrichedExam) => {
    const { exam, meta } = item;

    return (
      <div
        key={exam.id || exam.slug}
        onClick={() => handleSelectExam(exam)}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-4.5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer group relative"
      >
        <div>
          {/* Card Top Row: Emblem, Title & Category, and Badge */}
          <div className="flex items-start gap-3 relative">
            {/* Department / Exam Emblem */}
            <div
              className={cn(
                'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center p-1.5 shrink-0 transition-transform group-hover:scale-105 shadow-2xs',
                meta.bgColor
              )}
            >
              <img
                src={meta.emblem}
                alt={exam.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/exams/emblem_wbpsc.png';
                }}
              />
            </div>

            {/* Title & Category Label */}
            <div className={cn('min-w-0 flex-1', meta.badge ? 'pr-14' : '')}>
              <h3
                className="text-[13.5px] sm:text-[14.5px] font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0158FC] transition-colors break-words line-clamp-2"
                title={exam.title}
              >
                {exam.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                {meta.category}
              </p>
            </div>

            {/* Top Right Pill Badge (Positioned absolute so it never crushes the title) */}
            {meta.badge && (
              <span
                className={cn(
                  'absolute top-0 right-0 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tracking-tight leading-normal shadow-2xs',
                  meta.badge === 'Popular' &&
                    'bg-[#FFF3E0] text-[#D97706] dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60',
                  meta.badge === 'Trending' &&
                    'bg-[#E8F8F0] text-[#059669] dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60',
                  meta.badge === 'New' &&
                    'bg-[#EBF5FF] text-[#2563EB] dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60'
                )}
              >
                {meta.badge}
              </span>
            )}
          </div>

          {/* Middle Metric Row (Mock Tests | Questions) */}
          <div className="grid grid-cols-2 gap-2 my-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {meta.mockTestsText}
              </div>
              <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Mock Tests
              </div>
            </div>
            <div className="border-l border-slate-100 dark:border-slate-800">
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {meta.questionsText}
              </div>
              <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Questions
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Blue CTA Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectExam(exam);
          }}
          className="w-full py-2.5 px-3 bg-[#0158FC] hover:bg-[#0047cc] active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs group-hover:shadow-sm"
        >
          <span>View Tests</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    );
  };

  const isCategorizedView = selectedFilter === 'all';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-5 sm:py-7 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            to="/dashboard"
            className="hover:text-[#0158FC] transition-colors font-medium text-slate-600 dark:text-slate-400"
          >
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 dark:text-white">Exams</span>
        </nav>

        {/* Hero Banner with Exploration Title & Book Illustration */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#EFF6FF] via-[#E8F2FE] to-[#D5ECFD] dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-100/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Left Content Column */}
            <div className="w-full md:max-w-xl space-y-3.5">
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Explore <span className="text-[#0158FC]">Exams</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Choose your exam and start your preparation journey with mock tests, topic practice,
                PYQ and detailed solutions.
              </p>
            </div>

            {/* Right Side Book Stack Illustration */}
            <div className="hidden sm:flex items-center justify-end shrink-0 pl-2">
              <img
                src="/images/exams_books_illustration.png"
                alt="Same Dream, Bigger Preparation - Practice, Prepare, Improve, Succeed"
                className="h-28 sm:h-36 lg:h-40 object-contain pointer-events-none select-none mix-blend-multiply dark:mix-blend-luminosity drop-shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills and Sort By Row */}
        <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between pt-1">
          {/* Category Filter Pills (Derived 100% from Admin Panel categories in Database) */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setSelectedFilter(pill.key)}
                className={cn(
                  'px-4 sm:px-5 py-2 rounded-full text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer',
                  selectedFilter === pill.key
                    ? 'bg-[#0158FC] text-white shadow-xs font-bold'
                    : 'bg-[#EEF4FB] text-[#334155] dark:bg-slate-800/90 dark:text-slate-300 hover:bg-[#E2EDF9] dark:hover:bg-slate-700/80'
                )}
              >
                {pill.label} ({pill.count})
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Sort by</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="popularity">Popularity</option>
                <option value="name">Name (A-Z)</option>
                <option value="tests">Mock Tests</option>
                <option value="questions">Questions</option>
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Content Body: Categorized Sections or Filtered Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-56 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 animate-pulse rounded-2xl p-4 space-y-4"
              >
                <div className="flex gap-3">
                  <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
                <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedExams.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              No examinations found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any exams for the selected category filter.
            </p>
            <button
              onClick={() => {
                setSelectedFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-[#0158FC] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : isCategorizedView ? (
          /* ========================================================= */
          /* CATEGORIZED SECTIONS (Sections matching Admin Categories)  */
          /* ========================================================= */
          <div className="space-y-9">
            {sections.map((section) => (
              <section key={section.id} className="space-y-3.5">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {section.icon === 'wb' ? (
                      <img
                        src="/images/exams/header_icon_wb.png"
                        alt="State Govt."
                        className="w-5 h-6 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : section.icon === 'police' ? (
                      <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0158FC] shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                    ) : section.icon === 'central' ? (
                      <img
                        src="/images/exams/header_icon_central.png"
                        alt="Central"
                        className="w-5 h-6 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : section.icon === 'teaching' ? (
                      <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                    ) : section.icon === 'railway' ? (
                      <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#0158FC] shrink-0">
                        <Train className="w-4 h-4" />
                      </div>
                    ) : section.icon === 'civil' ? (
                      <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <h2 className="text-base sm:text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {section.title}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedFilter(section.categoryName)}
                    className="text-xs font-semibold text-[#0158FC] hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section Cards Grid (5 columns on desktop matching reference) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {section.exams.map(renderExamCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* ========================================================= */
          /* FILTERED OR SEARCH RESULTS VIEW                           */
          /* ========================================================= */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredAndSortedExams.length}
                </span>{' '}
                examinations
                {selectedFilter !== 'all' && (
                  <span>
                    {' '}
                    under <span className="font-bold text-[#0158FC]">{selectedFilter}</span>
                  </span>
                )}
              </div>

              {(selectedFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedFilter('all');
                  }}
                  className="text-xs font-semibold text-[#0158FC] hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAndSortedExams.map(renderExamCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
