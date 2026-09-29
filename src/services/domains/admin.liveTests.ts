import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localExams, localLiveTests, localLiveTestParticipations, localTests } from '@/services/domains/localStore';
import type { LiveTest, LiveTestParticipation } from '@/types';

/**
 * Service domain for Live Tests Management & Student Participation
 */

export async function getLiveTests(examId?: string): Promise<LiveTest[]> {
  if (!isSupabaseConfigured) {
    return localLiveTests
      .filter((lt) => !examId || lt.examId === examId)
      .map((lt) => {
        const exam = localExams.find((e) => e.id === lt.examId);
        const test = localTests.find((t) => t.id === lt.testId);
        return {
          ...lt,
          examTitle: exam?.title || lt.examTitle,
          testTitle: test?.title || lt.testTitle,
        };
      })
      .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());
  }

  try {
    let query = supabase
      .from('live_tests')
      .select('*, exams:exam_id(title), tests:test_id(title)')
      .order('scheduled_start_time', { ascending: true });

    if (examId) query = query.eq('exam_id', examId);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return localLiveTests;

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      examId: item.exam_id,
      testSeriesId: item.test_series_id ?? undefined,
      testId: item.test_id,
      scheduledStartTime: item.scheduled_start_time,
      scheduledEndTime: item.scheduled_end_time,
      durationMinutes: item.duration_minutes,
      totalQuestions: item.total_questions,
      totalMarks: Number(item.total_marks || 100),
      negativeMarking: Number(item.negative_marking || 0.25),
      instructions: item.instructions ?? undefined,
      status: item.status,
      isPublished: Boolean(item.is_published),
      enrolledCount: Number(item.enrolled_count || 0),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      examTitle: item.exams?.title || undefined,
      testTitle: item.tests?.title || undefined,
    }));
  } catch (err) {
    console.warn('Supabase getLiveTests fallback:', err);
    return localLiveTests;
  }
}

export async function getActiveLiveTest(): Promise<LiveTest | null> {
  const all = await getLiveTests();
  // Filter published tests that are scheduled or live
  const active = all.filter((lt) => lt.isPublished && (lt.status === 'live' || lt.status === 'scheduled'));
  if (active.length === 0) return all.find((lt) => lt.isPublished) || null;

  // Sort: live first, then soonest scheduled
  active.sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime();
  });

  return active[0];
}

export async function createLiveTest(data: Omit<LiveTest, 'id'>): Promise<LiveTest> {
  const id = `live-${data.examId}-${Date.now().toString().slice(-4)}`;
  const exam = localExams.find((e) => e.id === data.examId);
  const test = localTests.find((t) => t.id === data.testId);

  const newLiveTest: LiveTest = {
    id,
    ...data,
    examTitle: exam?.title,
    testTitle: test?.title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    localLiveTests.unshift(newLiveTest);
    return newLiveTest;
  }

  try {
    const payload = {
      id,
      title: data.title,
      exam_id: data.examId,
      test_series_id: data.testSeriesId || null,
      test_id: data.testId,
      scheduled_start_time: data.scheduledStartTime,
      scheduled_end_time: data.scheduledEndTime,
      duration_minutes: data.durationMinutes,
      total_questions: data.totalQuestions,
      total_marks: data.totalMarks,
      negative_marking: data.negativeMarking,
      instructions: data.instructions || null,
      status: data.status || 'scheduled',
      is_published: data.isPublished ?? true,
      enrolled_count: data.enrolledCount || 0,
    };

    const { error } = await supabase.from('live_tests').insert(payload);
    if (error) throw error;
  } catch (err) {
    console.warn('Supabase createLiveTest write error, persisting locally:', err);
  }

  localLiveTests.unshift(newLiveTest);
  return newLiveTest;
}

export async function updateLiveTest(id: string, updates: Partial<LiveTest>): Promise<LiveTest> {
  const idx = localLiveTests.findIndex((lt) => lt.id === id);
  if (idx !== -1) {
    localLiveTests[idx] = {
      ...localLiveTests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }

  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.examId !== undefined) payload.exam_id = updates.examId;
      if (updates.testSeriesId !== undefined) payload.test_series_id = updates.testSeriesId || null;
      if (updates.testId !== undefined) payload.test_id = updates.testId;
      if (updates.scheduledStartTime !== undefined) payload.scheduled_start_time = updates.scheduledStartTime;
      if (updates.scheduledEndTime !== undefined) payload.scheduled_end_time = updates.scheduledEndTime;
      if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
      if (updates.totalQuestions !== undefined) payload.total_questions = updates.totalQuestions;
      if (updates.totalMarks !== undefined) payload.total_marks = updates.totalMarks;
      if (updates.negativeMarking !== undefined) payload.negative_marking = updates.negativeMarking;
      if (updates.instructions !== undefined) payload.instructions = updates.instructions || null;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.isPublished !== undefined) payload.is_published = updates.isPublished;

      const { error } = await supabase.from('live_tests').update(payload).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase updateLiveTest error:', err);
    }
  }

  return localLiveTests[idx] || (updates as LiveTest);
}

export async function deleteLiveTest(id: string): Promise<boolean> {
  const idx = localLiveTests.findIndex((lt) => lt.id === id);
  if (idx !== -1) localLiveTests.splice(idx, 1);

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('live_tests').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase deleteLiveTest error:', err);
    }
  }
  return true;
}

export async function joinLiveTest(liveTestId: string, userId: string): Promise<LiveTestParticipation> {
  const existing = localLiveTestParticipations.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  if (existing) return existing;

  const participation: LiveTestParticipation = {
    id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    liveTestId,
    userId,
    joinedAt: new Date().toISOString(),
    status: 'joined',
  };

  localLiveTestParticipations.push(participation);

  // Increment enrolledCount
  const lt = localLiveTests.find((t) => t.id === liveTestId);
  if (lt) lt.enrolledCount += 1;

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_test_participations').upsert({
        live_test_id: liveTestId,
        user_id: userId,
        status: 'joined',
        joined_at: participation.joinedAt,
      });
      // Increment enrolled count
      await supabase.rpc('increment_live_test_enrollment', { p_live_test_id: liveTestId });
    } catch (err) {
      console.warn('Supabase joinLiveTest fallback:', err);
    }
  }

  return participation;
}

export const adminLiveTestsApi = {
  getLiveTests,
  getActiveLiveTest,
  createLiveTest,
  updateLiveTest,
  deleteLiveTest,
  joinLiveTest,
};
