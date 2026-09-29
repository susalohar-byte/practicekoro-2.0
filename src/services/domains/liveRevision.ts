import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MockTest, TestSeries } from '@/types';
import { getActiveLiveTest, getLiveTests } from './admin.liveTests';

export type LiveTestStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled' | 'archived';

export interface LiveTest {
  id: string; title: string; description?: string | null; testId: string;
  examId?: string | null; testSeriesId?: string | null;
  scheduledStartAt: string; scheduledEndAt: string; durationMinutes: number;
  instructions?: string | null; subscriptionRequired: boolean;
  rankingEnabled: boolean; status: LiveTestStatus; resultVisibility: string;
  test?: MockTest | null; participantsCount?: number;
}

export interface FlashcardDeck {
  id: string; examId?: string | null; subjectId?: string | null; chapterId?: string | null;
  title: string; description?: string | null; coverIcon?: string | null;
  status: 'draft' | 'published' | 'archived'; orderIndex: number; cardCount?: number;
}
export interface Flashcard {
  id: string; deckId: string; type: string; front: string; back: string;
  explanation?: string | null; source?: string | null;
  difficulty: 'easy' | 'medium' | 'hard'; tags: string[]; status: string; orderIndex: number;
}
export interface FlashcardProgress {
  flashcardId: string; status: 'new' | 'learning' | 'review' | 'mastered';
  reviewCount: number; lastReviewedAt?: string | null; nextReviewAt?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
}

const mapLive = (r: any): LiveTest => ({
  id: String(r.id), title: String(r.title), description: r.description ?? null,
  testId: String(r.test_id), examId: r.exam_id ?? null, testSeriesId: r.test_series_id ?? null,
  scheduledStartAt: String(r.scheduled_start_at), scheduledEndAt: String(r.scheduled_end_at),
  durationMinutes: Number(r.duration_minutes || 0), instructions: r.instructions ?? null,
  subscriptionRequired: Boolean(r.subscription_required), rankingEnabled: Boolean(r.ranking_enabled),
  resultVisibility: r.result_visibility || 'immediate', status: r.status,
  participantsCount: r.participants_count == null ? undefined : Number(r.participants_count),
  test: r.tests ? ({
    id: r.tests.id, title: r.tests.title, durationMinutes: Number(r.tests.duration_minutes || 0),
    totalQuestions: Number(r.tests.total_questions || 0), totalMarks: Number(r.tests.total_marks || 0),
    passingMarks: Number(r.tests.passing_marks || 0), negativeMarking: Number(r.tests.negative_marking || 0),
    testType: r.tests.test_type, isPremium: Boolean(r.tests.is_premium), isActive: Boolean(r.tests.is_active),
    examId: r.tests.exam_id ?? undefined, testSeriesId: r.tests.test_series_id ?? undefined,
  } as MockTest) : null,
});

const mapDeck = (r: any): FlashcardDeck => ({
  id: String(r.id), examId: r.exam_id ?? null, subjectId: r.subject_id ?? null, chapterId: r.chapter_id ?? null,
  title: String(r.title), description: r.description ?? null, coverIcon: r.cover_icon ?? null,
  status: r.status, orderIndex: Number(r.order_index || 0),
  cardCount: Array.isArray(r.flashcards) ? r.flashcards.length : undefined,
});
const mapCard = (r: any): Flashcard => ({
  id: String(r.id), deckId: String(r.deck_id), type: r.card_type || 'question_answer',
  front: String(r.front_content || ''), back: String(r.back_content || ''),
  explanation: r.explanation ?? null, source: r.source ?? null, difficulty: r.difficulty || 'medium',
  tags: Array.isArray(r.tags) ? r.tags : [], status: r.status, orderIndex: Number(r.order_index || 0),
});

export const liveRevisionApi = {
  async getFeaturedLiveTest(): Promise<LiveTest | null> {
    if (isSupabaseConfigured) {
      try {
        const now = new Date().toISOString();
        const select = '*, tests(id,title,duration_minutes,total_questions,total_marks,passing_marks,negative_marking,test_type,is_premium,is_active,exam_id,test_series_id)';
        const { data: live } = await supabase.from('live_tests').select(select).eq('status','live').eq('visibility','public').lte('scheduled_start_at',now).gt('scheduled_end_at',now).order('scheduled_start_at',{ascending:true}).limit(1).maybeSingle();
        if (live) return mapLive(live);
        const { data: next, error } = await supabase.from('live_tests').select(select).eq('status','scheduled').eq('visibility','public').gt('scheduled_start_at',now).order('scheduled_start_at',{ascending:true}).limit(1).maybeSingle();
        if (!error && next) return mapLive(next);
      } catch {
        // Fallback to active live test from local store
      }
    }
    const fallback = await getActiveLiveTest();
    if (!fallback) return null;
    return {
      id: fallback.id,
      title: fallback.title,
      description: fallback.instructions || null,
      testId: fallback.testId,
      examId: fallback.examId,
      testSeriesId: fallback.testSeriesId,
      scheduledStartAt: fallback.scheduledStartTime,
      scheduledEndAt: fallback.scheduledEndTime,
      durationMinutes: fallback.durationMinutes,
      instructions: fallback.instructions || null,
      subscriptionRequired: false,
      rankingEnabled: true,
      status: (fallback.status as any) || 'scheduled',
      resultVisibility: 'immediate',
      test: {
        id: fallback.testId,
        title: fallback.testTitle || fallback.title,
        durationMinutes: fallback.durationMinutes,
        totalQuestions: fallback.totalQuestions,
        totalMarks: fallback.totalMarks,
        passingMarks: Math.floor(fallback.totalMarks * 0.4),
        negativeMarking: fallback.negativeMarking,
        testType: 'full',
        isPremium: false,
        isActive: true,
      } as any,
    };
  },
  async getLiveTestsForAdmin(): Promise<LiveTest[]> {
    const list = await getLiveTests();
    return list.map((lt) => ({
      id: lt.id,
      title: lt.title,
      description: lt.instructions || null,
      testId: lt.testId,
      examId: lt.examId,
      testSeriesId: lt.testSeriesId,
      scheduledStartAt: lt.scheduledStartTime,
      scheduledEndAt: lt.scheduledEndTime,
      durationMinutes: lt.durationMinutes,
      instructions: lt.instructions || null,
      subscriptionRequired: false,
      rankingEnabled: true,
      status: (lt.status as any) || 'scheduled',
      resultVisibility: 'immediate',
    }));
  },
  async joinLiveTest(liveTestId: string, userId: string) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('live_test_participants').upsert({live_test_id:liveTestId,user_id:userId,status:'registered'},{onConflict:'live_test_id,user_id'});
    } catch {
      // safe fallback
    }
  },
  async isRegistered(liveTestId: string, userId: string) {
    if (!isSupabaseConfigured) return false;
    try {
      const { data } = await supabase.from('live_test_participants').select('id').eq('live_test_id',liveTestId).eq('user_id',userId).maybeSingle();
      return Boolean(data);
    } catch {
      return false;
    }
  },
  async getFeaturedTestSeries(): Promise<TestSeries[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('test_series').select('*, exams:exam_id(title)').eq('is_active',true).eq('is_featured',true).order('order_index',{ascending:true}).limit(8);
      if (error) return [];
      return (data || []).map((r:any)=>({id:String(r.id),examId:String(r.exam_id),title:String(r.title),slug:r.slug,description:r.description??undefined,iconUrl:r.icon_url??undefined,isPremium:Boolean(r.is_premium),isActive:Boolean(r.is_active),orderIndex:Number(r.order_index||0),examTitle:r.exams?.title??undefined})) as TestSeries[];
    } catch {
      return [];
    }
  },
  async getAllFlashcardDecksForAdmin(): Promise<FlashcardDeck[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('flashcard_decks').select('*, flashcards(id)').order('order_index', { ascending: true });
      if (error) return [];
      return (data || []).map(mapDeck);
    } catch {
      return [];
    }
  },
  async getFlashcardsForAdmin(deckId: string): Promise<Flashcard[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('flashcards').select('*').eq('deck_id', deckId).order('order_index', { ascending: true });
      if (error) return [];
      return (data || []).map(mapCard);
    } catch {
      return [];
    }
  },
  async createFlashcardDeck(payload: Record<string, unknown>): Promise<FlashcardDeck> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.from('flashcard_decks').insert(payload).select().single();
    if (error) throw error;
    return mapDeck(data);
  },
  async createFlashcard(payload: Record<string, unknown>): Promise<Flashcard> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.from('flashcards').insert(payload).select().single();
    if (error) throw error;
    return mapCard(data);
  },
  async getDecks(filters: {examId?:string;subjectId?:string;chapterId?:string} = {}): Promise<FlashcardDeck[]> {
    if (!isSupabaseConfigured) return [];
    try {
      let q:any=supabase.from('flashcard_decks').select('*, flashcards(id)').eq('status','published').order('order_index',{ascending:true});
      if(filters.examId) q=q.eq('exam_id',filters.examId); if(filters.subjectId) q=q.eq('subject_id',filters.subjectId); if(filters.chapterId) q=q.eq('chapter_id',filters.chapterId);
      const {data,error}=await q;
      if(error) return [];
      return (data||[]).map(mapDeck);
    } catch {
      return [];
    }
  },
  async getDeckCards(deckId:string):Promise<Flashcard[]> {
    if(!isSupabaseConfigured) return [];
    try {
      const {data,error}=await supabase.from('flashcards').select('*').eq('deck_id',deckId).eq('status','published').order('order_index',{ascending:true});
      if(error) return [];
      return (data||[]).map(mapCard);
    } catch {
      return [];
    }
  },
  async getProgress(userId:string, cardIds?:string[]):Promise<FlashcardProgress[]> {
    if(!isSupabaseConfigured) return [];
    try {
      let q:any=supabase.from('flashcard_progress').select('*').eq('user_id',userId);
      if(cardIds?.length) q=q.in('flashcard_id',cardIds);
      const {data,error}=await q;
      if(error) return [];
      return (data||[]).map((r:any)=>({flashcardId:String(r.flashcard_id),status:r.status,reviewCount:Number(r.review_count||0),lastReviewedAt:r.last_reviewed_at,nextReviewAt:r.next_review_at,difficulty:r.difficulty||'medium'}));
    } catch {
      return [];
    }
  },
  async getDueCards(userId:string, limit=20):Promise<Flashcard[]> {
    if(!isSupabaseConfigured) return [];
    try {
      const {data: progress,error}=await supabase.from('flashcard_progress').select('flashcard_id').eq('user_id',userId).lte('next_review_at',new Date().toISOString()).limit(limit);
      if(error) return [];
      const ids=(progress||[]).map((r:any)=>r.flashcard_id);
      if(!ids.length) return [];
      const {data:cards,error:cardError}=await supabase.from('flashcards').select('*').in('id',ids).eq('status','published');
      if(cardError) return [];
      return (cards||[]).map(mapCard);
    } catch {
      return [];
    }
  },
  async reviewCard(userId:string,cardId:string,rating:'again'|'hard'|'good'|'easy'):Promise<FlashcardProgress>{
    if(!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const minutes={again:10,hard:24*60,good:3*24*60,easy:7*24*60}[rating]; const now=new Date(); const next=new Date(now.getTime()+minutes*60000);
    const status=rating==='easy'?'mastered':rating==='good'?'review':'learning'; const difficulty=rating==='again'||rating==='hard'?'hard':rating==='easy'?'easy':'medium';
    const {data:old}=await supabase.from('flashcard_progress').select('review_count').eq('user_id',userId).eq('flashcard_id',cardId).maybeSingle();
    const payload={user_id:userId,flashcard_id:cardId,status,review_count:Number(old?.review_count||0)+1,last_reviewed_at:now.toISOString(),next_review_at:next.toISOString(),difficulty,updated_at:now.toISOString()};
    const {data,error}=await supabase.from('flashcard_progress').upsert(payload,{onConflict:'user_id,flashcard_id'}).select().single(); if(error) throw error;
    await supabase.from('flashcard_reviews').insert({user_id:userId,flashcard_id:cardId,rating,reviewed_at:now.toISOString()});
    return {flashcardId:cardId,status:data.status,reviewCount:Number(data.review_count||0),lastReviewedAt:data.last_reviewed_at,nextReviewAt:data.next_review_at,difficulty:data.difficulty};
  },
};