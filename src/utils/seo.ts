/**
 * SEO utilities for PracticeKoro.
 *
 * Generates JSON-LD structured data (QAPage, BreadcrumbList) and meta-tag
 * helpers so that uploaded questions can appear in Google Search results with
 * rich snippets — exactly like Testbook's "[Solved]" results.
 */

import type { Question } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SITE_NAME = 'PracticeKoro';
const SITE_URL = 'https://practicekoro.online';
const SITE_LOGO = `${SITE_URL}/logo.png`;

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

/**
 * Converts question text into a URL-safe slug.
 * Supports Bengali (Unicode) characters alongside ASCII.
 */
export function questionSlug(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/[<>:"/\\|?*#%&=+{}[\]^`~@!$();',]/g, '') // strip URL-unsafe chars
    .replace(/-{2,}/g, '-') // collapse hyphens
    .replace(/^-|-$/g, '') // trim leading/trailing hyphens
    .substring(0, 120); // keep URLs manageable
}

/** Canonical URL for a single question page. */
export function questionPageUrl(questionId: string, questionText: string): string {
  const slug = questionSlug(questionText);
  return `${SITE_URL}/questions/${questionId}/${slug}`;
}

// ---------------------------------------------------------------------------
// Structured Data: QAPage (schema.org)
// ---------------------------------------------------------------------------

export interface QAPageJsonLdInput {
  question: Question;
  url: string;
}

/**
 * Generates a `QAPage` JSON-LD object that tells Google this page has
 * one question with an accepted answer.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/qapage
 */
export function generateQAPageJsonLd({ question, url }: QAPageJsonLdInput): object {
  const qText = question.questionBengaliText || question.questionText;
  const correctOptionKey = `option${question.correctOption}` as
    | 'optionA'
    | 'optionB'
    | 'optionC'
    | 'optionD';
  const correctAnswer = question[correctOptionKey];
  const explanation =
    question.explanationBengali || question.explanation || `সঠিক উত্তর: ${correctAnswer}`;

  const answerText = `সঠিক উত্তরটি হল ${correctAnswer}। ${explanation}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: qText,
      text: qText,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answerText,
        upvoteCount: 1,
        url,
      },
      dateCreated: new Date().toISOString(),
      author: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Structured Data: BreadcrumbList
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// Structured Data: FAQPage (for listing pages)
// ---------------------------------------------------------------------------

export function generateFAQPageJsonLd(
  questions: Array<{ questionText: string; answer: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.questionText,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// Meta tag helpers
// ---------------------------------------------------------------------------

/**
 * Title format like Testbook: "[Solved] গৌতম বুদ্ধ সারনাথে তাঁর প্রথম ধর্মোপদেশ ______"
 */
export function questionPageTitle(question: Question): string {
  const text = question.questionBengaliText || question.questionText;
  const truncated = text.length > 80 ? text.substring(0, 80) + '...' : text;
  return `[Solved] ${truncated} | ${SITE_NAME}`;
}

/**
 * Meta description: includes the answer preview.
 */
export function questionPageDescription(question: Question): string {
  const text = question.questionBengaliText || question.questionText;
  const correctOptionKey = `option${question.correctOption}` as
    | 'optionA'
    | 'optionB'
    | 'optionC'
    | 'optionD';
  const correctAnswer = question[correctOptionKey];
  const explanation =
    question.explanationBengali || question.explanation || '';

  const answerSnippet = `সঠিক উত্তরটি হল ${correctAnswer}। ${explanation}`;
  const truncated =
    answerSnippet.length > 155
      ? answerSnippet.substring(0, 155) + '...'
      : answerSnippet;

  return `${text.substring(0, 100)}... 1 answer · Top answer: "${truncated}"`;
}

/** Organization JSON-LD for the site (added once at root). */
export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    sameAs: [],
  };
}
