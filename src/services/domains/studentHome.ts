import { isSupabaseConfigured, supabaseRuntime as supabase } from '@/lib/supabase';

export interface AppLeaderboardRow {
  rank: number;
  display_name: string;
  average_percentage: number;
  district: string | null;
  tests_count: number;
}

export interface DailyContent {
  factText?: string;
  factSource?: string;
  subjectName?: string;
  targetExam?: string;
  quoteText?: string;
  quoteAuthor?: string;
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export async function getAppLeaderboard(
  scope: 'all_india' | 'west_bengal' | 'district' = 'all_india',
  district?: string
): Promise<AppLeaderboardRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_app_leaderboard', {
    p_scope: scope,
    p_district: district ?? null,
  });
  if (error) {
    console.warn('Could not load app leaderboard:', error.message);
    return [];
  }

  return (Array.isArray(data) ? data : []).map((row: Record<string, unknown>) => ({
    rank: Number(row.rank || 0),
    display_name: String(row.display_name || 'Student'),
    average_percentage: Number(row.average_percentage || 0),
    district: row.district ? String(row.district) : null,
    tests_count: Number(row.tests_count || 0),
  }));
}

export async function getDailyContent(): Promise<DailyContent> {
  if (!isSupabaseConfigured) return {};

  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('id', 'student_daily_content')
    .maybeSingle();
  if (error) {
    console.warn('Could not load student daily content:', error.message);
    return {};
  }

  return (parseJsonObject(data?.value) || {}) as DailyContent;
}

function subscribeToTables(
  channelName: string,
  tables: string[],
  callback: () => void
): () => void {
  if (!isSupabaseConfigured) return () => {};

  let channel = supabase.channel(channelName);
  for (const table of tables) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    );
  }
  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToStudentCatalogUpdates(callback: () => void): () => void {
  return subscribeToTables(
    `student-catalog-${crypto.randomUUID()}`,
    ['test_series', 'tests', 'test_exams'],
    callback
  );
}

export function subscribeToPopularExamUpdates(callback: () => void): () => void {
  return subscribeToTables(`popular-exams-${crypto.randomUUID()}`, ['app_settings'], callback);
}

export const studentHomeApi = {
  getAppLeaderboard,
  getDailyContent,
  subscribeToStudentCatalogUpdates,
  subscribeToPopularExamUpdates,
};