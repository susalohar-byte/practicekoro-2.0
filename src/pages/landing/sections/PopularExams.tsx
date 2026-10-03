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
      className="relative py-14 sm:py-20 lg:py-24 bg-slate-50 dark:bg-slate-950 border-t border-b border-slate-100 dark:border-slate-800/80 scroll-mt-24"
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

        {/* Filter Tabs & Search Row */}
        <Reveal className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap pb-1.5 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {examCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={isActive}
                  className={cn(
                    'px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all shrink-0',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-800 shadow-xs'
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 shadow-xs transition-all"
            />
          </div>
        </Reveal>

        {/* Exam Cards Grid */}
        {filteredPopularExams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredPopularExams.map((exam, index) => (
              <Reveal key={exam.title} delay={Math.min(index, 7) * 60} className="h-full">
                <div
                  onClick={() => navigate(exam.route)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(exam.route)}
                  className="group relative h-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 overflow-hidden"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    {exam.isCustomIcon ? (
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 p-1.5 shadow-2xs group-hover:border-blue-300 group-hover:bg-blue-50/50 group-hover:scale-105 transition-all">
                        <img
                          src={exam.icon}
                          alt={exam.title}
                          loading="lazy"
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {exam.title}
                        </h3>
                        {exam.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/60">
                            {exam.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {exam.testsCount ? `${exam.testsCount} • ` : ''}{exam.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 border border-slate-200/70 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 dark:group-hover:border-blue-600 transition-all shadow-2xs">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
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
