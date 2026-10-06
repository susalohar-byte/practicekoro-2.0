import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Crown,
  Layers3,
  ListChecks,
  Sparkles,
  ChevronDown,
  Check,
  Calculator,
  Brain,
  Globe,
  Languages,
  Target,
  LayoutGrid,
  Columns,
  FileQuestion,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/services/api';
import { useExam } from '@/context/ExamContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import type { Chapter, MockTest, Subject } from '@/types';

// Subject visual styling resolver
const getSubjectTheme = (subjectName: string) => {
  const lower = subjectName.toLowerCase();
  if (lower.includes('math') || lower.includes('গণিত') || lower.includes('arithmetic')) {
    return {
      icon: Calculator,
      isSigma: true,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60',
      borderColor: 'border-blue-200/80 dark:border-blue-900/60',
      activeRing: 'ring-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    };
  }
  if (
    lower.includes('reason') ||
    lower.includes('রিজনিং') ||
    lower.includes('intelligence') ||
    lower.includes('gi')
  ) {
    return {
      icon: Brain,
      isSigma: false,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/60',
      borderColor: 'border-rose-200/80 dark:border-rose-900/60',
      activeRing: 'ring-rose-500',
      badgeBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    };
  }
  if (lower.includes('english') || lower.includes('ইংরেজি')) {
    return {
      icon: Languages,
      isBadgeA: true,
      isSigma: false,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60',
      borderColor: 'border-purple-200/80 dark:border-purple-900/60',
      activeRing: 'ring-purple-500',
      badgeBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    };
  }
  if (
    lower.includes('awareness') ||
    lower.includes('current') ||
    lower.includes('সাম্প্রতিক')
  ) {
    return {
      icon: Globe,
      isSigma: false,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/60',
      borderColor: 'border-teal-200/80 dark:border-teal-900/60',
      activeRing: 'ring-teal-500',
      badgeBg: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
    };
  }
  if (
    lower.includes('knowledge') ||
    lower.includes('সাধারণ জ্ঞান') ||
    lower.includes('gk') ||
    lower.includes('history') ||
    lower.includes('geography') ||
    lower.includes('polity')
  ) {
    return {
      icon: BookOpen,
      isSigma: false,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
      borderColor: 'border-emerald-200/80 dark:border-emerald-900/60',
      activeRing: 'ring-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    };
  }
  return {
    icon: Layers3,
    isSigma: false,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
    borderColor: 'border-indigo-200/80 dark:border-indigo-900/60',
    activeRing: 'ring-indigo-500',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  };
};

export const TopicTests: React.FC = () => {
  const navigate = useNavigate();
  const { exams, selectedExam, setSelectedExam } = useExam();
  const { hasAccessToTest } = useSubscription();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Chapter[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  // Filtering controls
  const [filterType, setFilterType] = useState<'all' | 'free' | 'pro'>('all');
  const [layoutMode, setLayoutMode] = useState<'split' | 'grid'>('split');
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const examDropdownRef = useRef<HTMLDivElement>(null);

  // Close exam dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (examDropdownRef.current && !examDropdownRef.current.contains(e.target as Node)) {
        setIsExamDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 1. Load subjects when active exam changes
  useEffect(() => {
    let active = true;

    const loadSubjects = async () => {
      if (!selectedExam) {
        setSubjects([]);
        setSelectedSubjectId('');
        return;
      }

      setLoadingSubjects(true);
      setSelectedSubjectId('');
      setSelectedTopicId('');
      setTopics([]);
      setTests([]);

      try {
        const result = await api.getSubjects(selectedExam.id);
        if (!active) return;
        setSubjects(result);
        if (result.length > 0) {
          setSelectedSubjectId(result[0].id);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        if (active) setLoadingSubjects(false);
      }
    };

    loadSubjects();
    return () => {
      active = false;
    };
  }, [selectedExam]);

  // 2. Load topics when active subject changes
  useEffect(() => {
    let active = true;

    const loadTopics = async () => {
      if (!selectedSubjectId) {
        setTopics([]);
        setSelectedTopicId('');
        return;
      }

      setLoadingTopics(true);
      setSelectedTopicId('');
      setTests([]);

      try {
        const result = await api.getChapters(selectedSubjectId);
        if (!active) return;
        setTopics(result);
        if (result.length > 0) {
          setSelectedTopicId(result[0].id);
        }
      } catch (err) {
        console.error('Failed to load topics:', err);
      } finally {
        if (active) setLoadingTopics(false);
      }
    };

    loadTopics();
    return () => {
      active = false;
    };
  }, [selectedSubjectId]);

  // 3. Load tests when active topic changes
  useEffect(() => {
    let active = true;

    const loadTests = async () => {
      if (!selectedTopicId || !selectedExam) {
        setTests([]);
        return;
      }

      setLoadingTests(true);
      try {
        const result = await api.getTests(selectedTopicId, selectedExam.id);
        if (active) setTests(result);
      } catch (err) {
        console.error('Failed to load tests:', err);
      } finally {
        if (active) setLoadingTests(false);
      }
    };

    loadTests();
    return () => {
      active = false;
    };
  }, [selectedTopicId, selectedExam]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );

  const selectedTopic = useMemo(
    () => topics.find((t) => t.id === selectedTopicId),
    [topics, selectedTopicId]
  );

  // Topics list (search lives on Home — no text filter here)
  const filteredTopics = useMemo(() => topics, [topics]);

  // Filter tests by filterType (all/free/pro)
  const filteredTests = useMemo(() => {
    let list = tests;
    if (filterType === 'free') {
      list = list.filter((t) => !t.isPremium);
    } else if (filterType === 'pro') {
      list = list.filter((t) => t.isPremium);
    }
    return list;
  }, [tests, filterType]);

  const freeTestsCount = useMemo(() => tests.filter((t) => !t.isPremium).length, [tests]);
  const proTestsCount = useMemo(() => tests.filter((t) => t.isPremium).length, [tests]);

  return (
    <div className="space-y-6 pk-student-page pb-12">
      {/* =========================================================================
          HERO BANNER: TOPIC-WISE PRACTICE HEADER (Matches Brand Standard)
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EBF5FE] via-[#E2EEFD] to-[#D5E8FD] dark:from-slate-800/95 dark:via-slate-800/80 dark:to-slate-900/90 border border-blue-100/90 dark:border-blue-900/40 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0158FC] text-white text-[11px] font-black tracking-wide uppercase shadow-2xs">
                <Layers3 className="w-3.5 h-3.5" />
                <span>Chapter & Topic Mocks</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-700/90 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-200/60 dark:border-blue-800/50">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                Syllabus-Aligned
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Topic-wise Practice Tests
              <span className="text-[#0158FC] block sm:inline sm:ml-2 text-base sm:text-2xl font-bold">
                (টপিক ভিত্তিক মক টেস্ট)
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Master individual chapters with targeted syllabus tests. Measure your accuracy, time
              management, and concept clarity topic by topic.
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-2.5 pt-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <BookOpen className="w-3.5 h-3.5 text-[#0158FC]" />
                <span>{subjects.length} Subjects</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <Layers3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{topics.length > 0 ? `${topics.length} Topics` : 'All Topics'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <ListChecks className="w-3.5 h-3.5 text-amber-500" />
                <span>{tests.length} Active Tests</span>
              </div>
            </div>
          </div>

          {/* Target Exam Switcher Dropdown */}
          <div ref={examDropdownRef} className="relative shrink-0 self-start md:self-center">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Selected Target Exam
            </div>
            <button
              type="button"
              onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-[#0158FC]/40 hover:border-[#0158FC] text-slate-900 dark:text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              <span className="w-6 h-6 rounded-lg bg-[#0158FC] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                {selectedExam?.title ? selectedExam.title.slice(0, 2).toUpperCase() : 'WB'}
              </span>
              <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {selectedExam?.title || 'Select Exam'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${isExamDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isExamDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Exam Syllabus
                </div>
                {exams.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setSelectedExam(ex);
                      setIsExamDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors ${
                      selectedExam?.id === ex.id
                        ? 'font-bold text-[#0158FC] bg-blue-50/50 dark:bg-blue-950/40'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">{ex.title}</span>
                    {selectedExam?.id === ex.id && (
                      <Check className="w-3.5 h-3.5 text-[#0158FC] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUBJECT SELECTOR TABS (Step 1)
          ========================================================================= */}
      <section className="space-y-3" aria-labelledby="subject-tabs-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0158FC] text-[11px] font-black text-white">
              1
            </span>
            <h2 id="subject-tabs-heading" className="text-sm font-black text-slate-900 dark:text-white">
              Choose Subject (বিষয় নির্বাচন করুন)
            </h2>
          </div>
          {selectedSubject && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Active: <strong className="text-slate-800 dark:text-slate-200">{selectedSubject.name}</strong>
            </span>
          )}
        </div>

        {loadingSubjects ? (
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 w-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0"
              />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No subjects available"
            description="No active subjects are configured for the selected exam yet."
          />
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide pt-0.5">
            {subjects.map((subject) => {
              const selected = subject.id === selectedSubjectId;
              const theme = getSubjectTheme(subject.name);
              const Icon = theme.icon;

              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(subject.id)}
                  aria-pressed={selected}
                  className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#0158FC] focus:ring-offset-2 ${
                    selected
                      ? 'border-[#0158FC] bg-[#0158FC] text-white shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-2xs'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      selected
                        ? 'bg-white/20 text-white'
                        : `${theme.bgColor} ${theme.color} border ${theme.borderColor}`
                    }`}
                  >
                    {theme.isSigma ? (
                      <span className="font-serif font-black text-sm leading-none">Σ</span>
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-bold leading-tight">
                      {subject.name}
                    </span>
                    {subject.chaptersCount !== undefined && (
                      <span
                        className={`text-[10px] block mt-0.5 ${
                          selected ? 'text-blue-100 font-medium' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {subject.chaptersCount} Topics
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          CONTROLS BAR: FILTERS & VIEW MODE
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Tests
            </button>
            <button
              type="button"
              onClick={() => setFilterType('free')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'free'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setFilterType('pro')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'pro'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pro
            </button>
          </div>

          {/* View mode toggle */}
          <div className="hidden sm:inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              title="Split Master-Detail View"
              className={`p-1.5 rounded-lg transition-all ${
                layoutMode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-[#0158FC] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-lg transition-all ${
                layoutMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#0158FC] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: SPLIT MASTER-DETAIL EXPLORER (Default / Recommended)
          ========================================================================= */}
      {layoutMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* -------------------------------------------------------------------
              LEFT COLUMN: TOPIC EXPLORER (4 cols on lg)
              ------------------------------------------------------------------- */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0158FC] text-[11px] font-black text-white">
                  2
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Select Topic ({filteredTopics.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {selectedSubject?.name}
              </span>
            </div>

            {loadingTopics ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <FileQuestion className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No matching topics found
                </p>
                <p className="text-[11px] text-slate-400">
                  Try adjusting your search query or pick another subject.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {filteredTopics.map((topic, index) => {
                  const isSelected = topic.id === selectedTopicId;
                  const theme = getSubjectTheme(selectedSubject?.name || '');

                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group focus:outline-none focus:ring-2 focus:ring-[#0158FC] ${
                        isSelected
                          ? 'border-[#0158FC] bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs ring-1 ring-[#0158FC]'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
                            isSelected
                              ? 'bg-[#0158FC] text-white shadow-xs'
                              : `${theme.bgColor} ${theme.color} border ${theme.borderColor}`
                          }`}
                        >
                          {topic.iconName &&
                          (topic.iconName.startsWith('http') ||
                            topic.iconName.startsWith('data:') ||
                            topic.iconName.startsWith('/') ||
                            topic.iconName.startsWith('blob:')) ? (
                            <img
                              src={topic.iconName}
                              alt={topic.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-[11px] font-black">{index + 1}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className={`text-xs sm:text-[13px] font-bold leading-snug truncate ${
                              isSelected
                                ? 'text-blue-950 dark:text-blue-200'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {topic.name}
                          </h4>
                          {topic.description ? (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {topic.description}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              Chapter {index + 1}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {topic.testsCount !== undefined && topic.testsCount > 0 && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {topic.testsCount} Tests
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected
                              ? 'text-[#0158FC] translate-x-0.5'
                              : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------------
              RIGHT COLUMN: ACTIVE TOPIC TESTS (8 cols on lg)
              ------------------------------------------------------------------- */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header for Active Topic */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0158FC] text-[11px] font-black text-white">
                    3
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Available Topic Tests
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                  {selectedTopic ? selectedTopic.name : 'Select a Topic'}
                </h3>
                {selectedTopic?.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedTopic.description}
                  </p>
                )}
              </div>

              {/* Counts Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                  {filteredTests.length} Tests Found
                </span>
                {freeTestsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/60 dark:border-emerald-900/60">
                    {freeTestsCount} Free
                  </span>
                )}
                {proTestsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/60 dark:border-amber-900/60 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {proTestsCount} Pro
                  </span>
                )}
              </div>
            </div>

            {/* Test Cards Grid */}
            {loadingTests ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0158FC] flex items-center justify-center mx-auto">
                  <ListChecks className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No tests available for this topic yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Our academic educators are uploading and validating new questions for{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {selectedTopic?.name}
                  </strong>
                  . Please check back shortly or explore another topic!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredTests.map((test) => {
                  const hasAccess = hasAccessToTest(test.isPremium);
                  const isLocked = test.isPremium && !hasAccess;

                  return (
                    <div
                      key={test.id}
                      className={`group bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md ${
                        isLocked
                          ? 'border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                      }`}
                    >
                      <div>
                        {/* Badges row */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                test.isPremium
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/60'
                              }`}
                            >
                              {test.isPremium ? (
                                <span className="flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                  PRO TEST
                                </span>
                              ) : (
                                'FREE TEST'
                              )}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              Topic Test
                            </span>
                          </div>

                          {test.isPremium && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              Pro Pass
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#0158FC] dark:group-hover:text-blue-400 transition-colors">
                          {test.title}
                        </h4>

                        {test.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {test.description}
                          </p>
                        )}
                      </div>

                      {/* Metadata Row */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                            {test.totalQuestions} Qs
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                            {test.durationMinutes}m
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-slate-400" />
                            {test.totalMarks} M
                          </span>
                        </div>

                        {/* Action Button */}
                        {isLocked ? (
                          <Button
                            size="sm"
                            variant="pro"
                            onClick={() => navigate('/subscription')}
                            className="font-bold text-xs gap-1 shadow-2xs"
                            leftIcon={<Crown className="w-3 h-3 text-white fill-white" />}
                          >
                            Unlock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/exams/${test.id}`)}
                            className="font-bold text-xs gap-1 shadow-2xs bg-[#0158FC] hover:bg-blue-700 text-white"
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            Start Test
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: CARD GRID VIEW (Alternative)
          ========================================================================= */}
      {layoutMode === 'grid' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic, index) => {
              const theme = getSubjectTheme(selectedSubject?.name || '');
              const isSelected = topic.id === selectedTopicId;

              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#0158FC] bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-[#0158FC]'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${theme.bgColor} ${theme.color} border ${theme.borderColor}`}
                      >
                        {topic.iconName &&
                        (topic.iconName.startsWith('http') ||
                          topic.iconName.startsWith('data:') ||
                          topic.iconName.startsWith('/') ||
                          topic.iconName.startsWith('blob:')) ? (
                          <img
                            src={topic.iconName}
                            alt={topic.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs font-black">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        Topic {index + 1}
                      </span>
                    </div>

                    <h4 className="mt-3 text-sm font-bold leading-5 text-slate-900 dark:text-white">
                      {topic.name}
                    </h4>

                    {topic.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0158FC] dark:text-blue-400">
                      {topic.testsCount !== undefined ? `${topic.testsCount} tests` : 'View Tests'}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 font-bold text-[11px]">
                      Select Topic <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test list under selected topic in grid view */}
          {selectedTopic && (
            <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Tests for {selectedTopic.name}
                  </h3>
                  <p className="text-xs text-slate-500">Pick any test to start immediately</p>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {filteredTests.length} Tests
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredTests.map((test) => {
                  const hasAccess = hasAccessToTest(test.isPremium);
                  const isLocked = test.isPremium && !hasAccess;

                  return (
                    <div
                      key={test.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              test.isPremium
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {test.isPremium ? 'PRO' : 'FREE'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {test.totalQuestions} Qs • {test.durationMinutes}m
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {test.title}
                        </h4>
                      </div>

                      {isLocked ? (
                        <Button
                          size="sm"
                          variant="pro"
                          onClick={() => navigate('/subscription')}
                          className="font-bold text-xs shrink-0"
                        >
                          Unlock
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/exams/${test.id}`)}
                          className="font-bold text-xs shrink-0 bg-[#0158FC] text-white"
                        >
                          Start Test
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
