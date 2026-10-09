import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  Sigma,
  Brain,
  Languages,
  GraduationCap,
  Play,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  LayoutGrid,
  X,
  Copy,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { api } from '@/services/api';
import { MathText } from '@/components/common/MathText';
import { StudentLoading, StudentLoadError } from '@/components/student/StudentLoadState';
import { getErrorMessage } from '@/lib/errors';
import type { BookmarkItem } from '@/types';


// Subject theme mapper for icon, color, and border
function getSubjectTheme(subjectName?: string) {
  const norm = (subjectName || '').toLowerCase();
  if (norm.includes('knowledge') || norm.includes('gk') || norm.includes('general')) {
    return {
      icon: BookOpen,
      iconBox: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      badgeText: 'General Knowledge',
      examDefault: 'WBP Constable',
    };
  }
  if (norm.includes('math') || norm.includes('arithmetic') || norm.includes('quant')) {
    return {
      icon: Sigma,
      iconBox: 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
      badgeText: 'Mathematics',
      examDefault: 'SSC GD',
    };
  }
  if (norm.includes('reason') || norm.includes('mental') || norm.includes('gi')) {
    return {
      icon: Brain,
      iconBox: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      badgeText: 'Reasoning',
      examDefault: 'WBP Constable',
    };
  }
  if (norm.includes('bengali') || norm.includes('bangla')) {
    return {
      icon: Languages,
      iconBox: 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa] dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
      badgeText: 'Bengali',
      examDefault: 'Primary TET',
    };
  }
  if (norm.includes('english')) {
    return {
      icon: GraduationCap,
      iconBox: 'bg-[#faf5ff] text-[#9333ea] border-[#e9d5ff] dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
      badgeText: 'English',
      examDefault: 'WBSSC',
    };
  }
  return {
    icon: HelpCircle,
    iconBox: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
    badgeText: 'General',
    examDefault: 'Competitive Exam',
  };
}

// Date formatter
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Saved recently';
  try {
    const d = new Date(dateStr);
    return `Saved on ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Saved recently';
  }
}

export const SavedQuestions: React.FC = () => {
  const { user } = useAuth();
  const { isBilingualEnabled } = useContentLanguage();

  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [removing, setRemoving] = useState(false);
  const removalLock = useRef(false);
  const loadVersion = useRef(0);

  // Filters & State
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Menus
  const [practiceItem, setPracticeItem] = useState<BookmarkItem | null>(null);
  const [practiceSelectedOption, setPracticeSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [practiceAnswerChecked, setPracticeAnswerChecked] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load user bookmarks from DB
  const loadBookmarks = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setLoadError('');
    if (!user?.id) { setItems([]); setLoading(false); return; }
    try {
      const data = await api.getBookmarks(user.id);
      if (version !== loadVersion.current) return;
      setItems(data);
      setSelectedIds(prev => prev.filter(id => data.some(item => item.id === id)));
    } catch (err) {
      if (version === loadVersion.current) setLoadError(getErrorMessage(err, 'Saved questions could not be loaded.'));
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setItems([]);
    setSelectedIds([]);
    void loadBookmarks();
    const counter = loadVersion;
    return () => { counter.current++; };
  }, [loadBookmarks]);

  // Subject statistics
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const sub = item.subjectName || 'Uncategorized';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filtered & sorted questions
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Subject Filter
    if (selectedSubject !== 'all') {
      result = result.filter(
        (item) => (item.subjectName || 'Uncategorized').toLowerCase() === selectedSubject.toLowerCase()
      );
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const text = (item.question.questionText || '').toLowerCase();
        const bText = (item.question.questionBengaliText || '').toLowerCase();
        const optA = (item.question.optionA || '').toLowerCase();
        const optB = (item.question.optionB || '').toLowerCase();
        const optC = (item.question.optionC || '').toLowerCase();
        const optD = (item.question.optionD || '').toLowerCase();
        const sub = (item.subjectName || '').toLowerCase();
        return (
          text.includes(q) ||
          bText.includes(q) ||
          optA.includes(q) ||
          optB.includes(q) ||
          optC.includes(q) ||
          optD.includes(q) ||
          sub.includes(q)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }, [items, selectedSubject, searchQuery, sortBy]);

  // Bulk Selection Handlers
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredItemIds = new Set(filteredItems.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredItemIds.has(id)));
    } else {
      const idsToAdd = filteredItems.map((i) => i.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removeSaved = async (targets: BookmarkItem[], clearAll = false) => {
    if (!user?.id || removalLock.current || !targets.length) return;
    removalLock.current = true;
    setRemoving(true);
    setActionError('');
    try {
      const confirmed = clearAll
        ? await api.clearAllBookmarks(user.id)
        : await api.removeBookmarks(user.id, targets.map(item => item.questionId));
      if (!confirmed) throw new Error('Removal was not confirmed. Please retry.');
      const removedIds = new Set(targets.map(item => item.id));
      setItems(prev => clearAll ? [] : prev.filter(item => !removedIds.has(item.id)));
      setSelectedIds(prev => prev.filter(id => !removedIds.has(id)));
      setPracticeItem(prev => prev && removedIds.has(prev.id) ? null : prev);
      setActiveMenuId(null);
      setShowClearConfirm(false);
      setShowBulkDeleteConfirm(false);
      showToast(clearAll ? 'All saved questions cleared' : `Removed ${targets.length} saved question${targets.length === 1 ? '' : 's'}`);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Saved questions could not be removed.'));
    } finally {
      removalLock.current = false;
      setRemoving(false);
    }
  };
  const handleRemoveItem = (item: BookmarkItem) => removeSaved([item]);
  const handleBulkDelete = () => removeSaved(items.filter(item => selectedIds.includes(item.id)));
  const handleClearAll = () => removeSaved(items, true);

  // Start in-page practice
  const handleStartPractice = (item: BookmarkItem) => {
    setPracticeItem(item);
    setPracticeSelectedOption(null);
    setPracticeAnswerChecked(false);
  };

  const handleNextPractice = () => {
    if (!practiceItem) return;
    const currentIndex = filteredItems.findIndex((i) => i.id === practiceItem.id);
    if (currentIndex >= 0 && currentIndex < filteredItems.length - 1) {
      setPracticeItem(filteredItems[currentIndex + 1]);
      setPracticeSelectedOption(null);
      setPracticeAnswerChecked(false);
    } else {
      setPracticeItem(null);
      showToast('Practice completed!');
    }
  };

  // Copy Question Text
  const handleCopyQuestion = async (item: BookmarkItem) => {
    const text = `${item.question.questionText}\n\nA. ${item.question.optionA}\nB. ${item.question.optionB}\nC. ${item.question.optionC}\nD. ${item.question.optionD}\n\nCorrect Answer: ${item.question.correctOption}\n${item.question.explanation ? `Explanation: ${item.question.explanation}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Question copied to clipboard');
    } catch {
      setActionError('Clipboard access is unavailable. Please copy the question text manually.');
    }
    setActiveMenuId(null);
  };

  // Print / Download as PDF
  const handleDownloadPdf = () => {
    window.print();
  };

  if (loading) return <StudentLoading label="Loading saved questions" />;
  if (loadError) return <StudentLoadError message={loadError} onRetry={() => void loadBookmarks()} />;

  return (
    <div className="space-y-5 sm:space-y-6 text-slate-900 dark:text-slate-100">
      {actionError && <p role="alert" className="rounded-xl p-4 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 text-sm">{actionError}</p>}
      {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/home" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 font-bold">Saved Questions</span>
        </nav>

        {/* 2. Page Header with Mascot Art */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
              Saved <span className="text-[#026BFC]">Questions</span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Your bookmarked questions for focused revision.
              <br className="hidden sm:inline" />
              Revisit important questions anytime and practice smarter.
            </p>
          </div>

          {/* Top Right Decorative Illustration */}
          <div className="relative shrink-0 flex items-center justify-end">
            <img
              src="/images/saved_questions_hero_art_exact.png"
              alt="Revise Reinforce Remember Succeed - Small Reviews Big Results"
              className="h-28 sm:h-34 lg:h-38 w-auto object-contain select-none pointer-events-none drop-shadow-xs"
            />
          </div>
        </div>

        {/* 3. Subject Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* All */}
          <button
            type="button"
            onClick={() => setSelectedSubject('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              selectedSubject === 'all'
                ? 'bg-[#026BFC] text-white shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All ({items.length})
          </button>

          {/* Individual Subjects */}
          {Object.entries(subjectCounts).map(([name, count]) => ({ name, count })).map((sub) => {
            const isActive = selectedSubject.toLowerCase() === sub.name.toLowerCase();
            return (
              <button
                key={sub.name}
                type="button"
                onClick={() => setSelectedSubject(sub.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isActive
                    ? 'bg-[#026BFC] text-white font-bold shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {sub.name} ({sub.count})
              </button>
            );
          })}
        </div>

        {/* 4. Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* LEFT COLUMN: Questions List & Toolbar (Col-span 8 or 9) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Toolbar: Bulk Selection, Search, Filter, Sort */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Left: Bulk Checkbox */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    disabled={filteredItems.length === 0}
                    className="h-4 w-4 rounded border-slate-300 text-[#026BFC] focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {selectedIds.length} selected
                  </span>
                </label>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const first = items.find((i) => selectedIds.includes(i.id));
                        if (first) handleStartPractice(first);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#026BFC] border border-blue-200 text-xs font-bold flex items-center gap-1 hover:bg-blue-100"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Practice Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Search Input, Filter Button, Sort Dropdown */}
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search saved questions"
                    placeholder="Search saved questions..."
                    className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 min-h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#026BFC]"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSortDropdown((prev) => !prev)}
                    className="min-h-11 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    <span>
                      {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30">
                      {[
                        { id: 'newest', label: 'Newest First' },
                        { id: 'oldest', label: 'Oldest First' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id as typeof sortBy);
                            setShowSortDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            sortBy === opt.id
                              ? 'text-[#026BFC] font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Questions List */}
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-100 dark:border-slate-800 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No saved questions found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query or subject filters to view bookmarked questions.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const theme = getSubjectTheme(item.subjectName);
                  const Icon = theme.icon;
                  const isChecked = selectedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-900/60 transition-all grid grid-cols-[20px_44px_minmax(0,1fr)] sm:flex items-start gap-3 sm:gap-4 relative"
                    >
                      {/* 1. Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.id)}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-[#026BFC] focus:ring-blue-500 mt-1 cursor-pointer shrink-0"
                      />

                      {/* 2. Subject Icon Box */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${theme.iconBox}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* 3. Question Info (Center) */}
                      <div className="col-span-3 sm:flex-1 min-w-0 space-y-2">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
                            {item.subjectName || 'Uncategorized'}
                          </span>
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium px-2 py-0.5 rounded-md">
                            {item.question.sourceExam || item.examTitle || 'Exam not specified'}
                          </span>
                        </div>

                        {/* Question Text */}
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                          <MathText>{!isBilingualEnabled
                            ? item.question.questionBengaliText || item.question.questionText
                            : item.question.questionText}</MathText>
                        </h4>
                        {isBilingualEnabled && item.question.questionBengaliText && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium font-sans">
                            <MathText>{item.question.questionBengaliText}</MathText>
                          </p>
                        )}

                        {/* Inline Options Preview */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          A. {item.question.optionA} &nbsp; B. {item.question.optionB} &nbsp; C. {item.question.optionC} &nbsp; D. {item.question.optionD}
                        </p>

                        {/* Saved On Date */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      {/* 4. Right Action Buttons */}
                      <div className="col-start-3 row-start-1 flex flex-wrap sm:flex-col items-end justify-end sm:justify-between self-stretch shrink-0 gap-3">
                        {/* Top: Bookmark icon, 3-dots */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item)}
                            disabled={removing}
                            className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-[#026BFC] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            aria-label="Remove from saved"
                            title="Remove from saved"
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId((curr) => (curr === item.id ? null : item.id))
                              }
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                <button
                                  type="button"
                                  onClick={() => handleCopyQuestion(item)}
                                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item)}
                            disabled={removing}
                                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Practice Now button */}
                        <button
                          type="button"
                          onClick={() => handleStartPractice(item)}
                          className="min-h-11 px-3.5 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#026BFC] dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Practice Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: 4 Stacked Cards (Col-span 4 or 3) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5 sm:space-y-6">
            {/* CARD 1: "Your Saved Questions" */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Your Saved Questions
              </h3>

              {/* Bookmark Icon & Count */}
              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#026BFC] border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                  <Bookmark className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                    {items.length}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    Questions Saved
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 font-medium">
                  Great! Keep saving important questions.
                </p>
              </div>
            </div>

            {/* CARD 2: "Subject-wise" */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Subject-wise
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedSubject('all')}
                  className="text-xs font-bold text-[#026BFC] hover:text-blue-700 cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Subjects List */}
              <div className="space-y-3 pt-1">
                {Object.keys(subjectCounts).map(name => ({ name, icon: getSubjectTheme(name).icon, color: getSubjectTheme(name).iconBox })).map((s) => {
                  const Icon = s.icon;
                  const count = subjectCounts[s.name] || 0;
                  return (
                    <button
                      type="button"
                      key={s.name}
                      onClick={() => setSelectedSubject(s.name)}
                      className="flex items-center justify-between w-full min-h-11 text-xs cursor-pointer group hover:opacity-80"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${s.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#026BFC] transition-colors">
                          {s.name}
                        </span>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white text-xs">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD 3: "Quick Actions" */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Quick Actions
              </h3>

              <div className="space-y-3 pt-1">
                {/* 1. Practice Saved Questions */}
                <button
                  type="button"
                  onClick={() => {
                    if (filteredItems.length > 0) {
                      handleStartPractice(filteredItems[0]);
                    } else {
                      showToast('No questions to practice');
                    }
                  }}
                  className="w-full text-left flex items-start gap-3 p-2 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#026BFC] flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Practice Saved Questions
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Start a test with your saved questions
                    </p>
                  </div>
                </button>

                {/* 2. Organize by Subject */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject('all');
                    showToast('Showing all subjects');
                  }}
                  className="w-full text-left flex items-start gap-3 p-2 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/50">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Organize by Subject
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      View subject-wise saved questions
                    </p>
                  </div>
                </button>

                {/* 3. Download as PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full text-left flex items-start gap-3 p-2 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Download as PDF
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Export your saved questions
                    </p>
                  </div>
                </button>

                {/* 4. Clear All */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full text-left flex items-start gap-3 p-2 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Clear All
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Remove all saved questions
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* CARD 4: "Motivation & Target" */}
            <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:to-slate-850 rounded-3xl p-5 sm:p-6 border border-blue-100/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 relative overflow-hidden">
              <div className="space-y-1 z-10 max-w-[70%]">
                <span className="text-[#026BFC] text-3xl font-serif font-black leading-none block">
                  &ldquo;
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug italic">
                  The questions you save today, build your success tomorrow.
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white pt-1">
                  — PracticeKoro
                </p>
              </div>

              {/* Target Image Illustration */}
              <div className="shrink-0 flex items-end justify-end">
                <img
                  src="/images/saved_questions_target.png"
                  alt="Archery Target"
                  className="w-14 h-14 object-contain drop-shadow-2xs select-none pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* Interactive Practice Modal                                                */}
      {/* ========================================================================= */}
      {practiceItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#026BFC]">
                  {practiceItem.subjectName}
                </span>
                <span className="text-xs text-slate-400">• Practice Mode</span>
              </div>
              <button
                type="button"
                onClick={() => setPracticeItem(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Question Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                <MathText>{!isBilingualEnabled
                  ? practiceItem.question.questionBengaliText || practiceItem.question.questionText
                  : practiceItem.question.questionText}</MathText>
              </h3>

              {/* 4 Options */}
              <div className="space-y-2 pt-2">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optText =
                    opt === 'A'
                      ? practiceItem.question.optionA
                      : opt === 'B'
                      ? practiceItem.question.optionB
                      : opt === 'C'
                      ? practiceItem.question.optionC
                      : practiceItem.question.optionD;

                  const isSelected = practiceSelectedOption === opt;
                  const isCorrect = practiceItem.question.correctOption === opt;

                  let optClass =
                    'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50';
                  if (practiceAnswerChecked) {
                    if (isCorrect) {
                      optClass =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500';
                    } else if (isSelected) {
                      optClass =
                        'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                    }
                  } else if (isSelected) {
                    optClass = 'border-[#026BFC] bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500';
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={practiceAnswerChecked}
                      onClick={() => setPracticeSelectedOption(opt)}
                      className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${optClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">
                          {opt}
                        </span>
                        <span><MathText>{optText}</MathText></span>
                      </div>
                      {practiceAnswerChecked && isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {practiceAnswerChecked && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation / Short Notes Box */}
              {practiceAnswerChecked &&
                (practiceItem.question.explanationBengali || practiceItem.question.explanation) && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs space-y-1">
                    <p className="font-bold text-[#026BFC] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{!isBilingualEnabled ? 'শর্ট নোটস' : 'Explanation / শর্ট নোটস'}</span>
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {practiceItem.question.explanationBengali || practiceItem.question.explanation}
                    </p>
                  </div>
                )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPracticeItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
              >
                Close
              </button>

              {!practiceAnswerChecked ? (
                <button
                  type="button"
                  disabled={!practiceSelectedOption}
                  onClick={() => setPracticeAnswerChecked(true)}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextPractice}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear all saved questions?
              </h3>
              <p className="text-xs text-slate-500">
                This will remove all {items.length} questions from your saved list.
              </p>
            </div>
            {actionError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={removing}
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={removing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete {selectedIds.length} selected questions?
              </h3>
              <p className="text-xs text-slate-500">
                These questions will be removed from your saved list.
              </p>
            </div>
            {actionError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={removing}
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={removing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
