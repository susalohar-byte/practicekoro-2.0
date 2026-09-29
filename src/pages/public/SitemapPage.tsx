/**
 * Sitemap generator component.
 *
 * Route: /sitemap.xml
 *
 * Generates an XML sitemap of all published question pages for Google
 * crawling. Since this is a SPA, the actual sitemap.xml is served as
 * a static file by the build script (see scripts/generate-sitemap.ts).
 * This page displays a human-readable link list instead.
 *
 * For the actual XML sitemap generation, see the build-time script.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Question } from '@/types';
import { questionSlug } from '@/utils/seo';
import { BookOpen, ExternalLink } from 'lucide-react';

export const SitemapPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const all = await api.getPublicQuestions();
        if (!cancelled) setQuestions(all);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <BookOpen className="h-5 w-5 text-brand-600" />
          PracticeKoro Sitemap
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {questions.length} question pages available for indexing
        </p>

        <div className="mt-4 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Homepage
          </Link>
          <Link
            to="/questions"
            className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Questions Directory
          </Link>

          <hr className="my-3" />

          {questions.map((q) => {
            const text = q.questionBengaliText || q.questionText;
            const slug = questionSlug(text);
            return (
              <Link
                key={q.id}
                to={`/questions/${q.id}/${slug}`}
                className="block truncate text-xs text-brand-600 hover:underline"
              >
                /questions/{q.id}/{slug}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
