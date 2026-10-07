import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mapQuestionRow } from './admin.shared';
import {
  localQuestions,
  localTestQuestions,
  localSubjects,
  localChapters,
} from '@/services/domains/localStore';
import type { Question } from '@/types';

function enrichQuestionWithTaxonomy(q: Question): Question {
  const subjectName =
    q.subjectName || localSubjects.find((s) => s.id === q.subjectId)?.name || undefined;
  const chapId = q.chapterId || q.topicId;
  const chapterName =
    q.chapterName ||
    q.topicName ||
    localChapters.find((c) => c.id === chapId)?.name ||
    undefined;
  return {
    ...q,
    subjectName,
    chapterName,
    topicName: q.topicName || chapterName,
  };
}

/** Section of the admin API: questions (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// QUESTIONS API
// --------------------------------------------------------------------------
export type AdminQuestionFilters = {
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  difficulty?: string;
  sourceType?: string;
  sourceExam?: string;
  testId?: string;
  search?: string;
  status?: string;
  hasImage?: 'all' | 'with_image' | 'without_image';
};

export async function getAllAdminQuestions(filters?: AdminQuestionFilters): Promise<Question[]> {
  if (!isSupabaseConfigured) {
    let questions = [...localQuestions];
    if (filters) {
      if (filters.hasImage === 'with_image') {
        questions = questions.filter((q) => Boolean(q.imageUrl && q.imageUrl.trim()));
      } else if (filters.hasImage === 'without_image') {
        questions = questions.filter((q) => !q.imageUrl || !q.imageUrl.trim());
      }
      if (filters.subjectId) questions = questions.filter((q) => q.subjectId === filters.subjectId);
      if (filters.chapterId)
        questions = questions.filter(
          (q) => q.chapterId === filters.chapterId || q.topicId === filters.chapterId
        );
      if (filters.topicId)
        questions = questions.filter(
          (q) => q.topicId === filters.topicId || q.chapterId === filters.topicId
        );
      if (filters.difficulty)
        questions = questions.filter((q) => q.difficulty === filters.difficulty);
      if (filters.sourceType) {
        if (filters.sourceType === 'full_mock' || filters.sourceType === 'other') {
          questions = questions.filter(
            (q) =>
              q.sourceType === 'other' ||
              (q.sourceType as string) === 'full_mock' ||
              Boolean(q.sourceExam && q.sourceType !== 'topic' && q.sourceType !== 'pyq')
          );
        } else {
          questions = questions.filter((q) => q.sourceType === filters.sourceType);
        }
      }
      if (filters.sourceExam) {
        const sExam = filters.sourceExam.toLowerCase();
        questions = questions.filter(
          (q) =>
            q.sourceExam &&
            (q.sourceExam.toLowerCase() === sExam ||
              q.sourceExam.toLowerCase().includes(sExam) ||
              sExam.includes(q.sourceExam.toLowerCase()))
        );
      }
      if (filters.testId) {
        const tqIds = localTestQuestions
          .filter((tq) => tq.testId === filters.testId)
          .map((tq) => tq.questionId);
        questions = questions.filter((q) => tqIds.includes(q.id));
      }
      if (filters.status) questions = questions.filter((q) => q.status === filters.status);
      if (filters.search) {
        const term = filters.search.toLowerCase();
        questions = questions.filter(
          (q) =>
            q.questionText.toLowerCase().includes(term) ||
            (q.questionBengaliText && q.questionBengaliText.toLowerCase().includes(term))
        );
      }
    }
    return questions;
  }

  let testQuestionIds: string[] | null = null;
  if (filters?.testId) {
    const { data: tqData, error: tqError } = await supabase
      .from('test_questions')
      .select('question_id')
      .eq('test_id', filters.testId);

    if (tqError) throw new Error(tqError.message);
    testQuestionIds = tqData?.map((r: any) => r.question_id) || [];
    if (testQuestionIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from('questions')
    .select(
      `
      *,
      subjects:subject_id (id, name),
      chapters:chapter_id (id, name)
    `
    )
    .order('created_at', { ascending: false });

  if (testQuestionIds && testQuestionIds.length > 0) {
    query = query.in('id', testQuestionIds);
  }
  if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
  const chapId = filters?.topicId || filters?.chapterId;
  if (chapId) query = query.or(`chapter_id.eq.${chapId},topic_id.eq.${chapId}`);
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters?.sourceType) {
    if (filters.sourceType === 'full_mock' || filters.sourceType === 'other') {
      query = query.in('source_type', ['other', 'full_mock']);
    } else {
      query = query.eq('source_type', filters.sourceType);
    }
  }
  if (filters?.sourceExam) query = query.eq('source_exam', filters.sourceExam);
  if (filters?.status) query = query.eq('status', filters.status);

  if (filters?.hasImage === 'with_image') {
    query = query.not('image_url', 'is', null).neq('image_url', '');
  } else if (filters?.hasImage === 'without_image') {
    query = query.or('image_url.is.null,image_url.eq.""');
  }

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim();
    query = query.or(
      `question_text.ilike.%${term}%,question_bengali_text.ilike.%${term}%,explanation.ilike.%${term}%,explanation_bengali.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((q: any) => mapQuestionRow(q));
}

/**
 * Shared Supabase filter builder (single source of truth for every
 * question-list query). `testId` is resolved by callers into id lists or
 * counts because it needs a junction pre-query.
 */
function applyQuestionListFilters(
  query: any,
  filters: AdminQuestionFilters | undefined,
  testQuestionIds: string[] | null
): any {
  if (testQuestionIds && testQuestionIds.length > 0) {
    query = query.in('id', testQuestionIds);
  }
  if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
  const chapId = filters?.topicId || filters?.chapterId;
  if (chapId) query = query.or(`chapter_id.eq.${chapId},topic_id.eq.${chapId}`);
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters?.sourceType) {
    if (filters.sourceType === 'full_mock' || filters.sourceType === 'other') {
      query = query.in('source_type', ['other', 'full_mock']);
    } else {
      query = query.eq('source_type', filters.sourceType);
    }
  }
  if (filters?.sourceExam) query = query.eq('source_exam', filters.sourceExam);
  if (filters?.status) query = query.eq('status', filters.status);

  if (filters?.hasImage === 'with_image') {
    query = query.not('image_url', 'is', null).neq('image_url', '');
  } else if (filters?.hasImage === 'without_image') {
    query = query.or('image_url.is.null,image_url.eq.""');
  }

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim();
    query = query.or(
      `question_text.ilike.%${term}%,question_bengali_text.ilike.%${term}%,explanation.ilike.%${term}%,explanation_bengali.ilike.%${term}%`
    );
  }
  return query;
}

async function resolveTestQuestionIds(testId: string): Promise<string[]> {
  const { data: tqData, error: tqError } = await supabase
    .from('test_questions')
    .select('question_id')
    .eq('test_id', testId);

  if (tqError) throw new Error(tqError.message);
  return tqData?.map((r: any) => r.question_id) || [];
}

/**
 * Exact total of matching questions WITHOUT loading rows (head count).
 * Used for honest "Select all N" labels on large banks. Returns null when
 * the count cannot be determined (callers fall back to loaded length).
 */
export async function getAdminQuestionsCount(
  filters?: AdminQuestionFilters
): Promise<number | null> {
  if (!isSupabaseConfigured) {
    return (await getAllAdminQuestions(filters)).length;
  }
  try {
    if (filters?.testId) {
      return (await resolveTestQuestionIds(filters.testId)).length;
    }
    let query = supabase.from('questions').select('id', { count: 'exact', head: true });
    query = applyQuestionListFilters(query, filters, null);
    const { count, error } = await query;
    if (error) return null;
    return count ?? null;
  } catch {
    return null;
  }
}

/**
 * ALL matching question IDs, bypassing PostgREST's 1000-row default cap via
 * chunked range fetches. Powers cap-proof "Select all N questions".
 */
export async function getAllAdminQuestionIds(filters?: AdminQuestionFilters): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return (await getAllAdminQuestions(filters)).map((q) => q.id);
  }
  let testQuestionIds: string[] | null = null;
  if (filters?.testId) {
    testQuestionIds = await resolveTestQuestionIds(filters.testId);
    if (testQuestionIds.length === 0) return [];
  }
  const CHUNK = 1000;
  const ids: string[] = [];
  for (let from = 0; ; from += CHUNK) {
    let query = supabase
      .from('questions')
      .select('id')
      .order('created_at', { ascending: false })
      .range(from, from + CHUNK - 1);
    query = applyQuestionListFilters(query, filters, testQuestionIds);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = (data || []) as { id: string }[];
    ids.push(...rows.map((r) => String(r.id)));
    if (rows.length < CHUNK) break;
  }
  return ids;
}

/**
 * Server-side paginated question fetch (large banks must not load entirely
 * into the browser). Returns the page of questions plus the exact total
 * count so the admin UI can render pagination controls.
 */
export async function getAdminQuestionsPaged(
  filters:
    | {
        subjectId?: string;
        chapterId?: string;
        topicId?: string;
        difficulty?: string;
        sourceType?: string;
        search?: string;
        status?: string;
        hasImage?: 'all' | 'with_image' | 'without_image';
      }
    | undefined,
  page: number,
  pageSize: number
): Promise<{ questions: Question[]; total: number }> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.min(200, Math.max(1, Math.floor(pageSize) || 50));
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;

  if (!isSupabaseConfigured) {
    const all = await getAllAdminQuestions(filters);
    return {
      questions: all.slice(from, from + safeSize),
      total: all.length,
    };
  }

  let query = supabase
    .from('questions')
    .select(
      `
      *,
      subjects:subject_id (id, name),
      chapters:chapter_id (id, name)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (filters?.subjectId) query = query.eq('subject_id', filters.subjectId);
  const chapId = filters?.topicId || filters?.chapterId;
  if (chapId) query = query.or(`chapter_id.eq.${chapId},topic_id.eq.${chapId}`);
  if (filters?.sourceType) {
    if (filters.sourceType === 'full_mock' || filters.sourceType === 'other') {
      query = query.in('source_type', ['other', 'full_mock']);
    } else {
      query = query.eq('source_type', filters.sourceType);
    }
  }
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.hasImage === 'with_image') {
    query = query.not('image_url', 'is', null).neq('image_url', '');
  } else if (filters?.hasImage === 'without_image') {
    query = query.or('image_url.is.null,image_url.eq.""');
  }
  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim();
    query = query.or(
      `question_text.ilike.%${term}%,question_bengali_text.ilike.%${term}%,explanation.ilike.%${term}%,explanation_bengali.ilike.%${term}%`
    );
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {
    questions: (data || []).map((q: any) => mapQuestionRow(q)),
    total: count ?? (data ? data.length : 0),
  };
}

export async function getQuestionById(id: string): Promise<Question | null> {
  if (!isSupabaseConfigured) {
    const found = localQuestions.find((q) => q.id === id);
    return found ? enrichQuestionWithTaxonomy(found) : null;
  }

  const { data, error } = await supabase
    .from('questions')
    .select(
      `
      *,
      subjects:subject_id (id, name),
      chapters:chapter_id (id, name)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (!error && data) {
    return enrichQuestionWithTaxonomy(mapQuestionRow(data));
  }

  return getPublicQuestionById(id);
}

export async function getPublicQuestionById(id: string): Promise<Question | null> {
  if (isSupabaseConfigured) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_public_seo_question_by_id',
        { p_question_id: id }
      );
      if (!rpcError && rpcData && typeof rpcData === 'object' && 'id' in rpcData) {
        return enrichQuestionWithTaxonomy(rpcData as unknown as Question);
      }
    } catch {
      // RPC may not be deployed yet; fall back to localQuestions
    }
  }

  const localFound = localQuestions.find((q) => q.id === id);
  return localFound ? enrichQuestionWithTaxonomy(localFound) : null;
}

export async function getPublicQuestions(filters?: {
  subjectId?: string;
  search?: string;
}): Promise<Question[]> {
  if (isSupabaseConfigured) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_seo_questions', {
        p_subject_id: filters?.subjectId || null,
        p_search: filters?.search || null,
        p_limit: 500,
      });
      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return (rpcData as unknown as Question[]).map(enrichQuestionWithTaxonomy);
      }
    } catch {
      // RPC may not be deployed yet; continue to adminList / localQuestions
    }

    try {
      const adminList = await getAllAdminQuestions({
        status: 'active',
        subjectId: filters?.subjectId,
        search: filters?.search,
      });
      if (adminList.length > 0) {
        return adminList.map(enrichQuestionWithTaxonomy);
      }
    } catch {
      // Fall through to localQuestions
    }
  }

  let questions = localQuestions
    .filter((q) => q.isActive !== false && q.status !== 'archived' && q.status !== 'draft')
    .map(enrichQuestionWithTaxonomy);

  if (filters?.subjectId) {
    questions = questions.filter((q) => q.subjectId === filters.subjectId);
  }
  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    questions = questions.filter(
      (q) =>
        q.questionText.toLowerCase().includes(term) ||
        (q.questionBengaliText && q.questionBengaliText.toLowerCase().includes(term)) ||
        (q.explanation && q.explanation.toLowerCase().includes(term)) ||
        (q.explanationBengali && q.explanationBengali.toLowerCase().includes(term))
    );
  }

  return questions;
}

export async function createQuestion(qData: Omit<Question, 'id'>): Promise<Question> {
  const id = crypto.randomUUID();
  const effectiveTopicId = qData.topicId || qData.chapterId || null;

  if (!isSupabaseConfigured) {
    const newQuestion: Question = {
      id,
      ...qData,
      topicId: effectiveTopicId || undefined,
      chapterId: effectiveTopicId || undefined,
      sourceType: qData.sourceType || 'topic',
      isActive: qData.isActive ?? true,
      status: qData.status || 'active',
    };
    localQuestions.unshift(newQuestion);
    return newQuestion;
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({
      id,
      chapter_id: effectiveTopicId,
      topic_id: effectiveTopicId,
      subject_id: qData.subjectId || null,
      question_text: qData.questionText || qData.questionBengaliText || '',
      question_bengali_text:
        qData.questionBengaliText ||
        (/[\u0980-\u09FF]/.test(qData.questionText) ? qData.questionText : null),
      image_url: qData.imageUrl || null,
      option_a: qData.optionA,
      option_b: qData.optionB,
      option_c: qData.optionC,
      option_d: qData.optionD,
      correct_option: qData.correctOption,
      explanation: qData.explanation || qData.explanationBengali || null,
      explanation_bengali: qData.explanationBengali || qData.explanation || null,
      difficulty: qData.difficulty || 'medium',
      default_marks: qData.defaultMarks ?? 1.0,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      default_negative_marks: qData.defaultNegativeMarks ?? 0,
      question_type: qData.questionType || 'mcq',
      source_type: qData.sourceType || 'topic',
      source_year: qData.sourceYear || null,
      source_exam: qData.sourceExam || null,
      source_paper: qData.sourcePaper || null,
      source_shift: qData.sourceShift || null,
      is_active: qData.isActive ?? true,
      status: qData.status || 'active',
    })
    .select(
      `
      *,
      subjects:subject_id (id, name),
      chapters:chapter_id (id, name)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create question in database');
  }

  return mapQuestionRow(data);
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
  if (!isSupabaseConfigured) {
    const idx = localQuestions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      localQuestions[idx] = { ...localQuestions[idx], ...updates };
    }
    return localQuestions[idx] || (updates as Question);
  }

  const payload: Record<string, unknown> = {};
  if (updates.questionText !== undefined) payload.question_text = updates.questionText;
  if (updates.questionBengaliText !== undefined)
    payload.question_bengali_text = updates.questionBengaliText;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl || null;
  if (updates.optionA !== undefined) payload.option_a = updates.optionA;
  if (updates.optionB !== undefined) payload.option_b = updates.optionB;
  if (updates.optionC !== undefined) payload.option_c = updates.optionC;
  if (updates.optionD !== undefined) payload.option_d = updates.optionD;
  if (updates.correctOption !== undefined) payload.correct_option = updates.correctOption;
  if (updates.explanation !== undefined) payload.explanation = updates.explanation;
  if (updates.explanationBengali !== undefined)
    payload.explanation_bengali = updates.explanationBengali;
  if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty;
  if (updates.defaultMarks !== undefined) payload.default_marks = updates.defaultMarks;
  if (updates.defaultNegativeMarks !== undefined)
    payload.default_negative_marks = updates.defaultNegativeMarks;
  if (updates.topicId !== undefined) {
    payload.topic_id = updates.topicId || null;
    payload.chapter_id = updates.topicId || null;
  }
  if (updates.chapterId !== undefined) {
    payload.chapter_id = updates.chapterId || null;
    payload.topic_id = updates.chapterId || null;
  }
  if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
  if (updates.questionType !== undefined) payload.question_type = updates.questionType;
  if (updates.sourceType !== undefined) payload.source_type = updates.sourceType;
  if (updates.sourceYear !== undefined) payload.source_year = updates.sourceYear || null;
  if (updates.sourceExam !== undefined) payload.source_exam = updates.sourceExam || null;
  if (updates.sourcePaper !== undefined) payload.source_paper = updates.sourcePaper || null;
  if (updates.sourceShift !== undefined) payload.source_shift = updates.sourceShift || null;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase
    .from('questions')
    .update(payload)
    .eq('id', id)
    .select(
      `
      *,
      subjects:subject_id (id, name),
      chapters:chapter_id (id, name)
    `
    )
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update question in database');
  }

  return mapQuestionRow(data);
}

export async function deleteQuestion(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const idx = localQuestions.findIndex((q) => q.id === id);
    if (idx !== -1) localQuestions.splice(idx, 1);
    const tqIdx = localTestQuestions.findIndex((t) => t.questionId === id);
    if (tqIdx !== -1) localTestQuestions.splice(tqIdx, 1);
    return true;
  }

  // Delete test_questions assignments first
  await supabase.from('test_questions').delete().eq('question_id', id);

  // Delete question and verify affected row
  const { data, error } = await supabase.from('questions').delete().eq('id', id).select('id');
  if (error) {
    throw new Error(error.message || 'Failed to delete question from database');
  }
  if (!data || data.length === 0) {
    throw new Error('Question not found or 0 rows deleted');
  }
  return true;
}

export async function deleteQuestions(
  ids: string[]
): Promise<{ success: boolean; deletedCount: number }> {
  if (ids.length === 0) return { success: true, deletedCount: 0 };

  if (!isSupabaseConfigured) {
    const idSet = new Set(ids);
    const initialLength = localQuestions.length;
    for (let i = localQuestions.length - 1; i >= 0; i--) {
      if (idSet.has(localQuestions[i].id)) {
        localQuestions.splice(i, 1);
      }
    }
    for (let i = localTestQuestions.length - 1; i >= 0; i--) {
      if (idSet.has(localTestQuestions[i].questionId)) {
        localTestQuestions.splice(i, 1);
      }
    }
    const deletedCount = initialLength - localQuestions.length;
    return { success: true, deletedCount: deletedCount || ids.length };
  }

  await supabase.from('test_questions').delete().in('question_id', ids);

  const { data, error } = await supabase.from('questions').delete().in('id', ids).select('id');
  if (error) {
    throw new Error(error.message || 'Failed to bulk delete questions from database');
  }
  const deletedCount = data?.length ?? 0;
  if (deletedCount === 0) {
    throw new Error('No questions were deleted (0 rows affected)');
  }

  return { success: true, deletedCount };
}

export async function updateQuestionsStatus(
  ids: string[],
  status: 'active' | 'draft' | 'archived'
): Promise<{ success: boolean; updatedCount: number }> {
  if (ids.length === 0) return { success: true, updatedCount: 0 };
  const isActive = status === 'active';

  if (!isSupabaseConfigured) {
    const idSet = new Set(ids);
    let count = 0;
    localQuestions.forEach((q) => {
      if (idSet.has(q.id)) {
        q.status = status;
        q.isActive = isActive;
        count++;
      }
    });
    return { success: true, updatedCount: count };
  }

  const { data, error } = await supabase
    .from('questions')
    .update({ status, is_active: isActive })
    .in('id', ids)
    .select('id');

  if (error) {
    throw new Error(error.message || 'Failed to update questions status in database');
  }
  const updatedCount = data?.length ?? 0;
  if (updatedCount === 0) {
    throw new Error('No questions were updated (0 rows affected)');
  }

  return { success: true, updatedCount };
}

export async function archiveQuestion(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const idx = localQuestions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      localQuestions[idx].status = 'archived';
      localQuestions[idx].isActive = false;
    }
    return true;
  }

  const { error } = await supabase
    .from('questions')
    .update({ status: 'archived', is_active: false })
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to archive question in database');
  }
  return true;
}

export async function uploadQuestionImage(file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const filePath = `questions/${fileName}`;

  const { data, error } = await supabase.storage.from('question-images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from('question-images').getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export async function uploadUserAvatar(file: File, userId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const ext = file.name.split('.').pop() || 'png';
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `${userId}-${Date.now()}.${cleanExt}`;
    const filePath = `avatars/${fileName}`;

    // First try 'avatars' storage bucket
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (!error && data?.path) {
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    }

    // If 'avatars' bucket failed, fallback to 'question-images' bucket
    const { data: qData, error: qError } = await supabase.storage
      .from('question-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!qError && qData?.path) {
      const { data: qUrlData } = supabase.storage.from('question-images').getPublicUrl(qData.path);
      return qUrlData.publicUrl;
    }

    // Safe fallback to data URL
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.warn('Avatar upload exception, falling back to data URL:', err);
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

export const adminQuestionsApi = {
  getAllAdminQuestions,
  getAllAdminQuestionIds,
  getAdminQuestionsCount,
  getAdminQuestionsPaged,
  getQuestionById,
  getPublicQuestionById,
  getPublicQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteQuestions,
  updateQuestionsStatus,
  archiveQuestion,
  uploadQuestionImage,
  uploadUserAvatar,
};
