import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Layers3, RotateCcw, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api, type Flashcard, type FlashcardDeck } from '@/services/api';

type Rating = 'again'|'hard'|'good'|'easy';

export const Flashcards: React.FC = () => {
  const { user } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selected, setSelected] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionMode, setSessionMode] = useState<5|10|20|null>(null);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      const [d, due] = await Promise.all([api.getDecks(), api.getDueCards(user.id, 20)]);
      setDecks(d); setDueCount(due.length);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [user?.id]);

  const current = cards[index];
  const sessionCards = useMemo(() => sessionMode ? cards.slice(0, sessionMode) : cards, [cards, sessionMode]);

  const openDue = async (mode: 5|10|20) => {
    if (!user?.id) return;
    setLoading(true); setSelected({id:'due',title:"Today's Revision",status:'published',orderIndex:0} as FlashcardDeck); setIndex(0); setFlipped(false); setSessionMode(mode);
    try { setCards((await api.getDueCards(user.id, mode)).slice(0, mode)); } finally { setLoading(false); }
  };

  const openDeck = async (deck: FlashcardDeck, mode?: 5|10|20) => {
    setLoading(true); setSelected(deck); setIndex(0); setFlipped(false); setReviewed(0); setSessionMode(mode || null);
    try { setCards(await api.getDeckCards(deck.id)); } finally { setLoading(false); }
  };

  const rate = async (rating: Rating) => {
    if (!current || !user?.id) return;
    await api.reviewCard(user.id, current.id, rating);
    setFlipped(false);
    if (index + 1 < sessionCards.length) setIndex(v => v + 1);
    else setSelected(null);
  };

  if (selected && !loading && current) return (
    <div className="pk-student-page">
      <div className="pk-content max-w-3xl">
        <button onClick={() => setSelected(null)} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#0158FC]"><ArrowLeft className="h-4 w-4"/> Quick Revision</button>
        <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{selected.title}</span><span>{index + 1} / {sessionCards.length}</span>
        </div>
        <div onClick={() => setFlipped(v=>!v)} className="min-h-[380px] cursor-pointer rounded-3xl border border-[#D9E7FD] bg-white p-8 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="mb-5 rounded-full bg-[#EFF5FB] px-3 py-1 text-[10px] font-black uppercase text-[#0158FC]">{flipped ? 'Answer' : 'Quick Revision'}</span>
          <div className="max-w-2xl text-xl font-black leading-relaxed text-[#0B1F44]">{flipped ? current.back : current.front}</div>
          {flipped && current.explanation && <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-500">{current.explanation}</p>}
          {!flipped && <p className="mt-5 text-xs font-semibold text-slate-400">Tap the card to show answer</p>}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {([
            ['again','Again',X,'bg-rose-50 text-rose-600'],
            ['hard','Hard',RotateCcw,'bg-amber-50 text-amber-600'],
            ['good','Good',Check,'bg-emerald-50 text-emerald-600'],
            ['easy','Easy',Sparkles,'bg-blue-50 text-[#0158FC]'],
          ] as const).map(([key,label,Icon,cls]) => (
            <button key={key} onClick={() => rate(key)} disabled={!flipped} className={`rounded-2xl p-3 text-xs font-black ${cls} disabled:opacity-40`}>
              <Icon className="mx-auto mb-1 h-5 w-5"/>{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pk-student-page">
      <div className="pk-content space-y-5">
        <div><p className="text-xs font-semibold text-slate-400">Practice / Quick Revision</p><h1 className="mt-1 text-2xl font-black text-[#0B1F44]">Quick Revision</h1><p className="mt-1 text-sm text-slate-500">Revise smart. Remember more.</p></div>
        <div className="grid max-w-2xl gap-3 sm:grid-cols-4">
          <button disabled={!dueCount} onClick={()=>openDue(10)} className="pk-panel p-4 text-left hover:border-[#0158FC] disabled:opacity-50"><div className="text-xl font-black text-[#0158FC]">{dueCount}</div><div className="text-xs font-bold text-[#0B1F44]">Today's Revision</div><div className="text-[10px] text-slate-400">cards due</div></button>
          {[5,10,20].map(n=><button key={n} disabled={!decks.length} onClick={()=>openDeck(decks[0], n as 5|10|20)} className="pk-panel p-4 text-left hover:border-[#0158FC] disabled:opacity-50"><div className="text-xl font-black text-[#0158FC]">{n}</div><div className="text-xs font-bold text-[#0B1F44]">Quick {n}</div><div className="text-[10px] text-slate-400">cards</div></button>)}
        </div>
        {loading ? <div className="pk-panel p-8">Loading decks...</div> : decks.length === 0 ? <div className="pk-panel p-8 text-center"><Layers3 className="mx-auto h-9 w-9 text-slate-300"/><h2 className="mt-2 font-black text-[#0B1F44]">No revision decks yet</h2><p className="text-sm text-slate-500">Published flashcard decks from Admin will appear here.</p></div> :
          <div><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black text-[#0B1F44]">Your Decks</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map(deck=><button key={deck.id} onClick={()=>openDeck(deck)} className="pk-panel p-5 text-left hover:-translate-y-0.5 hover:border-[#0158FC] transition">
              <div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFF5FB] text-[#0158FC]"><Layers3 className="h-5 w-5"/></div><span className="text-xs font-bold text-slate-400">{deck.cardCount || 0} cards</span></div>
              <h3 className="mt-4 font-black text-[#0B1F44]">{deck.title}</h3><p className="mt-1 text-xs text-slate-500">{deck.description || 'Quick revision deck'}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[#0158FC]">Start Revision <ArrowRight className="h-3 w-3"/></div>
            </button>)}
          </div></div>}
      </div>
    </div>
  );
};
