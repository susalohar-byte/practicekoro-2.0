import { uploadValidatedImage, validateRasterFile } from '@/lib/rasterUploads';
import { readCompleteQuery } from './admin.reporting';
import { notifyExamsUpdated } from '@/lib/dataSync';
import { validateSubjectInput, type SubjectReportingData } from '@/utils/adminSubjectModel';
import { requireSavedRow, deleteAdminRecord } from './admin.mutations';
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

  const data = await readCompleteQuery(() => {
    let query = supabase
      .from('subjects')
      .select('*, chapters(count)', { count: 'exact' })
      .order('order_index', { ascending: true })
      .order('id', { ascending: true });
    if (examId) query = query.or(`exam_id.eq.${examId},exam_id.is.null`);
    return query;
  });
  return (data as (SubjectRow & { chapters?: { count: number }[] })[]).map((item) => {
    const chaptersCount =
      Array.isArray(item.chapters) && item.chapters[0]?.count != null
        ? Number(item.chapters[0].count)
        : 0;
    return {
      createdAt: (item as any).created_at,
      updatedAt: (item as any).updated_at,
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
    createdAt: (row as any).created_at,
    updatedAt: (row as any).updated_at,
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

async function assertSubjectSlugAvailable(slug: string, examId?: string, excludeId?: string) {
  if (!isSupabaseConfigured) return;
  let q = supabase.from('subjects').select('id').ilike('slug', slug);
  q = examId ? q.eq('exam_id', examId) : q.is('exam_id', null);
  if (excludeId) q = q.neq('id', excludeId);
  const { data, error } = await q.limit(1);
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error('Subject slug availability could not be confirmed.');
  if (data.length) throw new Error('This URL slug already exists in the same subject scope.');
}

export async function createSubject(subjectData: Omit<Subject, 'id'>): Promise<Subject> {
  const slug =
    subjectData.slug ||
    subjectData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  validateSubjectInput({ ...subjectData, slug });
  const id = crypto.randomUUID();

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

  await assertSubjectSlugAvailable(slug, subjectData.examId);
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

  requireSavedRow({ data, error });
  notifyExamsUpdated();
  return {
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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
  if (!id) throw new Error('A real subject ID is required.');
  validateSubjectInput({
    name: updates.name ?? 'Subject',
    slug: updates.slug ?? 'subject',
    orderIndex: updates.orderIndex,
    iconName: updates.iconName,
  });
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

  if (updates.slug !== undefined) {
    const current = await getSubjectById(id);
    if (!current) throw new Error('Subject not found.');
    await assertSubjectSlugAvailable(updates.slug, updates.examId ?? current.examId, id);
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

  requireSavedRow({ data, error }, id);
  notifyExamsUpdated();

  return {
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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
  const confirmed = await deleteAdminRecord('subjects', id);
  notifyExamsUpdated();
  return confirmed;
}

export async function uploadSubjectIcon(file: File, _subjectId: string = 'custom'): Promise<string>{
  validateRasterFile(file, 'banners', 2 * 1024 * 1024);
  if (isSupabaseConfigured) return uploadValidatedImage(file, 'banners');
  return new Promise<string>((resolve,reject)=>{const reader=new FileReader(); reader.onload=()=>resolve(reader.result as string);reader.onerror=()=>reject(new Error('Image read failed'));reader.readAsDataURL(file);});
}

export async function getSubjectReportingData(): Promise<SubjectReportingData> {
  if (!isSupabaseConfigured) return { questions: [], attempts: [], warnings: [] };
  const read = (table: string, columns: string) =>
    readCompleteQuery(() =>
      supabase.from(table).select(columns, { count: 'exact' }).order('id', { ascending: true })
    );
  const [q, a] = await Promise.allSettled([
    read('questions', 'id,subject_id,chapter_id,topic_id'),
    read('test_attempts', 'id,test_id,status,score,total_marks,correct_count,wrong_count'),
  ]);
  return {
    questions: q.status === 'fulfilled' ? q.value : null,
    attempts: a.status === 'fulfilled' ? a.value : null,
    warnings: [
      ...(q.status === 'rejected'
        ? [`Question counts unavailable: ${q.reason?.message || 'Read failed'}`]
        : []),
      ...(a.status === 'rejected'
        ? [`Attempt statistics unavailable: ${a.reason?.message || 'Read failed'}`]
        : []),
    ],
  };
}

export const adminSubjectsApi = {
  getSubjectReportingData,
  getAllAdminSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  uploadSubjectIcon,
};
