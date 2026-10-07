import { deleteAdminRecord } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localChapters, localSubjects } from '@/services/domains/localStore';
import type { Subject } from '@/types';
import type { SubjectRow } from '@/services/domains/localStore';

/** Section of the admin API: subjects (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// SUBJECTS API
// --------------------------------------------------------------------------
export async function getAllAdminSubjects(examId?: string): Promise<Subject[]> {
  if (!isSupabaseConfigured) {
    return localSubjects
      .filter((s) => !examId || !s.examId || s.examId === examId)
      .map((s) => ({
        ...s,
        chaptersCount: localChapters.filter((c) => c.subjectId === s.id).length,
      }));
  }

  let query = supabase
    .from('subjects')
    .select('*, chapters(count)')
    .order('order_index', { ascending: true });
  if (examId) query = query.or(`exam_id.eq.${examId},exam_id.is.null`);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return (data as (SubjectRow & { chapters?: { count: number }[] })[]).map((item) => {
    const chaptersCount =
      Array.isArray(item.chapters) && item.chapters[0]?.count != null
        ? Number(item.chapters[0].count)
        : 0;
    return {
      id: item.id,
      examId: item.exam_id ?? undefined,
      name: item.name,
      category: (item as any).category ?? undefined,
      slug: item.slug,
      description: item.description ?? undefined,
      iconName: item.icon_name,
      orderIndex: item.order_index,
      isActive: item.is_active,
      chaptersCount,
    };
  });
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  if (!isSupabaseConfigured) {
    return localSubjects.find((s) => s.id === id) || null;
  }

  const { data, error } = await supabase
    .from('subjects')
    .select('*, chapters(count)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as SubjectRow & { chapters?: { count: number }[] };
  const chaptersCount =
    Array.isArray(row.chapters) && row.chapters[0]?.count != null
      ? Number(row.chapters[0].count)
      : 0;

  return {
    id: row.id,
    examId: row.exam_id ?? undefined,
    name: row.name,
    category: (row as any).category ?? undefined,
    slug: row.slug,
    description: row.description ?? undefined,
    iconName: row.icon_name,
    orderIndex: row.order_index,
    isActive: row.is_active,
    chaptersCount,
  };
}

export async function createSubject(subjectData: Omit<Subject, 'id'>): Promise<Subject> {
  const slug =
    subjectData.slug ||
    subjectData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const id = subjectData.examId
    ? `${subjectData.examId}-${slug}`.slice(0, 50)
    : `sub-${slug}-${Date.now().toString().slice(-4)}`.slice(0, 50);

  if (!isSupabaseConfigured) {
    const newSubject: Subject = {
      id,
      ...subjectData,
      slug,
      chaptersCount: 0,
    };
    localSubjects.push(newSubject);
    return newSubject;
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      id,
      exam_id: subjectData.examId || null,
      name: subjectData.name,
      slug,
      description: subjectData.description || null,
      category: subjectData.category || null,
      icon_name: subjectData.iconName || 'BookOpen',
      order_index: subjectData.orderIndex || 0,
      is_active: subjectData.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    examId: data.exam_id ?? undefined,
    name: data.name,
    category: (data as any).category ?? undefined,
    slug: data.slug,
    description: data.description ?? undefined,
    iconName: data.icon_name,
    orderIndex: data.order_index,
    isActive: data.is_active,
    chaptersCount: 0,
  };
}

export async function updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
  if (!isSupabaseConfigured) {
    const idx = localSubjects.findIndex((s) => s.id === id);
    if (idx !== -1) {
      localSubjects[idx] = { ...localSubjects[idx], ...updates };
    }
    return (
      localSubjects[idx] || {
        id,
        name: updates.name || '',
        slug: '',
        iconName: '',
        orderIndex: 0,
        isActive: true,
      }
    );
  }

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.iconName !== undefined) payload.icon_name = updates.iconName;
  if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.examId !== undefined) payload.exam_id = updates.examId || null;

  const { data, error } = await supabase
    .from('subjects')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    examId: data.exam_id ?? undefined,
    name: data.name,
    category: (data as any).category ?? undefined,
    slug: data.slug,
    description: data.description ?? undefined,
    iconName: data.icon_name,
    orderIndex: data.order_index,
    isActive: data.is_active,
  };
}

export async function deleteSubject(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const i = localSubjects.findIndex((e) => e.id === id);
    if (i < 0) throw new Error('Record not found.');
    localSubjects.splice(i, 1);
    return true;
  }
  return deleteAdminRecord('subjects', id);
}

export async function uploadSubjectIcon(file: File, subjectId: string = 'custom'): Promise<string> {
  if (isSupabaseConfigured) {
    {
      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'png';
      const safeId = subjectId.replace(/[^a-zA-Z0-9_-]/g, '-');
      const path = `subject-icons/${safeId}/icon-${Date.now()}.${extension}`;
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

export const adminSubjectsApi = {
  getAllAdminSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  uploadSubjectIcon,
};
