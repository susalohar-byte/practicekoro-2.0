import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { examCategories, popularExams } from '../data';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { ArrowRight, ChevronRight, Search, Layers, SearchX } from 'lucide-react';
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

  return (
    <section
      id="exams"
      className="relative scroll-mt-24 border-y border-slate-100 bg-gradient-to-b from-[#f7faff] via-slate-50 to-white py-14 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/40 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[240px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
      />
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Popular Exams"
          title={
            <>
              Explore{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Your Exam
              </span>
            </>
          }
          description="Choose your target exam and start practicing with topic-wise tests, PYQs and full mock tests."
        />

        {/* Category filters and search stay together as one discovery control. */}
        <Reveal className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white/85 p-3 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.35)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter exams by category"
              className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 no-scrollbar sm:flex-wrap sm:pb-0"
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
                      'shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-all sm:px-4',
                      isActive
                        ? 'bg-pk-primary text-white shadow-md shadow-pk-primary/25'
                        : 'border border-slate-200/80 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-pk-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-slate-800'
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:inline">
                {filteredPopularExams.length} {filteredPopularExams.length === 1 ? 'exam' : 'exams'}
              </span>
              <div className="relative w-full sm:w-64 lg:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  aria-label="Search exams"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-slate-800 shadow-inner shadow-slate-900/[0.02] transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Exam Cards Grid */}
        {filteredPopularExams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {filteredPopularExams.map((exam, index) => (
              <Reveal key={exam.title} delay={Math.min(index, 7) * 60} className="h-full">
                <button
                  type="button"
                  onClick={() => navigate(exam.route)}
                  aria-label={`Explore ${exam.title}`}
                  className="group relative flex h-full min-h-[154px] w-full flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white p-5 text-left shadow-[0_8px_28px_-20px_rgba(15,23,42,0.32)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_22px_48px_-28px_rgba(1,88,252,0.42)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                  <div className="flex w-full items-start gap-4">
                    {exam.isCustomIcon ? (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
                        <Layers className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-2 shadow-sm transition-all group-hover:scale-105 group-hover:border-blue-200 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                        <img
                          src={exam.icon}
                          alt={exam.title}
                          loading="lazy"
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 pt-0.5">
                      {exam.badge && (
                        <span className="mb-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
                          {exam.badge}
                        </span>
                      )}
                      <h3 className="line-clamp-2 min-h-11 text-base font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-pk-primary dark:text-white dark:group-hover:text-blue-300">
                        {exam.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {exam.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto flex w-full items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {exam.testsCount || 'Explore all tests'}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-pk-primary transition-all group-hover:translate-x-0.5 group-hover:bg-pk-primary group-hover:text-white dark:bg-blue-950/60 dark:text-blue-300">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-14 px-6 text-center">
            <SearchX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No exams found</p>
            <p className="mt-1 text-xs text-slate-500">
              Try a different search term or category filter.
            </p>
          </div>
        )}

        {/* Bottom "View All Exams" Button */}
        <Reveal className="text-center mt-8 sm:mt-10">
          <Button
            size="lg"
            onClick={() => navigate('/exams')}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 text-sm gap-2 transition-all hover:-translate-y-0.5"
          >
            <span>View All Exams</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
