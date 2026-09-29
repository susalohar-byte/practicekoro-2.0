/**
 * Public Questions Listing — SEO-optimized browsable question directory.
 *
 * Route: /questions
 *
 * Renders a paginated list of all published questions, grouped by
 * subject. Each question links to its individual QuestionPage.
 * Includes FAQPage JSON-LD for listing-level rich snippets.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import type { Question } from '@/types';
import { SEOHead } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/JsonLd';
import { generateFAQPageJsonLd, questionSlug } from '@/utils/seo';
import {
  Search,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Filter,
  ChevronLeft,
} from 'lucide-react';

const PAGE_SIZE = 20;
const SITE_URL = 'https://practicekoro.online';

export const QuestionsListing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');

  const page = Number(searchParams.get('page') || '1');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const all = await api.getAllAdminQuestions({
          status: 'active',
          ...(selectedSubject ? { subjectId: selectedSubject } : {}),
          ...(searchTerm ? { search: searchTerm } : {}),
        });
        if (!cancelled) setQuestions(all);
      } catch {
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedSubject, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const paginatedQuestions = useMemo(
    () => questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [questions, page]
  );

  // Unique subjects for filter
  const subjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    questions.forEach((q) => {
      if (q.subjectId && q.subjectName) subjectMap.set(q.subjectId, q.subjectName);
    });
    return Array.from(subjectMap.entries());
  }, [questions]);

  // FAQ schema for listing
  const faqJsonLd = useMemo(() => {
    return generateFAQPageJsonLd(
      paginatedQuestions.slice(0, 10).map((q) => {
        const correctKey = `option${q.correctOption}` as
          | 'optionA'
          | 'optionB'
          | 'optionC'
          | 'optionD';
        return {
          questionText: q.questionBengaliText || q.questionText,
          answer: `সঠিক উত্তরটি হল ${q[correctKey]}। ${q.explanationBengali || q.explanation || ''}`,
        };
      })
    );
  }, [paginatedQuestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) params.set('q', searchTerm);
    else params.delete('q');
    params.set('page', '1');
    setSearchParams(params);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SEOHead
        title={`প্রশ্নব্যাংক | PracticeKoro — Solved Questions for WB Competitive Exams`}
        description={`PracticeKoro-র প্রশ্নব্যাংক — সমস্ত বিষয়ের সমাধানসহ প্রশ্ন। WBP, WBCS, Primary TET, Group D পরীক্ষার জন্য অনুশীলন করুন।`}
        url={`${SITE_URL}/questions`}
      />
      <JsonLd data={faqJsonLd} />

      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-600">
            <BookOpen className="h-5 w-5" />
            PracticeKoro
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Title */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            📚 প্রশ্নব্যাংক — Solved Questions
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            West Bengal-এর প্রতিযোগিতামূলক পরীক্ষার জন্য সমাধানসহ প্রশ্ন
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="প্রশ্ন খুঁজুন..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </form>
          {subjects.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value) params.set('subject', e.target.value);
                  else params.delete('subject');
                  params.set('page', '1');
                  setSearchParams(params);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">All Subjects</option>
                {subjects.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Question count */}
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Loading...' : `${questions.length} প্রশ্ন পাওয়া গেছে`}
        </p>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : paginatedQuestions.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-500">কোনো প্রশ্ন পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedQuestions.map((q, idx) => {
              const qText = q.questionBengaliText || q.questionText;
              const slug = questionSlug(qText);
              const correctKey = `option${q.correctOption}` as
                | 'optionA'
                | 'optionB'
                | 'optionC'
                | 'optionD';
              const correctAnswer = q[correctKey];

              return (
                <Link
                  key={q.id}
                  to={`/questions/${q.id}/${slug}`}
                  className="group block rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-medium leading-snug text-slate-900 group-hover:text-brand-600 dark:text-white">
                        {qText.length > 120 ? qText.substring(0, 120) + '...' : qText}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          {correctAnswer}
                        </span>
                        {q.subjectName && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>{q.subjectName}</span>
                          </>
                        )}
                        {q.sourceExam && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span>
                              {q.sourceExam}
                              {q.sourceYear ? ` ${q.sourceYear}` : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 group-hover:text-brand-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} PracticeKoro. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
            <Link to="/terms" className="hover:text-brand-600">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-brand-600">
              Privacy
            </Link>
            <Link to="/contact-us" className="hover:text-brand-600">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
