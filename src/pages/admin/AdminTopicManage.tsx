import { withAdminSkeleton, AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  BookOpen,
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Eye,
  RotateCcw,
  Download,
  CheckCircle2,
} from 'lucide-react';
import type { Subject, Chapter, Question } from '@/types';
import { getErrorMessage } from '@/lib/errors';

/* ─── Color palette for subject badges ────────────────────── */
const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {};
const PALETTE = [
  {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
  {
    bg: 'bg-violet-50 dark:bg-violet-950/50',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
  },
  {
    bg: 'bg-cyan-50 dark:bg-cyan-950/50',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    bg: 'bg-pink-50 dark:bg-pink-950/50',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
];

function getBadgeColor(subjectId: string, index: number) {
  if (!BADGE_COLORS[subjectId]) {
    BADGE_COLORS[subjectId] = PALETTE[index % PALETTE.length];
  }
  return BADGE_COLORS[subjectId];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

const ITEMS_PER_PAGE = 10;

export const AdminTopicManage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramSubjectId = searchParams.get('subjectId');

  /* ── Data ─────────── */
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Filters ──────── */
  const [search, setSearch] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>(paramSubjectId || 'all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Dropdowns ────── */
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Subject Modal ── */
  const [isManageSubjectsModalOpen, setIsManageSubjectsModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [subOrderIndex, setSubOrderIndex] = useState(1);
  const [subIsActive, setSubIsActive] = useState(true);
  const [subError, setSubError] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  /* ── Topic Modal ──── */
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Chapter | null>(null);
  const [topicSubjectId, setTopicSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicOrderIndex, setTopicOrderIndex] = useState(1);
  const [topicIsActive, setTopicIsActive] = useState(true);
  const [topicError, setTopicError] = useState('');
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  /* ── View Modal ───── */
  const [viewingTopic, setViewingTopic] = useState<Chapter | null>(null);

  /* ── Add Topic Dropdown (Header) ── */
  const [isAddTopicDropdownOpen, setIsAddTopicDropdownOpen] = useState(false);
  const addTopicDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Sync URL param if changed ── */
  useEffect(() => {
    if (paramSubjectId) {
      setFilterSubjectId(paramSubjectId);
    }
  }, [paramSubjectId]);

  /* ── Load initial data ── */
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [subs, chaps, qs] = await Promise.all([
        api.getAllAdminSubjects(),
        api.getAllAdminChapters(),
        api.getAllAdminQuestions(),
      ]);
      setSubjects(subs);
      setChapters(chaps);
      setQuestions(qs);
    } catch (err) {
      console.error('Failed to load topic manage data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (addTopicDropdownRef.current && !addTopicDropdownRef.current.contains(e.target as Node)) {
        setIsAddTopicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Maps for fast lookup ─────────────────────────── */
  const subjectMap = useMemo(() => {
    const map: Record<string, Subject> = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  const subjectOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    subjects.forEach((s, idx) => {
      map[s.id] = idx;
    });
    return map;
  }, [subjects]);

  const questionCountsByTopic = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      const tid = q.topicId || q.chapterId;
      if (tid) counts[tid] = (counts[tid] || 0) + 1;
    });
    return counts;
  }, [questions]);

  /* ── Filtered & Paginated Topics ─────────────────── */
  const filteredTopics = useMemo(() => {
    return chapters.filter((c) => {
      if (filterSubjectId !== 'all' && c.subjectId !== filterSubjectId) return false;
      if (filterStatus === 'active' && !c.isActive) return false;
      if (filterStatus === 'inactive' && c.isActive) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = c.name.toLowerCase().includes(query);
        const matchSubject = (subjectMap[c.subjectId]?.name || '').toLowerCase().includes(query);
        const matchSlug = c.slug.toLowerCase().includes(query);
        if (!matchName && !matchSubject && !matchSlug) return false;
      }
      return true;
    });
  }, [chapters, filterSubjectId, filterStatus, search, subjectMap]);

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTopics = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredTopics.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTopics, safePage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterSubjectId, filterStatus]);

  /* ── Stats ────────────────────────────────────────── */
  const stats = useMemo(
    () => ({
      totalSubjects: subjects.length,
      totalTopics: chapters.length,
      totalQuestions: questions.length,
      activeTopics: chapters.filter((c) => c.isActive).length,
    }),
    [subjects, chapters, questions]
  );

  /* ── Subject CRUD ─────────────────────────────────── */
  const openCreateSubjectModal = () => {
    setEditingSubject(null);
    setSubName('');
    setSubSlug('');
    setSubDescription('');
    setSubOrderIndex(subjects.length + 1);
    setSubIsActive(true);
    setSubError('');
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (sub: Subject) => {
    setEditingSubject(sub);
    setSubName(sub.name);
    setSubSlug(sub.slug);
    setSubDescription(sub.description || '');
    setSubOrderIndex(sub.orderIndex);
    setSubIsActive(sub.isActive);
    setSubError('');
    setIsSubjectModalOpen(true);
  };

  const handleSubNameChange = (val: string) => {
    setSubName(val);
    if (!editingSubject) {
      setSubSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return setSubError('Subject name is required.');
    try {
      setIsSavingSubject(true);
      setSubError('');
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          name: subName.trim(),
          slug: subSlug.trim(),
          description: subDescription.trim() || undefined,
          orderIndex: Number(subOrderIndex),
          isActive: subIsActive,
        });
      } else {
        await api.createSubject({
          name: subName.trim(),
          slug: subSlug.trim(),
          description: subDescription.trim() || undefined,
          iconName: 'BookOpen',
          orderIndex: Number(subOrderIndex),
          isActive: subIsActive,
        });
      }
      setIsSubjectModalOpen(false);
      await loadData();
    } catch (err) {
      setSubError(getErrorMessage(err, 'Failed to save subject'));
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (sub: Subject) => {
    if (
      !window.confirm(
        `Delete subject "${sub.name}"?\n\nTopics belonging to this subject may also be affected.`
      )
    )
      return;
    try {
      setIsLoading(true);
      await api.deleteSubject(sub.id);
      if (filterSubjectId === sub.id) setFilterSubjectId('all');
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete subject'));
      setIsLoading(false);
    }
  };

  /* ── Topic CRUD ──────────────────────────────────── */
  const openCreateTopicModal = (parentSubjectId?: string) => {
    setEditingTopic(null);
    const sid =
      parentSubjectId || (filterSubjectId !== 'all' ? filterSubjectId : subjects[0]?.id || '');
    setTopicSubjectId(sid);
    setTopicName('');
    setTopicSlug('');
    setTopicDescription('');
    setTopicOrderIndex(chapters.filter((c) => c.subjectId === sid).length + 1);
    setTopicIsActive(true);
    setTopicError('');
    setIsAddTopicDropdownOpen(false);
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: Chapter) => {
    setEditingTopic(topic);
    setTopicSubjectId(topic.subjectId);
    setTopicName(topic.name);
    setTopicSlug(topic.slug);
    setTopicDescription(topic.description || '');
    setTopicOrderIndex(topic.orderIndex);
    setTopicIsActive(topic.isActive);
    setTopicError('');
    setIsTopicModalOpen(true);
  };

  const handleTopicNameChange = (val: string) => {
    setTopicName(val);
    if (!editingTopic) {
      setTopicSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return setTopicError('Topic name is required.');
    if (!topicSubjectId) return setTopicError('Parent subject must be selected.');
    try {
      setIsSavingTopic(true);
      setTopicError('');
      if (editingTopic) {
        await api.updateChapter(editingTopic.id, {
          subjectId: topicSubjectId,
          name: topicName.trim(),
          slug: topicSlug.trim(),
          description: topicDescription.trim() || undefined,
          orderIndex: Number(topicOrderIndex),
          isActive: topicIsActive,
        });
      } else {
        await api.createChapter({
          subjectId: topicSubjectId,
          name: topicName.trim(),
          slug:
            topicSlug.trim() ||
            topicName
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
          description: topicDescription.trim() || undefined,
          orderIndex: Number(topicOrderIndex),
          isActive: topicIsActive,
        });
      }
      setIsTopicModalOpen(false);
      await loadData();
    } catch (err) {
      setTopicError(getErrorMessage(err, 'Failed to save topic'));
    } finally {
      setIsSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (topic: Chapter) => {
    if (
      !window.confirm(
        `Delete topic "${topic.name}"?\n\nAssociated question references may be affected.`
      )
    )
      return;
    try {
      setIsLoading(true);
      await api.deleteChapter(topic.id);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete topic'));
      setIsLoading(false);
    }
  };

  const navigateToTopicQuestions = (subjectId: string, topicId: string) =>
    navigate(`/admin/question-bank?source=topic&subjectId=${subjectId}&topicId=${topicId}`);

  /* ── Shared classes ──────────────────────────────── */
  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-colors font-medium';

  const cardCls =
    'bg-white dark:bg-[#0a1226] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl shadow-xs';

  /* ── Page numbers ────────────────────────────────── */
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++)
        pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return withAdminSkeleton(
    isLoading,
    <div className="space-y-5">
      {/* ── Page Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Topic Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage, filter, and organize academic topics across your subjects
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Topic dropdown */}
          <div ref={addTopicDropdownRef} className="relative">
            <Button
              onClick={() => setIsAddTopicDropdownOpen((v) => !v)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Topic
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isAddTopicDropdownOpen ? 'rotate-180' : ''}`}
              />
            </Button>
            {isAddTopicDropdownOpen && subjects.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 shadow-lg z-30 py-1 max-h-60 overflow-y-auto">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openCreateTopicModal(s.id)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Subject */}
          <Button
            onClick={openCreateSubjectModal}
            variant="outline"
            className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </Button>

          {/* Manage Subjects Modal Button */}
          <Button
            onClick={() => setIsManageSubjectsModalOpen(true)}
            variant="outline"
            className="border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Manage Subjects ({subjects.length})</span>
          </Button>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Subjects */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Subjects
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.totalSubjects}
            </p>
          </div>
        </div>

        {/* Topics */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Topics
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.totalTopics}
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Questions
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.totalQuestions}
            </p>
          </div>
        </div>

        {/* Active Topics */}
        <div className={`${cardCls} p-4 flex items-center gap-3.5`}>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Active Topics
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5 leading-none">
              {stats.activeTopics}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics by name…"
            className={`${inputCls} pl-10 text-xs`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subject Dropdown */}
        <div ref={subjectDropdownRef} className="relative min-w-[240px] sm:min-w-[260px]">
          <button
            type="button"
            onClick={() => {
              setIsSubjectDropdownOpen((v) => !v);
              setIsStatusDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <span className="truncate">
              {filterSubjectId === 'all'
                ? 'All Subjects'
                : subjectMap[filterSubjectId]?.name || 'All Subjects'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 ml-2 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isSubjectDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-full min-w-[260px] sm:min-w-[280px] rounded-xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 shadow-lg z-30 py-1.5 max-h-72 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setFilterSubjectId('all');
                  setIsSubjectDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  filterSubjectId === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                All Subjects ({chapters.length})
              </button>
              {subjects.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-3.5 py-2 transition-colors ${
                    filterSubjectId === s.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <button
                    type="button"
                    title={s.name}
                    onClick={() => {
                      setFilterSubjectId(s.id);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className="flex-1 text-left text-xs font-medium truncate cursor-pointer"
                  >
                    {s.name} ({chapters.filter((c) => c.subjectId === s.id).length})
                  </button>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      title={`Edit ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSubjectDropdownOpen(false);
                        openEditSubjectModal(s);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      title={`Delete ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSubjectDropdownOpen(false);
                        handleDeleteSubject(s);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div ref={statusDropdownRef} className="relative min-w-[130px]">
          <button
            type="button"
            onClick={() => {
              setIsStatusDropdownOpen((v) => !v);
              setIsSubjectDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-colors cursor-pointer"
          >
            <span className="capitalize">
              {filterStatus === 'all' ? 'All Status' : filterStatus}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 ml-2 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isStatusDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-full rounded-xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 shadow-lg z-30 py-1">
              {(['all', 'active', 'inactive'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setFilterStatus(st);
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {st === 'all' ? 'All Status' : st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons: Reset & Export */}
        <div className="flex items-center gap-2 ml-auto">
          {(search || filterSubjectId !== 'all' || filterStatus !== 'all') && (
            <Button
              onClick={() => {
                setSearch('');
                setFilterSubjectId('all');
                setFilterStatus('all');
              }}
              variant="outline"
              className="text-xs text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}

          <Button
            onClick={() => {
              const headers = [
                'ID',
                'Topic Name',
                'Subject',
                'Questions Count',
                'Status',
                'Updated At',
              ];
              const rows = filteredTopics.map((t, idx) => [
                idx + 1,
                `"${t.name.replace(/"/g, '""')}"`,
                `"${(subjectMap[t.subjectId]?.name || '').replace(/"/g, '""')}"`,
                questionCountsByTopic[t.id] || 0,
                t.isActive ? 'Active' : 'Inactive',
                t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
              ]);
              const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'topics-export.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            className="text-xs text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* ── Table View ────────────────────────────── */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/90 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-4 py-3.5">Topic Name</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5 text-center">Questions</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Updated On</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {isLoading ? <tr><td colSpan={7} className="p-4"><AdminSectionSkeleton label="Loading topics…" variant="table" /></td></tr> : pagedTopics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <FolderTree className="w-10 h-10 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No topics found
                      </p>
                      <p className="text-xs text-slate-400 text-center">
                        {search || filterSubjectId !== 'all' || filterStatus !== 'all'
                          ? 'Try adjusting your search or filters to find what you are looking for.'
                          : 'Get started by creating your first academic topic.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedTopics.map((topic, index) => {
                  const sub = subjectMap[topic.subjectId];
                  const subIdx = subjectOrderMap[topic.subjectId] ?? 0;
                  const badgeColor = getBadgeColor(topic.subjectId, subIdx);
                  const qCount = questionCountsByTopic[topic.id] || 0;
                  const rowNum = (safePage - 1) * ITEMS_PER_PAGE + index + 1;

                  return (
                    <tr
                      key={topic.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors group"
                    >
                      {/* Row number */}
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {rowNum}
                      </td>

                      {/* Topic Name */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{topic.name}</span>
                        </div>
                      </td>

                      {/* Subject Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                        >
                          {sub?.name || 'Unknown Subject'}
                        </span>
                      </td>

                      {/* Questions Count */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigateToTopicQuestions(topic.subjectId, topic.id)}
                          title="View questions for this topic"
                          className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>{qCount}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            topic.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${topic.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          />
                          {topic.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Updated On */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap font-mono">
                        {formatDate(topic.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingTopic(topic)}
                            title="View topic details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditTopicModal(topic)}
                            title="Edit topic"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(topic)}
                            title="Delete topic"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────── */}
        {!isLoading && filteredTopics.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200/90 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(safePage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(safePage * ITEMS_PER_PAGE, filteredTopics.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredTopics.length}
              </span>{' '}
              topics
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      safePage === p
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          M O D A L S
          ══════════════════════════════════════════════ */}

      {/* ── View Topic Details Modal ──────────────── */}
      {viewingTopic && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-500" />
                Topic Details
              </h3>
              <button
                type="button"
                onClick={() => setViewingTopic(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Topic Name</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {viewingTopic.name}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Slug</span>
                <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                  {viewingTopic.slug}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">
                  Parent Subject
                </span>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {subjectMap[viewingTopic.subjectId]?.name || 'Unknown'}
                </p>
              </div>

              {viewingTopic.description && (
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">
                    Description
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    {viewingTopic.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Questions</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {questionCountsByTopic[viewingTopic.id] || 0} Questions
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Status</span>
                  <p className="mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingTopic.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${viewingTopic.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                      {viewingTopic.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
              <Button variant="outline" onClick={() => setViewingTopic(null)} className="text-xs">
                Close
              </Button>
              <Button
                onClick={() => {
                  const t = viewingTopic;
                  setViewingTopic(null);
                  openEditTopicModal(t);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Topic
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Topic Modal ──────────────── */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-500" />
                {editingTopic ? 'Edit Topic' : 'Add New Topic'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {topicError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{topicError}</span>
              </div>
            )}

            <form onSubmit={handleTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={topicSubjectId}
                  onChange={(e) => setTopicSubjectId(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">Select Parent Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => handleTopicNameChange(e.target.value)}
                  placeholder="e.g. Percentage & Profit Loss"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={topicSlug}
                  onChange={(e) => setTopicSlug(e.target.value)}
                  placeholder="e.g. percentage-profit-loss"
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  rows={2}
                  placeholder="Short overview of what this topic covers…"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Order Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={topicOrderIndex}
                    onChange={(e) => setTopicOrderIndex(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2.5 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topicIsActive}
                      onChange={(e) => setTopicIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Active (visible in tests)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingTopic}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {isSavingTopic ? 'Saving…' : editingTopic ? 'Update Topic' : 'Create Topic'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create / Edit Subject Modal ────────────── */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {subError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{subError}</span>
              </div>
            )}

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => handleSubNameChange(e.target.value)}
                  placeholder="e.g. Mathematics & Quantitative Aptitude"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={subSlug}
                  onChange={(e) => setSubSlug(e.target.value)}
                  placeholder="e.g. mathematics"
                  className={`${inputCls} font-mono text-xs`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  rows={2}
                  placeholder="Short description of this subject…"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Order Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={subOrderIndex}
                    onChange={(e) => setSubOrderIndex(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2.5 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subIsActive}
                      onChange={(e) => setSubIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingSubject}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {isSavingSubject
                    ? 'Saving…'
                    : editingSubject
                      ? 'Update Subject'
                      : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MANAGE SUBJECTS MODAL ────────────────── */}
      {isManageSubjectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Manage Subjects
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create, edit, and organize subjects without leaving Topic Management
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={openCreateSubjectModal}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Subject
                </Button>
                <button
                  type="button"
                  onClick={() => setIsManageSubjectsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subjects Table */}
            <div className="overflow-y-auto flex-1 border border-slate-100 dark:border-slate-800/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                      Subject Name
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300">
                      Slug
                    </th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-center">
                      Topics
                    </th>
                    <th className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-300 text-center">
                      Status
                    </th>
                    <th className="py-2.5 px-4 font-bold text-slate-600 dark:text-slate-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No subjects created yet. Click "Add Subject" to begin.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub) => {
                      const topicCount = chapters.filter((c) => c.subjectId === sub.id).length;
                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              <span>{sub.name}</span>
                            </div>
                            {sub.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {sub.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {sub.slug}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {sub.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterSubjectId(sub.id);
                                  setIsManageSubjectsModalOpen(false);
                                }}
                                title="Filter topics by this subject"
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900 transition-colors"
                              >
                                View Topics
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  openEditSubjectModal(sub);
                                }}
                                title="Edit Subject"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(sub)}
                                title="Delete Subject"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-850 shrink-0">
              <span className="text-xs text-slate-500">
                Total {subjects.length} subjects registered
              </span>
              <Button
                variant="outline"
                onClick={() => setIsManageSubjectsModalOpen(false)}
                className="text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    { label: 'Loading topic manage…', variant: 'table' }
  );
};

export default AdminTopicManage;
