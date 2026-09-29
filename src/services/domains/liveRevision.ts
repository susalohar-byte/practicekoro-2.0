import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LiveTest, TestSeries } from '@/types';
import {
  getActiveLiveTest,
  getLiveTests,
  registerForLiveTest,
  isLiveTestRegistered,
} from './admin.liveTests';

export type { LiveTest, LiveTestStatus } from '@/types';

export const liveRevisionApi = {
  async getFeaturedLiveTest(): Promise<LiveTest | null> {
    return getActiveLiveTest();
  },
  async getLiveTestsForAdmin(): Promise<LiveTest[]> {
    return getLiveTests();
  },
  async joinLiveTest(liveTestId: string, userId: string) {
    return registerForLiveTest(liveTestId, userId);
  },
  async isRegistered(liveTestId: string, userId: string) {
    return isLiveTestRegistered(liveTestId, userId);
  },
  async getFeaturedTestSeries(): Promise<TestSeries[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('test_series')
        .select('*, exams:exam_id(title)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('order_index', { ascending: true })
        .limit(8);
      if (error) return [];
      return (data || []).map((r: any) => ({
        id: String(r.id),
        examId: String(r.exam_id),
        title: String(r.title),
        slug: r.slug,
        description: r.description ?? undefined,
        iconUrl: r.icon_url ?? undefined,
        isPremium: Boolean(r.is_premium),
        isActive: Boolean(r.is_active),
        orderIndex: Number(r.order_index || 0),
        examTitle: r.exams?.title ?? undefined,
      })) as TestSeries[];
    } catch {
      return [];
    }
  },
};