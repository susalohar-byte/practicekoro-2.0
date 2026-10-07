import { requireSavedRow, deleteAdminRecord } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localChapters, localTests } from '@/services/domains/localStore';
import type { Chapter } from '@/types';

const CHAPTERS_STORAGE_KEY = 'pk_admin_chapters_list';

export function getStoredChapters(): Chapter[] {
  try {
    const raw = localStorage.getItem(CHAPTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* Optional browser cache is unavailable. Backend remains authoritative. */
  }
  return [...localChapters];
}

export function saveStoredChapters(chapters: Chapter[]): void {
  try {
    localStorage.setItem(CHAPTERS_STORAGE_KEY, JSON.stringify(chapters));
  } catch {
    /* Optional browser cache is unavailable. Backend remains authoritative. */
  }
}

/** Section of the admin API: chapters (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// CHAPTERS / TOPICS API
// --------------------------------------------------------------------------
export async function getAllAdminChapters(subjectId?: string): Promise<Chapter[]> {
  if (!isSupabaseConfigured)
    return getStoredChapters()
      .filter((c) => !subjectId || c.subjectId === subjectId)
      .map((c) => ({ ...c, testsCount: localTests.filter((t) => t.chapterId === c.id).length }));
  let q = supabase.from('chapters').select('*, tests(count)').order('order_index');
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []).map((d) => ({
    id: d.id,
    subjectId: d.subject_id,
    name: d.name,
    slug: d.slug,
    description: d.description ?? undefined,
    iconName: d.icon_name ?? undefined,
    parentId: d.parent_id ?? undefined,
    orderIndex: d.order_index,
    isActive: d.is_active,
    testsCount: Number(d.tests?.[0]?.count || 0),
  }));
}

export async function getChapterById(id: string): Promise<Chapter | null> {
  if (!isSupabaseConfigured) return getStoredChapters().find((c) => c.id === id) || null;
  const { data: d, error } = await supabase
    .from('chapters')
    .select('*, tests(count)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return d
    ? {
        id: d.id,
        subjectId: d.subject_id,
        name: d.name,
        slug: d.slug,
        description: d.description ?? undefined,
        iconName: d.icon_name ?? undefined,
        parentId: d.parent_id ?? undefined,
        orderIndex: d.order_index,
        isActive: d.is_active,
        testsCount: Number(d.tests?.[0]?.count || 0),
      }
    : null;
}

export async function createChapter(input: Omit<Chapter, 'id'>): Promise<Chapter> {
  if (!input.name.trim() || !input.subjectId)
    throw new Error('Topic name and subject are required.');
  const id = crypto.randomUUID();
  const slug = input.slug || id;
  if (!isSupabaseConfigured) {
    const saved = { ...input, id, slug };
    const rows = getStoredChapters();
    rows.push(saved);
    saveStoredChapters(rows);
    localChapters.push(saved);
    return saved;
  }
  const d = requireSavedRow(
    await supabase
      .from('chapters')
      .insert({
        id,
        subject_id: input.subjectId,
        name: input.name.trim(),
        slug,
        description: input.description || null,
        icon_name: input.iconName || null,
        parent_id: input.parentId || null,
        order_index: input.orderIndex ?? 0,
        is_active: input.isActive ?? true,
      })
      .select('*')
      .single()
  );
  return {
    id: d.id,
    subjectId: d.subject_id,
    name: d.name,
    slug: d.slug,
    description: d.description ?? undefined,
    iconName: d.icon_name ?? undefined,
    parentId: d.parent_id ?? undefined,
    orderIndex: d.order_index,
    isActive: d.is_active,
    testsCount: Number(d.tests?.[0]?.count || 0),
  };
}

export async function updateChapter(id: string, input: Partial<Chapter>): Promise<Chapter> {
  if (input.name !== undefined && !input.name.trim()) throw new Error('Topic name is required.');
  if (!isSupabaseConfigured) {
    const rows = getStoredChapters();
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error('Topic not found.');
    rows[i] = { ...rows[i], ...input };
    saveStoredChapters(rows);
    return rows[i];
  }
  const fields: Record<string, string> = {
    name: 'name',
    slug: 'slug',
    description: 'description',
    subjectId: 'subject_id',
    iconName: 'icon_name',
    parentId: 'parent_id',
    orderIndex: 'order_index',
    isActive: 'is_active',
  };
  const payload: Record<string, unknown> = {};
  for (const [k, c] of Object.entries(fields))
    if ((input as any)[k] !== undefined) payload[c] = (input as any)[k];
  const d = requireSavedRow(
    await supabase.from('chapters').update(payload).eq('id', id).select('*').single(),
    id
  );
  return {
    id: d.id,
    subjectId: d.subject_id,
    name: d.name,
    slug: d.slug,
    description: d.description ?? undefined,
    iconName: d.icon_name ?? undefined,
    parentId: d.parent_id ?? undefined,
    orderIndex: d.order_index,
    isActive: d.is_active,
    testsCount: Number(d.tests?.[0]?.count || 0),
  };
}

export async function deleteChapter(id: string): Promise<boolean> {
  if (isSupabaseConfigured) return deleteAdminRecord('chapters', id);
  const rows = getStoredChapters();
  if (!rows.some((r) => r.id === id)) throw new Error('Topic not found.');
  saveStoredChapters(rows.filter((r) => r.id !== id));
  const i = localChapters.findIndex((r) => r.id === id);
  if (i >= 0) localChapters.splice(i, 1);
  return true;
}

export async function uploadTopicIcon(file: File, topicId: string = 'custom'): Promise<string> {
  if (isSupabaseConfigured) {
    {
      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'png';
      const safeId = topicId.replace(/[^a-zA-Z0-9_-]/g, '-');
      const path = `topic-icons/${safeId}/icon-${Date.now()}.${extension}`;
      const { data, error } = await supabase.storage.from('banners').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (!error && data) {
        return supabase.storage.from('banners').getPublicUrl(data.path).data.publicUrl;
      }
    }
    throw new Error('Image upload failed. Please check Storage permissions.');
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
