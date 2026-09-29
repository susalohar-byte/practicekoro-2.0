import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LiveTest, TestSeries } from '@/types';
import {
  getActiveLiveTest,
  getLiveTests,
  registerForLiveTest,
  isLiveTestRegistered,
} from './admin.liveTests';

export type { LiveTest, LiveTestStatus } from '@/types';

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