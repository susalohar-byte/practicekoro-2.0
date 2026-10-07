import { getErrorMessage } from '@/lib/errors';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { parseQuestionsCsv, parseQuestionsText } from '@/utils/csvParser';
import { catalogApi } from '@/services/domains/catalog';
import { createQuestion } from './admin.questions';
import { localTestQuestions, localTests } from '@/services/domains/localStore';
import type { MockTest, Question } from '@/types';
import type { ParsedTxtQuestion } from '@/utils/txtQuestionParser';

/** Section of the admin API: bulkImports (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// DIRECT TEST QUESTION CREATION & BULK IMPORTS
// --------------------------------------------------------------------------
export async function createQuestionForTest(
  testId: string,
  qData: Omit<Question, 'id'>
): Promise<{ success: boolean; question?: Question; error?: string }> {
  try {
    let testType: MockTest['testType'] | undefined;
    let examId: string | undefined;
    let testChapterId: string | undefined;
    let testSubjectId: string | undefined;
    let testYear: number | undefined;
    let testPaper: string | undefined;
    let testShift: string | undefined;

    if (!isSupabaseConfigured) {
      const localTest = localTests.find((t) => t.id === testId);
      if (localTest) {
        testType = localTest.testType;
        examId = localTest.examId;
        testChapterId = localTest.chapterId || localTest.topicId;
        testSubjectId = localTest.subjectId;
        testYear = localTest.year;
        testPaper = localTest.paperName;
        testShift = localTest.shift;
      }
    } else {
      const { data, error } = await supabase
        .from('tests')
        .select('id, test_type, exam_id, chapter_id, subject_id, year, paper_name, shift')
        .eq('id', testId)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!data) return { success: false, error: 'Test not found.' };

      testType = data.test_type;
      examId = data.exam_id;
      testChapterId = data.chapter_id;
      testSubjectId = data.subject_id;
      testYear = data.year ? Number(data.year) : undefined;
      testPaper = data.paper_name;
      testShift = data.shift;
    }

    const sourceType: Question['sourceType'] =
      testType === 'pyq'
        ? 'pyq'
        : testType === 'chapter_mock' || testType === 'topic'
          ? 'topic'
          : 'other';

    const effectiveTopicId = qData.topicId || qData.chapterId || testChapterId || undefined;
    const effectiveSubjectId = qData.subjectId || testSubjectId || undefined;
    const effectiveExam = qData.sourceExam || examId;
    const effectiveYear = qData.sourceYear || (testType === 'pyq' ? testYear : undefined);
    const effectivePaper = qData.sourcePaper || (testType === 'pyq' ? testPaper : undefined);
    const effectiveShift = qData.sourceShift || (testType === 'pyq' ? testShift : undefined);

    const question = await createQuestion({
      ...qData,
      sourceType,
      sourceExam: effectiveExam,
      sourceYear: effectiveYear,
      sourcePaper: effectivePaper,
      sourceShift: effectiveShift,
      subjectId: effectiveSubjectId,
      chapterId: effectiveTopicId,
      topicId: effectiveTopicId,
    });

    let nextOrder = 1;
    if (isSupabaseConfigured) {
      const { data: lastRow } = await supabase
        .from('test_questions')
        .select('question_order')
        .eq('test_id', testId)
        .order('question_order', { ascending: false })
        .limit(1);

      nextOrder =
        lastRow && lastRow[0] && lastRow[0].question_order != null
          ? Number(lastRow[0].question_order) + 1
          : 1;

      const { error: insertError } = await supabase.from('test_questions').insert({
        test_id: testId,
        question_id: question.id,
        question_order: nextOrder,
        marks: question.defaultMarks ?? 1.0,
        // Questions never carry negative marks — scoring uses the test-level scheme.
        negative_marks: question.defaultNegativeMarks ?? 0,
      });

      if (insertError) {
        return {
          success: false,
          question,
          error: `Question created but failed to assign to test: ${insertError.message}`,
        };
      }

      // Update test total count
      const { count } = await supabase
        .from('test_questions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', testId);

      if (count != null) {
        await supabase.from('tests').update({ total_questions: count }).eq('id', testId);
      }
    } else {
      nextOrder =
        localTestQuestions
          .filter((tq) => tq.testId === testId)
          .reduce((max, tq) => Math.max(max, tq.questionOrder), 0) + 1;

      localTestQuestions.push({
        id: `tq-${testId}-${question.id}`,
        testId,
        questionId: question.id,
        questionOrder: nextOrder,
        marks: question.defaultMarks ?? 1.0,
        // Questions never carry negative marks — scoring uses the test-level scheme.
        negativeMarks: question.defaultNegativeMarks ?? 0,
      });
    }

    return { success: true, question };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, 'Failed to create question for test') };
  }
}

export async function bulkCreateQuestionsFromTxt(params: {
  questions: ParsedTxtQuestion[];
  sourceType: 'topic' | 'other' | 'pyq';
  subjectId?: string;
  topicId?: string;
  examId?: string;
  testId?: string;
  defaultMarks?: number;
  // NOTE: no defaultNegativeMarks — questions never carry negative marks.
  // Scoring uses the test-level scheme (Full Mock / PYQ only, optional).
}): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];
  let currentTestOrder = 1;

  if (params.testId && isSupabaseConfigured) {
    try {
      const { data: lastRow } = await supabase
        .from('test_questions')
        .select('question_order')
        .eq('test_id', params.testId)
        .order('question_order', { ascending: false })
        .limit(1);
      if (lastRow && lastRow[0] && lastRow[0].question_order != null) {
        currentTestOrder = Number(lastRow[0].question_order) + 1;
      }
    } catch (err) {
      console.warn('Failed to fetch last question_order for test:', err);
    }
  }

  for (const q of params.questions) {
    try {
      const created = await createQuestion({
        questionText: q.questionText,
        questionBengaliText: /[\u0980-\u09FF]/.test(q.questionText)
          ? q.questionText
          : q.questionText,
        imageUrl: q.imageUrl,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation,
        explanationBengali: q.explanation,
        subjectId: params.subjectId,
        topicId: params.topicId,
        chapterId: params.topicId,
        sourceType: params.sourceType,
        sourceExam: params.examId,
        defaultMarks: params.defaultMarks ?? 1.0,
        // Questions never carry negative marks — scoring uses the test-level scheme.
        defaultNegativeMarks: 0,
        isActive: true,
        status: 'active',
      });

      if (params.testId) {
        if (isSupabaseConfigured) {
          await supabase.from('test_questions').insert({
            test_id: params.testId,
            question_id: created.id,
            question_order: currentTestOrder++,
            marks: params.defaultMarks ?? 1.0,
            // Questions never carry negative marks — scoring uses the test-level scheme.
            negative_marks: 0,
          });
        } else {
          localTestQuestions.push({
            id: `tq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            testId: params.testId,
            questionId: created.id,
            questionOrder: currentTestOrder++,
            marks: params.defaultMarks ?? 1.0,
            // Questions never carry negative marks — scoring uses the test-level scheme.
            negativeMarks: 0,
          });
        }
      }

      successCount++;
    } catch (err) {
      errors.push(
        `Failed to save question #${q.questionNumber} ("${q.questionText.slice(0, 30)}..."): ${getErrorMessage(err, 'Unknown error')}`
      );
    }
  }

  if (params.testId && successCount > 0) {
    try {
      if (isSupabaseConfigured) {
        const { count } = await supabase
          .from('test_questions')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', params.testId);

        if (count != null) {
          await supabase.from('tests').update({ total_questions: count }).eq('id', params.testId);
        }
      } else {
        const test = localTests.find((t) => t.id === params.testId);
        if (test) {
          test.totalQuestions = (test.totalQuestions || 0) + successCount;
        }
      }
    } catch (err) {
      console.warn('Failed to update test total_questions:', err);
    }
  }

  return {
    successCount,
    errorCount: errors.length,
    errors,
  };
}

export async function importQuestionsCSV(
  csvContent: string,
  defaultSubjectId?: string,
  defaultChapterId?: string
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  const parsed = parseQuestionsCsv(csvContent, { defaultSubjectId, defaultChapterId });

  if (parsed.errors.length > 0 && parsed.questions.length === 0) {
    return {
      successCount: 0,
      errorCount: parsed.totalRows,
      errors: parsed.errors,
    };
  }

  let successCount = 0;
  const errors: string[] = [...parsed.errors];

  for (const qData of parsed.questions) {
    try {
      await createQuestion(qData);
      successCount++;
    } catch (err) {
      errors.push(
        `Failed to save question "${qData.questionText.slice(0, 30)}...": ${getErrorMessage(err, 'Unknown error')}`
      );
    }
  }

  return {
    successCount,
    errorCount: parsed.invalidCount,
    errors,
  };
}

export async function importQuestionsText(
  text: string,
  defaultSubjectId?: string,
  defaultChapterId?: string
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  const parsed = parseQuestionsText(text, {
    defaultSubjectId,
    defaultChapterId,
  });

  if (parsed.errors.length > 0 && parsed.questions.length === 0) {
    return {
      successCount: 0,
      errorCount: parsed.totalRows,
      errors: parsed.errors,
    };
  }

  let successCount = 0;
  const errors: string[] = [...parsed.errors];

  for (const qData of parsed.questions) {
    try {
      await createQuestion(qData);
      successCount++;
    } catch (err) {
      errors.push(
        `Failed to save question "${qData.questionText.slice(0, 30)}...": ${getErrorMessage(err, 'Unknown error')}`
      );
    }
  }

  return {
    successCount,
    errorCount: parsed.invalidCount,
    errors,
  };
}

export async function getExamTopicMappings(examId: string): Promise<string[]> {
  return catalogApi.getExamTopicMappings(examId);
}

export async function saveExamTopicMappings(examId: string, topicIds: string[]): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const { data, error } = await supabase.rpc('admin_save_exam_topics', {
    p_exam_id: examId,
    p_topic_ids: topicIds,
  });
  if (error) throw new Error(error.message);
  if (data?.success !== true || data.saved_count !== topicIds.length)
    throw new Error('Topic mapping save was not confirmed.');
  return true;
}

export const adminBulkImportsApi = {
  createQuestionForTest,
  bulkCreateQuestionsFromTxt,
  importQuestionsCSV,
  importQuestionsText,
  getExamTopicMappings,
  saveExamTopicMappings,
};
