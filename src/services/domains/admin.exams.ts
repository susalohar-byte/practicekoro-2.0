import { requireSavedRow, deleteAdminRecord } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localExams, localTests } from '@/services/domains/localStore';
import { notifyExamsUpdated } from '@/lib/dataSync';
import type { Exam, PopularExamCard } from '@/types';
import type { ExamRow } from '@/services/domains/localStore';

/** Section of the admin API: exams (split from domains/admin.ts, same behaviour). */
// Per-exam content counts by test type. Topic tests are reusable across
// exams via the test_exams junction, so an exam's topic count includes
// tests associated through that junction (matching the student catalog).
export async function getExamContentCounts(): Promise<
  Record<string, { fullMock: number; pyq: number; topic: number }>
> {
  const counts: Record<string, { fullMock: number; pyq: number; topic: number }> = {};
  const bump = (examId: string | null | undefined, kind: 'fullMock' | 'pyq' | 'topic') => {
    if (!examId) return;
    counts[examId] = counts[examId] || { fullMock: 0, pyq: 0, topic: 0 };
    counts[examId][kind] += 1;
  };
  const classify = (type: string | null | undefined): 'fullMock' | 'pyq' | 'topic' | null => {
    if (type === 'full_mock') return 'fullMock';
    if (type === 'pyq') return 'pyq';
    if (type === 'topic' || type === 'chapter_mock' || type === 'subject_mock') return 'topic';
    return null;
  };

  if (!isSupabaseConfigured) {
    const commonTopicCount = localTests.filter(
      (t) => classify((t as any).testType) === 'topic'
    ).length;

    for (const t of localTests) {
      const kind = classify((t as any).testType);
      if (kind && kind !== 'topic') bump(t.examId, kind);
    }
    for (const e of localExams) {
      counts[e.id] = counts[e.id] || { fullMock: 0, pyq: 0, topic: 0 };
      counts[e.id].topic = commonTopicCount;
    }
    return counts;
  }

  try {
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('id, exam_id, test_type');
    if (testsError) throw new Error(testsError.message);

    const { data: assoc, error: assocError } = await supabase
      .from('test_exams')
      .select('test_id, exam_id');
    if (assocError) throw new Error(assocError.message);

    // Total topic tests available across the platform (common for all exams)
    const commonTopicCount = (tests ?? []).filter(
      (t: any) => classify(t.test_type) === 'topic'
    ).length;

    const seen = new Set<string>();
    for (const row of tests ?? []) {
      const kind = classify(row.test_type);
      if (!kind) continue;
      if (kind !== 'topic') {
        bump(row.exam_id, kind);
      }
      if (row.exam_id) seen.add(`${row.id}:${row.exam_id}`);
    }
    // Extra exam links from the junction (skip duplicates of the owning exam_id)
    for (const row of assoc ?? []) {
      const kind = classify((tests ?? []).find((t) => t.id === row.test_id)?.test_type);
      if (!kind) continue;
      if (kind !== 'topic') {
        const key = `${row.test_id}:${row.exam_id}`;
        if (!seen.has(key)) {
          bump(row.exam_id, kind);
          seen.add(key);
        }
      }
    }

    // Ensure every exam receives the common topic count
    const { data: allExams, error: examsError } = await supabase.from('exams').select('id');
    if (examsError) throw new Error(examsError.message);

    for (const ex of allExams ?? []) {
      counts[ex.id] = counts[ex.id] || { fullMock: 0, pyq: 0, topic: 0 };
      counts[ex.id].topic = commonTopicCount;
    }
  } catch (err) {
    console.warn('getExamContentCounts failed:', err);
  }
  return counts;
}

// --------------------------------------------------------------------------
// EXAMS API
// --------------------------------------------------------------------------
export async function getAllAdminExams(): Promise<Exam[]> {
  if (!isSupabaseConfigured) {
    const contentCounts = await getExamContentCounts();
    const empty = { fullMock: 0, pyq: 0, topic: 0 };
    return localExams.map((e) => {
      const fullMock = contentCounts[e.id]?.fullMock ?? empty.fullMock;
      const pyq = contentCounts[e.id]?.pyq ?? empty.pyq;
      const topic = contentCounts[e.id]?.topic ?? empty.topic;
      return {
        ...e,
        fullMockCount: fullMock,
        pyqCount: pyq,
        topicTestCount: topic,
        fullMocksCount: fullMock,
        pyqsCount: pyq,
        topicTestsCount: topic,
        testsCount: fullMock + pyq + topic,
      };
    });
  }

  const [contentCounts, { data, error }] = await Promise.all([
    getExamContentCounts(),
    supabase.from('exams').select('*').order('order_index', { ascending: true }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  const empty = { fullMock: 0, pyq: 0, topic: 0 };
  return (data as ExamRow[]).map((item) => {
    const fullMock = contentCounts[item.id]?.fullMock ?? empty.fullMock;
    const pyq = contentCounts[item.id]?.pyq ?? empty.pyq;
    const topic = contentCounts[item.id]?.topic ?? empty.topic;
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description ?? undefined,
      category: item.category,
      iconName: item.icon_name,
      bannerUrl: item.banner_url ?? undefined,
      shortName: (item as any).short_name ?? undefined,
      subtitle: (item as any).subtitle ?? undefined,
      orderIndex: item.order_index,
      isActive: item.is_active,
      fullMockCount: fullMock,
      pyqCount: pyq,
      topicTestCount: topic,
      fullMocksCount: fullMock,
      pyqsCount: pyq,
      topicTestsCount: topic,
      testsCount: fullMock + pyq + topic,
    };
  });
}

export async function getExamById(id: string): Promise<Exam | null> {
  if (!isSupabaseConfigured) {
    return localExams.find((e) => e.id === id) || null;
  }

  const { data, error } = await supabase.from('exams').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as ExamRow;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    category: row.category,
    iconName: row.icon_name,
    bannerUrl: row.banner_url ?? undefined,
    shortName: (row as any).short_name ?? undefined,
    subtitle: (row as any).subtitle ?? undefined,
    orderIndex: row.order_index,
    isActive: row.is_active,
  };
}

export async function createExam(examData: Omit<Exam, 'id'>): Promise<Exam> {
  if (!examData.title.trim()) throw new Error('Exam title is required.');
  const slug =
    examData.slug ||
    examData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const id = slug || `exam-${Date.now()}`;

  if (!isSupabaseConfigured) {
    const newExam: Exam = {
      id,
      ...examData,
      slug,
      fullMockCount: 0,
      pyqCount: 0,
      topicTestCount: 0,
    };
    localExams.push(newExam);
    notifyExamsUpdated();
    return newExam;
  }

  const { data, error } = await supabase
    .from('exams')
    .insert({
      id,
      title: examData.title.trim(),
      short_name: examData.shortName || null,
      subtitle: examData.subtitle || null,
      slug,
      description: examData.description || null,
      category: examData.category,
      icon_name: examData.iconName || 'Shield',
      banner_url: examData.bannerUrl || null,
      order_index: examData.orderIndex || 0,
      is_active: examData.isActive ?? true,
    })
    .select()
    .single();

  requireSavedRow({ data, error });
  notifyExamsUpdated();
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description ?? undefined,
    category: data.category,
    iconName: data.icon_name,
    bannerUrl: data.banner_url ?? undefined,
    shortName: data.short_name ?? undefined,
    subtitle: data.subtitle ?? undefined,
    orderIndex: data.order_index,
    isActive: data.is_active,
    fullMockCount: 0,
    pyqCount: 0,
    topicTestCount: 0,
    testsCount: 0,
  };
}

export async function updateExam(id: string, updates: Partial<Exam>): Promise<Exam> {
  if (updates.title !== undefined && !updates.title.trim())
    throw new Error('Exam title is required.');
  if (!isSupabaseConfigured) {
    const index = localExams.findIndex((e) => e.id === id);
    if (index < 0) throw new Error('Exam not found.');
    localExams[index] = { ...localExams[index], ...updates };
    notifyExamsUpdated();
    return localExams[index];
  }
  const payload: Record<string, unknown> = {};
  const fields: Record<string, string> = {
    title: 'title',
    slug: 'slug',
    description: 'description',
    category: 'category',
    iconName: 'icon_name',
    bannerUrl: 'banner_url',
    orderIndex: 'order_index',
    isActive: 'is_active',
    shortName: 'short_name',
    subtitle: 'subtitle',
  };
  for (const [key, column] of Object.entries(fields))
    if ((updates as any)[key] !== undefined) payload[column] = (updates as any)[key];
  requireSavedRow(
    await supabase.from('exams').update(payload).eq('id', id).select('id').maybeSingle(),
    id
  );
  notifyExamsUpdated();
  const saved = await getExamById(id);
  if (!saved) throw new Error('Saved exam could not be reloaded.');
  return saved;
}

export async function deleteExam(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const i = localExams.findIndex((e) => e.id === id);
    if (i < 0) throw new Error('Exam not found.');
    localExams.splice(i, 1);
  } else await deleteAdminRecord('exams', id);
  notifyExamsUpdated();
  return true;
}

export const DEFAULT_POPULAR_EXAMS: PopularExamCard[] = [
  {
    id: 'popular-wbp-constable',
    examId: 'wbp-constable',
    title: 'WBP Constable',
    slug: 'wbp-constable',
    route: '/exams/wbp-constable',
    testsCount: '120+ Tests',
    cardBadge: '120+ Tests',
    cardGradientStart: '#0084FF',
    cardGradientEnd: '#0048C6',
    cardArrowColor: '#026BFC',
    cardBgImage: '/images/exam_wbp_bg.png',
    cardEmblemUrl: '/images/exams/emblem_series_wbp.png',
    orderIndex: 1,
    isActive: true,
  },
  {
    id: 'popular-kp-constable',
    examId: 'kp-police-si',
    title: 'KP Constable',
    slug: 'kolkata-police-si',
    route: '/exams/kolkata-police-si',
    testsCount: '100+ Tests',
    cardBadge: '100+ Tests',
    cardGradientStart: '#9B27F4',
    cardGradientEnd: '#5E09BD',
    cardArrowColor: '#8B5CF6',
    cardBgImage: '/images/exam_kp_bg.png',
    cardEmblemUrl: '/images/exams/emblem_series_kp.png',
    orderIndex: 2,
    isActive: true,
  },
  {
    id: 'popular-ssc-gd',
    examId: 'ssc-gd',
    title: 'SSC GD',
    slug: 'ssc-gd',
    route: '/exams/ssc-gd',
    testsCount: '150+ Tests',
    cardBadge: '150+ Tests',
    cardGradientStart: '#F97316',
    cardGradientEnd: '#C22B00',
    cardArrowColor: '#EA580C',
    cardBgImage: '/images/exam_ssc_bg.png',
    cardEmblemUrl: '/images/exams/emblem_series_ssc.png',
    orderIndex: 3,
    isActive: true,
  },
];

export async function getPopularExams(): Promise<PopularExamCard[]> {
  if (!isSupabaseConfigured) return attachPopularExamCounts(DEFAULT_POPULAR_EXAMS);
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', 'popular_exams_config')
      .maybeSingle();
    if (error) throw error;
    if (!data?.value) return await attachPopularExamCounts(DEFAULT_POPULAR_EXAMS);
    const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return await attachPopularExamCounts(DEFAULT_POPULAR_EXAMS);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pk_popular_exams_config', JSON.stringify(parsed));
      }
    } catch {
      // Browser storage is an optional cache.
    }
    // Check if legacy uncustomized seed exists (primary-tet demo cards)
    const isLegacyDemo =
      parsed.length === 5 &&
      parsed.some(
        (c: any) => c.id === 'popular-primary-tet' && c.cardBgImage?.includes('popular_exams/bg_')
      );
    const cardsToUse = isLegacyDemo ? DEFAULT_POPULAR_EXAMS : (parsed as PopularExamCard[]);
    return await attachPopularExamCounts(cardsToUse);
  } catch (err) {
    console.warn('Could not fetch remote Popular Exam settings:', err);
    return await attachPopularExamCounts(DEFAULT_POPULAR_EXAMS);
  }
}

async function attachPopularExamCounts(cards: PopularExamCard[]): Promise<PopularExamCard[]> {
  if (!isSupabaseConfigured || cards.length === 0) {
    return [...cards].sort((a, b) => a.orderIndex - b.orderIndex);
  }
  const [
    { data: tests, error: testsError },
    { data: mappings, error: mappingsError },
    { data: testSeries, error: seriesError },
  ] = await Promise.all([
    supabase
      .from('tests')
      .select('id, exam_id, test_series_id')
      .eq('is_active', true)
      .eq('status', 'published'),
    supabase.from('test_exams').select('test_id, exam_id'),
    supabase.from('test_series').select('id, exam_id'),
  ]);
  if (testsError) throw new Error(testsError.message);
  if (mappingsError) throw new Error(mappingsError.message);
  if (seriesError) throw new Error(seriesError.message);

  const seriesExamMap = new Map<string, string>();
  (testSeries || []).forEach((s: { id: string; exam_id: string | null }) => {
    if (s.exam_id) seriesExamMap.set(s.id, s.exam_id);
  });

  const examByTest = new Map<string, Set<string>>();
  (tests || []).forEach(
    (test: { id: string; exam_id: string | null; test_series_id?: string | null }) => {
      const ids = examByTest.get(test.id) || new Set<string>();
      if (test.exam_id) ids.add(test.exam_id);
      if (test.test_series_id && seriesExamMap.has(test.test_series_id)) {
        ids.add(seriesExamMap.get(test.test_series_id)!);
      }
      examByTest.set(test.id, ids);
    }
  );
  (mappings || []).forEach((mapping: { test_id: string; exam_id: string }) => {
    const ids = examByTest.get(mapping.test_id);
    if (ids) ids.add(mapping.exam_id);
  });
  return cards
    .map((card) => {
      if (!card.examId) return card;
      const count = [...examByTest.values()].filter((ids) => ids.has(card.examId!)).length;
      const label = count > 0 ? `${count}+ Tests` : card.testsCount || '0 Tests';
      return { ...card, testsCount: label, cardBadge: label };
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getPublishedExamTestCount(examId: string): Promise<number> {
  if (!isSupabaseConfigured) {
    return localTests.filter(
      (test) => test.examId === examId && test.isActive && test.status === 'published'
    ).length;
  }
  const [{ data: tests, error }, { data: mappings, error: mappingError }] = await Promise.all([
    supabase.from('tests').select('id, exam_id').eq('is_active', true).eq('status', 'published'),
    supabase.from('test_exams').select('test_id, exam_id'),
  ]);
  if (error) throw new Error(error.message);
  if (mappingError) throw new Error(mappingError.message);
  const examByTest = new Map<string, Set<string>>();
  (tests || []).forEach((test: { id: string; exam_id: string | null }) => {
    const ids = examByTest.get(test.id) || new Set<string>();
    if (test.exam_id) ids.add(test.exam_id);
    examByTest.set(test.id, ids);
  });
  (mappings || []).forEach((mapping: { test_id: string; exam_id: string }) => {
    examByTest.get(mapping.test_id)?.add(mapping.exam_id);
  });
  return [...examByTest.values()].filter((ids) => ids.has(examId)).length;
}

export async function uploadPopularExamImage(
  file: File,
  cardId: string,
  kind: 'logo' | 'background'
) {
  if (!isSupabaseConfigured)
    throw new Error('Connect to the Admin Panel database before uploading images.');
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  const extension =
    file.name
      .split('.')
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'png';
  const safeId = cardId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const path = `popular-exams/${safeId}/${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const { data, error } = await supabase.storage.from('banners').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return supabase.storage.from('banners').getPublicUrl(data.path).data.publicUrl;
}

export function subscribeToPopularExamUpdates(callback: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel('popular-exam-settings-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_settings', filter: 'id=eq.popular_exams_config' },
      callback
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function savePopularExams(cards: PopularExamCard[]): Promise<PopularExamCard[]> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pk_popular_exams_config', JSON.stringify(cards));
    }
  } catch {
    // Browser storage is an optional cache.
  }

  const normalized = cards.map((card, index) => ({ ...card, orderIndex: index + 1 }));
  if (!isSupabaseConfigured) {
    throw new Error('Connect to the Admin Panel database before saving Popular Exams.');
  }
  {
    const settingRow = {
      id: 'popular_exams_config',
      category: 'general',
      key: 'popular_exams_config',
      value: normalized,
      description: 'Admin-managed Popular Exam cards shown in student apps',
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
      const { error } = await supabase
        .from('app_settings')
        .upsert(settingRow, { onConflict: 'id' });
      if (error) {
        throw new Error(`Could not save Popular Exam settings: ${error.message}`);
      }
    }
  }

  notifyExamsUpdated();
  return await getPopularExams();
}

export const adminExamsApi = {
  getExamContentCounts,
  getAllAdminExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getPopularExams,
  DEFAULT_POPULAR_EXAMS,
  getPublishedExamTestCount,
  savePopularExams,
  uploadPopularExamImage,
  subscribeToPopularExamUpdates,
};
