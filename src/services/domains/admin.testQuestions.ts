import { getErrorMessage } from '@/lib/errors';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localQuestions, localTestQuestions, localTests } from '@/services/domains/localStore';
import type { TestQuestionAssignment } from '@/types';

/** Section of the admin API: testQuestions (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// TEST QUESTIONS (ASSIGNMENTS & REORDERING)
// --------------------------------------------------------------------------
export async function getTestAssignedQuestions(testId: string): Promise<TestQuestionAssignment[]> {
  if (!isSupabaseConfigured) {
    const assignments = localTestQuestions
      .filter((tq) => tq.testId === testId)
      .sort((a, b) => a.questionOrder - b.questionOrder);

    return assignments.map((a) => {
      const q = localQuestions.find((item) => item.id === a.questionId);
      return {
        questionId: a.questionId,
        questionOrder: a.questionOrder,
        marks: a.marks,
        negativeMarks: a.negativeMarks,
        questionText: q?.questionText,
        questionBengaliText: q?.questionBengaliText,
        imageUrl: q?.imageUrl,
        difficulty: q?.difficulty ?? undefined,
        correctOption: q?.correctOption,
        optionA: q?.optionA,
        optionB: q?.optionB,
        optionC: q?.optionC,
        optionD: q?.optionD,
        explanation: q?.explanation ?? undefined,
        explanationBengali: q?.explanationBengali ?? undefined,
        subjectId: q?.subjectId,
        subjectName: q?.subjectName,
        chapterId: q?.chapterId,
        chapterName: q?.chapterName,
      };
    });
  }

  const { data, error } = await supabase
    .from('test_questions')
    .select(
      `
      question_id,
      question_order,
      marks,
      negative_marks,
      questions (
        *,
        subjects:subject_id (id, name),
        chapters:chapter_id (id, name)
      )
    `
    )
    .eq('test_id', testId)
    .order('question_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item: any) => {
    const q = item.questions as any;
    return {
      questionId: item.question_id,
      questionOrder: item.question_order,
      marks: Number(item.marks),
      negativeMarks: Number(item.negative_marks),
      questionText: q?.question_text ?? undefined,
      questionBengaliText: q?.question_bengali_text ?? undefined,
      imageUrl: q?.image_url ?? undefined,
      difficulty: (q?.difficulty as 'easy' | 'medium' | 'hard') ?? undefined,
      correctOption: (q?.correct_option as 'A' | 'B' | 'C' | 'D' | null) ?? undefined,
      optionA: q?.option_a ?? undefined,
      optionB: q?.option_b ?? undefined,
      optionC: q?.option_c ?? undefined,
      optionD: q?.option_d ?? undefined,
      explanation: q?.explanation ?? undefined,
      explanationBengali: q?.explanation_bengali ?? undefined,
      subjectId: q?.subject_id ?? undefined,
      subjectName: q?.subjects?.name || undefined,
      chapterId: q?.chapter_id ?? undefined,
      chapterName: q?.chapters?.name || undefined,
    };
  });
}

export async function saveTestQuestions(
  testId: string,
  questions: { questionId: string; orderIndex: number; marks?: number; negativeMarks?: number }[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    for (let i = localTestQuestions.length - 1; i >= 0; i--) {
      if (localTestQuestions[i].testId === testId) {
        localTestQuestions.splice(i, 1);
      }
    }

    let totalMarks = 0;
    questions.forEach((q, idx) => {
      const marks = q.marks ?? 1.0;
      // Questions never carry negative marks — scoring uses the test-level scheme.
      const negMarks = q.negativeMarks ?? 0;
      totalMarks += marks;
      localTestQuestions.push({
        id: `tq-${testId}-${q.questionId}`,
        testId,
        questionId: q.questionId,
        questionOrder: q.orderIndex || idx + 1,
        marks,
        negativeMarks: negMarks,
      });
    });

    const testIdx = localTests.findIndex((t) => t.id === testId);
    if (testIdx !== -1) {
      localTests[testIdx].totalQuestions = questions.length;
      localTests[testIdx].totalMarks = totalMarks;
    }
    return { success: true };
  }

  try {
    const payload = questions.map((q, idx) => ({
      question_id: q.questionId,
      question_order: q.orderIndex || idx + 1,
      marks: q.marks ?? 1.0,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      negative_marks: q.negativeMarks ?? 0,
    }));

    // First attempt atomic RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('save_test_questions', {
      p_test_id: testId,
      p_questions: payload,
    });

    if (
      !rpcError &&
      rpcData?.success === true &&
      rpcData.test_id === testId &&
      rpcData.total_questions === questions.length
    )
      return { success: true };
    if (!rpcError) throw new Error('Question assignment was not confirmed.');

    throw new Error(rpcError.message || 'Atomic question assignment failed.');
  } catch (err) {
    return { success: false, error: getErrorMessage(err, 'Failed to save test questions') };
  }
}

export async function addQuestionToTest(
  testId: string,
  questionId: string,
  marks?: number,
  negativeMarks?: number
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const exists = localTestQuestions.some(
      (tq) => tq.testId === testId && tq.questionId === questionId
    );
    if (exists) return { success: false, error: 'Question already assigned to this test.' };

    const nextOrder =
      localTestQuestions
        .filter((tq) => tq.testId === testId)
        .reduce((max, tq) => Math.max(max, tq.questionOrder), 0) + 1;

    localTestQuestions.push({
      id: `tq-${testId}-${questionId}`,
      testId,
      questionId,
      questionOrder: nextOrder,
      marks: marks ?? 1.0,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      negativeMarks: negativeMarks ?? 0,
    });
    return { success: true };
  }

  try {
    const { data: existing, error: existError } = await supabase
      .from('test_questions')
      .select('id')
      .eq('test_id', testId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (existError) return { success: false, error: existError.message };
    if (existing) return { success: false, error: 'Question already assigned to this test.' };

    const { data: lastOrder } = await supabase
      .from('test_questions')
      .select('question_order')
      .eq('test_id', testId)
      .order('question_order', { ascending: false })
      .limit(1);

    const nextOrder =
      lastOrder && lastOrder[0] && lastOrder[0].question_order != null
        ? Number(lastOrder[0].question_order) + 1
        : 1;

    const { error: insertError } = await supabase.from('test_questions').insert({
      test_id: testId,
      question_id: questionId,
      question_order: nextOrder,
      marks: marks ?? 1.0,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      negative_marks: negativeMarks ?? 0,
    });

    if (insertError) return { success: false, error: insertError.message };

    // Update test total count
    const { count } = await supabase
      .from('test_questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId);

    if (count != null) {
      await supabase.from('tests').update({ total_questions: count }).eq('id', testId);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, 'Failed to add question to test') };
  }
}

export async function removeQuestionFromTest(
  testId: string,
  questionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const idx = localTestQuestions.findIndex(
      (tq) => tq.testId === testId && tq.questionId === questionId
    );
    if (idx !== -1) localTestQuestions.splice(idx, 1);
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', testId)
      .eq('question_id', questionId);

    if (error) return { success: false, error: error.message };

    // Update test total count
    const { count } = await supabase
      .from('test_questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId);

    if (count != null) {
      await supabase.from('tests').update({ total_questions: count }).eq('id', testId);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, 'Failed to remove question from test') };
  }
}

export async function updateTestQuestionMarks(
  testId: string,
  questionId: string,
  marks: number,
  negativeMarks: number
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const tq = localTestQuestions.find(
      (item) => item.testId === testId && item.questionId === questionId
    );
    if (tq) {
      tq.marks = marks;
      tq.negativeMarks = negativeMarks;
    }
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('test_questions')
      .update({ marks, negative_marks: negativeMarks })
      .eq('test_id', testId)
      .eq('question_id', questionId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, 'Failed to update question marks') };
  }
}

export const adminTestQuestionsApi = {
  getTestAssignedQuestions,
  saveTestQuestions,
  addQuestionToTest,
  removeQuestionFromTest,
  updateTestQuestionMarks,
};
