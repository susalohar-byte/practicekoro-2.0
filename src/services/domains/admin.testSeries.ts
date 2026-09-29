import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localExams, localTestSeries, localTests } from '@/services/domains/localStore';
import type { TestSeries } from '@/types';

/** Section of the admin API: testSeries (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// TEST SERIES API
// --------------------------------------------------------------------------
export async function getTestSeries(examId?: string): Promise<TestSeries[]> {
  let cachedIcons: Record<string, string> = {};
  try {
    const raw = localStorage.getItem('practicekoro_series_icons');
    if (raw) cachedIcons = JSON.parse(raw);
  } catch {}

  if (!isSupabaseConfigured) {
    return localTestSeries
      .filter((s) => !examId || s.examId === examId)
      .map((s) => {
        const exam = localExams.find((e) => e.id === s.examId);
        const sTests = localTests.filter((t) => t.testSeriesId === s.id);
        const count = sTests.length;
        const fullMockCount = sTests.filter((t) => t.testType === 'full_mock').length;
        const pyqTestCount = sTests.filter((t) => t.testType === 'pyq').length;
        const topicTestCount = sTests.filter(
          (t) =>
            t.testType === 'topic' ||
            t.testType === 'chapter_mock' ||
            t.testType === 'subject_mock'
        ).length;
        return {
          ...s,
          iconUrl: s.iconUrl || cachedIcons[s.id] || undefined,
          examTitle: exam?.title,
          testCount: count,
          testsCount: count,
          fullMockCount,
          topicTestCount,
          pyqTestCount,
        };
      });
  }

  let query = supabase
    .from('test_series')
    .select('*, exams:exam_id(title), tests(id, test_type)')
    .order('order_index', { ascending: true });
  if (examId) query = query.eq('exam_id', examId);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item: any) => {
    const testsList = Array.isArray(item.tests) ? item.tests : [];
    const count = testsList.length;
    const fullMockCount = testsList.filter((t: any) => t.test_type === 'full_mock').length;
    const pyqTestCount = testsList.filter((t: any) => t.test_type === 'pyq').length;
    const topicTestCount = testsList.filter(
      (t: any) =>
        t.test_type === 'topic' ||
        t.test_type === 'chapter_mock' ||
        t.test_type === 'subject_mock'
    ).length;
    return {
      id: item.id,
      examId: item.exam_id,
      title: item.title,
      slug: item.slug,
      description: item.description ?? undefined,
      iconUrl: item.icon_url || cachedIcons[item.id] || item.iconUrl || undefined,
      isPremium: item.is_premium,
      orderIndex: item.order_index,
      isActive: Boolean(item.is_active ?? true),
      isPopular: Boolean(item.is_popular || (item as any).is_featured),
      createdAt: item.created_at,
      examTitle: item.exams?.title || undefined,
      testCount: count,
      testsCount: count,
      fullMockCount,
      topicTestCount,
      pyqTestCount,
    };
  });
}

export async function createTestSeries(seriesData: Omit<TestSeries, 'id'>): Promise<TestSeries> {
  const slug =
    seriesData.slug ||
    seriesData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const id = `${seriesData.examId}-${slug}-${Date.now().toString().slice(-4)}`.slice(0, 50);

  if (!isSupabaseConfigured) {
    const exam = localExams.find((e) => e.id === seriesData.examId);
    const newSeries: TestSeries = {
      id,
      ...seriesData,
      slug,
      iconUrl: seriesData.iconUrl,
      examTitle: exam?.title,
      createdAt: new Date().toISOString(),
    };
    localTestSeries.push(newSeries);
    if (seriesData.iconUrl) {
      try {
        const raw = localStorage.getItem('practicekoro_series_icons');
        const icons = raw ? JSON.parse(raw) : {};
        icons[id] = seriesData.iconUrl;
        localStorage.setItem('practicekoro_series_icons', JSON.stringify(icons));
      } catch {}
    }
    return newSeries;
  }

  const insertPayload: Record<string, unknown> = {
    id,
    exam_id: seriesData.examId,
    title: seriesData.title,
    slug,
    description: seriesData.description || null,
    is_premium: seriesData.isPremium ?? false,
    order_index: seriesData.orderIndex || 0,
    is_popular: seriesData.isPopular ?? (seriesData as any).isFeatured ?? false,
  };
  if (seriesData.iconUrl) {
    insertPayload.icon_url = seriesData.iconUrl;
  }

  let { data, error } = await supabase
    .from('test_series')
    .insert(insertPayload)
    .select('*, exams:exam_id(title)')
    .single();

  if (error && (error.message?.includes('is_popular') || error.code === 'PGRST204')) {
    delete insertPayload.is_popular;
    const retry = await supabase
      .from('test_series')
      .insert(insertPayload)
      .select('*, exams:exam_id(title)')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error && (error.message?.includes('icon_url') || error.code === 'PGRST204')) {
    delete insertPayload.icon_url;
    delete insertPayload.is_popular;
    const retry = await supabase
      .from('test_series')
      .insert(insertPayload)
      .select('*, exams:exam_id(title)')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (seriesData.iconUrl) {
    try {
      const raw = localStorage.getItem('practicekoro_series_icons');
      const icons = raw ? JSON.parse(raw) : {};
      icons[data.id] = seriesData.iconUrl;
      localStorage.setItem('practicekoro_series_icons', JSON.stringify(icons));
    } catch {}
  }

  return {
    id: data.id,
    examId: data.exam_id,
    title: data.title,
    slug: data.slug,
    description: data.description ?? undefined,
    isPremium: data.is_premium,
    orderIndex: data.order_index,
    isActive: data.is_active,
    isFeatured: Boolean(data.is_featured),
    iconUrl: seriesData.iconUrl || (data as any)?.icon_url || undefined,
    createdAt: data.created_at,
    examTitle: (data as any).exams?.title || undefined,
    testCount: 0,
    testsCount: 0,
  };
}

export async function updateTestSeries(
  id: string,
  updates: Partial<TestSeries>
): Promise<TestSeries> {
  // Always update in-memory store and local icon cache
  const localIdx = localTestSeries.findIndex((s) => s.id === id);
  if (localIdx !== -1) {
    localTestSeries[localIdx] = { ...localTestSeries[localIdx], ...updates };
  }

  if (updates.iconUrl !== undefined) {
    try {
      const raw = localStorage.getItem('practicekoro_series_icons');
      const icons = raw ? JSON.parse(raw) : {};
      if (updates.iconUrl) {
        icons[id] = updates.iconUrl;
      } else {
        delete icons[id];
      }
      localStorage.setItem('practicekoro_series_icons', JSON.stringify(icons));
    } catch (e) {
      console.warn('Could not cache series icon in localStorage:', e);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      localTestSeries[localIdx] || {
        id,
        examId: '',
        title: '',
        slug: '',
        isPremium: false,
        orderIndex: 0,
        isActive: true,
        iconUrl: updates.iconUrl,
      }
    );
  }

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.isPremium !== undefined) payload.is_premium = updates.isPremium;
  if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.isPopular !== undefined) payload.is_popular = updates.isPopular;
  if ((updates as any).isFeatured !== undefined && updates.isPopular === undefined) payload.is_popular = (updates as any).isFeatured;
  if (updates.examId !== undefined) payload.exam_id = updates.examId;
  if (updates.iconUrl !== undefined) payload.icon_url = updates.iconUrl || null;

  let { data, error } = await supabase
    .from('test_series')
    .update(payload)
    .eq('id', id)
    .select('*, exams:exam_id(title)')
    .single();

  if (error && (error.message?.includes('is_popular') || error.code === 'PGRST204')) {
    delete payload.is_popular;
    const retry = await supabase
      .from('test_series')
      .update(payload)
      .eq('id', id)
      .select('*, exams:exam_id(title)')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error && (error.message?.includes('icon_url') || error.code === 'PGRST204')) {
    delete payload.icon_url;
    delete payload.is_popular;
    const retry = await supabase
      .from('test_series')
      .update(payload)
      .eq('id', id)
      .select('*, exams:exam_id(title)')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    examId: data.exam_id,
    title: data.title,
    slug: data.slug,
    description: data.description ?? undefined,
    isPremium: data.is_premium,
    orderIndex: data.order_index,
    isActive: data.is_active,
    isFeatured: Boolean(data.is_featured),
    createdAt: data.created_at,
    examTitle: (data as any).exams?.title || undefined,
  };
}

export async function deleteTestSeries(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const idx = localTestSeries.findIndex((s) => s.id === id);
    if (idx !== -1) localTestSeries.splice(idx, 1);
    return true;
  }

  const { error } = await supabase.from('test_series').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export async function getPopularTestSeries(): Promise<TestSeries[]> {
  const all = await getTestSeries();
  const popular = all.filter((s) => s.isPopular && s.isActive);
  if (popular.length > 0) return popular;
  return all.filter((s) => s.isActive).slice(0, 5);
}

export const adminTestSeriesApi = {
  getTestSeries,
  getPopularTestSeries,
  createTestSeries,
  updateTestSeries,
  deleteTestSeries,
};
