import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Layers,
  Search,
  ArrowRight,
  Award,
  BookOpen,
  Shield,
  Zap,
  TrendingUp,
  FileText,
} from 'lucide-react';
import type { TestSeries } from '@/types';

// Category filter tabs
const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'police', label: 'WBP', icon: Shield },
  { id: 'kp', label: 'KP', icon: Award },
  { id: 'ssc', label: 'SSC', icon: Zap },
  { id: 'railways', label: 'Railway', icon: TrendingUp },
  { id: 'other', label: 'Other', icon: BookOpen },
];

type AccessFilter = 'all' | 'free' | 'pro';

// Emblem mapping based on exam title or category
function getSeriesEmblem(series: TestSeries): { emblem: string; bgColor: string } {
  if (series.iconUrl) {
    return {
      emblem: series.iconUrl,
      bgColor: 'bg-[#FFF4F0] dark:bg-slate-800/80 border-[#FDE2D7] dark:border-slate-700/60',
    };
  }

  const title = (series.title || '').toLowerCase();
  const exam = (series.examTitle || '').toLowerCase();
  const combined = `${title} ${exam}`;

  if (combined.includes('wbp') || combined.includes('constable') || combined.includes('police')) {
    if (combined.includes('kolkata') || combined.includes('kp')) {
      return { emblem: '/images/exams/icon_kolkata_police.png', bgColor: 'bg-[#EFF6FF] dark:bg-blue-950/40 border-[#DBEAFE] dark:border-blue-900/60' };
    }
    return { emblem: '/images/exams/emblem_wbp.png', bgColor: 'bg-[#FFF4F0] dark:bg-slate-800/80 border-[#FDE2D7] dark:border-slate-700/60' };
  }
  if (combined.includes('wbcs')) {
    return { emblem: '/images/exams/wbcs_emblem.png', bgColor: 'bg-[#EEF2FF] dark:bg-indigo-950/40 border-[#E0E7FF] dark:border-indigo-900/60' };
  }
  if (combined.includes('clerk') || combined.includes('wbpsc') || combined.includes('misc')) {
    return { emblem: '/images/exams/emblem_wbpsc.png', bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/40 border-[#FEF3C7] dark:border-amber-900/60' };
  }
  if (combined.includes('slst') || combined.includes('wbssc') || combined.includes('group d')) {
    return { emblem: '/images/exams/emblem_wbssc.png', bgColor: 'bg-[#ECFDF5] dark:bg-emerald-950/40 border-[#D1FAE5] dark:border-emerald-900/60' };
  }
  if (combined.includes('tet') || combined.includes('teach')) {
    return { emblem: '/images/exams/emblem_tet.png', bgColor: 'bg-[#FAF5FF] dark:bg-purple-950/40 border-[#F3E8FF] dark:border-purple-900/60' };
  }
  if (combined.includes('rail') || combined.includes('ntpc') || combined.includes('rrb')) {
    return { emblem: '/images/exams/emblem_railway.png', bgColor: 'bg-[#F0F9FF] dark:bg-sky-950/40 border-[#E0F2FE] dark:border-sky-900/60' };
  }
  if (combined.includes('ssc') || combined.includes('cgl') || combined.includes('gd') || combined.includes('mts')) {
    return { emblem: '/images/exams/emblem_ssc.png', bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/40 border-[#FEF3C7] dark:border-amber-900/60' };
  }

  return { emblem: '/images/exams/emblem_wbp.png', bgColor: 'bg-[#FFF4F0] dark:bg-slate-800/80 border-[#FDE2D7] dark:border-slate-700/60' };
}

export const TestSeriesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');

  useEffect(() => {
    let mounted = true;
    async function loadTestSeries() {
      try {
        setLoading(true);
        const data = await api.getStudentTestSeries();
        if (mounted) {
          setSeriesList(data);
        }
      } catch (err) {
        console.error('Failed to load test series:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadTestSeries();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter series based on search, category tab, and access level
  const filteredSeries = useMemo(() => {
    return seriesList.filter((series) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = series.title.toLowerCase().includes(query);
        const matchesExam = (series.examTitle || '').toLowerCase().includes(query);
        const matchesDesc = (series.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesExam && !matchesDesc) return false;
      }

      // Access filter (Free vs Pro Pass)
      if (accessFilter === 'free' && series.isPremium) return false;
      if (accessFilter === 'pro' && !series.isPremium) return false;

      // Category filter
      if (activeCategory !== 'all') {
        const title = (series.title || '').toLowerCase();
        const exam = (series.examTitle || '').toLowerCase();
        const cat = (series.examCategory || '').toLowerCase();
        const combined = `${title} ${exam} ${cat}`;

        if ((activeCategory === 'police' || activeCategory === 'kp') && !(combined.includes('police') || combined.includes('wbp') || combined.includes('kp') || combined.includes('constable') || combined.includes('si'))) {
          return false;
        }
        if (activeCategory === 'ssc' && !(combined.includes('ssc') || combined.includes('cgl') || combined.includes('gd') || combined.includes('mts') || combined.includes('chsl') || combined.includes('central'))) {
          return false;
        }
        if (activeCategory === 'railways' && !(combined.includes('rail') || combined.includes('ntpc') || combined.includes('rrb') || combined.includes('group d') || combined.includes('alp'))) {
          return false;
        }
        if (activeCategory === 'other' && (combined.includes('police') || combined.includes('wbp') || combined.includes('kp') || combined.includes('constable') || combined.includes('si') || combined.includes('ssc') || combined.includes('cgl') || combined.includes('gd') || combined.includes('mts') || combined.includes('chsl') || combined.includes('central') || combined.includes('rail') || combined.includes('ntpc') || combined.includes('rrb') || combined.includes('group d') || combined.includes('alp'))) return false;
      }

      return true;
    });
  }, [seriesList, searchTerm, activeCategory, accessFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F44] pb-24 font-sans">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3"><button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="rounded-full p-2 hover:bg-blue-50"><ArrowRight className="h-5 w-5 rotate-180" /></button><h1 className="text-2xl font-extrabold tracking-tight">Test Series</h1></div>
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search test series" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search" className="w-36 rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-52" /></label>
        </header>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" aria-label="Filter by exam category">{CATEGORY_TABS.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveCategory(tab.id)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeCategory === tab.id ? 'bg-[#0158FC] text-white shadow-md shadow-blue-500/20' : 'bg-white text-slate-700 shadow-sm hover:bg-blue-50'}`}>{tab.label}</button>)}</div>
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#063585] via-[#073a86] to-[#061b48] p-6 text-white shadow-lg shadow-blue-900/15 sm:p-8"><div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" /><div className="relative max-w-xl"><span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-[#0B1F44]">Complete Preparation</span><h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">All Test Series<br /><span className="text-amber-300">in One Subscription</span></h2><p className="mt-3 text-sm leading-relaxed text-blue-100">Full Mock Tests · Chapter-wise Tests · Previous Year Questions · Live Tests · Detailed Solutions</p><button type="button" onClick={() => document.getElementById('popular-series')?.scrollIntoView({ behavior: 'smooth' })} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#063585] shadow hover:bg-blue-50">Start Testing <ArrowRight className="h-4 w-4" /></button></div><div className="pointer-events-none absolute bottom-4 right-5 hidden text-7xl opacity-15 sm:block">✦</div></section>
        <section className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Test type shortcuts">{[{ label: 'Full Mock Tests', icon: FileText, color: 'text-emerald-500', filter: 'full_mock' }, { label: 'Chapter-wise Tests', icon: BookOpen, color: 'text-sky-500', filter: 'topic' }, { label: 'Previous Year Questions', icon: Award, color: 'text-violet-500', filter: 'pyq' }, { label: 'Live Tests', icon: Zap, color: 'text-rose-500', filter: 'live' }].map(({ label, icon: Icon, color, filter }) => <button key={label} type="button" onClick={() => navigate(filter === 'live' ? '/live-test' : `/practice?type=${filter}`)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white px-2 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 ${color}`}><Icon className="h-5 w-5" /></span><span className="text-[11px] font-semibold leading-tight sm:text-xs">{label}</span></button>)}</section>
        <section id="popular-series" className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">🔥 Popular Test Series</h2><button type="button" onClick={() => { setActiveCategory('all'); setAccessFilter('all'); }} className="inline-flex items-center gap-1 text-sm font-bold text-[#0158FC]">See All <ArrowRight className="h-4 w-4" /></button></div>
          {loading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-white shadow-sm" />)}</div> : filteredSeries.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><Layers className="mx-auto h-8 w-8 text-blue-500" /><p className="mt-2 font-bold">No Test Series Found</p><p className="mt-1 text-sm text-slate-500">Try another category or search term.</p></div> : <div className="space-y-3">{filteredSeries.map((series) => { const { emblem, bgColor } = getSeriesEmblem(series); const totalTests = series.testsCount ?? series.testCount ?? 0; return <article key={series.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex gap-4"><div className={`h-[76px] w-[76px] shrink-0 rounded-2xl border p-2 ${bgColor}`}><img src={emblem} alt="" className="h-full w-full object-contain" onError={(event) => { (event.target as HTMLImageElement).src = '/logo-icon.png'; }} /></div><div className="min-w-0 flex-1"><h3 className="font-extrabold leading-snug">{series.title}</h3><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-[#063585]">{totalTests} Tests</span>{series.examTitle && <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-[#063585]">{series.examTitle}</span>}</div><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{series.description || 'Full Mock, Chapter-wise, PYQ and Live Tests with detailed solutions.'}</p></div></div><div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3"><button type="button" onClick={() => navigate(`/test-series/${series.slug || series.id}`)} className="inline-flex items-center gap-2 rounded-xl bg-[#0158FC] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">View Series <ArrowRight className="h-4 w-4" /></button></div></article>; })}</div>}
        </section>
      </div>
    </div>
  );
};
