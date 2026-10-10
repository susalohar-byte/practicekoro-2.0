import { uploadValidatedImage, validateRasterFile } from '@/lib/rasterUploads';
import { requireSavedRow } from './admin.mutations';
import { deleteAdminRecord } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  localExams,
  localTestSeries,
  localTests,
  DEFAULT_SHOWCASE_SERIES,
} from '@/services/domains/localStore';
import type { TestSeries, TestSeriesStatus, PopularTestSeriesCard } from '@/types';

export { DEFAULT_SHOWCASE_SERIES };

/** Section of the admin API: testSeries (split from domains/admin.ts). */
// --------------------------------------------------------------------------
// TEST SERIES API
// --------------------------------------------------------------------------

const SERIES_SELECT = '*, exams:exam_id(title, category), tests(id, test_type)';
const SERIES_RETURN_SELECT = '*, exams:exam_id(title, category)';

/**
 * Columns introduced by migration 20261005040000. If that migration has not
 * been applied yet, writes containing them fail with PGRST204 / "column ...
 * does not exist"; we strip them and retry so the panel keeps working.
 */

const ICON_CACHE_KEY = 'practicekoro_series_icons';
export const SERIES_STORAGE_KEY = 'pk_admin_test_series_list';

export function getStoredTestSeries(): TestSeries[] {
  if (typeof window === 'undefined') return [...DEFAULT_SHOWCASE_SERIES];
  try {
    const raw = localStorage.getItem(SERIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(DEFAULT_SHOWCASE_SERIES));
      return [...DEFAULT_SHOWCASE_SERIES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_SHOWCASE_SERIES];
  } catch {
    return [...DEFAULT_SHOWCASE_SERIES];
  }
}

export function saveStoredTestSeries(list: TestSeries[]): void {
  localTestSeries.length = 0;
  localTestSeries.push(...list);
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pk_test_series_updated', { detail: list }));
  } catch (err) {
    console.warn('Failed to save test series to localStorage:', err);
  }
}

function readIconCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ICON_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeIconCache(id: string, iconUrl: string | undefined) {
  try {
    const icons = readIconCache();
    if (iconUrl) icons[id] = iconUrl;
    else delete icons[id];
    localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(icons));
  } catch {
    // localStorage unavailable — icon still lives in the DB when icon_url exists
  }
}

/** Run a write; on a missing-column error drop optional columns one by one and retry. */
async function writeWithSchemaFallback(
  payload: Record<string, unknown>,
  run: (p: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>
): Promise<any> {
  return requireSavedRow(await run(payload));
}

function normalizeTestType(type: string): 'full_mock' | 'pyq' | 'topic' {
  if (type === 'full_mock') return 'full_mock';
  if (type === 'pyq') return 'pyq';
  return 'topic'; // topic, chapter_mock, subject_mock
}

function countTests(tests: { testType?: string; test_type?: string }[]) {
  let fullMockCount = 0;
  let pyqTestCount = 0;
  let topicTestCount = 0;
  for (const t of tests) {
    const kind = normalizeTestType(String(t.testType ?? t.test_type ?? ''));
    if (kind === 'full_mock') fullMockCount++;
    else if (kind === 'pyq') pyqTestCount++;
    else topicTestCount++;
  }
  const total = tests.length;
  return { fullMockCount, pyqTestCount, topicTestCount, testCount: total, testsCount: total };
}

function resolveStatus(row: {
  status?: string | null;
  is_active?: boolean | null;
}): TestSeriesStatus {
  const s = row.status;
  if (s === 'published' || s === 'draft' || s === 'under_review' || s === 'archived') return s;
  return row.is_active === false ? 'draft' : 'published';
}

function mapSeriesRow(row: any, iconCache: Record<string, string>): TestSeries {
  const status = resolveStatus(row);
  return {
    id: row.id,
    examId: row.exam_id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    slug: row.slug,
    description: row.description ?? undefined,
    iconUrl: row.icon_url || (!isSupabaseConfigured ? iconCache[row.id] : undefined),
    bannerUrl: row.banner_url ?? undefined,
    isPremium: Boolean(row.is_premium),
    orderIndex: row.order_index ?? 0,
    status,
    isActive: status === 'published',
    isPopular: Boolean(row.is_popular),
    createdAt: row.created_at,
    examTitle: row.exams?.title || undefined,
    examCategory: row.exams?.category || undefined,
  };
}

type SeriesMetrics = { enrollmentCount: number; avgAccuracy?: number };

/** Admin-only aggregate. Returns an empty map if the RPC is unavailable. */
async function fetchSeriesMetrics(): Promise<Map<string, SeriesMetrics>> {
  const map = new Map<string, SeriesMetrics>();
  try {
    const { data, error } = await supabase.rpc('admin_get_test_series_metrics');
    if (error || !Array.isArray(data)) return map;
    for (const r of data as any[]) {
      map.set(r.series_id, {
        enrollmentCount: Number(r.enrollment_count || 0),
        avgAccuracy: r.avg_accuracy != null ? Number(r.avg_accuracy) : undefined,
      });
    }
  } catch {
    // RPC not deployed yet — metrics show as 0 / N/A instead of fake numbers
  }
  return map;
}

export async function getTestSeries(examId?: string): Promise<TestSeries[]> {
  const iconCache = readIconCache();
  const stored = getStoredTestSeries();

  if (!isSupabaseConfigured) {
    return stored
      .filter((s) => !examId || s.examId === examId)
      .map((s) => {
        const exam = localExams.find((e) => e.id === s.examId);
        const status = s.status || (s.isActive ? 'published' : 'draft');
        return {
          ...s,
          status,
          isActive: status === 'published',
          iconUrl: s.iconUrl || iconCache[s.id] || undefined,
          examTitle: exam?.title || s.examTitle,
          examCategory: exam?.category || s.examCategory,
          ...countTests(localTests.filter((t) => t.testSeriesId === s.id)),
        };
      })
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  let query = supabase
    .from('test_series')
    .select(SERIES_SELECT)
    .order('order_index', { ascending: true });
  if (examId) query = query.eq('exam_id', examId);

  {
    const [{ data, error }, metrics] = await Promise.all([query, fetchSeriesMetrics()]);
    if (error || !data || data.length === 0) {
      if (error) throw new Error(error.message);
      return [];
    }

    const fetched = data.map((row: any) => {
      const m = metrics.get(row.id);
      return {
        ...mapSeriesRow(row, iconCache),
        ...countTests(Array.isArray(row.tests) ? row.tests : []),
        enrollmentCount: m?.enrollmentCount ?? 0,
        avgAccuracy: m?.avgAccuracy,
      };
    });
    saveStoredTestSeries(fetched);
    return fetched;
  }
}

export async function getTestSeriesById(id: string): Promise<TestSeries | null> {
  const all = await getTestSeries();
  return all.find((s) => s.id === id) || null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createTestSeries(
  input: Omit<TestSeries, 'id'> | TestSeries
): Promise<TestSeries> {
  if (!input.title.trim() || !input.examId) throw new Error('Series title and exam are required.');
  const id = crypto.randomUUID(),
    status = input.status || (input.isActive ? 'published' : 'draft'),
    saved = {
      ...input,
      id,
      slug: input.slug || slugify(input.title),
      status,
      isActive: status === 'published',
    };
  if (!isSupabaseConfigured) {
    saveStoredTestSeries([saved, ...getStoredTestSeries()]);
    return saved;
  }
  const payload: Record<string, unknown> = { id, status, is_active: saved.isActive };
  for (const [k, c] of Object.entries({
    title: 'title',
    slug: 'slug',
    description: 'description',
    examId: 'exam_id',
    isPremium: 'is_premium',
    orderIndex: 'order_index',
    subtitle: 'subtitle',
    bannerUrl: 'banner_url',
    iconUrl: 'icon_url',
    isPopular: 'is_popular',
    isFeatured: 'is_popular',
  }))
    if ((saved as any)[k] !== undefined) payload[c] = (saved as any)[k];
  const d = await writeWithSchemaFallback(payload, (p) =>
    supabase.from('test_series').insert(p).select(SERIES_RETURN_SELECT).single()
  );
  return mapSeriesRow(d, {});
}

export async function updateTestSeries(
  id: string,
  input: Partial<TestSeries>
): Promise<TestSeries> {
  if (input.title !== undefined && !input.title.trim())
    throw new Error('Series title is required.');
  if (!isSupabaseConfigured) {
    const rows = getStoredTestSeries(),
      i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('Series not found.');
    rows[i] = { ...rows[i], ...input };
    saveStoredTestSeries(rows);
    return rows[i];
  }
  const payload: Record<string, unknown> = {};
  for (const [k, c] of Object.entries({
    title: 'title',
    slug: 'slug',
    description: 'description',
    examId: 'exam_id',
    isPremium: 'is_premium',
    orderIndex: 'order_index',
    subtitle: 'subtitle',
    bannerUrl: 'banner_url',
    iconUrl: 'icon_url',
    isPopular: 'is_popular',
    isFeatured: 'is_popular',
  }))
    if ((input as any)[k] !== undefined) payload[c] = (input as any)[k];
  if (input.status !== undefined) {
    payload.status = input.status;
    payload.is_active = input.status === 'published';
  } else if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
    payload.status = input.isActive ? 'published' : 'draft';
  }
  const d = await writeWithSchemaFallback(payload, (p) =>
    supabase.from('test_series').update(p).eq('id', id).select(SERIES_RETURN_SELECT).single()
  );
  if (d.id !== id) throw new Error('Matching series was not saved.');
  return mapSeriesRow(d, {});
}

/** Persist a full display order in one pass (only rows whose index changed). */
export async function reorderTestSeries(
  ordered: { id: string; orderIndex: number }[]
): Promise<void> {
  for (const r of ordered) await updateTestSeries(r.id, { orderIndex: r.orderIndex });
}

/** Link (or unlink with `null`) many tests to a series in a single request. */
export async function assignTestsToSeries(ids: string[], seriesId: string | null): Promise<void> {
  if (!ids.length) return;
  if (!isSupabaseConfigured) {
    for (const t of localTests) if (ids.includes(t.id)) t.testSeriesId = seriesId || undefined;
    return;
  }
  const { data, error } = await supabase.rpc('admin_assign_series_tests', {
    p_ids: ids,
    p_series_id: seriesId,
  });
  if (error) throw new Error(error.message);
  if (
    data?.success !== true ||
    !Array.isArray(data.saved_ids) ||
    data.saved_ids.length !== ids.length ||
    ids.some((id) => !data.saved_ids.includes(id))
  )
    throw new Error('Not all assignments were confirmed.');
}

export async function deleteTestSeries(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    await deleteAdminRecord('test_series', id);
  } else {
    const rows = getStoredTestSeries();
    if (!rows.some((s) => s.id === id)) throw new Error('Series not found.');
    saveStoredTestSeries(rows.filter((s) => s.id !== id));
  }
  writeIconCache(id, undefined);
  return true;
}

export const DEFAULT_POPULAR_TEST_SERIES: PopularTestSeriesCard[] = [
  {
    id: 'popular-series-wbp',
    testSeriesId: 'wbp-constable',
    title: 'WBP Constable',
    subtitle: 'Complete Mock Test Series',
    cardGradientStart: '#0052D4',
    cardGradientEnd: '#0A2E6E',
    cardArrowColor: '#026BFC',
    cardBgImage: '/images/exams/bg_wbp.png',
    cardLogoUrl: '/images/exams/emblem_series_wbp.png',
    orderIndex: 1,
    isActive: true,
    route: '/test-series/wbp-constable',
    badgeText: 'Most Popular',
    fullMockCount: 12,
    topicTestCount: 48,
    pyqTestCount: 15,
  },
  {
    id: 'popular-series-railway',
    testSeriesId: 'railway-ntpc',
    title: 'Railway (NTPC)',
    subtitle: 'RRB NTPC Preparation Series',
    cardGradientStart: '#7F1D1D',
    cardGradientEnd: '#450A0A',
    cardArrowColor: '#DC2626',
    cardBgImage: '/images/exams/bg_railway.png',
    cardLogoUrl: '/images/exams/logo_railway.png',
    orderIndex: 2,
    isActive: true,
    route: '/test-series/railway-ntpc',
    badgeText: 'Trending Now',
    fullMockCount: 15,
    topicTestCount: 60,
    pyqTestCount: 25,
  },
  {
    id: 'popular-series-ssc',
    testSeriesId: 'ssc-mts',
    title: 'SSC MTS',
    subtitle: 'Staff Selection Commission Series',
    cardGradientStart: '#FFF4DC',
    cardGradientEnd: '#FCE39E',
    cardArrowColor: '#D97706',
    cardBgImage: '/images/exams/bg_ssc.png',
    cardLogoUrl: '/images/exams/logo_ssc.png',
    orderIndex: 3,
    isActive: true,
    route: '/test-series/ssc-mts',
    badgeText: 'Staff Selection',
    fullMockCount: 18,
    topicTestCount: 32,
    pyqTestCount: 14,
  },
  {
    id: 'popular-series-kp',
    testSeriesId: 'kp-constable',
    title: 'KP Constable',
    subtitle: 'Kolkata Police Complete Series',
    cardGradientStart: '#4C1D95',
    cardGradientEnd: '#2E1065',
    cardArrowColor: '#8B5CF6',
    cardBgImage: '/images/series_kp_bg.png',
    cardLogoUrl: '/images/exams/emblem_series_kp.png',
    orderIndex: 4,
    isActive: true,
    route: '/test-series/kp-constable',
    badgeText: 'Kolkata Police',
    fullMockCount: 10,
    topicTestCount: 35,
    pyqTestCount: 10,
  },
];

async function attachPopularTestSeriesCounts(
  cards: PopularTestSeriesCard[]
): Promise<PopularTestSeriesCard[]> {
  if (!isSupabaseConfigured || cards.length === 0) {
    return [...cards].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  try {
    const { data: tests, error } = await supabase
      .from('tests')
      .select('id, test_series_id, test_type, is_active, status');
    if (error) throw error;

    const activeTests = (tests || []).filter(
      (t: any) => t.is_active !== false && (t.status === 'published' || !t.status)
    );

    return cards
      .map((card) => {
        if (!card.testSeriesId) return card;
        const seriesTests = activeTests.filter((t: any) => t.test_series_id === card.testSeriesId);
        if (seriesTests.length === 0) return card;

        const fullMockCount = seriesTests.filter((t: any) => t.test_type === 'full_mock').length;
        const pyqTestCount = seriesTests.filter((t: any) => t.test_type === 'pyq').length;
        const topicTestCount = seriesTests.filter(
          (t: any) =>
            t.test_type === 'topic' ||
            t.test_type === 'chapter_mock' ||
            t.test_type === 'subject_mock'
        ).length;

        return {
          ...card,
          fullMockCount,
          pyqTestCount,
          topicTestCount,
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  } catch (err) {
    console.warn('Could not attach real-time test counts for Popular Test Series:', err);
    return [...cards].sort((a, b) => a.orderIndex - b.orderIndex);
  }
}

export async function getPopularTestSeriesCards(): Promise<PopularTestSeriesCard[]> {
  if (!isSupabaseConfigured) return attachPopularTestSeriesCounts(DEFAULT_POPULAR_TEST_SERIES);

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', 'popular_test_series_config')
      .maybeSingle();
    if (error) throw error;
    if (!data?.value) return await attachPopularTestSeriesCounts(DEFAULT_POPULAR_TEST_SERIES);
    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return await attachPopularTestSeriesCounts(DEFAULT_POPULAR_TEST_SERIES);
    }
    return await attachPopularTestSeriesCounts(parsed as PopularTestSeriesCard[]);
  } catch (err) {
    console.warn('Could not fetch remote Popular Test Series settings:', err);
    return await attachPopularTestSeriesCounts(DEFAULT_POPULAR_TEST_SERIES);
  }
}

export async function savePopularTestSeries(
  cards: PopularTestSeriesCard[]
): Promise<PopularTestSeriesCard[]> {
  const normalized = cards.map((card, index) => ({ ...card, orderIndex: index + 1 }));
  if (!isSupabaseConfigured) {
    throw new Error('Connect to the Admin Panel database before saving Popular Test Series.');
  }

  const settingRow = {
    id: 'popular_test_series_config',
    category: 'general',
    key: 'popular_test_series_config',
    value: normalized,
    description: 'Admin-managed Popular Test Series cards shown in student apps',
    updated_at: new Date().toISOString(),
  };

  let saved = false;
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_app_settings', {
      p_settings: [settingRow],
    });
    if (!rpcError && (rpcData?.success || rpcData?.updated_count !== undefined)) {
      saved = true;
    }
  } catch {
    // Fallback to direct upsert
  }

  if (!saved) {
    const { error } = await supabase.from('app_settings').upsert(settingRow, { onConflict: 'id' });
    if (error) {
      throw new Error(`Could not save Popular Test Series settings: ${error.message}`);
    }
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('practicekoro:popular_test_series_updated'));
    }
  } catch {
    // ignore
  }

  return await getPopularTestSeriesCards();
}

export async function uploadPopularTestSeriesImage(
  file: File,
  _cardId: string,
  _kind: 'logo' | 'background'
): Promise<string>{
  validateRasterFile(file, 'banners');
  if (isSupabaseConfigured) return uploadValidatedImage(file, 'banners');
  return new Promise<string>((resolve,reject)=>{const reader=new FileReader(); reader.onload=()=>resolve(reader.result as string);reader.onerror=()=>reject(new Error('Image read failed'));reader.readAsDataURL(file);});
}

export async function uploadTestSeriesIcon(file: File, _id: string = 'custom'): Promise<string>{
  validateRasterFile(file, 'banners');
  if (isSupabaseConfigured) return uploadValidatedImage(file, 'banners');
  return new Promise<string>((resolve,reject)=>{const reader=new FileReader(); reader.onload=()=>resolve(reader.result as string);reader.onerror=()=>reject(new Error('Image read failed'));reader.readAsDataURL(file);});
}

export function subscribeToPopularTestSeriesUpdates(callback: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel('popular-test-series-settings-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'app_settings',
        filter: 'id=eq.popular_test_series_config',
      },
      callback
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export const adminTestSeriesApi = {
  getTestSeries,
  getTestSeriesById,
  getPopularTestSeries: getPopularTestSeriesCards,
  getPopularTestSeriesCards,
  savePopularTestSeries,
  uploadPopularTestSeriesImage,
  uploadTestSeriesIcon,
  subscribeToPopularTestSeriesUpdates,
  DEFAULT_POPULAR_TEST_SERIES,
  DEFAULT_SHOWCASE_SERIES,
  createTestSeries,
  updateTestSeries,
  deleteTestSeries,
  reorderTestSeries,
  assignTestsToSeries,
};
