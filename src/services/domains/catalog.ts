import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  MOCK_SUBJECTS,
  MOCK_CHAPTERS,
  MOCK_QUESTIONS,
  MOCK_ATTEMPTS,
  MOCK_MISTAKES,
  MOCK_BOOKMARKS,
} from '@/services/mockData';
import type { AttemptStatus } from '@/types/database';
import type {
  Exam,
  Subject,
  Chapter,
  MockTest,
  TestSeries,
  Question,
  StudentTestQuestion,
  AttemptAnswerState,
  TestAttempt,
  TestSeriesAnalytics,
  AttemptRankings,
  GradedResult,
  QuestionSolution,
  MistakeItem,
  BookmarkItem,
} from '@/types';
import { calculateScore } from '@/utils/scoring';
import { resolveTestNegativeMarking } from '@/utils/negativeMarking';
import {
  localAttemptsStore,
  localTests,
} from '@/services/domains/localStore';
import type {
  AttemptRow,
  BookmarkRow,
  ChapterRow,
  ExamRow,
  MistakeRow,
  SubjectRow,
  QuestionRow,
} from '@/services/domains/localStore';

type QuestionWithContext = QuestionRow & {
  chapters?: {
    name?: string;
    subjects?: { name?: string; exams?: { title?: string } | null } | null;
  } | null;
};

/**
 * Student catalog, test-taking, attempts, mistakes & bookmarks API.
 * Methods extracted verbatim from the original src/services/api.ts.
 */

export const catalogApi = {
  async getDailyContent(): Promise<Record<string, unknown>> {
    if (!isSupabaseConfigured) return {};
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', 'daily_content')
      .maybeSingle();
    if (error) throw new Error(error.message || 'Failed to load daily student content');
    if (!data?.value) return {};
    const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  },

  async getAppLeaderboard(
    scope: 'all_india' | 'west_bengal' | 'district' = 'west_bengal',
    district?: string,
    examName?: string,
    from?: string,
  ) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.rpc('get_app_leaderboard', {
      p_scope: scope,
      p_district: district ?? null,
      p_exam_name: examName ?? null,
      p_from: from ?? null,
    });
    if (error) throw new Error(error.message || 'Failed to load leaderboard');
    return (data || []) as Array<{
      rank: number;
      display_name: string;
      average_percentage: number;
      district: string | null;
      tests_count: number;
    }>;
  },

  subscribeToStudentCatalogUpdates(callback: () => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('student-catalog-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_series' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tests' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chapters' }, callback)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  },

  async getExams(): Promise<Exam[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const [examsRes, testsRes, testExamsRes] = await Promise.all([
        supabase
          .from('exams')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true }),
        supabase
          .from('tests')
          .select('id, exam_id, total_questions')
          .eq('is_active', true)
          .eq('status', 'published'),
        supabase.from('test_exams').select('test_id, exam_id'),
      ]);

      const data = examsRes.data;
      if (examsRes.error || !data || data.length === 0) return [];

      const statsMap: Record<string, { testsCount: number; questionsCount: number }> = {};
      data.forEach((e: ExamRow) => {
        statsMap[e.id] = { testsCount: 0, questionsCount: 0 };
      });

      if (testsRes.data) {
        testsRes.data.forEach(
          (t: { id: string; exam_id?: string | null; total_questions?: number | null }) => {
            const targetExamIds = new Set<string>();
            if (t.exam_id && statsMap[t.exam_id]) targetExamIds.add(t.exam_id);
            if (testExamsRes.data) {
              testExamsRes.data
                .filter((te: { test_id: string; exam_id: string }) => te.test_id === t.id)
                .forEach((te: { test_id: string; exam_id: string }) => {
                  if (statsMap[te.exam_id]) targetExamIds.add(te.exam_id);
                });
            }
            targetExamIds.forEach((examId) => {
              statsMap[examId].testsCount += 1;
              statsMap[examId].questionsCount += t.total_questions || 0;
            });
          }
        );
      }

      return (data as ExamRow[]).map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: item.description ?? undefined,
        category: item.category,
        iconName: item.icon_name,
        bannerUrl: item.banner_url ?? undefined,
        orderIndex: item.order_index,
        isActive: item.is_active,
        testsCount: statsMap[item.id]?.testsCount ?? 0,
        questionsCount: statsMap[item.id]?.questionsCount ?? 0,
      }));
    } catch {
      return [];
    }
  },

  async getExamBySlug(slug: string): Promise<Exam | null> {
    const exams = await this.getExams();
    return exams.find((e) => e.slug === slug || e.id === slug) || null;
  },

  async getSubjects(examId?: string): Promise<Subject[]> {
    if (!isSupabaseConfigured) return [];
    try {
      let query = supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      // Include universal subjects (exam_id IS NULL) alongside exam-specific ones
      if (examId) {
        query = query.or(`exam_id.eq.${examId},exam_id.is.null`);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) return [];
      return (data as SubjectRow[]).map((item) => ({
        id: item.id,
        examId: item.exam_id ?? undefined,
        name: item.name,
        slug: item.slug,
        description: item.description ?? undefined,
        iconName: item.icon_name,
        orderIndex: item.order_index,
        isActive: item.is_active,
      }));
    } catch {
      return [];
    }
  },

  async getChapters(subjectId: string): Promise<Chapter[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) return [];
      return (data as ChapterRow[]).map((item) => ({
        id: item.id,
        subjectId: item.subject_id,
        name: item.name,
        slug: item.slug,
        description: item.description ?? undefined,
        orderIndex: item.order_index,
        isActive: item.is_active,
      }));
    } catch {
      return [];
    }
  },

  async getAllChapters(): Promise<Chapter[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error || !data || data.length === 0) return [];
      return (data as ChapterRow[]).map((item) => ({
        id: item.id,
        subjectId: item.subject_id,
        name: item.name,
        slug: item.slug,
        description: item.description ?? undefined,
        parentId: item.parent_id ?? undefined,
        orderIndex: item.order_index,
        isActive: item.is_active,
      }));
    } catch {
      return [];
    }
  },

  async getExamTopicMappings(examId: string): Promise<string[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('exam_topics')
        .select('topic_id')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });
      if (error || !data) return [];
      return data.map((r: { topic_id: string }) => r.topic_id);
    } catch {
      return [];
    }
  },

  async getExamSubjectsWithTopics(examId: string): Promise<
    {
      subject: Subject;
      topics: Chapter[];
    }[]
  > {
    try {
      const [fetchedSubjects, allChapters, mappedTopicIds] = await Promise.all([
        this.getSubjects(examId),
        this.getAllChapters(),
        this.getExamTopicMappings(examId),
      ]);
      let allSubjects = fetchedSubjects;

      // If no exam-specific subjects were found, fallback to universal active subjects
      if (!allSubjects || allSubjects.length === 0) {
        allSubjects = await this.getSubjects();
      }

      const mappedSet = new Set(mappedTopicIds);
      const hasMappings = mappedTopicIds.length > 0;

      const result: { subject: Subject; topics: Chapter[] }[] = [];
      for (const subject of allSubjects) {
        const subChapters = allChapters.filter(
          (c) => c.subjectId === subject.id && (!hasMappings || mappedSet.has(c.id))
        );
        if (subChapters.length > 0) {
          result.push({ subject, topics: subChapters });
        }
      }
      return result;
    } catch (err) {
      console.error('Error in getExamSubjectsWithTopics:', err);
      return [];
    }
  },

  async getTests(chapterId?: string, examId?: string): Promise<MockTest[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
    try {
      let assocTestIds: string[] = [];
      if (examId) {
        try {
          const { data: assocData } = await supabase
            .from('test_exams')
            .select('test_id')
            .eq('exam_id', examId);
          if (assocData && assocData.length > 0) {
            assocTestIds = assocData.map((a) => a.test_id);
          }
        } catch (e) {
          console.warn('Could not query test_exams table, fallback to exam_id', e);
        }
      }

      let query = supabase
        .from('tests')
        .select('*, exams(title), subjects(name), chapters(name), test_series(title)')
        .eq('is_active', true)
        .eq('status', 'published');
      if (chapterId) query = query.eq('chapter_id', chapterId);
      if (examId) {
        if (assocTestIds.length > 0) {
          query = query.or(`id.in.(${assocTestIds.join(',')}),exam_id.eq.${examId}`);
        } else {
          query = query.eq('exam_id', examId);
        }
      }
      const { data, error } = await query.order('order_index', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }
      return data.map((item) => ({
        id: item.id,
        examId: item.exam_id,
        subjectId: item.subject_id ?? undefined,
        chapterId: item.chapter_id ?? undefined,
        topicId: item.chapter_id ?? undefined,
        testSeriesId: item.test_series_id ?? undefined,
        title: item.title,
        slug: item.slug,
        description: item.description ?? undefined,
        testType: item.test_type,
        year: item.year ? Number(item.year) : undefined,
        paperName: item.paper_name ?? undefined,
        shift: item.shift ?? undefined,
        setName: item.set_name ?? undefined,
        examDate: item.exam_date ?? undefined,
        durationMinutes: item.duration_minutes,
        totalQuestions: item.total_questions,
        totalMarks: Number(item.total_marks),
        passingMarks: Number(item.passing_marks),
        negativeMarking: Number(item.negative_marking),
        isPremium: item.is_premium,
        orderIndex: item.order_index,
        isActive: item.is_active,
        status: (item.status as 'draft' | 'published' | 'archived') || 'published',
        examTitle: item.exams?.title,
        subjectName: item.subjects?.name,
        chapterName: item.chapters?.name,
        topicName: item.chapters?.name,
        testSeriesTitle: item.test_series?.title,
      }));
    } catch {
      return [];
    }
  },

  async getTestsForExam(
    examId: string,
    category?: 'full_mock' | 'pyq' | 'topic'
  ): Promise<MockTest[]> {
    if (category === 'topic') {
      if (!isSupabaseConfigured) return [];

      try {
        let assocTestIds: string[] = [];
        try {
          const { data: assocData } = await supabase
            .from('test_exams')
            .select('test_id')
            .eq('exam_id', examId);
          if (assocData && assocData.length > 0) {
            assocTestIds = assocData.map((a) => a.test_id);
          }
        } catch (e) {
          console.warn('Could not query test_exams table', e);
        }

        let query = supabase
          .from('tests')
          .select('*, exams(title), subjects(name), chapters(name), test_series(title)')
          .eq('is_active', true)
          .eq('status', 'published')
          .in('test_type', ['topic', 'chapter_mock', 'subject_mock']);

        if (assocTestIds.length > 0) {
          query = query.or(
            `id.in.(${assocTestIds.join(',')}),exam_id.eq.${examId},exam_id.is.null`
          );
        } else {
          query = query.or(`exam_id.eq.${examId},exam_id.is.null`);
        }

        const { data, error } = await query.order('order_index', { ascending: true });
        if (error || !data || data.length === 0) {
          return [];
        }

        return data.map((item) => ({
          id: item.id,
          examId: item.exam_id,
          subjectId: item.subject_id ?? undefined,
          chapterId: item.chapter_id ?? undefined,
          topicId: item.chapter_id ?? undefined,
          testSeriesId: item.test_series_id ?? undefined,
          title: item.title,
          slug: item.slug,
          description: item.description ?? undefined,
          testType: item.test_type,
          year: item.year ? Number(item.year) : undefined,
          paperName: item.paper_name ?? undefined,
          shift: item.shift ?? undefined,
          setName: item.set_name ?? undefined,
          examDate: item.exam_date ?? undefined,
          durationMinutes: item.duration_minutes,
          totalQuestions: item.total_questions,
          totalMarks: Number(item.total_marks),
          passingMarks: Number(item.passing_marks),
          negativeMarking: Number(item.negative_marking),
          isPremium: item.is_premium,
          orderIndex: item.order_index,
          isActive: item.is_active,
          status: (item.status as 'draft' | 'published' | 'archived') || 'published',
          examTitle: item.exams?.title,
          subjectName: item.subjects?.name,
          chapterName: item.chapters?.name,
          topicName: item.chapters?.name,
          testSeriesTitle: item.test_series?.title,
        }));
      } catch {
        return [];
      }
    }

    const allTests = await this.getTests(undefined, examId);
    if (!category) return allTests;

    if (category === 'full_mock') {
      return allTests.filter((t) => t.testType === 'full_mock');
    }
    if (category === 'pyq') {
      return allTests.filter((t) => t.testType === 'pyq');
    }
    return allTests;
  },

  async getTestExamAssociations(testId: string): Promise<string[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('test_exams')
        .select('exam_id')
        .eq('test_id', testId);
      if (error || !data) return [];
      return data.map((d) => d.exam_id);
    } catch {
      return [];
    }
  },

  async associateTestWithExam(testId: string, examId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('test_exams')
        .upsert({ test_id: testId, exam_id: examId }, { onConflict: 'test_id,exam_id' });
      return !error;
    } catch {
      return false;
    }
  },

  async dissociateTestFromExam(testId: string, examId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error } = await supabase
        .from('test_exams')
        .delete()
        .eq('test_id', testId)
        .eq('exam_id', examId);
      return !error;
    } catch {
      return false;
    }
  },

  async syncTestExamAssociations(testId: string, examIds: string[]): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    try {
      const { error: delError } = await supabase.from('test_exams').delete().eq('test_id', testId);
      if (delError) return false;

      if (examIds.length > 0) {
        const rows = examIds.map((eid) => ({ test_id: testId, exam_id: eid }));
        const { error: insError } = await supabase.from('test_exams').insert(rows);
        if (insError) return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  async getTestById(testId: string): Promise<MockTest | null> {
    if (!isSupabaseConfigured) return null;

    try {
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
        .eq('is_active', true)
        .eq('status', 'published')
        .maybeSingle();
      if (error || !data) return null;
      const row = data as any;
      return {
        id: row.id,
        examId: row.exam_id ?? undefined,
        subjectId: row.subject_id ?? undefined,
        chapterId: row.chapter_id ?? undefined,
        testSeriesId: row.test_series_id ?? undefined,
        title: row.title,
        slug: row.slug,
        description: row.description ?? undefined,
        testType: row.test_type,
        year: 'year' in row && row.year ? Number(row.year) : undefined,
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
        status: row.status || 'published',
        examTitle: row.exams?.title || undefined,
        subjectName: row.subjects?.name || undefined,
        chapterName: row.chapters?.name || undefined,
        topicName: row.chapters?.name || undefined,
        testSeriesTitle: row.test_series?.title || undefined,
      };
    } catch {
      return null;
    }
  },

  async getStudentTestQuestions(testId: string): Promise<StudentTestQuestion[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_student_exam_questions', {
        p_test_id: testId,
      });
      if (error) {
        throw new Error(error.message || 'Failed to fetch exam questions');
      }
      if (Array.isArray(data)) {
        return data as StudentTestQuestion[];
      }
      return [];
    }

    return [];
  },

  async getTestQuestions(testId: string): Promise<Question[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('test_questions')
        .select(
          `
          question_order,
          marks,
          negative_marks,
          questions (
            id,
            chapter_id,
            subject_id,
            image_url,
            question_text,
            question_bengali_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_option,
            explanation,
            explanation_bengali,
            difficulty,
            default_marks,
            default_negative_marks,
            is_active
          )
        `
        )
        .eq('test_id', testId)
        .order('question_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }

      return (
        data as unknown as Array<{
          question_order: number;
          marks: number;
          negative_marks: number;
          questions: Record<string, unknown>;
        }>
      ).map((item) => {
        const q = item.questions;
        return {
          id: String(q.id),
          chapterId: q.chapter_id ? String(q.chapter_id) : undefined,
          subjectId: q.subject_id ? String(q.subject_id) : undefined,
          questionText: String(q.question_text),
          questionBengaliText: q.question_bengali_text
            ? String(q.question_bengali_text)
            : undefined,
          imageUrl: q.image_url ? String(q.image_url) : undefined,
          optionA: String(q.option_a),
          optionB: String(q.option_b),
          optionC: String(q.option_c),
          optionD: String(q.option_d),
          correctOption: (q.correct_option as 'A' | 'B' | 'C' | 'D') || 'A',
          explanation: q.explanation ? String(q.explanation) : undefined,
          explanationBengali: q.explanation_bengali ? String(q.explanation_bengali) : undefined,
          difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
          defaultMarks: Number(item.marks || q.default_marks || 1),
          defaultNegativeMarks: Number(item.negative_marks || q.default_negative_marks || 0),
          isActive: Boolean(q.is_active),
        };
      });
    } catch {
      return [];
    }
  },

  async startTestAttempt(testId: string): Promise<{
    attemptId: string;
    startTime: string;
    durationMinutes: number;
  }> {
    const test = await this.getTestById(testId);
    if (!test) throw new Error('Mock Test not found');

    const durationMinutes = test.durationMinutes;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('start_test_attempt', {
        p_test_id: testId,
      });

      if (error) {
        throw new Error(error.message || 'Failed to initialize exam session');
      }

      if (data && typeof data === 'object') {
        const res = data as { attempt_id: string; start_time: string; duration_minutes?: number };
        return {
          attemptId: res.attempt_id,
          startTime: res.start_time,
          durationMinutes: res.duration_minutes || durationMinutes,
        };
      }
    }

    // Local / Demo Fallback (Only active in development when Supabase is unconfigured)
    const existing = Object.values(localAttemptsStore).find(
      (a) => a.attempt.testId === testId && a.attempt.status === 'in_progress'
    );

    if (existing) {
      return {
        attemptId: existing.attempt.id,
        startTime: existing.attempt.startTime,
        durationMinutes,
      };
    }

    const attemptId = 'att-' + Date.now();
    const startTime = new Date().toISOString();

    localAttemptsStore[attemptId] = {
      attempt: {
        id: attemptId,
        userId: 'dev-student',
        testId,
        testTitle: test.title,
        status: 'in_progress',
        startTime,
        timeSpentSeconds: 0,
        score: 0,
        totalMarks: test.totalMarks,
        correctCount: 0,
        wrongCount: 0,
        skippedCount: 0,
        accuracy: 0,
        createdAt: startTime,
      },
      answers: {},
    };

    return { attemptId, startTime, durationMinutes };
  },

  async getTestAttempt(attemptId: string): Promise<TestAttempt | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('id', attemptId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Failed to fetch test attempt');
      }

      if (data) {
        const d = data as AttemptRow;
        return {
          id: d.id,
          userId: d.user_id,
          testId: d.test_id,
          status: d.status as AttemptStatus,
          startTime: d.start_time,
          endTime: d.end_time ?? undefined,
          timeSpentSeconds: d.time_spent_seconds,
          score: d.score,
          totalMarks: d.total_marks,
          correctCount: d.correct_count,
          wrongCount: d.wrong_count,
          skippedCount: d.skipped_count,
          accuracy: d.accuracy,
          rank: d.rank ?? undefined,
          percentile: d.percentile ?? undefined,
          createdAt: d.created_at,
        };
      }
      return null;
    }

    return localAttemptsStore[attemptId]?.attempt || null;
  },

  async saveAnswers(
    attemptId: string,
    answers: AttemptAnswerState[],
    timeSpentSeconds: number
  ): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('save_test_answers', {
          p_attempt_id: attemptId,
          p_answers: answers,
          p_time_spent_seconds: timeSpentSeconds,
        });
      } catch (err) {
        console.warn('Autosave RPC failed:', err);
      }
    }

    // Local in-memory sync
    if (localAttemptsStore[attemptId]) {
      localAttemptsStore[attemptId].attempt.timeSpentSeconds = timeSpentSeconds;
      answers.forEach((ans) => {
        localAttemptsStore[attemptId].answers[ans.questionId] = ans;
      });
    }

    // Persist in localStorage for complete page refresh recovery
    try {
      localStorage.setItem(
        `practicekoro_attempt_${attemptId}`,
        JSON.stringify({
          answers,
          timeSpentSeconds,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // localStorage fallback
    }

    return true;
  },

  async submitTestAttempt(
    attemptId: string,
    answers: AttemptAnswerState[],
    timeSpentSeconds: number,
    testId: string
  ): Promise<GradedResult> {
    const test = await this.getTestById(testId);

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('submit_test_attempt', {
        p_attempt_id: attemptId,
        p_answers: answers,
        p_time_spent_seconds: timeSpentSeconds,
      });

      if (error) {
        throw new Error(error.message || 'Submission failed on server');
      }

      if (data && typeof data === 'object') {
        const res = data as Record<string, unknown>;
        return {
          attemptId,
          testId,
          testTitle: test?.title,
          score: Number(res.score || 0),
          totalMarks: Number(res.total_marks || test?.totalMarks || 5),
          percentage: Number(res.percentage || 0),
          accuracy: Number(res.accuracy || 0),
          correctCount: Number(res.correct_count || 0),
          wrongCount: Number(res.wrong_count || 0),
          skippedCount: Number(res.skipped_count || 0),
          timeSpentSeconds,
          rank: res.rank !== undefined && res.rank !== null ? Number(res.rank) : null,
          totalCandidates: Number(res.total_candidates || 1),
          percentile:
            res.percentile !== undefined && res.percentile !== null ? Number(res.percentile) : null,
          passed: Boolean(res.passed),
        };
      }
    }

    // Local / Demo Authoritative fallback (only active when Supabase is unconfigured)
    const questions = MOCK_QUESTIONS[testId] || MOCK_QUESTIONS['test-indus-01'] || [];
    const answersMap = new Map(answers.map((a) => [a.questionId, a.selectedOption]));
    const totalMarks = test ? test.totalMarks : 5;
    const passingMarks = test?.passingMarks || 2;
    // Negative marking is test-level only for every supported type — never per-question.
    const effectiveNegative = resolveTestNegativeMarking(test?.testType, test?.negativeMarking);
    const scoreSummary = calculateScore(
      questions.map((q) => ({
        id: q.id,
        correctOption: q.correctOption,
        marks: q.defaultMarks || 1,
        negativeMarks: effectiveNegative,
      })),
      answers,
      totalMarks,
      passingMarks
    );

    // AUTOMATIC MISTAKES NOTEBOOK POPULATION (Local demo)
    questions.forEach((q) => {
      const selected = answersMap.get(q.id);
      if (selected && selected !== q.correctOption) {
        const existingMistake = MOCK_MISTAKES.find((m) => m.questionId === q.id);
        if (existingMistake) {
          existingMistake.wrongCount++;
          existingMistake.isResolved = false;
          existingMistake.lastReviewedAt = new Date().toISOString();
        } else {
          MOCK_MISTAKES.unshift({
            id: 'mst-' + Date.now() + '-' + q.id.slice(-4),
            userId: 'dev-student',
            questionId: q.id,
            question: q,
            wrongCount: 1,
            isResolved: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    const gradedResult: GradedResult = {
      attemptId,
      testId,
      testTitle: test?.title,
      score: scoreSummary.score,
      totalMarks,
      percentage: scoreSummary.percentage,
      accuracy: scoreSummary.accuracy,
      correctCount: scoreSummary.correctCount,
      wrongCount: scoreSummary.wrongCount,
      skippedCount: scoreSummary.skippedCount,
      timeSpentSeconds,
      rank: null,
      totalCandidates: 1,
      percentile: null,
      passed: scoreSummary.passed,
    };

    // Store in localAttemptsStore
    localAttemptsStore[attemptId] = {
      attempt: {
        id: attemptId,
        userId: 'dev-student',
        testId,
        testTitle: test?.title,
        status: 'completed',
        startTime: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        timeSpentSeconds,
        score: gradedResult.score,
        totalMarks: gradedResult.totalMarks,
        correctCount: scoreSummary.correctCount,
        wrongCount: scoreSummary.wrongCount,
        skippedCount: scoreSummary.skippedCount,
        accuracy: scoreSummary.accuracy,
        rank: null,
        percentile: null,
        createdAt: new Date().toISOString(),
      },
      answers: Object.fromEntries(answers.map((a) => [a.questionId, a])),
      result: gradedResult,
    };

    // Clean up local cache
    try {
      localStorage.removeItem(`practicekoro_attempt_${attemptId}`);
    } catch {
      // ignore
    }

    return gradedResult;
  },

  async getAttemptResult(attemptId: string): Promise<GradedResult | null> {
    if (isSupabaseConfigured) {
      const { data: res, error } = await supabase
        .from('test_results')
        .select(
          `
          score,
          total_marks,
          percentage,
          accuracy,
          rank,
          total_candidates,
          percentile,
          passed,
          test_id,
          test_attempts (
            correct_count,
            wrong_count,
            skipped_count,
            time_spent_seconds
          ),
          tests (
            title
          )
        `
        )
        .eq('attempt_id', attemptId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Failed to fetch test result');
      }

      if (res) {
        const r = res as Record<string, unknown>;
        const attempt = r.test_attempts as {
          correct_count: number;
          wrong_count: number;
          skipped_count: number;
          time_spent_seconds: number;
        } | null;
        const test = r.tests as { title: string } | null;

        return {
          attemptId,
          testId: String(r.test_id),
          testTitle: test?.title,
          score: Number(r.score),
          totalMarks: Number(r.total_marks),
          percentage: Number(r.percentage || 0),
          accuracy: Number(r.accuracy || 0),
          correctCount: Number(attempt?.correct_count || 0),
          wrongCount: Number(attempt?.wrong_count || 0),
          skippedCount: Number(attempt?.skipped_count || 0),
          timeSpentSeconds: Number(attempt?.time_spent_seconds || 0),
          rank: r.rank !== null && r.rank !== undefined ? Number(r.rank) : null,
          totalCandidates: Number(r.total_candidates || 1),
          percentile:
            r.percentile !== null && r.percentile !== undefined ? Number(r.percentile) : null,
          passed: Boolean(r.passed),
        };
      }
      return null;
    }

    if (localAttemptsStore[attemptId]?.result) {
      return localAttemptsStore[attemptId].result!;
    }

    // Check attempts in mock list
    const attempt = MOCK_ATTEMPTS.find((a) => a.id === attemptId);
    if (attempt) {
      return {
        attemptId: attempt.id,
        testId: attempt.testId,
        testTitle: attempt.testTitle,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: Number(((attempt.score / attempt.totalMarks) * 100).toFixed(1)),
        accuracy: attempt.accuracy,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        timeSpentSeconds: attempt.timeSpentSeconds,
        rank: attempt.rank ?? null,
        totalCandidates: 1,
        percentile: attempt.percentile ?? null,
        passed: attempt.score >= 2,
      };
    }

    return null;
  },

  async getAttemptRankings(attemptId: string): Promise<AttemptRankings | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase.rpc('get_attempt_rankings', {
      p_attempt_id: attemptId,
    });
    if (error) throw new Error(error.message || 'Failed to load rankings');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data as unknown as AttemptRankings;
  },

  async getAttemptSolutions(attemptId: string, testId: string): Promise<QuestionSolution[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('get_attempt_solutions', {
        p_attempt_id: attemptId,
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch solutions');
      }

      if (Array.isArray(data)) {
        return data as QuestionSolution[];
      }
      return [];
    }

    // Local / Demo fallback
    const questions = MOCK_QUESTIONS[testId] || MOCK_QUESTIONS['test-indus-01'] || [];
    const answersMap = localAttemptsStore[attemptId]?.answers || {};
    const allSubjects = Object.values(MOCK_SUBJECTS).flat();
    const allChapters = Object.values(MOCK_CHAPTERS).flat();
    const demoTest = localTests.find((test) => test.id === testId);
    const negativePerWrong = resolveTestNegativeMarking(
      demoTest?.testType,
      demoTest?.negativeMarking
    );

    return questions.map((q, idx) => {
      const ans = answersMap[q.id];
      const selected = ans?.selectedOption || null; // Strictly real answer or null; never guess
      const isCorrect = selected !== null && selected === q.correctOption;
      const marksAwarded = isCorrect ? q.defaultMarks : selected ? -negativePerWrong : 0;

      return {
        id: q.id,
        questionOrder: idx + 1,
        questionText: q.questionText,
        questionBengaliText: q.questionBengaliText,
        imageUrl: q.imageUrl,
        subjectId: q.subjectId,
        subjectName:
          q.subjectName ||
          (q.subjectId ? allSubjects.find((s) => s.id === q.subjectId)?.name : undefined),
        chapterId: q.chapterId,
        chapterName:
          q.chapterName ||
          (q.chapterId ? allChapters.find((c) => c.id === q.chapterId)?.name : undefined),
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        selectedOption: selected,
        correctOption: q.correctOption,
        isCorrect,
        marksAwarded,
        explanation: q.explanation,
        explanationBengali: q.explanationBengali,
        isBookmarked: MOCK_BOOKMARKS.some((b) => b.questionId === q.id),
      };
    });
  },

  async getAttemptNegativeMarks(attemptId: string, testId: string): Promise<number> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('attempt_answers')
        .select('marks_awarded')
        .eq('attempt_id', attemptId);

      if (error) {
        throw new Error(error.message || 'Failed to fetch negative marks');
      }

      return (data || []).reduce(
        (total, answer) => total + Math.max(0, -Number(answer.marks_awarded || 0)),
        0
      );
    }

    const solutions = await this.getAttemptSolutions(attemptId, testId);
    return solutions.reduce(
      (total, solution) => total + Math.max(0, -Number(solution.marksAwarded || 0)),
      0
    );
  },

  async toggleBookmark(userId: string, questionId: string, note?: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('question_id', questionId)
          .maybeSingle();

        if (existing) {
          await supabase.from('bookmarks').delete().eq('id', existing.id);
          return false; // Removed
        } else {
          await supabase.from('bookmarks').insert({
            user_id: userId,
            question_id: questionId,
            note: note || 'Bookmarked during practice review',
          });
          return true; // Added
        }
      } catch (err) {
        console.error('Supabase toggleBookmark error:', err);
      }
    }

    const existingIndex = MOCK_BOOKMARKS.findIndex(
      (b) => b.questionId === questionId && b.userId === userId
    );

    if (existingIndex >= 0) {
      MOCK_BOOKMARKS.splice(existingIndex, 1);
      return false; // Removed
    } else {
      const q = Object.values(MOCK_QUESTIONS)
        .flat()
        .find((item) => item.id === questionId);
      if (q) {
        MOCK_BOOKMARKS.unshift({
          id: 'bm-' + Date.now(),
          userId,
          questionId,
          question: q,
          note: note || 'Bookmarked during mock test review',
          createdAt: new Date().toISOString(),
        });
      }
      return true; // Added
    }
  },

  async getUserAttempts(userId: string, testIds?: string[]): Promise<TestAttempt[]> {
    if (testIds && testIds.length === 0) return [];
    // Merge any live session attempts with mock attempts if not on Supabase
    const sessionAttempts = Object.values(localAttemptsStore)
      .filter((a) => a.attempt.userId === userId && a.attempt.status === 'completed')
      .map((a) => a.attempt);

    if (!isSupabaseConfigured) {
      const combined = [...sessionAttempts, ...MOCK_ATTEMPTS];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      return testIds ? unique.filter((attempt) => testIds.includes(attempt.testId)) : unique;
    }

    try {
      let query = supabase
        .from('test_attempts')
        .select(
          `
          *,
          tests (
            title,
            duration_minutes,
            total_questions,
            total_marks,
            is_premium,
            test_type,
            year,
            exams (title),
            subjects (name),
            chapters (name)
          )
        `
        )
        .eq('user_id', userId);
      if (testIds) query = query.in('test_id', testIds);
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return [];
      return data.map((d) => {
        const test = d.tests;
        return {
          id: d.id,
          userId: d.user_id,
          testId: d.test_id,
          testTitle: test?.title || d.test_id,
          examTitle: test?.exams?.title,
          subjectName: test?.subjects?.name,
          chapterName: test?.chapters?.name,
          durationMinutes: test?.duration_minutes ? Number(test.duration_minutes) : undefined,
          totalQuestions: test?.total_questions ? Number(test.total_questions) : undefined,
          isPremium: Boolean(test?.is_premium),
          testType: test?.test_type,
          year: test?.year ? Number(test.year) : undefined,
          status: d.status,
          startTime: d.start_time,
          endTime: d.end_time ?? undefined,
          timeSpentSeconds: d.time_spent_seconds,
          score: Number(d.score),
          totalMarks: Number(d.total_marks || test?.total_marks || 0),
          correctCount: d.correct_count,
          wrongCount: d.wrong_count,
          skippedCount: d.skipped_count,
          accuracy: Number(d.accuracy),
          rank: d.rank ?? undefined,
          percentile: d.percentile ? Number(d.percentile) : undefined,
          createdAt: d.created_at,
        };
      });
    } catch {
      return [];
    }
  },

  async getMistakes(userId: string): Promise<MistakeItem[]> {
    if (!isSupabaseConfigured) return MOCK_MISTAKES.filter((m) => m.userId === userId || !m.userId);
    try {
      const { data, error } = await supabase
        .from('mistakes')
        .select(
          `
          id,
          user_id,
          question_id,
          wrong_count,
          is_resolved,
          last_reviewed_at,
          created_at,
          questions (
            *,
            chapters (
              name,
              subjects (
                name,
                exams (title)
              )
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return [];
      return (data as unknown as Array<MistakeRow & { questions: QuestionWithContext }>).map(
        (d) => {
          const q = d.questions || {};
          const ch = q.chapters;
          const sub = ch?.subjects;
          const ex = sub?.exams;
          return {
            id: d.id,
            userId: d.user_id,
            questionId: d.question_id,
            wrongCount: d.wrong_count,
            isResolved: d.is_resolved,
            lastReviewedAt: d.last_reviewed_at ?? undefined,
            createdAt: d.created_at,
            examTitle: ex?.title,
            subjectName: sub?.name,
            chapterName: ch?.name,
            question: {
              id: String(q.id),
              chapterId: q.chapter_id ?? undefined,
              subjectId: q.subject_id ?? undefined,
              questionText: String(q.question_text),
              questionBengaliText: q.question_bengali_text
                ? String(q.question_bengali_text)
                : undefined,
              optionA: String(q.option_a),
              optionB: String(q.option_b),
              optionC: String(q.option_c),
              optionD: String(q.option_d),
              correctOption: (q.correct_option as 'A' | 'B' | 'C' | 'D') || 'A',
              explanation: q.explanation ? String(q.explanation) : undefined,
              explanationBengali: q.explanation_bengali ? String(q.explanation_bengali) : undefined,
              difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
              defaultMarks: Number(q.default_marks || 1),
              defaultNegativeMarks: Number(q.default_negative_marks || 0),
              isActive: Boolean(q.is_active),
              examTitle: ex?.title,
              subjectName: sub?.name,
              chapterName: ch?.name,
            },
          };
        }
      );
    } catch {
      return [];
    }
  },

  async resolveMistake(mistakeId: string, isResolved: boolean = true): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('mistakes')
          .update({
            is_resolved: isResolved,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq('id', mistakeId);
        if (!error) return true;
      } catch (err) {
        console.error('resolveMistake Supabase error:', err);
      }
    }
    const idx = MOCK_MISTAKES.findIndex((m) => m.id === mistakeId);
    if (idx !== -1) {
      MOCK_MISTAKES[idx].isResolved = isResolved;
      MOCK_MISTAKES[idx].lastReviewedAt = new Date().toISOString();
      return true;
    }
    return false;
  },

  async getBookmarks(userId: string): Promise<BookmarkItem[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(
          `
          id,
          user_id,
          question_id,
          note,
          created_at,
          questions (
            *,
            chapters (
              name,
              subjects (
                name,
                exams (title)
              )
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return [];
      return (data as unknown as Array<BookmarkRow & { questions: QuestionWithContext }>).map(
        (d) => {
          const q = d.questions || {};
          const ch = q.chapters;
          const sub = ch?.subjects;
          const ex = sub?.exams;
          return {
            id: d.id,
            userId: d.user_id,
            questionId: d.question_id,
            note: d.note ?? undefined,
            createdAt: d.created_at,
            examTitle: ex?.title,
            subjectName: sub?.name,
            chapterName: ch?.name,
            question: {
              id: String(q.id),
              chapterId: q.chapter_id ?? undefined,
              subjectId: q.subject_id ?? undefined,
              questionText: String(q.question_text),
              questionBengaliText: q.question_bengali_text
                ? String(q.question_bengali_text)
                : undefined,
              optionA: String(q.option_a),
              optionB: String(q.option_b),
              optionC: String(q.option_c),
              optionD: String(q.option_d),
              correctOption: (q.correct_option as 'A' | 'B' | 'C' | 'D') || 'A',
              explanation: q.explanation ? String(q.explanation) : undefined,
              explanationBengali: q.explanation_bengali ? String(q.explanation_bengali) : undefined,
              difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
              defaultMarks: Number(q.default_marks || 1),
              defaultNegativeMarks: Number(q.default_negative_marks || 0),
              isActive: Boolean(q.is_active),
              examTitle: ex?.title,
              subjectName: sub?.name,
              chapterName: ch?.name,
            },
          };
        }
      );
    } catch {
      return [];
    }
  },

  async removeBookmarks(userId: string, questionIds: string[]): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .in('question_id', questionIds);
      } catch (err) {
        console.error('Supabase removeBookmarks error:', err);
      }
    }
    for (const qId of questionIds) {
      const idx = MOCK_BOOKMARKS.findIndex((b) => b.questionId === qId);
      if (idx >= 0) MOCK_BOOKMARKS.splice(idx, 1);
    }
    return true;
  },

  async clearAllBookmarks(userId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('bookmarks').delete().eq('user_id', userId);
      } catch (err) {
        console.error('Supabase clearAllBookmarks error:', err);
      }
    }
    MOCK_BOOKMARKS.length = 0;
    return true;
  },

  /**
   * Fetch active test series for the student Test Series catalog.
   * Returns test series created in Admin Panel with accurate test counts:
   * fullMockCount, topicTestCount, pyqTestCount, and total testCount.
   */
  async getStudentTestSeries(examId?: string): Promise<TestSeries[]> {
    let cachedIcons: Record<string, string> = {};
    try {
      const raw = localStorage.getItem('practicekoro_series_icons');
      if (raw) cachedIcons = JSON.parse(raw);
    } catch {
      // Ignore storage errors
    }

    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('test_series')
        .select(
          `
          *,
          exams:exam_id (id, title, category, slug),
          tests (id, test_type, is_active, status)
        `
        )
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (examId) query = query.eq('exam_id', examId);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((item: any) => {
        const rawTests = Array.isArray(item.tests) ? item.tests : [];
        const activeTests = rawTests.filter(
          (t: any) => t.is_active !== false && (t.status === 'published' || !t.status)
        );
        const count = activeTests.length;
        const fullMockCount = activeTests.filter((t: any) => t.test_type === 'full_mock').length;
        const pyqTestCount = activeTests.filter((t: any) => t.test_type === 'pyq').length;
        const topicTestCount = activeTests.filter(
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
          isPremium: Boolean(item.is_premium),
          orderIndex: Number(item.order_index || 0),
          isActive: Boolean(item.is_active),
          isPopular: Boolean(item.is_popular),
          createdAt: item.created_at,
          examTitle: item.exams?.title || undefined,
          examCategory: item.exams?.category || undefined,
          testCount: count,
          testsCount: count,
          fullMockCount,
          topicTestCount,
          pyqTestCount,
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Fetch active & published tests assigned to a specific test series for students.
   */
  async getSeriesTestsForStudent(seriesId: string): Promise<MockTest[]> {
    if (!isSupabaseConfigured) return [];

    try {
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
        .eq('test_series_id', seriesId)
        .eq('is_active', true)
        .eq('status', 'published')
        .order('order_index', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        examId: item.exam_id,
        subjectId: item.subject_id ?? undefined,
        chapterId: item.chapter_id ?? undefined,
        topicId: item.chapter_id ?? undefined,
        testSeriesId: item.test_series_id ?? undefined,
        title: item.title,
        slug: item.slug,
        description: item.description ?? undefined,
        testType: item.test_type,
        year: item.year ? Number(item.year) : undefined,
        paperName: item.paper_name ?? undefined,
        shift: item.shift ?? undefined,
        setName: item.set_name ?? undefined,
        examDate: item.exam_date ?? undefined,
        durationMinutes: Number(item.duration_minutes || 60),
        totalQuestions: Number(item.total_questions || 0),
        totalMarks: Number(item.total_marks || 0),
        passingMarks: Number(item.passing_marks || 0),
        negativeMarking: Number(item.negative_marking || 0),
        isPremium: Boolean(item.is_premium),
        orderIndex: Number(item.order_index || 0),
        isActive: Boolean(item.is_active),
        status: (item.status as 'draft' | 'published' | 'archived') || 'published',
        examTitle: item.exams?.title,
        subjectName: item.subjects?.name,
        chapterName: item.chapters?.name,
        topicName: item.chapters?.name,
        testSeriesTitle: item.test_series?.title,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetches one database-aggregated, caller-scoped report for a test series.
   * The RPC returns latest-per-test metrics plus every completed attempt for
   * the trend and history, without issuing one query per test or answer.
   */
  async getTestSeriesAnalytics(seriesId: string): Promise<TestSeriesAnalytics> {
    const emptyReport = (totalTests: number): TestSeriesAnalytics => ({
      totalTests,
      testsAttempted: 0,
      overallScorePercent: 0,
      averageScorePercent: 0,
      accuracyPercent: 0,
      bestScorePercent: 0,
      completionPercent: 0,
      testTypeBreakdown: [],
      trend: [],
      subjects: [],
      weakTopics: [],
      history: [],
    });

    if (!isSupabaseConfigured) {
      const totalTests = localTests.filter(
        (test) => test.testSeriesId === seriesId && test.isActive && test.status === 'published'
      ).length;
      return emptyReport(totalTests);
    }

    const { data, error } = await supabase.rpc('get_test_series_analytics', {
      p_series_id: seriesId,
    });
    if (error) throw new Error(error.message || 'Failed to load series analytics');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return emptyReport(0);
    return data as unknown as TestSeriesAnalytics;
  },
};
