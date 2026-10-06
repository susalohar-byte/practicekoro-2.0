import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localExams, localLiveTests, localLiveTestParticipations, localTests } from '@/services/domains/localStore';
import type { LiveTest, LiveTestParticipant, MockTest } from '@/types';

/**
 * Service domain for Live Tests Management & Student Participation
 *
 * Core Principle:
 * LIVE TEST = EXISTING TEST + SCHEDULED EVENT + OPTIONAL RANKING
 * A Live Test does NOT have its own questions or runner; it is a thin event layer.
 *
 * Persistence Architecture (3-Tier Resilient Storage):
 * 1. Primary: `public.live_tests` & `public.live_test_participants` tables (when migrated)
 * 2. Universal Fallback: `public.app_settings` (`id = 'live_tests_schedule_list'`) — readable
 *    by all authenticated & anonymous clients (Web & Mobile) and writable by Admin via RPC/upsert.
 * 3. Local Cache: `localStorage` (`pk_live_tests_list` & `pk_live_test_participations`) + in-memory store.
 */

const STORAGE_KEY = 'pk_live_tests_list';
const PARTICIPANTS_STORAGE_KEY = 'pk_live_test_participations';
const APP_SETTINGS_LIVE_TESTS_ID = 'live_tests_schedule_list';
const APP_SETTINGS_PARTICIPANTS_ID = 'live_tests_participants_list';

function getStoredLiveTests(): LiveTest[] {
  if (typeof window === 'undefined') return [...localLiveTests];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...localLiveTests];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...localLiveTests];
  } catch {
    return [...localLiveTests];
  }
}

function saveStoredLiveTests(list: LiveTest[]): void {
  // Sync in-memory localLiveTests array
  localLiveTests.length = 0;
  localLiveTests.push(...list);

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pk_live_tests_updated', { detail: list }));
  } catch (err) {
    console.warn('Failed to save live tests to localStorage:', err);
  }
}

function getStoredParticipations(): LiveTestParticipant[] {
  if (typeof window === 'undefined') return [...localLiveTestParticipations];
  try {
    const raw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (!raw) return [...localLiveTestParticipations];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [...localLiveTestParticipations];
  } catch {
    return [...localLiveTestParticipations];
  }
}

function saveStoredParticipations(list: LiveTestParticipant[]): void {
  localLiveTestParticipations.length = 0;
  localLiveTestParticipations.push(...list);

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save live test participations to localStorage:', err);
  }
}

/** Helper to derive status based on schedule */
export function deriveLiveTestStatus(
  status: string,
  startAtStr: string,
  durationMinutes: number
): LiveTest['status'] {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'draft') return 'draft';
  if (status === 'ended' || status === 'completed') return 'ended';
  if (status === 'live') return 'live';
  const now = Date.now();
  const start = new Date(startAtStr).getTime();
  if (isNaN(start)) return 'upcoming';
  const end = start + Math.max(1, durationMinutes) * 60 * 1000;

  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

/** Map a Supabase `tests` row into a `MockTest` object */
function mapRowToMockTest(row: any): MockTest {
  return {
    id: String(row.id),
    title: String(row.title || 'Mock Test'),
    slug: String(row.slug || row.id),
    description: row.description ?? undefined,
    testType: row.test_type || 'full_mock',
    durationMinutes: Number(row.duration_minutes || 90),
    totalQuestions: Number(row.total_questions || 100),
    totalMarks: Number(row.total_marks || 100),
    passingMarks: Number(row.passing_marks || 40),
    negativeMarking: Number(row.negative_marking ?? 0.25),
    isPremium: Boolean(row.is_premium),
    isActive: Boolean(row.is_active ?? true),
    orderIndex: Number(row.order_index || 0),
    status: (row.status || (row.is_active ? 'published' : 'draft')) as 'draft' | 'published' | 'archived',
    examId: row.exam_id ?? undefined,
    testSeriesId: row.test_series_id ?? undefined,
    examTitle: row.exams?.title ?? undefined,
  };
}

/** Batch-fetch source MockTests from Supabase `public.tests` (with localTests fallback) */
async function fetchSourceTestsMap(testIds: string[]): Promise<Map<string, MockTest>> {
  const map = new Map<string, MockTest>();
  const uniqueIds = Array.from(new Set(testIds.filter(Boolean)));
  if (uniqueIds.length === 0) return map;

  // 1. Seed from localTests first
  for (const id of uniqueIds) {
    const local = localTests.find((t) => t.id === id);
    if (local) map.set(id, local);
  }

  // 2. Query Supabase `public.tests` when configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, exams:exam_id(id,title)')
        .in('id', uniqueIds);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          map.set(String(row.id), mapRowToMockTest(row));
        }
      }
    } catch (err) {
      console.warn('Could not batch-fetch source tests for live tests:', err);
    }
  }

  return map;
}

/** Format / enrich live test with source test data */
function enrichLiveTest(lt: any, sourceTest?: MockTest | null): LiveTest {
  const test = sourceTest || lt.test || localTests.find((t) => t.id === lt.testId || t.id === lt.test_id) || null;
  const exam = localExams.find((e) => e.id === (lt.examId || lt.exam_id || test?.examId));

  const startAt =
    lt.startAt ||
    lt.start_at ||
    lt.scheduledStartTime ||
    lt.scheduled_start_time ||
    new Date().toISOString();
  const duration = Number(test?.durationMinutes || lt.durationMinutes || lt.duration_minutes || 90);
  const derivedStatus = deriveLiveTestStatus(lt.status, startAt, duration);
  const endAt =
    lt.scheduledEndTime ||
    lt.scheduled_end_time ||
    new Date(new Date(startAt).getTime() + duration * 60000).toISOString();

  const resolvedTitle =
    (lt.customTitle && String(lt.customTitle).trim()) ||
    test?.title ||
    (lt.title && lt.title !== 'Live Mock Test' ? lt.title : undefined) ||
    lt.testTitle ||
    lt.title ||
    'Live Mock Test';

  const enrolled = Number(lt.enrolledCount ?? lt.enrolled_count ?? 0);
  const participants = Number(lt.participantsCount ?? lt.participants_count ?? enrolled);

  return {
    id: String(lt.id),
    testId: String(lt.testId || lt.test_id),
    startAt,
    registrationDeadline: lt.registrationDeadline ?? lt.registration_deadline ?? null,
    status: derivedStatus,
    rankingEnabled:
      lt.rankingEnabled !== undefined
        ? Boolean(lt.rankingEnabled)
        : lt.ranking_enabled !== undefined
          ? Boolean(lt.ranking_enabled)
          : true,
    subscriptionRequired:
      lt.subscriptionRequired !== undefined
        ? Boolean(lt.subscriptionRequired)
        : lt.subscription_required !== undefined
          ? Boolean(lt.subscription_required)
          : false,
    createdAt: lt.createdAt || lt.created_at || new Date().toISOString(),
    updatedAt: lt.updatedAt || lt.updated_at || new Date().toISOString(),

    // Inherited from source test
    test: test || null,
    title: resolvedTitle,
    examId: exam?.id || test?.examId || lt.examId || lt.exam_id,
    examTitle: test?.examTitle || exam?.title || lt.examTitle,
    testTitle: test?.title || lt.testTitle || resolvedTitle,
    durationMinutes: duration,
    totalQuestions: Number(test?.totalQuestions || lt.totalQuestions || lt.total_questions || 100),
    totalMarks: Number(test?.totalMarks || lt.totalMarks || lt.total_marks || 100),
    negativeMarking: Number(test?.negativeMarking ?? lt.negativeMarking ?? lt.negative_marking ?? 0.25),
    instructions:
      test?.description ||
      lt.instructions ||
      'Official examination pattern with statewide rank & percentile analysis.',
    enrolledCount: enrolled,
    participantsCount: participants,
    isPublished:
      lt.isPublished !== undefined
        ? Boolean(lt.isPublished)
        : lt.is_published !== undefined
          ? Boolean(lt.is_published)
          : true,
    scheduledStartTime: startAt,
    scheduledEndTime: endAt,
    scheduledStartAt: startAt,
    scheduledEndAt: endAt,
    logo:
      lt.logo ||
      lt.examLogo ||
      lt.exam_logo ||
      exam?.iconName ||
      (exam as any)?.icon_name ||
      test?.iconUrl ||
      undefined,
    examLogo:
      lt.logo ||
      lt.examLogo ||
      lt.exam_logo ||
      exam?.iconName ||
      (exam as any)?.icon_name ||
      test?.iconUrl ||
      undefined,
  };
}

/** Sort LiveTests: LIVE first, then UPCOMING (soonest first), then ENDED (newest first), then CANCELLED */
function sortLiveTests(list: LiveTest[]): LiveTest[] {
  const statusWeight: Record<string, number> = {
    live: 1,
    upcoming: 2,
    scheduled: 2,
    ended: 3,
    completed: 3,
    cancelled: 4,
  };

  return [...list].sort((a, b) => {
    const wA = statusWeight[a.status] ?? 5;
    const wB = statusWeight[b.status] ?? 5;
    if (wA !== wB) return wA - wB;

    const tA = new Date(a.startAt).getTime();
    const tB = new Date(b.startAt).getTime();
    // For upcoming/live, soonest start time first; for ended/cancelled, most recent first
    return wA <= 2 ? tA - tB : tB - tA;
  });
}

/**
 * Persist Live Tests list across all 3 tiers:
 * 1. localStorage + in-memory + window custom event
 * 2. Supabase `public.app_settings` (`id = 'live_tests_schedule_list'`)
 * 3. Broadcast on Supabase Realtime channel
 */
async function syncLiveTestsToRemote(list: LiveTest[]): Promise<void> {
  // Strip heavy nested `test` object before serializing to app_settings to keep payload compact,
  // while keeping all metadata fields (`title`, `examId`, `examTitle`, `durationMinutes`, etc.) intact.
  const compactList = list.map((lt) => ({
    ...lt,
    test: undefined,
  }));

  saveStoredLiveTests(list);

  if (!isSupabaseConfigured) return;

  try {
    const settingRow = {
      id: APP_SETTINGS_LIVE_TESTS_ID,
      category: 'live_tests',
      key: APP_SETTINGS_LIVE_TESTS_ID,
      value: compactList,
      description: 'Scheduled Live Mock Tests for Student Portal and Mobile App',
      updated_at: new Date().toISOString(),
    };

    let rpcSuccess = false;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_app_settings', {
        p_settings: [settingRow],
      });
      if (!rpcError && (rpcData?.success || rpcData?.updated_count !== undefined)) {
        rpcSuccess = true;
      }
    } catch {
      // Fallback to direct upsert
    }

    if (!rpcSuccess) {
      await supabase.from('app_settings').upsert(settingRow, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Could not sync live tests to app_settings:', err);
  }

  // Broadcast realtime event
  try {
    const channel = supabase.channel('live_tests_sync_channel');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'live_tests_updated',
          payload: { timestamp: Date.now() },
        });
      }
    });
  } catch {
    // Ignore broadcast errors
  }
}

async function fetchRemoteAppSettingsLiveTests(): Promise< any[] | null > {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', APP_SETTINGS_LIVE_TESTS_ID)
      .maybeSingle();

    if (error || !data || data.value === undefined || data.value === null) {
      return null;
    }

    let rawVal = data.value;
    if (typeof rawVal === 'string') {
      try {
        rawVal = JSON.parse(rawVal);
      } catch {
        return null;
      }
    }

    if (Array.isArray(rawVal)) {
      return rawVal;
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function getLiveTests(examId?: string): Promise<LiveTest[]> {
  if (!isSupabaseConfigured) {
    const stored = getStoredLiveTests();
    const sourceList = stored.length > 0 ? stored : localLiveTests;
    const enriched = sourceList
      .map((lt) => enrichLiveTest(lt))
      .filter((lt) => !examId || lt.examId === examId);
    return sortLiveTests(enriched);
  }

  let rawItems: any[] | null = null;

  // Tier 1: Try `public.live_tests` table in Supabase
  try {
    const { data, error } = await supabase
      .from('live_tests')
      .select('*, tests(*, exams:exam_id(id,title))')
      .order('start_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      rawItems = data;
    }
  } catch {
    // Fallback to Tier 2 seamlessly
  }

  // Tier 2: Try `public.app_settings` (`id = 'live_tests_schedule_list'`)
  if (!rawItems) {
    const appSettingsList = await fetchRemoteAppSettingsLiveTests();
    if (appSettingsList !== null) {
      rawItems = appSettingsList;
    }
  }

  // Tier 3: Fallback to localStorage cache
  if (!rawItems) {
    rawItems = getStoredLiveTests();
  }

  if (!rawItems || rawItems.length === 0) {
    return [];
  }

  // Batch-enrich with real MockTest rows from `public.tests`
  const testIds = rawItems.map((item: any) => String(item.testId || item.test_id || '')).filter(Boolean);
  const sourceTestsMap = await fetchSourceTestsMap(testIds);

  const enriched = rawItems.map((item: any) => {
    const tId = String(item.testId || item.test_id || '');
    const joinedTest = item.tests ? mapRowToMockTest(item.tests) : null;
    const sourceTest = joinedTest || sourceTestsMap.get(tId) || null;
    return enrichLiveTest(item, sourceTest);
  });

  const sorted = sortLiveTests(enriched);
  saveStoredLiveTests(sorted);

  if (examId) {
    return sorted.filter((lt) => lt.examId === examId);
  }
  return sorted;
}

export async function getActiveLiveTest(): Promise<LiveTest | null> {
  const all = await getLiveTests();
  const valid = all.filter(
    (lt) =>
      lt.isPublished !== false &&
      lt.status !== 'cancelled' &&
      lt.test?.isActive === true &&
      lt.test.status === 'published'
  );
  if (valid.length === 0) return null;

  // 1. Check for tests that are LIVE NOW
  const liveNow = valid.filter((lt) => lt.status === 'live');
  if (liveNow.length > 0) return liveNow[0];

  // 2. Check for soonest UPCOMING test
  const upcoming = valid
    .filter((lt) => lt.status === 'upcoming' || lt.status === 'scheduled')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  if (upcoming.length > 0) return upcoming[0];

  // 3. Fallback to most recently ended test
  const ended = valid
    .filter((lt) => lt.status === 'ended' || lt.status === 'completed')
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  return ended[0] || valid[0] || null;
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
  title?: string;
  logo?: string;
  examLogo?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  totalMarks?: number;
  negativeMarking?: number;
}

/** Schedule an existing test as a Live Test event */
export async function scheduleLiveTest(input: ScheduleLiveTestInput): Promise<LiveTest> {
  const currentList = await getLiveTests();

  // 1. Prevent duplicate active Live Test events for the same Test
  const isLocked = currentList.some(
    (lt) => lt.testId === input.testId && (lt.status === 'upcoming' || lt.status === 'live')
  );
  if (isLocked) {
    throw new Error(
      'This test is already scheduled for an active or upcoming Live Test event. Please cancel it or wait until it completes.'
    );
  }

  const id = `live-${input.testId}-${Date.now().toString().slice(-5)}`;
  const startAt = new Date(input.startAt).toISOString();
  const registrationDeadline = input.registrationDeadline
    ? new Date(input.registrationDeadline).toISOString()
    : startAt;

  // Fetch the real source test from Supabase (or localTests fallback)
  const sourceTestsMap = await fetchSourceTestsMap([input.testId]);
  const sourceTest = sourceTestsMap.get(input.testId) || null;

  const resolvedLogo = input.logo?.trim() || input.examLogo?.trim() || undefined;

  const newLiveTest: LiveTest = enrichLiveTest(
    {
      id,
      test_id: input.testId,
      testId: input.testId,
      customTitle: input.title?.trim() || undefined,
      title: input.title?.trim() || sourceTest?.title || undefined,
      start_at: startAt,
      startAt,
      registration_deadline: registrationDeadline,
      registrationDeadline,
      status: 'upcoming',
      ranking_enabled: input.rankingEnabled ?? true,
      rankingEnabled: input.rankingEnabled ?? true,
      subscription_required: input.subscriptionRequired ?? false,
      subscriptionRequired: input.subscriptionRequired ?? false,
      enrolledCount: 0,
      participantsCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      logo: resolvedLogo,
      examLogo: resolvedLogo,
      totalQuestions: input.totalQuestions,
      totalMarks: input.totalMarks,
      durationMinutes: input.durationMinutes,
      negativeMarking: input.negativeMarking,
    },
    sourceTest
  );

  // Persist to Tier 2 (app_settings) & Tier 3 (localStorage + in-memory)
  const updatedList = sortLiveTests([newLiveTest, ...currentList.filter((lt) => lt.id !== id)]);
  await syncLiveTestsToRemote(updatedList);

  // Also attempt Tier 1 (`public.live_tests` table) if migrated
  if (isSupabaseConfigured) {
    try {
      const payload = {
        id,
        test_id: input.testId,
        start_at: startAt,
        registration_deadline: registrationDeadline,
        status: newLiveTest.status === 'live' ? 'live' : 'upcoming',
        ranking_enabled: input.rankingEnabled ?? true,
        subscription_required: input.subscriptionRequired ?? false,
        title: newLiveTest.title,
        scheduled_start_time: startAt,
        scheduled_end_time: newLiveTest.scheduledEndTime,
        duration_minutes: newLiveTest.durationMinutes,
        total_questions: newLiveTest.totalQuestions,
        total_marks: newLiveTest.totalMarks,
        negative_marking: newLiveTest.negativeMarking,
        instructions: newLiveTest.instructions,
        is_published: true,
        logo: newLiveTest.logo,
        exam_logo: newLiveTest.examLogo,
      };

      await supabase.from('live_tests').upsert(payload, { onConflict: 'id' });
    } catch {
      // Handled via app_settings & localStorage
    }
  }

  return newLiveTest;
}

/** Update Live Test schedule or status */
export async function updateLiveTest(id: string, updates: Partial<LiveTest>): Promise<LiveTest> {
  const currentList = await getLiveTests();
  const existing = currentList.find((lt) => lt.id === id);

  const testId = updates.testId || existing?.testId || '';
  const sourceTestsMap = testId ? await fetchSourceTestsMap([testId]) : new Map<string, MockTest>();
  const sourceTest = sourceTestsMap.get(testId) || existing?.test || null;

  // If status is explicitly being set to 'upcoming' or 'live' (e.g. re-scheduling or starting now),
  // allow deriveLiveTestStatus to compute from the new startAt unless 'cancelled' or 'ended' was requested.
  const nextStatus =
    updates.status === 'cancelled' || updates.status === 'ended'
      ? updates.status
      : 'upcoming';

  const updatedItem = enrichLiveTest(
    {
      ...(existing || { id, testId }),
      ...updates,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    },
    sourceTest
  );

  const nextList = currentList.some((lt) => lt.id === id)
    ? currentList.map((lt) => (lt.id === id ? updatedItem : lt))
    : [updatedItem, ...currentList];

  await syncLiveTestsToRemote(sortLiveTests(nextList));

  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) {
        payload.title = updates.title;
      }
      if (updates.logo !== undefined || updates.examLogo !== undefined) {
        payload.logo = updates.logo || updates.examLogo;
        payload.exam_logo = updates.logo || updates.examLogo;
      }
      if (updates.totalQuestions !== undefined) {
        payload.total_questions = updates.totalQuestions;
      }
      if (updates.durationMinutes !== undefined) {
        payload.duration_minutes = updates.durationMinutes;
      }
      if (updates.startAt) {
        payload.start_at = updates.startAt;
        payload.scheduled_start_time = updates.startAt;
        payload.scheduled_end_time = updatedItem.scheduledEndTime;
      }
      if (updates.registrationDeadline !== undefined) {
        payload.registration_deadline = updates.registrationDeadline;
      }
      if (updates.status) payload.status = updates.status;
      if (updates.rankingEnabled !== undefined) payload.ranking_enabled = updates.rankingEnabled;
      if (updates.subscriptionRequired !== undefined) {
        payload.subscription_required = updates.subscriptionRequired;
      }
      if (updates.enrolledCount !== undefined) {
        payload.enrolled_count = updates.enrolledCount;
      }

      await supabase.from('live_tests').update(payload).eq('id', id);
    } catch {
      // Handled via app_settings & localStorage
    }
  }

  return updatedItem;
}

/** Upload Exam/Test Logo for Live Test to Supabase Storage */
export async function uploadLiveTestLogo(file: File, liveTestId: string): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Connect to the Admin Panel database before uploading images.');
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const safeId = liveTestId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const path = `live-tests/${safeId}/logo-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const { data, error } = await supabase.storage.from('banners').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`Logo upload failed: ${error.message}`);
  return supabase.storage.from('banners').getPublicUrl(data.path).data.publicUrl;
}

/** Cancel a live test */
export async function cancelLiveTest(id: string): Promise<boolean> {
  return (await updateLiveTest(id, { status: 'cancelled' })).status === 'cancelled';
}

/** Delete a live test */
export async function deleteLiveTest(id: string): Promise<boolean> {
  const currentList = await getLiveTests();
  const filtered = currentList.filter((lt) => lt.id !== id);
  await syncLiveTestsToRemote(filtered);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_tests').delete().eq('id', id);
    } catch {
      // Handled via app_settings
    }
  }
  return true;
}

/** Sync participations list to app_settings for cross-device registration & leaderboard support */
async function syncParticipationsToRemote(list: LiveTestParticipant[]): Promise<void> {
  saveStoredParticipations(list);
  if (!isSupabaseConfigured) return;

  try {
    const settingRow = {
      id: APP_SETTINGS_PARTICIPANTS_ID,
      category: 'live_tests',
      key: APP_SETTINGS_PARTICIPANTS_ID,
      value: list.slice(-500), // Keep latest 500 participations compact
      description: 'Live Mock Test Student Participations & Submissions',
      updated_at: new Date().toISOString(),
    };
    await supabase.from('app_settings').upsert(settingRow, { onConflict: 'id' });
  } catch {
    // Ignore if student role cannot write directly to app_settings;
    // student submissions are also recorded in `public.test_attempts`!
  }
}

async function fetchRemoteParticipations(): Promise<LiveTestParticipant[]> {
  const local = getStoredParticipations();
  if (!isSupabaseConfigured) return local;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', APP_SETTINGS_PARTICIPANTS_ID)
      .maybeSingle();

    if (!error && data?.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (Array.isArray(parsed)) {
        // Merge remote and local participations by `liveTestId + userId`
        const mergedMap = new Map<string, LiveTestParticipant>();
        for (const p of parsed) {
          if (p && p.liveTestId && p.userId) {
            mergedMap.set(`${p.liveTestId}:${p.userId}`, p);
          }
        }
        for (const p of local) {
          if (p && p.liveTestId && p.userId) {
            const key = `${p.liveTestId}:${p.userId}`;
            const prev = mergedMap.get(key);
            if (!prev || p.status === 'completed' || (p.score !== undefined && prev.score === undefined)) {
              mergedMap.set(key, p);
            }
          }
        }
        const merged = Array.from(mergedMap.values());
        saveStoredParticipations(merged);
        return merged;
      }
    }
  } catch {
    // Ignore
  }
  return local;
}

/** Register student for an upcoming live test */
export async function registerForLiveTest(
  liveTestId: string,
  userId: string
): Promise<LiveTestParticipant> {
  const allParts = await fetchRemoteParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  if (existing) return existing;

  const participation: LiveTestParticipant = {
    id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    liveTestId,
    userId,
    registeredAt: new Date().toISOString(),
    status: 'registered',
  };

  const nextParts = [...allParts, participation];
  await syncParticipationsToRemote(nextParts);

  // Update enrolled count on the live test
  try {
    const currentTests = await getLiveTests();
    const target = currentTests.find((t) => t.id === liveTestId);
    if (target) {
      const nextCount = (target.enrolledCount || 0) + 1;
      await updateLiveTest(liveTestId, {
        enrolledCount: nextCount,
        participantsCount: Math.max(target.participantsCount || 0, nextCount),
      });
    }
  } catch {
    // Ignore count update failure
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
    } catch {
      // Handled via local & app_settings
    }
  }

  return participation;
}

/** Check if student is registered for a live test */
export async function isLiveTestRegistered(liveTestId: string, userId: string): Promise<boolean> {
  const allParts = getStoredParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  if (existing) return true;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('live_test_participants')
        .select('id')
        .eq('live_test_id', liveTestId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return true;
    } catch {
      // Ignore
    }

    const remoteParts = await fetchRemoteParticipations();
    if (remoteParts.some((p) => p.liveTestId === liveTestId && p.userId === userId)) {
      return true;
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
    return {
      success: false,
      error: 'The Live Test has not started yet. Please wait until scheduled start time.',
    };
  }

  const duration = liveTest.durationMinutes || 90;
  const endTime = startTime + duration * 60 * 1000;
  if (now > endTime || liveTest.status === 'ended') {
    return { success: false, error: 'This Live Test event has already ended.' };
  }

  // Record started state
  const allParts = getStoredParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  const joinedAt = new Date().toISOString();

  if (existing) {
    if (existing.status !== 'completed') {
      existing.status = 'started';
    }
    existing.joinedAt = joinedAt;
  } else {
    allParts.push({
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      liveTestId,
      userId,
      registeredAt: joinedAt,
      joinedAt,
      status: 'started',
    });
  }
  await syncParticipationsToRemote(allParts);

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
    } catch {
      // Handled locally
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
  const allParts = await fetchRemoteParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);

  let fullName: string | undefined;
  let avatarUrl: string | undefined;
  let district: string | undefined;

  if (isSupabaseConfigured) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, district')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        fullName = (profile as any).full_name || undefined;
        avatarUrl = (profile as any).avatar_url || undefined;
        district = (profile as any).district || undefined;
      }
    } catch {
      // Ignore profile fetch error
    }
  }

  if (existing) {
    existing.status = 'completed';
    existing.completedAt = completedAt;
    existing.attemptId = submission.attemptId;
    existing.score = submission.score;
    existing.accuracy = submission.accuracy;
    existing.timeTaken = submission.timeTaken;
    if (fullName) existing.fullName = fullName;
    if (avatarUrl) existing.avatarUrl = avatarUrl;
    if (district) existing.district = district;
  } else {
    allParts.push({
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
      fullName,
      avatarUrl,
      district,
    });
  }

  await syncParticipationsToRemote(allParts);

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
    } catch {
      // Handled via test_attempts & local store
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
  const candidatesByUserId = new Map<string, LiveTestParticipant>();

  // 1. Seed from local & app_settings participations
  const storedParts = await fetchRemoteParticipations();
  for (const p of storedParts) {
    if (p.liveTestId === liveTestId && (p.status === 'completed' || p.score !== undefined)) {
      candidatesByUserId.set(p.userId, { ...p });
    }
  }

  if (isSupabaseConfigured) {
    // 2. Try RPC `get_live_test_leaderboard` if available
    try {
      const { data, error } = await supabase.rpc('get_live_test_leaderboard', {
        p_live_test_id: liveTestId,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          candidatesByUserId.set(String(row.user_id), {
            id: String(row.participant_id || `part-${row.user_id}`),
            liveTestId,
            userId: String(row.user_id),
            registeredAt: row.completed_at || new Date().toISOString(),
            completedAt: row.completed_at,
            status: 'completed',
            score: Number(row.score || 0),
            accuracy: Number(row.accuracy || 0),
            timeTaken: Number(row.time_taken || 0),
            rank: Number(row.rank || 1),
            fullName: row.full_name || 'Student',
            avatarUrl: row.avatar_url,
            district: row.district || 'West Bengal',
          });
        }
      }
    } catch {
      // Fallback to test_attempts
    }

    // 3. Also enrich from `public.test_attempts` for the underlying `testId` so all real student
    // submissions in Supabase appear on the statewide leaderboard even without migration 044!
    try {
      const liveTest = await getLiveTestById(liveTestId);
      if (liveTest?.testId) {
        const { data: attemptsData, error: attemptsErr } = await supabase
          .from('test_attempts')
          .select('id, user_id, score, accuracy, time_spent_seconds, end_time, created_at')
          .eq('test_id', liveTest.testId)
          .eq('status', 'completed')
          .order('score', { ascending: false })
          .limit(200);

        if (!attemptsErr && Array.isArray(attemptsData) && attemptsData.length > 0) {
          const userIds = Array.from(
            new Set(attemptsData.map((a: any) => String(a.user_id)).filter(Boolean))
          );

          const profilesMap = new Map<
            string,
            { fullName?: string; avatarUrl?: string; district?: string }
          >();
          if (userIds.length > 0) {
            try {
              const { data: profData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, district')
                .in('id', userIds);
              if (Array.isArray(profData)) {
                for (const pr of profData as any[]) {
                  profilesMap.set(String(pr.id), {
                    fullName: pr.full_name || undefined,
                    avatarUrl: pr.avatar_url || undefined,
                    district: pr.district || undefined,
                  });
                }
              }
            } catch {
              // Ignore profile lookup error
            }
          }

          for (const att of attemptsData as any[]) {
            const uId = String(att.user_id);
            const prof = profilesMap.get(uId);
            const existing = candidatesByUserId.get(uId);
            const attScore = Number(att.score || 0);
            const attAcc = Number(att.accuracy || 0);
            const attTime = Number(att.time_spent_seconds || 0);

            if (!existing || attScore > (existing.score ?? -Infinity)) {
              candidatesByUserId.set(uId, {
                id: existing?.id || `part-${att.id}`,
                liveTestId,
                userId: uId,
                attemptId: String(att.id),
                registeredAt: existing?.registeredAt || att.created_at || new Date().toISOString(),
                completedAt: att.end_time || att.created_at || new Date().toISOString(),
                status: 'completed',
                score: attScore,
                accuracy: attAcc,
                timeTaken: attTime,
                fullName: prof?.fullName || existing?.fullName || 'Student',
                avatarUrl: prof?.avatarUrl || existing?.avatarUrl,
                district: prof?.district || existing?.district || 'West Bengal',
              });
            } else if (existing && !existing.fullName && prof?.fullName) {
              existing.fullName = prof.fullName;
              existing.avatarUrl = prof.avatarUrl;
              existing.district = prof.district;
            }
          }
        }
      }
    } catch {
      // Ignore attempts query error
    }
  }

  // Deterministic tie-breaking sort
  const participants = Array.from(candidatesByUserId.values()).sort((a, b) => {
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

/**
 * Subscribe to real-time Live Test updates across tabs and Supabase channels
 */
export function subscribeToLiveTestUpdates(callback: () => void): () => void {
  const handleLocal = () => callback();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === PARTICIPANTS_STORAGE_KEY) {
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pk_live_tests_updated', handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  let broadcastChannel: any = null;
  let postgresChannel: any = null;

  if (isSupabaseConfigured) {
    try {
      broadcastChannel = supabase
        .channel('live_tests_sync_channel')
        .on('broadcast', { event: 'live_tests_updated' }, () => {
          callback();
        })
        .subscribe();

      postgresChannel = supabase
        .channel('realtime:live_tests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_settings',
            filter: `id=eq.${APP_SETTINGS_LIVE_TESTS_ID}`,
          },
          () => {
            callback();
          }
        )
        .subscribe();
    } catch {
      // Ignore realtime subscription errors
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pk_live_tests_updated', handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
    if (broadcastChannel && isSupabaseConfigured) {
      try {
        supabase.removeChannel(broadcastChannel);
      } catch {
        // ignore
      }
    }
    if (postgresChannel && isSupabaseConfigured) {
      try {
        supabase.removeChannel(postgresChannel);
      } catch {
        // ignore
      }
    }
  };
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
  subscribeToLiveTestUpdates,
  uploadLiveTestLogo,
};
