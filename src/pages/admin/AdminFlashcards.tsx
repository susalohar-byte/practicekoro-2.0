import React, { useEffect, useState } from 'react';
import { Plus, Layers3 } from 'lucide-react';
import { api, type FlashcardDeck } from '@/services/api';

export const AdminFlashcards: React.FC = () => {
  const [decks,setDecks]=useState<FlashcardDeck[]>([]); const [open,setOpen]=useState(false); const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({title:'',description:'',status:'published'});
  const load=()=>api.getDecks().then(setDecks).catch(console.error);
  useEffect(()=>{load()},[]);
  const create=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);try{await (api as any).createFlashcardDeck(form);setOpen(false);setForm({title:'',description:'',status:'published'});await load()}finally{setSaving(false)}};
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-black">Flashcards</h1><p className="text-sm text-slate-500">Create and publish Quick Revision decks for students.</p></div><button onClick={()=>setOpen(true)} className="rounded-xl bg-[#0158FC] px-4 py-2 text-sm font-bold text-white"><Plus className="mr-2 inline h-4 w-4"/>New Deck</button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{decks.map(d=><div key={d.id} className="rounded-2xl border bg-white p-5"><Layers3 className="h-6 w-6 text-[#0158FC]"/><h3 className="mt-3 font-black">{d.title}</h3><p className="mt-1 text-xs text-slate-500">{d.description||'Quick revision deck'} · {d.cardCount||0} cards</p></div>)}</div>{open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={create} className="w-full max-w-lg rounded-3xl bg-white p-6"><h2 className="text-xl font-black">New Flashcard Deck</h2><input required placeholder="Deck title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-4 w-full rounded-xl border p-3"/><textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-3 w-full rounded-xl border p-3"/><div className="mt-4 flex gap-2"><button type="button" onClick={()=>setOpen(false)} className="flex-1 rounded-xl border p-3">Cancel</button><button disabled={saving} className="flex-1 rounded-xl bg-[#0158FC] p-3 font-bold text-white">{saving?'Saving...':'Create'}</button></div></form></div>}</div>;
};
