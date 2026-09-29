import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localExams, localLiveTests, localLiveTestParticipations, localTests } from '@/services/domains/localStore';
import type { LiveTest, LiveTestParticipant, MockTest } from '@/types';

/**
 * Service domain for Live Tests Management & Student Participation
 *
 * Core Principle:
 * LIVE TEST = EXISTING TEST + SCHEDULED EVENT + OPTIONAL RANKING
 * A Live Test does NOT have its own questions or runner; it is a thin event layer.
 */

/** Helper to derive status based on schedule */
export function deriveLiveTestStatus(
  status: string,
  startAtStr: string,
  durationMinutes: number
): LiveTest['status'] {
  if (status === 'cancelled') return 'cancelled';
  const now = Date.now();
  const start = new Date(startAtStr).getTime();
  const end = start + Math.max(1, durationMinutes) * 60 * 1000;

  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

/** Format / enrich live test with source test data */
function enrichLiveTest(lt: any, sourceTest?: MockTest | null): LiveTest {
  const test = sourceTest || localTests.find((t) => t.id === lt.testId || t.id === lt.test_id);
  const exam = localExams.find((e) => e.id === (lt.examId || lt.exam_id || test?.examId));

  const startAt = lt.startAt || lt.start_at || lt.scheduledStartTime || lt.scheduled_start_time || new Date().toISOString();
  const duration = Number(test?.durationMinutes || lt.durationMinutes || lt.duration_minutes || 90);
  const derivedStatus = deriveLiveTestStatus(lt.status, startAt, duration);
  const endAt = lt.scheduledEndTime || lt.scheduled_end_time || new Date(new Date(startAt).getTime() + duration * 60000).toISOString();

  return {
    id: String(lt.id),
    testId: String(lt.testId || lt.test_id),
    startAt,
    registrationDeadline: lt.registrationDeadline || lt.registration_deadline || null,
    status: derivedStatus,
    rankingEnabled: lt.rankingEnabled !== undefined ? Boolean(lt.rankingEnabled) : lt.ranking_enabled !== undefined ? Boolean(lt.ranking_enabled) : true,
    subscriptionRequired: lt.subscriptionRequired !== undefined ? Boolean(lt.subscriptionRequired) : lt.subscription_required !== undefined ? Boolean(lt.subscription_required) : false,
    createdAt: lt.createdAt || lt.created_at,
    updatedAt: lt.updatedAt || lt.updated_at,

    // Inherited from source test
    test: test || null,
    title: test?.title || lt.title || 'Live Mock Test',
    examId: exam?.id || test?.examId || lt.examId || lt.exam_id,
    examTitle: exam?.title || lt.examTitle,
    testTitle: test?.title || lt.testTitle,
    durationMinutes: duration,
    totalQuestions: test?.totalQuestions || lt.totalQuestions || lt.total_questions || 100,
    totalMarks: Number(test?.totalMarks || lt.totalMarks || lt.total_marks || 100),
    negativeMarking: Number(test?.negativeMarking ?? lt.negativeMarking ?? lt.negative_marking ?? 0.25),
    instructions: test?.description || lt.instructions || 'Official examination pattern with statewide rank & percentile analysis.',
    enrolledCount: Number(lt.enrolledCount || lt.enrolled_count || 0),
    participantsCount: Number(lt.participantsCount || lt.participants_count || lt.enrolledCount || lt.enrolled_count || 0),
    isPublished: lt.isPublished !== undefined ? Boolean(lt.isPublished) : lt.is_published !== undefined ? Boolean(lt.is_published) : true,
    scheduledStartTime: startAt,
    scheduledEndTime: endAt,
    scheduledStartAt: startAt,
    scheduledEndAt: endAt,
  };
}

export async function getLiveTests(examId?: string): Promise<LiveTest[]> {
  if (!isSupabaseConfigured) {
    return localLiveTests
      .map((lt) => enrichLiveTest(lt))
      .filter((lt) => !examId || lt.examId === examId)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  try {
    const query = supabase
      .from('live_tests')
      .select('*, tests(*, exams:exam_id(id,title))')
      .order('start_at', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) {
      return localLiveTests.map((lt) => enrichLiveTest(lt));
    }

    const enriched = data.map((item: any) => {
      const sourceTest: MockTest | null = item.tests
        ? {
            id: item.tests.id,
            title: item.tests.title,
            slug: item.tests.slug || item.tests.id,
            description: item.tests.description,
            testType: item.tests.test_type,
            durationMinutes: Number(item.tests.duration_minutes || 90),
            totalQuestions: Number(item.tests.total_questions || 100),
            totalMarks: Number(item.tests.total_marks || 100),
            passingMarks: Number(item.tests.passing_marks || 40),
            negativeMarking: Number(item.tests.negative_marking || 0.25),
            isPremium: Boolean(item.tests.is_premium),
            isActive: Boolean(item.tests.is_active),
            orderIndex: Number(item.tests.order_index || 0),
            status: (item.tests.status || (item.tests.is_active ? 'published' : 'draft')) as 'draft' | 'published' | 'archived',
            examId: item.tests.exam_id,
            testSeriesId: item.tests.test_series_id,
            examTitle: item.tests.exams?.title,
          }
        : null;

      return enrichLiveTest(item, sourceTest);
    });

    if (examId) {
      return enriched.filter((lt) => lt.examId === examId);
    }
    return enriched;
  } catch (err) {
    console.warn('Supabase getLiveTests fallback:', err);
    return localLiveTests.map((lt) => enrichLiveTest(lt));
  }
}

export async function getActiveLiveTest(): Promise<LiveTest | null> {
  const all = await getLiveTests();
  if (all.length === 0) return null;

  // 1. Check for tests that are LIVE NOW
  const liveNow = all.filter((lt) => lt.status === 'live');
  if (liveNow.length > 0) return liveNow[0];

  // 2. Check for soonest UPCOMING test
  const upcoming = all
    .filter((lt) => lt.status === 'upcoming')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  if (upcoming.length > 0) return upcoming[0];

  // 3. Fallback to latest test
  return all[0] || null;
}

export async function getLiveTestById(id: string): Promise<LiveTest | null> {
  const all = await getLiveTests();
  return all.find((lt) => lt.id === id) || null;
}

/** Check if a test is locked because it is part of an active (upcoming or live) Live Test */
export async function isTestLockedForEditing(testId: string): Promise<boolean> {
  const all = await getLiveTests();
  return all.some(
    (lt) => lt.testId === testId && (lt.status === 'upcoming' || lt.status === 'live')
  );
}

export interface ScheduleLiveTestInput {
  testId: string;
  startAt: string;
  registrationDeadline?: string;
  rankingEnabled?: boolean;
  subscriptionRequired?: boolean;
}

/** Schedule an existing test as a Live Test event */
export async function scheduleLiveTest(input: ScheduleLiveTestInput): Promise<LiveTest> {
  // 1. Prevent duplicate active Live Test events for the same Test
  const isLocked = await isTestLockedForEditing(input.testId);
  if (isLocked) {
    throw new Error('This test is already scheduled for an active or upcoming Live Test event. Please cancel it or wait until it completes.');
  }

  const id = `live-${input.testId}-${Date.now().toString().slice(-4)}`;
  const startAt = new Date(input.startAt).toISOString();
  const registrationDeadline = input.registrationDeadline
    ? new Date(input.registrationDeadline).toISOString()
    : startAt;

  const sourceTest = localTests.find((t) => t.id === input.testId);

  const newLiveTest: LiveTest = enrichLiveTest(
    {
      id,
      test_id: input.testId,
      testId: input.testId,
      start_at: startAt,
      startAt,
      registration_deadline: registrationDeadline,
      registrationDeadline,
      status: 'upcoming',
      ranking_enabled: input.rankingEnabled ?? true,
      rankingEnabled: input.rankingEnabled ?? true,
      subscription_required: input.subscriptionRequired ?? false,
      subscriptionRequired: input.subscriptionRequired ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    sourceTest
  );

  if (isSupabaseConfigured) {
    try {
      const payload = {
        id,
        test_id: input.testId,
        start_at: startAt,
        registration_deadline: registrationDeadline,
        status: 'upcoming',
        ranking_enabled: input.rankingEnabled ?? true,
        subscription_required: input.subscriptionRequired ?? false,
        // Compatibility columns
        title: newLiveTest.title,
        scheduled_start_time: startAt,
        scheduled_end_time: newLiveTest.scheduledEndTime,
        duration_minutes: newLiveTest.durationMinutes,
        total_questions: newLiveTest.totalQuestions,
        total_marks: newLiveTest.totalMarks,
        negative_marking: newLiveTest.negativeMarking,
        instructions: newLiveTest.instructions,
        is_published: true,
      };

      const { error } = await supabase.from('live_tests').insert(payload);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase scheduleLiveTest write error, fallback to localStore:', err);
    }
  }

  localLiveTests.unshift(newLiveTest);
  return newLiveTest;
}

/** Update Live Test schedule */
export async function updateLiveTest(id: string, updates: Partial<LiveTest>): Promise<LiveTest> {
  const idx = localLiveTests.findIndex((lt) => lt.id === id);
  if (idx !== -1) {
    localLiveTests[idx] = enrichLiveTest({
      ...localLiveTests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.startAt) {
        payload.start_at = updates.startAt;
        payload.scheduled_start_time = updates.startAt;
      }
      if (updates.registrationDeadline !== undefined) {
        payload.registration_deadline = updates.registrationDeadline;
      }
      if (updates.status) payload.status = updates.status;
      if (updates.rankingEnabled !== undefined) payload.ranking_enabled = updates.rankingEnabled;
      if (updates.subscriptionRequired !== undefined) payload.subscription_required = updates.subscriptionRequired;

      const { error } = await supabase.from('live_tests').update(payload).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase updateLiveTest error:', err);
    }
  }

  return localLiveTests[idx] || (updates as LiveTest);
}

/** Cancel a live test */
export async function cancelLiveTest(id: string): Promise<boolean> {
  return (await updateLiveTest(id, { status: 'cancelled' })).status === 'cancelled';
}

/** Delete a live test */
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

/** Register student for an upcoming live test */
export async function registerForLiveTest(liveTestId: string, userId: string): Promise<LiveTestParticipant> {
  const existing = localLiveTestParticipations.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  if (existing) return existing;

  const participation: LiveTestParticipant = {
    id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    liveTestId,
    userId,
    registeredAt: new Date().toISOString(),
    status: 'registered',
  };

  localLiveTestParticipations.push(participation);

  // Update enrolled count locally
  const lt = localLiveTests.find((t) => t.id === liveTestId);
  if (lt) {
    lt.enrolledCount = (lt.enrolledCount || 0) + 1;
    lt.participantsCount = lt.enrolledCount;
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_test_participants').upsert(
        {
          live_test_id: liveTestId,
          user_id: userId,
          status: 'registered',
          registered_at: participation.registeredAt,
        },
        { onConflict: 'live_test_id,user_id' }
      );
    } catch (err) {
      console.warn('Supabase registerForLiveTest fallback:', err);
    }
  }

  return participation;
}

/** Check if student is registered for a live test */
export async function isLiveTestRegistered(liveTestId: string, userId: string): Promise<boolean> {
  const existing = localLiveTestParticipations.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  if (existing) return true;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('live_test_participants')
        .select('id')
        .eq('live_test_id', liveTestId)
        .eq('user_id', userId)
        .maybeSingle();
      return Boolean(data);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Join live test event:
 * Validates start timing (no early entry), updates status to 'started', sets joined_at
 */
export async function joinLiveTestEvent(
  liveTestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const liveTest = await getLiveTestById(liveTestId);
  if (!liveTest) return { success: false, error: 'Live test event not found.' };

  if (liveTest.status === 'cancelled') {
    return { success: false, error: 'This live test event has been cancelled.' };
  }

  const now = Date.now();
  const startTime = new Date(liveTest.startAt).getTime();
  if (now < startTime) {
    return { success: false, error: 'The Live Test has not started yet. Please wait until scheduled start time.' };
  }

  const duration = liveTest.durationMinutes || 90;
  const endTime = startTime + duration * 60 * 1000;
  if (now > endTime) {
    return { success: false, error: 'This Live Test event has already ended.' };
  }

  // Record started state
  const existing = localLiveTestParticipations.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  const joinedAt = new Date().toISOString();

  if (existing) {
    existing.status = 'started';
    existing.joinedAt = joinedAt;
  } else {
    localLiveTestParticipations.push({
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      liveTestId,
      userId,
      registeredAt: joinedAt,
      joinedAt,
      status: 'started',
    });
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_test_participants').upsert(
        {
          live_test_id: liveTestId,
          user_id: userId,
          status: 'started',
          joined_at: joinedAt,
        },
        { onConflict: 'live_test_id,user_id' }
      );
    } catch (err) {
      console.warn('Supabase joinLiveTestEvent error:', err);
    }
  }

  return { success: true };
}

/** Record student's submission from existing test runner into live test participant record */
export async function recordLiveTestSubmission(
  liveTestId: string,
  userId: string,
  submission: {
    attemptId: string;
    score: number;
    accuracy: number;
    timeTaken: number;
  }
): Promise<void> {
  const completedAt = new Date().toISOString();
  const existing = localLiveTestParticipations.find((p) => p.liveTestId === liveTestId && p.userId === userId);

  if (existing) {
    existing.status = 'completed';
    existing.completedAt = completedAt;
    existing.attemptId = submission.attemptId;
    existing.score = submission.score;
    existing.accuracy = submission.accuracy;
    existing.timeTaken = submission.timeTaken;
  } else {
    localLiveTestParticipations.push({
      id: `part-${Date.now()}`,
      liveTestId,
      userId,
      registeredAt: completedAt,
      joinedAt: completedAt,
      completedAt,
      status: 'completed',
      attemptId: submission.attemptId,
      score: submission.score,
      accuracy: submission.accuracy,
      timeTaken: submission.timeTaken,
    });
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_test_participants').upsert(
        {
          live_test_id: liveTestId,
          user_id: userId,
          status: 'completed',
          completed_at: completedAt,
          attempt_id: submission.attemptId,
          score: submission.score,
          accuracy: submission.accuracy,
          time_taken: submission.timeTaken,
        },
        { onConflict: 'live_test_id,user_id' }
      );
    } catch (err) {
      console.warn('Supabase recordLiveTestSubmission error:', err);
    }
  }
}

/**
 * Deterministic Leaderboard Ranking:
 * 1. Higher score (score DESC)
 * 2. Higher accuracy (accuracy DESC)
 * 3. Lower time taken (timeTaken ASC)
 */
export async function getLiveTestLeaderboard(liveTestId: string): Promise<LiveTestParticipant[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('get_live_test_leaderboard', {
        p_live_test_id: liveTestId,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
          id: row.participant_id,
          liveTestId,
          userId: row.user_id,
          registeredAt: row.completed_at || new Date().toISOString(),
          completedAt: row.completed_at,
          status: 'completed',
          score: Number(row.score || 0),
          accuracy: Number(row.accuracy || 0),
          timeTaken: Number(row.time_taken || 0),
          rank: Number(row.rank || 1),
          fullName: row.full_name,
          avatarUrl: row.avatar_url,
          district: row.district,
        }));
      }
    } catch (err) {
      console.warn('Supabase getLiveTestLeaderboard RPC fallback:', err);
    }
  }

  // Local fallback calculation with deterministic tie-breaking
  const participants = localLiveTestParticipations
    .filter((p) => p.liveTestId === liveTestId && (p.status === 'completed' || p.score !== undefined))
    .sort((a, b) => {
      // 1. Higher score
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;

      // 2. Higher accuracy
      const accDiff = (b.accuracy || 0) - (a.accuracy || 0);
      if (accDiff !== 0) return accDiff;

      // 3. Lower time taken
      const timeDiff = (a.timeTaken || 999999) - (b.timeTaken || 999999);
      if (timeDiff !== 0) return timeDiff;

      return (a.completedAt || '').localeCompare(b.completedAt || '');
    });

  return participants.map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));
}

/** Backward-compatible aliases */
export const createLiveTest = scheduleLiveTest;
export const joinLiveTest = registerForLiveTest;

export const adminLiveTestsApi = {
  getLiveTests,
  getActiveLiveTest,
  getLiveTestById,
  isTestLockedForEditing,
  scheduleLiveTest,
  createLiveTest,
  updateLiveTest,
  cancelLiveTest,
  deleteLiveTest,
  registerForLiveTest,
  joinLiveTest,
  isLiveTestRegistered,
  joinLiveTestEvent,
  recordLiveTestSubmission,
  getLiveTestLeaderboard,
};
