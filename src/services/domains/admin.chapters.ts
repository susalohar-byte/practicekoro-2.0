import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localChapters, localTests } from '@/services/domains/localStore';
import type { Chapter } from '@/types';
import type { ChapterRow } from '@/services/domains/localStore';

const CHAPTERS_STORAGE_KEY = 'pk_admin_chapters_list';

export function getStoredChapters(): Chapter[] {
  try {
    const raw = localStorage.getItem(CHAPTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...localChapters];
}

export function saveStoredChapters(chapters: Chapter[]): void {
  try {
    localStorage.setItem(CHAPTERS_STORAGE_KEY, JSON.stringify(chapters));
  } catch {}
}

/** Section of the admin API: chapters (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// CHAPTERS / TOPICS API
// --------------------------------------------------------------------------
export async function getAllAdminChapters(subjectId?: string): Promise<Chapter[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('chapters')
        .select('*, tests(count)')
        .order('order_index', { ascending: true });
      if (subjectId) query = query.eq('subject_id', subjectId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return (data as (ChapterRow & { tests?: { count: number }[] })[]).map((item) => {
          const testsCount =
            Array.isArray(item.tests) && item.tests[0]?.count != null ? Number(item.tests[0].count) : 0;
          return {
            id: item.id,
            subjectId: item.subject_id,
            name: item.name,
            slug: item.slug,
            description: item.description ?? undefined,
            orderIndex: item.order_index,
            isActive: item.is_active,
            iconName: (item as any).icon_name || (item as any).iconName || undefined,
            parentId: (item as any).parent_id ?? undefined,
            testsCount,
            updatedAt: (item as any).updated_at ?? undefined,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase getAllAdminChapters fallback:', err);
    }
  }

  const stored = getStoredChapters();
  return stored
    .filter((c) => !subjectId || c.subjectId === subjectId)
    .map((c) => ({
      ...c,
      testsCount: localTests.filter((t) => t.chapterId === c.id).length,
    }));
}

export async function getChapterById(id: string): Promise<Chapter | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*, tests(count)')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const row = data as ChapterRow & { tests?: { count: number }[] };
        const testsCount =
          Array.isArray(row.tests) && row.tests[0]?.count != null ? Number(row.tests[0].count) : 0;

        return {
          id: row.id,
          subjectId: row.subject_id,
          name: row.name,
          slug: row.slug,
          description: row.description ?? undefined,
          orderIndex: row.order_index,
          isActive: row.is_active,
          iconName: (row as any).icon_name || (row as any).iconName || undefined,
          parentId: (row as any).parent_id ?? undefined,
          testsCount,
        };
      }
    } catch (err) {
      console.warn('Supabase getChapterById fallback:', err);
    }
  }

  const stored = getStoredChapters();
  return stored.find((c) => c.id === id) || null;
}

export async function createChapter(chapterData: Omit<Chapter, 'id'>): Promise<Chapter> {
  const slug =
    chapterData.slug ||
    chapterData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const id = `${chapterData.subjectId}-${slug}-${Date.now().toString().slice(-4)}`.slice(0, 50);

  const newChapter: Chapter = {
    id,
    ...chapterData,
    slug,
    testsCount: 0,
    isActive: chapterData.isActive ?? true,
  };

  const stored = getStoredChapters();
  stored.push(newChapter);
  saveStoredChapters(stored);

  const localIdx = localChapters.findIndex((c) => c.id === id);
  if (localIdx === -1) localChapters.push(newChapter);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          id,
          subject_id: chapterData.subjectId,
          name: chapterData.name,
          slug,
          description: chapterData.description || null,
          icon_name: chapterData.iconName || null,
          order_index: chapterData.orderIndex || 0,
          is_active: chapterData.isActive ?? true,
          parent_id: chapterData.parentId || null,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          subjectId: data.subject_id,
          name: data.name,
          slug: data.slug,
          description: data.description ?? undefined,
          iconName: (data as any).icon_name || chapterData.iconName || undefined,
          orderIndex: data.order_index,
          isActive: data.is_active,
          parentId: (data as any).parent_id ?? undefined,
          testsCount: 0,
        };
      }
    } catch (err) {
      console.warn('Supabase createChapter fallback:', err);
    }
  }

  return newChapter;
}

export async function updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter> {
  const stored = getStoredChapters();
  const idx = stored.findIndex((c) => c.id === id);
  let updatedChapter: Chapter;

  if (idx !== -1) {
    updatedChapter = { ...stored[idx], ...updates };
    stored[idx] = updatedChapter;
  } else {
    const fromLocal = localChapters.find((c) => c.id === id);
    updatedChapter = {
      id,
      subjectId: '',
      name: '',
      slug: '',
      orderIndex: 0,
      isActive: true,
      ...fromLocal,
      ...updates,
    };
    stored.push(updatedChapter);
  }
  saveStoredChapters(stored);

  // Sync in-memory localChapters
  const localIdx = localChapters.findIndex((c) => c.id === id);
  if (localIdx !== -1) {
    localChapters[localIdx] = updatedChapter;
  } else {
    localChapters.push(updatedChapter);
  }

  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.slug !== undefined) payload.slug = updates.slug;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.iconName !== undefined) payload.icon_name = updates.iconName || null;
      if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.parentId !== undefined) payload.parent_id = updates.parentId || null;
      if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;

      const { data, error } = await supabase
        .from('chapters')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          subjectId: data.subject_id,
          name: data.name,
          slug: data.slug,
          description: data.description ?? undefined,
          iconName: (data as any).icon_name || updates.iconName || undefined,
          orderIndex: data.order_index,
          isActive: data.is_active,
          parentId: (data as any).parent_id ?? undefined,
        };
      }
    } catch (err) {
      console.warn('Supabase updateChapter fallback:', err);
    }
  }

  return updatedChapter;
}

export async function deleteChapter(id: string): Promise<boolean> {
  const stored = getStoredChapters();
  const next = stored.filter((c) => c.id !== id);
  saveStoredChapters(next);

  const idx = localChapters.findIndex((c) => c.id === id);
  if (idx !== -1) localChapters.splice(idx, 1);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('chapters').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteChapter fallback:', err);
    }
  }
  return true;
}

export async function uploadTopicIcon(file: File, topicId: string = 'custom'): Promise<string> {
  if (isSupabaseConfigured) {
    try {
      const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
      const safeId = topicId.replace(/[^a-zA-Z0-9_-]/g, '-');
      const path = `topic-icons/${safeId}/icon-${Date.now()}.${extension}`;
      const { data, error } = await supabase.storage.from('banners').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (!error && data) {
        return supabase.storage.from('banners').getPublicUrl(data.path).data.publicUrl;
      }
    } catch {
      // Fallback to data URL
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const adminChaptersApi = {
  getAllAdminChapters,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  uploadTopicIcon,
};
