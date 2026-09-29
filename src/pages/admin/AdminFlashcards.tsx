import React, { useEffect, useState } from 'react';
import { Layers3, Plus, Save } from 'lucide-react';
import { api, type Flashcard, type FlashcardDeck } from '@/services/api';

export const AdminFlashcards: React.FC = () => {
  const [decks,setDecks]=useState<FlashcardDeck[]>([]);
  const [selected,setSelected]=useState<FlashcardDeck|null>(null);
  const [cards,setCards]=useState<Flashcard[]>([]);
  const [deckOpen,setDeckOpen]=useState(false); const [cardOpen,setCardOpen]=useState(false); const [saving,setSaving]=useState(false);
  const [deck,setDeck]=useState({title:'',description:'',status:'published'});
  const [card,setCard]=useState({front:'',back:'',explanation:'',source:'',difficulty:'medium',status:'published',type:'question_answer'});
  const load=async()=>setDecks(await api.getAllFlashcardDecksForAdmin());
  useEffect(()=>{load().catch(console.error)},[]);
  const openDeck=async(d:FlashcardDeck)=>{setSelected(d);setCards(await api.getFlashcardsForAdmin(d.id));};
  const createDeck=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);try{await api.createFlashcardDeck(deck);setDeckOpen(false);setDeck({title:'',description:'',status:'published'});await load()}finally{setSaving(false)}};
  const createCard=async(e:React.FormEvent)=>{e.preventDefault();if(!selected)return;setSaving(true);try{await api.createFlashcard({deck_id:selected.id,front_content:card.front,back_content:card.back,explanation:card.explanation||null,source:card.source||null,difficulty:card.difficulty,status:card.status,card_type:card.type,order_index:cards.length});setCardOpen(false);setCard({front:'',back:'',explanation:'',source:'',difficulty:'medium',status:'published',type:'question_answer'});await openDeck(selected)}finally{setSaving(false)}};
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">Flashcards / Quick Revision</h1><p className="text-sm text-slate-500">Manage decks and the complete revision card content.</p></div><button onClick={()=>setDeckOpen(true)} className="rounded-xl bg-[#0158FC] px-4 py-2 text-sm font-bold text-white"><Plus className="mr-2 inline h-4 w-4"/>New Deck</button></div>
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3">{decks.map(d=><button key={d.id} onClick={()=>openDeck(d)} className={`w-full rounded-2xl border bg-white p-4 text-left ${selected?.id===d.id?'border-[#0158FC] ring-2 ring-blue-100':'border-slate-200'}`}><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF5FB] text-[#0158FC]"><Layers3 className="h-5 w-5"/></div><div className="min-w-0"><div className="font-black truncate">{d.title}</div><div className="text-xs text-slate-500">{d.status} · {d.cardCount||0} cards</div></div></div></button>)}</div>
      <div className="lg:col-span-2 rounded-2xl border bg-white p-5">
        {!selected?<div className="py-16 text-center text-slate-400">Select a deck to manage its cards.</div>:<>
          <div className="flex items-center justify-between"><div><h2 className="font-black">{selected.title}</h2><p className="text-xs text-slate-500">{cards.length} cards</p></div><button onClick={()=>setCardOpen(true)} className="rounded-xl bg-[#0158FC] px-3 py-2 text-xs font-bold text-white"><Plus className="mr-1 inline h-4 w-4"/>Add Card</button></div>
          <div className="mt-4 space-y-2">{cards.map((c,i)=><div key={c.id} className="rounded-xl border p-3"><div className="text-[10px] font-bold uppercase text-slate-400">Card {i+1} · {c.difficulty}</div><div className="mt-1 text-sm font-bold">{c.front}</div><div className="mt-1 text-xs text-slate-500">{c.back}</div></div>)}</div>
        </>}
      </div>
    </div>
    {deckOpen&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={createDeck} className="w-full max-w-lg rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Create Deck</h2><input required className="mt-4 w-full rounded-xl border p-3" placeholder="Deck title" value={deck.title} onChange={e=>setDeck({...deck,title:e.target.value})}/><textarea className="mt-3 w-full rounded-xl border p-3" placeholder="Description" value={deck.description} onChange={e=>setDeck({...deck,description:e.target.value})}/><div className="mt-4 flex gap-2"><button type="button" onClick={()=>setDeckOpen(false)} className="flex-1 rounded-xl border p-3">Cancel</button><button disabled={saving} className="flex-1 rounded-xl bg-[#0158FC] p-3 font-bold text-white">{saving?'Saving...':'Create'}</button></div></form></div>}
    {cardOpen&&selected&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={createCard} className="w-full max-w-xl rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Add Flashcard</h2><textarea required className="mt-4 min-h-24 w-full rounded-xl border p-3" placeholder="Front / Question / Prompt" value={card.front} onChange={e=>setCard({...card,front:e.target.value})}/><textarea required className="mt-3 min-h-24 w-full rounded-xl border p-3" placeholder="Back / Answer" value={card.back} onChange={e=>setCard({...card,back:e.target.value})}/><textarea className="mt-3 min-h-20 w-full rounded-xl border p-3" placeholder="Explanation (optional)" value={card.explanation} onChange={e=>setCard({...card,explanation:e.target.value})}/><input className="mt-3 w-full rounded-xl border p-3" placeholder="Source (optional)" value={card.source} onChange={e=>setCard({...card,source:e.target.value})}/><select className="mt-3 w-full rounded-xl border p-3" value={card.difficulty} onChange={e=>setCard({...card,difficulty:e.target.value})}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><div className="mt-4 flex gap-2"><button type="button" onClick={()=>setCardOpen(false)} className="flex-1 rounded-xl border p-3">Cancel</button><button disabled={saving} className="flex-1 rounded-xl bg-[#0158FC] p-3 font-bold text-white"><Save className="mr-1 inline h-4 w-4"/>{saving?'Saving...':'Save Card'}</button></div></form></div>}
  </div>;
};
