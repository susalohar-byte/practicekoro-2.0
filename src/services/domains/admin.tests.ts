import { readCompleteQuery } from './admin.reporting';
import { deleteAdminRecord, requireSavedRow } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { notifyExamsUpdated } from '@/lib/dataSync';
import { catalogApi } from '@/services/domains/catalog';
import { getTestAssignedQuestions, saveTestQuestions } from './admin.testQuestions';
import {
  localChapters,
  localExams,
  localSubjects,
  localTestQuestions,
  localTestSeries,
  localTests,
} from '@/services/domains/localStore';
import type {
  MockTest,
  PublishValidationResult,
  Question,
  StudentAttemptExportRow,
  TestQuestionAssignment,
} from '@/types';
import type { QuestionRow } from '@/services/domains/localStore';

/** Section of the admin API: tests (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// TESTS API
// --------------------------------------------------------------------------
/** Upload custom test icon to Supabase storage with robust bucket fallback */
export async function uploadTestIcon(file: File, testId: string = 'custom'): Promise<string> {
  if (isSupabaseConfigured) {
    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '') || 'png';
    const safeId = testId.replace(/[^a-zA-Z0-9_-]/g, '-');
    const path = `test-icons/${safeId}/icon-${Date.now()}.${extension}`;

    // 1. Try 'banners' bucket
    const { data, error } = await supabase.storage.from('banners').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (!error && data) {
      return supabase.storage.from('banners').getPublicUrl(data.path).data.publicUrl;
    }

    // 2. Fallback to 'question-images' or 'avatars'
    const fallbackBucket = 'question-images';
    const { data: fbData, error: fbError } = await supabase.storage
      .from(fallbackBucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
    if (!fbError && fbData) {
      return supabase.storage.from(fallbackBucket).getPublicUrl(fbData.path).data.publicUrl;
    }

    throw new Error(`Icon upload failed: ${error?.message || fbError?.message || 'Storage error'}`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getAllAdminTests(filter?: {
  examId?: string;
  subjectId?: string;
  chapterId?: string;
  testSeriesId?: string;
  testType?: string;
  status?: string;
}): Promise<MockTest[]> {
  if (!isSupabaseConfigured) {
    let tests = [...localTests];
    if (filter) {
      if (filter.examId) tests = tests.filter((t) => t.examId === filter.examId);
      if (filter.subjectId) tests = tests.filter((t) => t.subjectId === filter.subjectId);
      if (filter.chapterId) tests = tests.filter((t) => t.chapterId === filter.chapterId);
      if (filter.testSeriesId) tests = tests.filter((t) => t.testSeriesId === filter.testSeriesId);
      if (filter.testType) tests = tests.filter((t) => t.testType === filter.testType);
      if (filter.status) tests = tests.filter((t) => t.status === filter.status);
    }
    return tests.map((t) => {
      const exam = localExams.find((e) => e.id === t.examId);
      const subject = localSubjects.find((s) => s.id === t.subjectId);
      const chapter = localChapters.find((c) => c.id === t.chapterId);
      const series = localTestSeries.find((s) => s.id === t.testSeriesId);
      return {
        ...t,
        examTitle: exam?.title,
        subjectName: subject?.name,
        chapterName: chapter?.name,
        testSeriesTitle: series?.title,
      };
    });
  }

  let query = supabase
    .from('tests')
    .select(
      `
      *,
      exams:exam_id (title),
      subjects:subject_id (name),
      chapters:chapter_id (name),
      test_series:test_series_id (title)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (filter?.examId) query = query.eq('exam_id', filter.examId);
  if (filter?.subjectId) query = query.eq('subject_id', filter.subjectId);
  if (filter?.chapterId) query = query.eq('chapter_id', filter.chapterId);
  if (filter?.testSeriesId) query = query.eq('test_series_id', filter.testSeriesId);
  if (filter?.testType) query = query.eq('test_type', filter.testType);
  if (filter?.status) query = query.eq('status', filter.status);

  const data = await readCompleteQuery(() => query.order('id', { ascending: true }));

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    iconUrl: row.icon_url || undefined,
    examId: row.exam_id ?? undefined,
    subjectId: row.subject_id ?? undefined,
    chapterId: row.chapter_id ?? undefined,
    testSeriesId: row.test_series_id ?? undefined,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    testType: row.test_type,
    year: row.year ? Number(row.year) : undefined,
    paperName: row.paper_name ?? undefined,
    shift: row.shift ?? undefined,
    setName: row.set_name ?? undefined,
    examDate: row.exam_date ?? undefined,
    durationMinutes: row.duration_minutes,
    totalQuestions: row.total_questions,
    totalMarks: Number(row.total_marks),
    passingMarks: Number(row.passing_marks),
    negativeMarking: Number(row.negative_marking),
    isPremium: row.is_premium,
    orderIndex: row.order_index,
    isActive: row.is_active,
    status: (row.status as 'draft' | 'published' | 'archived') || 'published',
    examTitle: row.exams?.title || undefined,
    subjectName: row.subjects?.name || undefined,
    chapterName: row.chapters?.name || undefined,
    testSeriesTitle: row.test_series?.title || undefined,
  }));
}

export async function getSeriesTests(testSeriesId: string): Promise<MockTest[]> {
  return getAllAdminTests({ testSeriesId });
}

export async function assignTestToSeries(
  testId: string,
  testSeriesId: string | null
): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = localTests.findIndex((t) => t.id === testId);
    if (idx !== -1) {
      localTests[idx].testSeriesId = testSeriesId || undefined;
    }
    return;
  }

  const { data, error } = await supabase
    .from('tests')
    .update({ test_series_id: testSeriesId })
    .eq('id', testId)
    .select('id')
    .maybeSingle();
  requireSavedRow({ data, error }, testId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getTestById(testId: string): Promise<MockTest | null> {
  if (!isSupabaseConfigured) {
    const mockFound = localTests.find((t) => t.id === testId);
    return mockFound || null;
  }

  const { data, error } = await supabase
    .from('tests')
    .select(
      `
      *,
      exams:exam_id (title),
      subjects:subject_id (name),
      chapters:chapter_id (name),
      test_series:test_series_id (title)
    `
    )
    .eq('id', testId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as any;
  return {
    id: row.id,
    iconUrl: row.icon_url || undefined,
    examId: row.exam_id ?? undefined,
    subjectId: row.subject_id ?? undefined,
    chapterId: row.chapter_id ?? undefined,
    testSeriesId: row.test_series_id ?? undefined,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    testType: row.test_type,
    year: row.year ? Number(row.year) : undefined,
    paperName: row.paper_name ?? undefined,
    shift: row.shift ?? undefined,
    setName: row.set_name ?? undefined,
    examDate: row.exam_date ?? undefined,
    durationMinutes: row.duration_minutes,
    totalQuestions: row.total_questions,
    totalMarks: Number(row.total_marks),
    passingMarks: Number(row.passing_marks),
    negativeMarking: Number(row.negative_marking),
    isPremium: row.is_premium,
    orderIndex: row.order_index,
    isActive: row.is_active,
    status: (row.status as 'draft' | 'published' | 'archived') || 'published',
    examTitle: row.exams?.title || undefined,
    subjectName: row.subjects?.name || undefined,
    chapterName: row.chapters?.name || undefined,
    testSeriesTitle: row.test_series?.title || undefined,
  };
}

export async function createTest(
  testData: Omit<MockTest, 'id' | 'status'> & { status?: 'draft' | 'published' | 'archived' }
): Promise<MockTest> {
  const slug =
    testData.slug ||
    testData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  const id = `test-${slug}-${Date.now().toString().slice(-4)}`;

  if (!isSupabaseConfigured) {
    const newTest: MockTest = {
      id,
      ...testData,
      slug,
      status: testData.status || 'draft',
      isActive: testData.isActive ?? true,
    };
    localTests.unshift(newTest);
    notifyExamsUpdated();
    return newTest;
  }

  const insertPayload: Record<string, unknown> = {
    id,
    exam_id: testData.examId || null,
    subject_id: testData.subjectId || null,
    chapter_id: testData.chapterId || null,
    test_series_id: testData.testSeriesId || null,
    title: testData.title,
    slug,
    description: testData.description || null,
    test_type: testData.testType,
    year: testData.year || null,
    paper_name: testData.paperName || null,
    shift: testData.shift || null,
    set_name: testData.setName || null,
    exam_date: testData.examDate || null,
    duration_minutes: testData.durationMinutes,
    total_questions: testData.totalQuestions || 0,
    total_marks: testData.totalMarks || 0,
    passing_marks: testData.passingMarks || 0,
    // Negative marking is optional and set at test creation (Full Mock / PYQ only).
    negative_marking: testData.negativeMarking ?? 0,
    is_premium: testData.isPremium ?? false,
    order_index: testData.orderIndex || 0,
    is_active: testData.isActive ?? true,
    status: testData.status || 'draft',
    icon_url: testData.iconUrl || null,
  };

  const selectCols = `
    *,
    exams:exam_id (title),
    subjects:subject_id (name),
    chapters:chapter_id (name),
    test_series:test_series_id (title)
  `;

  let insertRes = await supabase.from('tests').insert(insertPayload).select(selectCols).single();

  // Resilience: if target DB does not have icon_url column yet, retry without icon_url
  if (insertRes.error && insertRes.error.message.includes('icon_url')) {
    if (testData.iconUrl)
      throw new Error(
        'Test icon storage is unavailable. Apply the tests icon_url migration before saving an icon.'
      );
    delete insertPayload.icon_url;
    insertRes = await supabase.from('tests').insert(insertPayload).select(selectCols).single();
  }

  const { data, error } = insertRes;

  if (error) {
    throw new Error(error.message);
  }

  // Sync extra exam associations
  const allAssocExams = Array.from(
    new Set(
      [testData.examId, ...(testData.associatedExamIds || [])].filter((x): x is string =>
        Boolean(x)
      )
    )
  );
  if (allAssocExams.length > 0) {
    const assocRows = allAssocExams.map((eid) => ({ test_id: id, exam_id: eid }));
    await supabase.from('test_exams').upsert(assocRows, { onConflict: 'test_id,exam_id' });
  }

  const row = data as any;
  if (testData.iconUrl && row.icon_url !== testData.iconUrl)
    throw new Error('The backend did not confirm the saved test icon.');
  notifyExamsUpdated();
  return {
    id: row.id,
    iconUrl: row.icon_url || undefined,
    examId: row.exam_id ?? undefined,
    subjectId: row.subject_id ?? undefined,
    chapterId: row.chapter_id ?? undefined,
    testSeriesId: row.test_series_id ?? undefined,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    testType: row.test_type,
    year: row.year ? Number(row.year) : undefined,
    paperName: row.paper_name ?? undefined,
    shift: row.shift ?? undefined,
    setName: row.set_name ?? undefined,
    examDate: row.exam_date ?? undefined,
    durationMinutes: row.duration_minutes,
    totalQuestions: row.total_questions,
    totalMarks: Number(row.total_marks),
    passingMarks: Number(row.passing_marks),
    negativeMarking: Number(row.negative_marking),
    isPremium: row.is_premium,
    orderIndex: row.order_index,
    isActive: row.is_active,
    status: (row.status as 'draft' | 'published' | 'archived') || 'draft',
    examTitle: row.exams?.title || undefined,
    subjectName: row.subjects?.name || undefined,
    chapterName: row.chapters?.name || undefined,
    testSeriesTitle: row.test_series?.title || undefined,
  };
}

export async function updateTest(id: string, updates: Partial<MockTest>): Promise<MockTest> {
  if (!isSupabaseConfigured) {
    const idx = localTests.findIndex((t) => t.id === id);
    if (idx !== -1) {
      localTests[idx] = { ...localTests[idx], ...updates };
    }
    notifyExamsUpdated();
    return localTests[idx] || (updates as MockTest);
  }

  const payload: Record<string, unknown> = {};
  if (updates.examId !== undefined) payload.exam_id = updates.examId || null;
  if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
  if (updates.chapterId !== undefined) payload.chapter_id = updates.chapterId || null;
  if (updates.topicId !== undefined) payload.chapter_id = updates.topicId || null;
  if (updates.testSeriesId !== undefined) payload.test_series_id = updates.testSeriesId || null;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.testType !== undefined) payload.test_type = updates.testType;
  if (updates.year !== undefined) payload.year = updates.year || null;
  if (updates.paperName !== undefined) payload.paper_name = updates.paperName || null;
  if (updates.shift !== undefined) payload.shift = updates.shift || null;
  if (updates.setName !== undefined) payload.set_name = updates.setName || null;
  if (updates.examDate !== undefined) payload.exam_date = updates.examDate || null;
  if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
  if (updates.totalQuestions !== undefined) payload.total_questions = updates.totalQuestions;
  if (updates.totalMarks !== undefined) payload.total_marks = updates.totalMarks;
  if (updates.passingMarks !== undefined) payload.passing_marks = updates.passingMarks;
  if (updates.negativeMarking !== undefined) payload.negative_marking = updates.negativeMarking;
  if (updates.isPremium !== undefined) payload.is_premium = updates.isPremium;
  if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;
  if (updates.isActive !== undefined) payload.is_active = updates.isActive;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.iconUrl !== undefined) payload.icon_url = updates.iconUrl || null;

  const selectCols = `
    *,
    exams:exam_id (title),
    subjects:subject_id (name),
    chapters:chapter_id (name),
    test_series:test_series_id (title)
  `;

  let updateRes = await supabase
    .from('tests')
    .update(payload)
    .eq('id', id)
    .select(selectCols)
    .single();

  // Resilience: if target DB does not have icon_url column yet, retry without icon_url
  if (updateRes.error && updateRes.error.message.includes('icon_url')) {
    if (updates.iconUrl !== undefined)
      throw new Error(
        'Test icon storage is unavailable. Apply the tests icon_url migration before changing an icon.'
      );
    delete payload.icon_url;
    updateRes = await supabase
      .from('tests')
      .update(payload)
      .eq('id', id)
      .select(selectCols)
      .single();
  }

  const { data, error } = updateRes;

  if (error) {
    throw new Error(error.message);
  }

  if (updates.associatedExamIds !== undefined) {
    await catalogApi.syncTestExamAssociations(id, updates.associatedExamIds);
  }

  const row = data as any;
  if (updates.iconUrl !== undefined && (row.icon_url || '') !== (updates.iconUrl || ''))
    throw new Error('The backend did not confirm the saved test icon.');
  notifyExamsUpdated();
  return {
    id: row.id,
    iconUrl: row.icon_url || undefined,
    examId: row.exam_id ?? undefined,
    subjectId: row.subject_id ?? undefined,
    chapterId: row.chapter_id ?? undefined,
    testSeriesId: row.test_series_id ?? undefined,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    testType: row.test_type,
    year: row.year ? Number(row.year) : undefined,
    paperName: row.paper_name ?? undefined,
    shift: row.shift ?? undefined,
    setName: row.set_name ?? undefined,
    examDate: row.exam_date ?? undefined,
    durationMinutes: row.duration_minutes,
    totalQuestions: row.total_questions,
    totalMarks: Number(row.total_marks),
    passingMarks: Number(row.passing_marks),
    negativeMarking: Number(row.negative_marking),
    isPremium: row.is_premium,
    orderIndex: row.order_index,
    isActive: row.is_active,
    status: (row.status as 'draft' | 'published' | 'archived') || 'published',
    examTitle: row.exams?.title || undefined,
    subjectName: row.subjects?.name || undefined,
    chapterName: row.chapters?.name || undefined,
    testSeriesTitle: row.test_series?.title || undefined,
  };
}

export async function deleteTest(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const i = localTests.findIndex((e) => e.id === id);
    if (i < 0) throw new Error('Record not found.');
    localTests.splice(i, 1);
    return true;
  }
  return deleteAdminRecord('tests', id);
}

export async function duplicateTest(id: string): Promise<MockTest | null> {
  const existing = await getTestById(id);
  if (!existing) return null;

  const newTest = await createTest({
    title: `${existing.title} (Copy)`,
    slug: `${existing.slug || 'test'}-copy-${Date.now()}`,
    description: existing.description,
    examId: existing.examId,
    subjectId: existing.subjectId,
    chapterId: existing.chapterId,
    topicId: existing.topicId,
    durationMinutes: existing.durationMinutes,
    totalMarks: existing.totalMarks,
    passingMarks: existing.passingMarks,
    negativeMarking: existing.negativeMarking,
    isPremium: existing.isPremium,
    testType: existing.testType,
    totalQuestions: existing.totalQuestions || 0,
    orderIndex: (existing.orderIndex || 1) + 1,
    isActive: false,
    year: existing.year,
    paperName: existing.paperName,
    shift: existing.shift,
    status: 'draft',
  });

  try {
    const qAssigned = await getTestAssignedQuestions(id);
    if (qAssigned && qAssigned.length > 0) {
      await saveTestQuestions(
        newTest.id,
        qAssigned.map((q: TestQuestionAssignment, idx: number) => ({
          questionId: q.questionId,
          orderIndex: idx + 1,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
        }))
      );
    }
  } catch (e) {
    console.warn('Questions duplication note:', e);
  }

  return newTest;
}

export async function getTestAttempts(testId: string): Promise<any[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  const { data, error } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, score, total_marks, accuracy, correct_count, wrong_count, skipped_count, time_spent_seconds, status, created_at, profiles(full_name, email)'
    )
    .eq('test_id', testId)
    .order('score', { ascending: false });

  if (error) {
    const { data: fallbackData } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('test_id', testId)
      .order('score', { ascending: false });
    return (fallbackData || []).map((d: any, idx: number) => ({
      id: d.id,
      rank: idx + 1,
      userId: d.user_id,
      userName: 'Student Candidate',
      userEmail: '',
      score: Number(d.score || 0),
      totalMarks: Number(d.total_marks || 0),
      accuracy: Number(d.accuracy || 0),
      correctCount: Number(d.correct_count || 0),
      wrongCount: Number(d.wrong_count || 0),
      skippedCount: Number(d.skipped_count || 0),
      timeSpentSeconds: Number(d.time_spent_seconds || 0),
      status: d.status || 'completed',
      createdAt: d.created_at,
    }));
  }

  return (data || []).map((d: any, idx: number) => ({
    id: d.id,
    rank: idx + 1,
    userId: d.user_id,
    userName: d.profiles?.full_name || 'Student Candidate',
    userEmail: d.profiles?.email || '',
    score: Number(d.score || 0),
    totalMarks: Number(d.total_marks || 0),
    accuracy: Number(d.accuracy || 0),
    correctCount: Number(d.correct_count || 0),
    wrongCount: Number(d.wrong_count || 0),
    skippedCount: Number(d.skipped_count || 0),
    timeSpentSeconds: Number(d.time_spent_seconds || 0),
    status: d.status || 'completed',
    createdAt: d.created_at,
  }));
}

export async function getTestResultsForExport(testId: string): Promise<StudentAttemptExportRow[]> {
  const rawAttempts = await getTestAttempts(testId);
  return rawAttempts.map((att, idx) => {
    const score = Number(att.score ?? 0);
    const totalMarks = Number(att.totalMarks ?? 0);
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;
    const accuracy = Number(att.accuracy ?? 0);
    const seconds = Number(att.timeSpentSeconds ?? 0);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return {
      rank: att.rank || idx + 1,
      candidateName: att.userName || 'Student Candidate',
      email: att.userEmail || '-',
      phone: undefined,
      score,
      totalMarks,
      percentage,
      accuracy,
      correctCount: Number(att.correctCount ?? 0),
      wrongCount: Number(att.wrongCount ?? 0),
      skippedCount: Number(att.skippedCount ?? 0),
      timeSpentMinutes: `${m}m ${s}s`,
      attemptDate: att.createdAt || new Date().toISOString(),
    };
  });
}

export function exportTestResultsToCsv(testTitle: string, rows: StudentAttemptExportRow[]): void {
  const headers = [
    'Rank',
    'Candidate Name',
    'Email / Phone',
    'Score',
    'Total Marks',
    'Percentage (%)',
    'Accuracy (%)',
    'Correct',
    'Wrong',
    'Skipped / Unattempted',
    'Time Spent (M:S)',
    'Submitted At',
  ];

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [headers.join(',')];
  for (const r of rows) {
    csvLines.push(
      [
        r.rank,
        escapeCsv(r.candidateName),
        escapeCsv(r.email || r.phone || '-'),
        r.score,
        r.totalMarks,
        r.percentage,
        r.accuracy,
        r.correctCount,
        r.wrongCount,
        r.skippedCount,
        escapeCsv(r.timeSpentMinutes),
        escapeCsv(new Date(r.attemptDate).toLocaleString('en-IN')),
      ].join(',')
    );
  }

  // Include UTF-8 BOM (\uFEFF) for Excel compatibility with Bengali & symbols
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = testTitle.replace(/[^a-zA-Z0-9_\u0980-\u09FF]+/g, '_').slice(0, 40);
  a.download = `${safeTitle}_results_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTestQuestionsToCsv(testTitle: string, questions: Question[]): void {
  const headers = [
    'Question Number',
    'Question Text (English/Bengali)',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer (A/B/C/D)',
    'Marks',
    'Negative Marks',
    'Difficulty',
    'Subject',
    'Chapter / Topic',
    'Diagram / Image URL',
    'Explanation / Short Notes',
  ];

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [headers.join(',')];
  questions.forEach((q, idx) => {
    csvLines.push(
      [
        idx + 1,
        escapeCsv(q.questionBengaliText || q.questionText),
        escapeCsv(q.optionA),
        escapeCsv(q.optionB),
        escapeCsv(q.optionC),
        escapeCsv(q.optionD),
        q.correctOption,
        q.defaultMarks ?? 1,
        q.defaultNegativeMarks ?? 0,
        escapeCsv(q.difficulty),
        escapeCsv(q.subjectName || '-'),
        escapeCsv(q.chapterName || q.topicName || '-'),
        escapeCsv(q.imageUrl || ''),
        escapeCsv(q.explanationBengali || q.explanation || ''),
      ].join(',')
    );
  });

  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = testTitle.replace(/[^a-zA-Z0-9_\u0980-\u09FF]+/g, '_').slice(0, 40);
  a.download = `${safeTitle}_questions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function validateTestForPublish(testId: string): Promise<PublishValidationResult> {
  const errors: string[] = [];

  if (!isSupabaseConfigured) {
    const test = localTests.find((t) => t.id === testId);
    if (!test) return { isValid: false, errors: ['Test not found.'] };
    if (!test.examId) errors.push('Exam must be selected.');
    if (test.durationMinutes <= 0) errors.push('Test duration must be greater than 0 minutes.');
    if (test.totalMarks <= 0) errors.push('Total marks must be greater than 0.');
    const assigned = localTestQuestions.filter((tq) => tq.testId === testId);
    if (assigned.length === 0) {
      errors.push('Test must have at least one question assigned before publishing.');
    }
    return { isValid: errors.length === 0, errors };
  }

  const { data: testData, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .maybeSingle();

  if (testError) return { isValid: false, errors: [testError.message] };
  if (!testData) return { isValid: false, errors: ['Test not found in database.'] };

  if (!testData.exam_id) {
    errors.push('Exam must be selected.');
  }
  if (testData.duration_minutes <= 0) {
    errors.push('Test duration must be greater than 0 minutes.');
  }
  if (Number(testData.total_marks) <= 0) {
    errors.push('Total marks must be greater than 0.');
  }

  const { data: tqData, error: tqError } = await supabase
    .from('test_questions')
    .select('question_id, question_order, questions(*)')
    .eq('test_id', testId)
    .order('question_order', { ascending: true });

  if (tqError) {
    return { isValid: false, errors: [tqError.message] };
  }

  if (!tqData || tqData.length === 0) {
    errors.push('Test must have at least one question assigned before publishing.');
    return { isValid: false, errors };
  }

  tqData.forEach((item: any, idx: number) => {
    const q = item.questions as QuestionRow | null;
    if (!q) {
      errors.push(`Question #${idx + 1} data is missing from question bank.`);
    } else {
      if (!q.question_text || q.question_text.trim() === '') {
        errors.push(`Question #${idx + 1} has empty question text.`);
      }
      if (!q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        errors.push(`Question #${idx + 1} must have all 4 options (A, B, C, D).`);
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) {
        errors.push(`Question #${idx + 1} has invalid or missing correct answer key.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function publishTest(testId: string): Promise<{ success: boolean; error?: string }> {
  const validation = await validateTestForPublish(testId);
  if (!validation.isValid) return { success: false, error: validation.errors.join('; ') };
  try {
    await updateTest(testId, { status: 'published', isActive: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Status save failed' };
  }
}

export async function archiveTest(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await updateTest(testId, { status: 'archived', isActive: false });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Status save failed' };
  }
}

export const adminTestsApi = {
  uploadTestIcon,
  getAllAdminTests,
  getSeriesTests,
  assignTestToSeries,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  duplicateTest,
  getTestAttempts,
  getTestResultsForExport,
  exportTestResultsToCsv,
  exportTestQuestionsToCsv,
  validateTestForPublish,
  publishTest,
  archiveTest,
};
