import { csvCell } from '@/utils/csvExport';
import { withAdminSkeleton, AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import {
  Activity,
  AlertTriangle,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
} from 'lucide-react';
import type { QuestionItemAnalysis, ItemAnalysisFilterOptions, Subject, Chapter } from '@/types';

export const AdminItemAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilterType =
    (searchParams.get('filter') as ItemAnalysisFilterOptions['filterType']) || 'all';

  const [items, setItems] = useState<QuestionItemAnalysis[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const [filterType, setFilterType] =
    useState<ItemAnalysisFilterOptions['filterType']>(initialFilterType);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    searchParams.get('subjectId') || ''
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    searchParams.get('chapterId') || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [analysisData, subs, chaps] = await Promise.all([
        api.getItemAnalysis({
          filterType,
          subjectId: selectedSubjectId || undefined,
          chapterId: selectedChapterId || undefined,
          searchQuery: searchQuery || undefined,
        }),
        api.getAllAdminSubjects().catch(() => []),
        api.getAllAdminChapters().catch(() => []),
      ]);
      setItems(analysisData);
      setSubjects(subs || []);
      setChapters(chaps || []);
    } catch (err) {
      console.error('Failed to load item analysis data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterType, selectedSubjectId, selectedChapterId, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync filter type to URL
  const handleFilterTypeChange = (newType: ItemAnalysisFilterOptions['filterType']) => {
    setFilterType(newType);
    const nextParams = new URLSearchParams(searchParams);
    if (newType && newType !== 'all') {
      nextParams.set('filter', newType);
    } else {
      nextParams.delete('filter');
    }
    setSearchParams(nextParams);
  };

  // High-level summary metrics
  const totalAnalyzed = items.length;
  const highFailureCount = useMemo(() => items.filter((i) => i.isHighFailure).length, [items]);
  const timeTrapsCount = useMemo(() => items.filter((i) => i.isTimeTrap).length, [items]);
  const avgPlatformAccuracy = useMemo(() => {
    if (items.length === 0) return '0.0';
    const sum = items.reduce((acc, curr) => acc + curr.accuracyRate, 0);
    return (sum / items.length).toFixed(1);
  }, [items]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Question ID',
      'Question Text',
      'Bengali Text',
      'Subject',
      'Topic',
      'Total Attempts',
      'Correct',
      'Wrong',
      'Skipped',
      'Accuracy %',
      'Failure Rate %',
      'Avg Time (Sec)',
      'High Failure (>=80%)',
      'Time Trap (>90s)',
      'Correct Option',
      'Option A %',
      'Option B %',
      'Option C %',
      'Option D %',
    ];

    const rows = items.map((i) => [
      i.questionId,
      i.questionText || '',
      i.questionBengali || '',
      i.subjectName || '',
      i.chapterName || '',
      i.totalAttempts,
      i.correctCount,
      i.wrongCount,
      i.skippedCount,
      i.accuracyRate,
      i.failureRate,
      i.avgTimeSpentSeconds,
      i.isHighFailure ? 'YES' : 'NO',
      i.isTimeTrap ? 'YES' : 'NO',
      i.correctOption,
      i.optionDistribution.A,
      i.optionDistribution.B,
      i.optionDistribution.C,
      i.optionDistribution.D,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join(
      '\r\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `item_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return withAdminSkeleton(
    isLoading,
    <div className="space-y-6">
      {/* ─── 1. TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Item Analysis & Question Psychometrics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            প্রশ্নভিত্তিক অ্যাকুরেসি, ভুল উত্তরের অনুপাত (≥৮০% failure rate), এবং সমাধানের
            অস্বাভাবিক সময় (Time Traps) বিশ্লেষণ।
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-2 shadow-xs shadow-indigo-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            Export Analysis CSV
          </button>
          <Link
            to="/admin/question-bank"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Back to Question Bank
          </Link>
        </div>
      </div>

      {/* ─── 2. SUMMARY KPI STATS CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions Evaluated */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Questions Analyzed
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {totalAnalyzed}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Item-level psychometric data recorded</p>
        </div>

        {/* High Failure Questions (>=80% Wrong) */}
        <div
          onClick={() => handleFilterTypeChange('high_failure')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
            filterType === 'high_failure'
              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              High Failure (≥80% Wrong)
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 tracking-tight">
            {highFailureCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Questions failed by 80%+ examinees (Trap questions)
          </p>
        </div>

        {/* Time Trap Questions (>90s Avg) */}
        <div
          onClick={() => handleFilterTypeChange('time_traps')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs relative overflow-hidden ${
            filterType === 'time_traps'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Time Traps (&gt;90s Avg)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2 tracking-tight">
            {timeTrapsCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Excessive solving duration compared to benchmark
          </p>
        </div>

        {/* Average Platform Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Platform Accuracy
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2 tracking-tight">
            {avgPlatformAccuracy}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Average correctness across question attempts
          </p>
        </div>
      </div>

      {/* ─── 3. PRESET FILTER BUTTONS & TOOLBAR ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xs">
        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleFilterTypeChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Questions ({totalAnalyzed})
          </button>

          <button
            type="button"
            onClick={() => handleFilterTypeChange('high_failure')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'high_failure'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            High Failure Rate (≥80% Wrong) ({highFailureCount})
          </button>

          <button
            type="button"
            onClick={() => handleFilterTypeChange('time_traps')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'time_traps'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-900/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Time Traps (&gt;90s Avg) ({timeTrapsCount})
          </button>

          <button
            type="button"
            onClick={() => handleFilterTypeChange('hardest')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'hardest'
                ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Hardest (Lowest Accuracy First)
          </button>

          <button
            type="button"
            onClick={() => handleFilterTypeChange('easiest')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'easiest'
                ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Easiest (Highest Accuracy First)
          </button>
        </div>

        {/* Drill-down Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search question text or Bengali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All Topics & Chapters</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── 4. ITEM ANALYSIS QUESTIONS LIST ─── */}
      {isLoading ? (
        <AdminSectionSkeleton label="Loading records…" variant="table" className="p-4" />
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No questions matched the current filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting the filter preset or clearing your search criteria to view all analyzed
            questions.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setSelectedSubjectId('');
              setSelectedChapterId('');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isExpanded = expandedQuestionId === item.questionId;

            return (
              <div
                key={item.questionId}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
                  item.isHighFailure
                    ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-300 dark:hover:border-rose-700'
                    : item.isTimeTrap
                      ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Question Details & Tags */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                        #{idx + 1}
                      </span>
                      {item.subjectName && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.subjectName}
                        </span>
                      )}
                      {item.chapterName && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                          {item.chapterName}
                        </span>
                      )}
                      {item.isHighFailure && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          ⚠️ {item.failureRate}% Failed (High Error Rate)
                        </span>
                      )}
                      {item.isTimeTrap && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" />⏳ {item.avgTimeSpentSeconds}s Avg (Time
                          Trap)
                        </span>
                      )}
                    </div>

                    {/* Question text */}
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {item.questionBengali || item.questionText}
                    </p>

                    {/* Distractor Analysis Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span>Candidate Choice Distribution:</span>
                        <span>
                          Correct Option:{' '}
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {item.correctOption}
                          </strong>
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div
                          style={{ width: `${item.optionDistribution.A}%` }}
                          title={`Option A: ${item.optionDistribution.A}%`}
                          className={`h-full transition-all ${
                            item.correctOption === 'A' ? 'bg-emerald-500' : 'bg-rose-400/80'
                          }`}
                        />
                        <div
                          style={{ width: `${item.optionDistribution.B}%` }}
                          title={`Option B: ${item.optionDistribution.B}%`}
                          className={`h-full transition-all ${
                            item.correctOption === 'B' ? 'bg-emerald-500' : 'bg-amber-400/80'
                          }`}
                        />
                        <div
                          style={{ width: `${item.optionDistribution.C}%` }}
                          title={`Option C: ${item.optionDistribution.C}%`}
                          className={`h-full transition-all ${
                            item.correctOption === 'C' ? 'bg-emerald-500' : 'bg-blue-400/80'
                          }`}
                        />
                        <div
                          style={{ width: `${item.optionDistribution.D}%` }}
                          title={`Option D: ${item.optionDistribution.D}%`}
                          className={`h-full transition-all ${
                            item.correctOption === 'D' ? 'bg-emerald-500' : 'bg-purple-400/80'
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1 pt-1.5 text-[10px] text-slate-500 font-medium">
                        <span
                          className={item.correctOption === 'A' ? 'text-emerald-600 font-bold' : ''}
                        >
                          A: {item.optionDistribution.A}% {item.correctOption === 'A' ? '✓' : ''}
                        </span>
                        <span
                          className={item.correctOption === 'B' ? 'text-emerald-600 font-bold' : ''}
                        >
                          B: {item.optionDistribution.B}% {item.correctOption === 'B' ? '✓' : ''}
                        </span>
                        <span
                          className={item.correctOption === 'C' ? 'text-emerald-600 font-bold' : ''}
                        >
                          C: {item.optionDistribution.C}% {item.correctOption === 'C' ? '✓' : ''}
                        </span>
                        <span
                          className={item.correctOption === 'D' ? 'text-emerald-600 font-bold' : ''}
                        >
                          D: {item.optionDistribution.D}% {item.correctOption === 'D' ? '✓' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Key Psychometric Numbers & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 text-right">
                      {/* Accuracy Score */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Accuracy
                        </span>
                        <span
                          className={`text-lg font-black tracking-tight block ${
                            item.accuracyRate < 20
                              ? 'text-rose-600 dark:text-rose-400'
                              : item.accuracyRate < 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {item.accuracyRate}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.correctCount}/{item.totalAttempts} correct
                        </span>
                      </div>

                      {/* Average Time Spent */}
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Avg Time
                        </span>
                        <span
                          className={`text-base font-black tracking-tight block ${
                            item.isTimeTrap
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.avgTimeSpentSeconds}s
                        </span>
                        <span className="text-[10px] text-slate-400">per candidate</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedQuestionId(isExpanded ? null : item.questionId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Link
                        to={`/admin/question-bank?search=${encodeURIComponent(item.questionId)}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        title="Edit Question in Question Bank"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Edit</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Expanded Inspection Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/60 dark:bg-slate-950/60 p-4 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          item.correctOption === 'A'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold mr-1.5">A.</span> {item.options.A}{' '}
                        {item.correctOption === 'A' && (
                          <span className="ml-1 text-emerald-600">✓ (Correct)</span>
                        )}
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${
                          item.correctOption === 'B'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold mr-1.5">B.</span> {item.options.B}{' '}
                        {item.correctOption === 'B' && (
                          <span className="ml-1 text-emerald-600">✓ (Correct)</span>
                        )}
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${
                          item.correctOption === 'C'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold mr-1.5">C.</span> {item.options.C}{' '}
                        {item.correctOption === 'C' && (
                          <span className="ml-1 text-emerald-600">✓ (Correct)</span>
                        )}
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${
                          item.correctOption === 'D'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="font-bold mr-1.5">D.</span> {item.options.D}{' '}
                        {item.correctOption === 'D' && (
                          <span className="ml-1 text-emerald-600">✓ (Correct)</span>
                        )}
                      </div>
                    </div>

                    {item.explanation && (
                      <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200">
                        <span className="font-bold block mb-1">
                          ব্যাখ্যা ও সমাধান বিশ্লেষণ (Psychometric Note):
                        </span>
                        <p className="leading-relaxed whitespace-pre-line">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>,
    { label: 'Loading item analysis…', variant: 'dashboard' }
  );
};
export default AdminItemAnalysis;
