import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { examCategories, popularExams } from '../data';
import { Reveal } from './Reveal';
import {
  ArrowRight,
  ChevronRight,
  Compass,
  FileText,
  Layers,
  Search,
  SearchX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const PopularExams: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPopularExams = popularExams.filter((exam) => {
    const matchesCategory =
      selectedCategory === 'all' || exam.categories.includes(selectedCategory);
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const featuredExamCount = popularExams.filter((exam) => !exam.isCustomIcon).length;
  const testCatalogCount = popularExams.find((exam) => exam.isCustomIcon)?.testsCount;

  return (
    <section
      id="exams"
      className="relative isolate scroll-mt-24 overflow-hidden border-y border-blue-100/70 bg-[#f5f8ff] py-16 dark:border-slate-800 dark:bg-slate-950 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-36 h-[32rem] w-[32rem] rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-700/10"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700 shadow-sm dark:border-blue-900/70 dark:bg-slate-900 dark:text-blue-300 sm:text-[11px]">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Popular exams
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
              Explore Your{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Exam
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-7">
              Pick your target exam and find focused mock tests, previous-year questions, and topic
              practice in one place.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white bg-white/75 p-3 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.38)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:min-w-[20rem] sm:p-4">
              <div className="rounded-2xl bg-blue-50/80 px-4 py-3 dark:bg-blue-950/40">
                <p className="text-2xl font-black tracking-tight text-pk-navy dark:text-white">
                  {featuredExamCount}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Featured exams
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                <p className="text-2xl font-black tracking-tight text-pk-navy dark:text-white">
                  {examCategories.length - 1}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Exam categories
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Search and category selection are grouped for quick scanning. */}
        <Reveal className="mt-8 sm:mt-10">
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-3 shadow-[0_20px_56px_-42px_rgba(15,23,42,0.42)] dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="px-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Browse by category
                </p>
                <div
                  role="group"
                  aria-label="Filter exams by category"
                  className="-mx-1 mt-2 flex items-center gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap sm:pb-0"
                >
                  {examCategories.map((cat) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        aria-pressed={isActive}
                        className={cn(
                          'shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all',
                          isActive
                            ? 'bg-pk-primary text-white shadow-md shadow-pk-primary/25'
                            : 'border border-transparent bg-slate-50 text-slate-600 hover:border-blue-100 hover:bg-blue-50 hover:text-pk-primary dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/50'
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-full items-center gap-3 xl:max-w-[27rem]">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    aria-label="Search exams"
                    placeholder="Search by exam name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                  />
                </div>
                <span className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-3 text-xs font-extrabold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {filteredPopularExams.length}
                  <span className="hidden sm:inline">
                    {filteredPopularExams.length === 1 ? 'exam' : 'exams'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Exam Cards Grid */}
        {filteredPopularExams.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {filteredPopularExams.map((exam, index) => {
              const isCatalogCard = Boolean(exam.isCustomIcon);
              const badgeTone =
                exam.badge === 'Popular'
                  ? 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300'
                  : exam.badge === 'Central'
                    ? 'border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300'
                    : exam.badge === 'Teaching'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : exam.badge === 'Hot'
                        ? 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';

              return (
                <Reveal key={exam.title} delay={Math.min(index, 7) * 55} className="h-full">
                  <button
                    type="button"
                    onClick={() => navigate(exam.route)}
                    aria-label={`Explore ${exam.title}`}
                    className={cn(
                      'group relative flex min-h-[236px] w-full flex-col overflow-hidden rounded-[1.75rem] border p-5 text-left transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 active:scale-[0.99] sm:min-h-[248px] sm:p-6',
                      isCatalogCard
                        ? 'border-blue-700 bg-gradient-to-br from-[#071b4b] via-[#073b9b] to-[#0758fc] text-white shadow-[0_18px_48px_-24px_rgba(1,52,150,0.7)] hover:shadow-[0_24px_58px_-26px_rgba(1,52,150,0.8)]'
                        : 'border-slate-200/90 bg-white text-slate-900 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.35)] hover:border-blue-200 hover:shadow-[0_24px_55px_-32px_rgba(1,88,252,0.42)] dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-800'
                    )}
                  >
                    {!isCatalogCard && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                      />
                    )}
                    {isCatalogCard && (
                      <>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10"
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-2 -top-7 h-28 w-28 rounded-full border border-white/10"
                        />
                      </>
                    )}

                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <span
                        className={cn(
                          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl p-2.5 transition-transform group-hover:scale-105',
                          isCatalogCard
                            ? 'bg-white/15 text-white shadow-inner shadow-white/10'
                            : 'border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-900'
                        )}
                      >
                        {isCatalogCard ? (
                          <Layers className="h-7 w-7" aria-hidden="true" />
                        ) : (
                          <img
                            src={exam.icon}
                            alt=""
                            loading="lazy"
                            className="h-10 w-10 object-contain"
                          />
                        )}
                      </span>
                      {exam.badge && (
                        <span
                          className={cn(
                            'mt-1 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]',
                            badgeTone
                          )}
                        >
                          {exam.badge}
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 mt-5 min-w-0">
                      <h3
                        className={cn(
                          'line-clamp-2 min-h-[3.5rem] text-lg font-extrabold leading-snug tracking-tight sm:text-xl',
                          isCatalogCard
                            ? 'text-white'
                            : 'text-slate-950 transition-colors group-hover:text-pk-primary dark:text-white dark:group-hover:text-blue-300'
                        )}
                      >
                        {exam.title}
                      </h3>
                      <p
                        className={cn(
                          'mt-1 line-clamp-2 min-h-10 text-xs leading-5 sm:text-[13px]',
                          isCatalogCard
                            ? 'text-blue-100/85'
                            : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {exam.subtitle}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'relative z-10 mt-auto flex items-center justify-between gap-3 border-t pt-4',
                        isCatalogCard ? 'border-white/15' : 'border-slate-100 dark:border-slate-800'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex min-w-0 items-center gap-2 text-xs font-bold',
                          isCatalogCard ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'
                        )}
                      >
                        <FileText
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isCatalogCard ? 'text-blue-200' : 'text-blue-600 dark:text-blue-400'
                          )}
                          aria-hidden="true"
                        />
                        {exam.testsCount || testCatalogCount || 'Explore tests'}
                      </span>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1.5 text-xs font-extrabold transition-transform group-hover:translate-x-0.5',
                          isCatalogCard ? 'text-white' : 'text-pk-primary dark:text-blue-300'
                        )}
                      >
                        {isCatalogCard ? 'Browse all' : 'Explore'}
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.75rem] border border-dashed border-slate-300 bg-white/75 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/60">
            <SearchX className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-800 dark:text-white">No exams found</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try another search or choose a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              Clear filters
            </button>
          </div>
        )}

        <Reveal className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:mt-10">
          <Button
            size="lg"
            onClick={() => navigate('/exams')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 sm:w-auto"
          >
            View all exams
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Find the right mock tests, PYQs, and topic practice for your goal.
          </p>
        </Reveal>
      </div>
    </section>
  );
};
