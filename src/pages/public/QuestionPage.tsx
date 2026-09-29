/**
 * Public Question Page — SEO-optimized, no auth required.
 *
 * Route: /questions/:questionId/:slug
 *
 * This is the page Google indexes. It renders:
 *  1. JSON-LD structured data (QAPage + BreadcrumbList)
 *  2. Dynamic <title> with "[Solved]" prefix (like Testbook)
 *  3. Full question text, all 4 options, correct answer, and explanation
 *  4. Breadcrumb trail: PracticeKoro > Subject > Topic > Question
 *  5. CTA to sign up / take test
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Question } from '@/types';
import { SEOHead } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  generateQAPageJsonLd,
  generateBreadcrumbJsonLd,
  questionPageTitle,
  questionPageDescription,
  questionPageUrl,
} from '@/utils/seo';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Share2,
  ExternalLink,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_KEYS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;

const SITE_URL = 'https://practicekoro.online';

function getDifficultyColor(d?: string) {
  switch (d) {
    case 'easy':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'hard':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QuestionPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string; slug?: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(true); // Default show for SEO
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!questionId) {
      setError('Question not found');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const q = await api.getQuestionById(questionId!);
        if (cancelled) return;
        if (!q) {
          setError('Question not found');
        } else {
          setQuestion(q);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load question');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error / 404
  if (error || !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {error || 'Question not found'}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            This question may have been removed or does not exist.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Go to PracticeKoro Home
          </Link>
        </div>
      </div>
    );
  }

  // Derived values
  const qText = question.questionBengaliText || question.questionText;
  const canonicalUrl = questionPageUrl(question.id, qText);
  const title = questionPageTitle(question);
  const description = questionPageDescription(question);

  const correctOptionKey = `option${question.correctOption}` as
    | 'optionA'
    | 'optionB'
    | 'optionC'
    | 'optionD';
  const correctAnswer = question[correctOptionKey];

  // Breadcrumb items
  const breadcrumbs = [
    { name: 'PracticeKoro', url: SITE_URL },
    ...(question.subjectName
      ? [{ name: question.subjectName, url: `${SITE_URL}/test-series` }]
      : []),
    ...(question.topicName || question.chapterName
      ? [
          {
            name: question.topicName || question.chapterName || 'Topic',
            url: `${SITE_URL}/test-series`,
          },
        ]
      : []),
    { name: qText.substring(0, 50) + (qText.length > 50 ? '...' : ''), url: canonicalUrl },
  ];

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, text: qText, url: canonicalUrl });
    } else {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* SEO Head */}
      <SEOHead title={title} description={description} url={canonicalUrl} />
      <JsonLd data={generateQAPageJsonLd({ question, url: canonicalUrl })} />
      <JsonLd data={generateBreadcrumbJsonLd(breadcrumbs)} />

      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
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

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-brand-600">
            PracticeKoro
          </Link>
          {question.subjectName && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="hover:text-brand-600">{question.subjectName}</span>
            </>
          )}
          {(question.topicName || question.chapterName) && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="hover:text-brand-600">
                {question.topicName || question.chapterName}
              </span>
            </>
          )}
        </nav>

        {/* Question Card */}
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              ✓ Solved
            </span>
            {question.difficulty && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getDifficultyColor(question.difficulty)}`}
              >
                {question.difficulty}
              </span>
            )}
            {question.sourceExam && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {question.sourceExam}
                {question.sourceYear ? ` ${question.sourceYear}` : ''}
              </span>
            )}
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          {/* Question text */}
          <div className="px-5 py-4">
            <h1 className="text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">
              {qText}
            </h1>
            {question.questionBengaliText && question.questionText !== question.questionBengaliText && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {question.questionText}
              </p>
            )}
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Question illustration"
                className="mt-3 max-h-60 rounded-lg border border-slate-200 dark:border-slate-700"
              />
            )}
          </div>

          {/* Options */}
          <div className="space-y-2 px-5 pb-4">
            {OPTION_KEYS.map((key, idx) => {
              const label = OPTION_LABELS[idx];
              const optionText = question[key];
              const isCorrect = question.correctOption === label;

              return (
                <div
                  key={label}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    showAnswer && isCorrect
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      showAnswer && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`text-sm ${
                      showAnswer && isCorrect
                        ? 'font-medium text-emerald-800 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {optionText}
                  </span>
                  {showAnswer && isCorrect && (
                    <CheckCircle2 className="ml-auto h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {showAnswer && !isCorrect && (
                    <XCircle className="ml-auto h-5 w-5 flex-shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Toggle answer visibility */}
          <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>

          {/* Answer / Explanation */}
          {showAnswer && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Correct Answer: Option {question.correctOption} — {correctAnswer}
                </span>
              </div>
              {(question.explanationBengali || question.explanation) && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Explanation
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {question.explanationBengali || question.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </article>

        {/* CTA Banner */}
        <div className="mt-6 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-indigo-50 p-5 dark:border-brand-800 dark:from-brand-900/20 dark:to-indigo-900/20">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            আরও প্রশ্ন অনুশীলন করুন PracticeKoro-তে! 🎯
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            West Bengal-এর সমস্ত প্রতিযোগিতামূলক পরীক্ষার জন্য — WBP, WBCS, Primary TET, Group D
            এবং আরও অনেক কিছু।
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Free-তে শুরু করুন <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/test-series"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Test Series দেখুন <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* More from subject (placeholder) */}
        {question.subjectName && (
          <div className="mt-6">
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
              {question.subjectName} থেকে আরও প্রশ্ন
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              আরও প্রশ্ন অনুশীলনের জন্য{' '}
              <Link to="/register" className="font-medium text-brand-600 hover:underline">
                PracticeKoro-তে সাইন আপ করুন
              </Link>
              ।
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} PracticeKoro. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
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
