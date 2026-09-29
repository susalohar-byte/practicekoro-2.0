/**
 * PracticeKoro — Static Sitemap Generator
 *
 * Generates a sitemap.xml listing all public pages and active questions.
 * Connects to Supabase via the public SEO RPC `get_public_seo_questions`
 * (with fallback to direct table query and built-in seed questions).
 *
 * Usage:
 *   node scripts/generate-sitemap.mjs
 *
 * Output: dist/sitemap.xml (if dist/ exists) and public/sitemap.xml
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');
const SITE_URL = 'https://practicekoro.online';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://prycanbnxuihxhskallw.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWNhbmJueHVpaHhoc2thbGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTY1NTgsImV4cCI6MjEwNDg5MjU1OH0.HOzUGuRqD0Y9qWlGGhvHGenylTJ2Sky_G7E3PEO0EIw';

function slugify(text) {
  return String(text || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[<>:"/\\|?*#%&=+{}[\]^`~@!$();',]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 120);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractSeedQuestionsFromMockData() {
  const mockPath = join(ROOT, 'src', 'services', 'mockData.ts');
  if (!existsSync(mockPath)) return [];
  const src = readFileSync(mockPath, 'utf-8');
  const results = [];
  const blockRegex =
    /id:\s*'(q-[^']+)'[\s\S]*?questionText:\s*["']([^"']+)["'](?:[\s\S]*?questionBengaliText:\s*["']([^"']+)["'])?/g;
  let match;
  const seen = new Set();
  while ((match = blockRegex.exec(src)) !== null) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const text = match[3] || match[2];
    results.push({ id, text });
  }
  return results;
}

async function main() {
  console.log('PracticeKoro — Sitemap Generator');
  console.log('================================\n');

  const today = new Date().toISOString().split('T')[0];

  const entries = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/questions', priority: '0.9', changefreq: 'daily' },
    { url: '/test-series', priority: '0.8', changefreq: 'weekly' },
    { url: '/subscription', priority: '0.6', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/contact-us', priority: '0.3', changefreq: 'yearly' },
  ];

  let questionsAdded = 0;

  try {
    console.log('Fetching questions from Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Try public SEO RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_seo_questions', {
      p_subject_id: null,
      p_search: null,
      p_limit: 1000,
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      console.log(`  ✓ Found ${rpcData.length} active questions via get_public_seo_questions RPC`);
      for (const q of rpcData) {
        const text = q.questionBengaliText || q.question_bengali_text || q.questionText || q.question_text;
        const slug = slugify(text);
        entries.push({
          url: `/questions/${q.id}/${encodeURI(slug)}`,
          priority: '0.7',
          changefreq: 'weekly',
        });
        questionsAdded++;
      }
    } else {
      // 2. Try direct table query
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, question_bengali_text')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        console.log(`  ✓ Found ${data.length} active questions from table`);
        for (const q of data) {
          const text = q.question_bengali_text || q.question_text;
          const slug = slugify(text);
          entries.push({
            url: `/questions/${q.id}/${encodeURI(slug)}`,
            priority: '0.7',
            changefreq: 'weekly',
          });
          questionsAdded++;
        }
      }
    }
  } catch (err) {
    console.warn(`  ⚠ Supabase fetch notice: ${err.message}`);
  }

  // 3. Fallback / supplement with seed questions if none returned from DB
  if (questionsAdded === 0) {
    const seedQuestions = extractSeedQuestionsFromMockData();
    console.log(`  ✓ Including ${seedQuestions.length} catalog questions in sitemap`);
    for (const q of seedQuestions) {
      const slug = slugify(q.text);
      entries.push({
        url: `/questions/${q.id}/${encodeURI(slug)}`,
        priority: '0.7',
        changefreq: 'weekly',
      });
    }
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
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

  if (existsSync(DIST)) {
    writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml, 'utf-8');
    console.log(`\n✓ Written: dist/sitemap.xml (${entries.length} URLs)`);
  }

  writeFileSync(join(PUBLIC, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log(`✓ Written: public/sitemap.xml (${entries.length} URLs)`);

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
