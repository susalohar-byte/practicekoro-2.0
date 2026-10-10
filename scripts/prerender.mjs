/**
 * PracticeKoro — Zero-Dependency Build-time SEO Prerender & Sitemap Generator
 *
 * Generates static HTML snapshots for `/questions` and every
 * `/questions/<questionId>/<slug>` page directly from `dist/index.html`
 * without requiring a headless browser binary.
 *
 * Each generated `dist/questions/<questionId>/index.html` includes:
 *   1. <title>[Solved] {question} | PracticeKoro</title>
 *   2. <meta name="description" content="{question}... 1 answer · Top answer: ...">
 *   3. <link rel="canonical" href="https://practicekoro.online/questions/{id}/{slug}">
 *   4. Open Graph & Twitter Card meta tags for rich social/search previews
 *   5. <script type="application/ld+json"> with schema.org QAPage + BreadcrumbList
 *   6. Pre-populated semantic HTML inside <div id="root"> (<h1>, options,
 *      accepted answer, explanation, and internal links) that Googlebot indexes
 *      immediately and React seamlessly hydrates/replaces on client boot.
 *
 * Usage:
 *   npm run build:seo
 *   — OR —
 *   npm run build && node scripts/prerender.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');
const SITE_NAME = 'PracticeKoro';
const SITE_URL = 'https://practicekoro.online';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://prycanbnxuihxhskallw.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWNhbmJueHVpaHhoc2thbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTY1NTgsImV4cCI6MjEwNDg5MjU1OH0.HOzUGuRqD0Y9qWlGGhvHGenylTJ2Sky_G7E3PEO0EIw';

// ---------------------------------------------------------------------------
// Helpers (matching src/utils/seo.ts)
// ---------------------------------------------------------------------------

function slugify(text) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[<>:"/\\|?*#%&=+{}[\]^`~@!$();',]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function getCorrectAnswerText(q) {
  const opt = (q.correctOption || 'A').toUpperCase();
  if (opt === 'B') return q.optionB;
  if (opt === 'C') return q.optionC;
  if (opt === 'D') return q.optionD;
  return q.optionA;
}

function buildQuestionTitle(q) {
  const text = q.questionBengaliText || q.questionText;
  const truncated = text.length > 80 ? text.substring(0, 80) + '...' : text;
  return `[Solved] ${truncated} | ${SITE_NAME}`;
}

function buildQuestionDescription(q) {
  const text = q.questionBengaliText || q.questionText;
  const correctAnswer = getCorrectAnswerText(q);
  const explanation = q.explanationBengali || q.explanation || '';
  const answerSnippet = `সঠিক উত্তরটি হল ${correctAnswer}। ${explanation}`;
  const truncated =
    answerSnippet.length > 155 ? answerSnippet.substring(0, 155) + '...' : answerSnippet;
  return `${text.substring(0, 100)}... 1 answer · Top answer: "${truncated}"`;
}

function buildQAPageJsonLd(q, url) {
  const qText = q.questionBengaliText || q.questionText;
  const correctAnswer = getCorrectAnswerText(q);
  const explanation =
    q.explanationBengali || q.explanation || `সঠিক উত্তর: ${correctAnswer}`;
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

function buildBreadcrumbJsonLd(q, url) {
  const qText = q.questionBengaliText || q.questionText;
  const items = [
    { name: SITE_NAME, url: SITE_URL },
    ...(q.subjectName ? [{ name: q.subjectName, url: `${SITE_URL}/questions` }] : []),
    ...(q.chapterName ? [{ name: q.chapterName, url: `${SITE_URL}/questions` }] : []),
    { name: qText.substring(0, 50) + (qText.length > 50 ? '...' : ''), url },
  ];
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
// Extract seed questions from src/services/mockData.ts as fallback
// ---------------------------------------------------------------------------

function extractSeedQuestions() {
  const mockPath = join(ROOT, 'src', 'services', 'mockData.ts');
  if (!existsSync(mockPath)) return [];
  const src = readFileSync(mockPath, 'utf-8');

  // Extract subject and chapter names
  const subjectNames = new Map();
  const subjRegex = /id:\s*'([^']+)',\s*(?:examId:\s*'[^']+',\s*)?name:\s*'([^']+)'/g;
  let m;
  while ((m = subjRegex.exec(src)) !== null) {
    subjectNames.set(m[1], m[2]);
  }

  const questions = [];
  const seen = new Set();
  const objectBlocks = src.split(/\{\s*\n\s*id:\s*'(q-[^']+)'/);

  for (let i = 1; i < objectBlocks.length; i += 2) {
    const id = objectBlocks[i];
    if (seen.has(id)) continue;
    const body = objectBlocks[i + 1]?.split(/\n\s*\},/)[0] || '';

    const getField = (name) => {
      const dbl = body.match(new RegExp(`${name}:\\s*"([^"]*)"`));
      if (dbl) return dbl[1].replace(/\\n/g, '\n');
      const sgl = body.match(new RegExp(`${name}:\\s*'([^']*)'`));
      if (sgl) return sgl[1].replace(/\\n/g, '\n');
      return '';
    };

    const questionText = getField('questionText');
    if (!questionText) continue;

    seen.add(id);
    const subjectId = getField('subjectId');
    const chapterId = getField('chapterId');

    questions.push({
      id,
      subjectId,
      subjectName: subjectNames.get(subjectId) || 'General Studies',
      chapterId,
      chapterName: subjectNames.get(chapterId) || undefined,
      questionText,
      questionBengaliText: getField('questionBengaliText') || questionText,
      optionA: getField('optionA') || 'Option A',
      optionB: getField('optionB') || 'Option B',
      optionC: getField('optionC') || 'Option C',
      optionD: getField('optionD') || 'Option D',
      correctOption: getField('correctOption') || 'A',
      explanation: getField('explanation'),
      explanationBengali: getField('explanationBengali'),
      difficulty: getField('difficulty') || 'medium',
    });
  }

  return questions;
}

// ---------------------------------------------------------------------------
// Inject SEO Head + Root HTML into template
// ---------------------------------------------------------------------------

function renderSeoHtml(templateHtml, { title, description, canonicalUrl, jsonLdList, bodyHtml }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(canonicalUrl);

  const jsonLdScripts = jsonLdList
    .map((data) => `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)
    .join('\n');

  let html = templateHtml;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`);

  // Replace <meta name="description" ...>
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${safeDesc}" />`
  );

  // Replace Open Graph & Twitter tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${safeUrl}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );

  // Inject canonical + JSON-LD right before </head>
  const headInjection = `    <link rel="canonical" href="${safeUrl}" />\n${jsonLdScripts}\n  </head>`;
  html = html.replace('</head>', headInjection);

  // Inject semantic HTML inside <div id="root">...</div>
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  return html;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  PracticeKoro — SEO Prerender & Sitemap      ║');
  console.log('╚══════════════════════════════════════════════╝');

  const templatePath = join(DIST, 'index.html');
  if (!existsSync(templatePath)) {
    console.error('ERROR: dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }
  const templateHtml = readFileSync(templatePath, 'utf-8');

  // 1. Fetch questions from Supabase RPC or fallback to seed questions
  console.log('\n[1/3] Loading questions for prerendering...');
  let questions = [];

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_seo_questions', {
      p_subject_id: null,
      p_search: null,
      p_limit: 1000,
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      questions = rpcData;
      console.log(`  ✓ Loaded ${questions.length} active questions from Supabase RPC`);
    }
  } catch (err) {
    console.warn(`  ⚠ Supabase RPC notice: ${err.message}`);
  }

  const seedQuestions = extractSeedQuestions();
  const existingIds = new Set(questions.map((q) => q.id));
  for (const sq of seedQuestions) {
    if (!existingIds.has(sq.id)) {
      questions.push(sq);
    }
  }
  console.log(`  ✓ Total questions to prerender: ${questions.length}`);

  // 2. Prerender each question page + /questions directory page
  console.log('\n[2/3] Generating static SEO HTML snapshots...');
  const sitemapEntries = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/questions', priority: '0.9', changefreq: 'daily' },
    { url: '/test-series', priority: '0.8', changefreq: 'weekly' },
    { url: '/subscription', priority: '0.6', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/contact-us', priority: '0.3', changefreq: 'yearly' },
  ];

  let count = 0;
  for (const q of questions) {
    const qText = q.questionBengaliText || q.questionText;
    const slug = slugify(qText);
    const relativePath = `/questions/${q.id}/${encodeURI(slug)}`;
    const canonicalUrl = `${SITE_URL}/questions/${q.id}/${slug}`;
    const title = buildQuestionTitle(q);
    const description = buildQuestionDescription(q);
    const correctAnswer = getCorrectAnswerText(q);
    const explanation = q.explanationBengali || q.explanation || '';

    const bodyHtml = `
      <main style="max-width:768px;margin:0 auto;padding:24px;font-family:sans-serif;">
        <nav aria-label="Breadcrumb">
          <a href="${SITE_URL}">PracticeKoro</a> &rsaquo;
          <a href="${SITE_URL}/questions">${escapeHtml(q.subjectName || 'Questions')}</a>
          ${q.chapterName ? `&rsaquo; <span>${escapeHtml(q.chapterName)}</span>` : ''}
        </nav>
        <article>
          <h1>${escapeHtml(qText)}</h1>
          ${
            q.questionBengaliText && q.questionText && q.questionText !== q.questionBengaliText
              ? `<p>${escapeHtml(q.questionText)}</p>`
              : ''
          }
          <ol type="A">
            <li>${escapeHtml(q.optionA)}</li>
            <li>${escapeHtml(q.optionB)}</li>
            <li>${escapeHtml(q.optionC)}</li>
            <li>${escapeHtml(q.optionD)}</li>
          </ol>
          <section>
            <h2>সঠিক উত্তর (Correct Answer)</h2>
            <p><strong>সঠিক উত্তরটি হল Option ${escapeHtml(q.correctOption)}: ${escapeHtml(correctAnswer)}</strong></p>
            ${explanation ? `<h3>Key Points / ব্যাখ্যা</h3><p>${escapeHtml(explanation)}</p>` : ''}
          </section>
        </article>
      </main>`;

    const pageHtml = renderSeoHtml(templateHtml, {
      title,
      description,
      canonicalUrl,
      jsonLdList: [buildQAPageJsonLd(q, canonicalUrl), buildBreadcrumbJsonLd(q, canonicalUrl)],
      bodyHtml,
    });

    const outFile = join(DIST, 'questions', q.id, 'index.html');
    ensureDir(outFile);
    writeFileSync(outFile, pageHtml, 'utf-8');

    sitemapEntries.push({
      url: relativePath,
      priority: '0.7',
      changefreq: 'weekly',
    });
    count++;
  }

  // Prerender /questions directory page with FAQPage schema & links to all questions
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.slice(0, 15).map((q) => {
      const qText = q.questionBengaliText || q.questionText;
      const correctAnswer = getCorrectAnswerText(q);
      return {
        '@type': 'Question',
        name: qText,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `সঠিক উত্তরটি হল ${correctAnswer}। ${q.explanationBengali || q.explanation || ''}`,
        },
      };
    }),
  };

  const directoryLinksHtml = questions
    .map((q) => {
      const qText = q.questionBengaliText || q.questionText;
      const slug = slugify(qText);
      const correctAnswer = getCorrectAnswerText(q);
      return `<li><a href="/questions/${escapeHtml(q.id)}/${escapeHtml(slug)}">[Solved] ${escapeHtml(qText)}</a> — উত্তর: ${escapeHtml(correctAnswer)}</li>`;
    })
    .join('\n');

  const directoryHtml = renderSeoHtml(templateHtml, {
    title: 'প্রশ্নব্যাংক | PracticeKoro — Solved Questions for WB Competitive Exams',
    description:
      'PracticeKoro-র প্রশ্নব্যাংক — সমস্ত বিষয়ের সমাধানসহ প্রশ্ন। WBP, WBCS, Primary TET, Group D পরীক্ষার জন্য অনুশীলন করুন।',
    canonicalUrl: `${SITE_URL}/questions`,
    jsonLdList: [faqJsonLd],
    bodyHtml: `<main style="max-width:896px;margin:0 auto;padding:24px;font-family:sans-serif;"><h1>প্রশ্নব্যাংক — Solved Questions | PracticeKoro</h1><ul>${directoryLinksHtml}</ul></main>`,
  });

  const listingFile = join(DIST, 'questions', 'index.html');
  ensureDir(listingFile);
  writeFileSync(listingFile, directoryHtml, 'utf-8');

  console.log(`  ✓ Prerendered /questions directory + ${count} individual question pages`);

  // 3. Write sitemap.xml
  console.log('\n[3/3] Generating sitemap.xml...');
  const today = new Date().toISOString().split('T')[0];
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(`${SITE_URL}${entry.url}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml, 'utf-8');
  writeFileSync(join(PUBLIC, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log(`  ✓ Written dist/sitemap.xml & public/sitemap.xml (${sitemapEntries.length} URLs)`);

  console.log('\n══════════════════════════════════════════════');
  console.log(`  DONE: ${count} question pages prerendered in dist/questions/`);
  console.log('══════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
