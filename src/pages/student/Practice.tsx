import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  usePracticeRevision,
  useRemoveBookmark,
  useResolveMistake,
} from '@/hooks/usePracticeRevision';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { MathText } from '@/components/common/MathText';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import { TopicTests } from '@/pages/student/TopicTests';
import {
  AlertTriangle,
  Bookmark,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  Play,
  Languages,
  RefreshCw,
  Trash2,
  Award,
  BookOpen,
  FileText,
  Crosshair,
  Globe,
  Calculator,
  Brain,
  Monitor,
  Clock,
  Target,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Question } from '@/types';

type PracticeTab = 'dashboard' | 'topics' | 'mistakes' | 'bookmarks';

interface PracticeAnswerRecord {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

export const Practice: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: practiceCatalog = { subjects: [], chapters: [], tests: [], attempts: [] } } = useQuery({
    queryKey: ['practice-catalog', user?.id],
    queryFn: async () => {
      const [subjects, chapters, tests, attempts] = await Promise.all([
        api.getSubjects(),
        api.getAllChapters(),
        api.getTests(),
        user?.id ? api.getUserAttempts(user.id) : Promise.resolve([]),
      ]);
      return { subjects, chapters, tests, attempts };
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Revision data: cached mistakes + bookmarks (TanStack Query)
  const {
    data: revision,
    isLoading: loading,
    isError: revisionError,
    refetch: loadData,
  } = usePracticeRevision(user?.id);
  const mistakes = useMemo(() => revision?.mistakes ?? [], [revision]);
  const bookmarks = useMemo(() => revision?.bookmarks ?? [], [revision]);
  const error = revisionError
    ? 'Unable to load revision items. Please check your connection.'
    : null;
  const resolveMistake = useResolveMistake(user?.id);
  const removeBookmark = useRemoveBookmark(user?.id);

  // Tab state
  const [activeTab, setActiveTab] = useState<PracticeTab>('dashboard');

  // List view state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Interactive Practice Session state
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceSource, setPracticeSource] = useState<'mistakes' | 'bookmarks'>('mistakes');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [sessionAnswers, setSessionAnswers] = useState<PracticeAnswerRecord[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const { isBilingualEnabled } = useContentLanguage();
  const [languageMode, setLanguageMode] = useState<'bengali' | 'english'>('bengali');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Sync active tab with URL (?tab=mistakes|bookmarks|topics) and optional
  // deep-link subject filter (?subject=Name) e.g. from a test result's
  // "weak areas" card.
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subjectParam = searchParams.get('subject');
    const pathSuffix = location.pathname.split('/').pop() || '';

    let nextTab: PracticeTab = 'dashboard';
    if (tabParam === 'mistakes' || pathSuffix === 'mistakes') {
      nextTab = 'mistakes';
    } else if (tabParam === 'bookmarks' || pathSuffix === 'bookmarks') {
      nextTab = 'bookmarks';
    } else if (tabParam === 'topics' || pathSuffix === 'topics') {
      nextTab = 'topics';
    } else {
      nextTab = 'dashboard';
    }

    setActiveTab((prev) => {
      if (prev !== nextTab) {
        setSelectedSubjectFilter(subjectParam || 'all');
        setExpandedId(null);
        setIsPracticing(false);
        setIsSessionComplete(false);
      } else if (subjectParam) {
        setSelectedSubjectFilter(subjectParam);
      }
      return nextTab;
    });
  }, [location.pathname, searchParams]);

  const handleTabChange = useCallback(
    (tab: PracticeTab) => {
      setActiveTab(tab);
      setSelectedSubjectFilter('all');
      setExpandedId(null);
      setIsPracticing(false);
      setIsSessionComplete(false);
      if (tab === 'dashboard') {
        setSearchParams({}, { replace: false });
      } else {
        setSearchParams({ tab }, { replace: false });
      }
    },
    [setSearchParams]
  );

  // Derived metrics
  const pendingMistakes = useMemo(() => mistakes.filter((m) => !m.isResolved), [mistakes]);

  // Available subjects for filtering in mistakes/bookmarks views
  const availableSubjects = useMemo(() => {
    const activeList =
      activeTab === 'mistakes' ? mistakes : activeTab === 'bookmarks' ? bookmarks : [];
    const set = new Set<string>();
    activeList.forEach((item) => {
      if (item.subjectName) set.add(item.subjectName);
    });
    return Array.from(set);
  }, [activeTab, mistakes, bookmarks]);

  // Filtered lists
  const filteredMistakes = useMemo(() => {
    if (selectedSubjectFilter === 'all') return mistakes;
    return mistakes.filter((m) => m.subjectName === selectedSubjectFilter);
  }, [mistakes, selectedSubjectFilter]);

  const filteredBookmarks = useMemo(() => {
    if (selectedSubjectFilter === 'all') return bookmarks;
    return bookmarks.filter((b) => b.subjectName === selectedSubjectFilter);
  }, [bookmarks, selectedSubjectFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleToggleResolve = async (mistakeId: string, currentResolvedState: boolean) => {
    setResolvingId(mistakeId);
    try {
      await resolveMistake.mutateAsync({ mistakeId, nextState: !currentResolvedState });
    } catch (err) {
      console.error('Failed to update mistake resolution:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string, questionId: string) => {
    if (!user) return;
    try {
      await removeBookmark.mutateAsync({ bookmarkId, questionId });
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  // Interactive practice session
  const startPracticeSession = (source: 'mistakes' | 'bookmarks') => {
    const list =
      source === 'mistakes'
        ? filteredMistakes.filter((m) => !m.isResolved).map((m) => m.question)
        : filteredBookmarks.map((b) => b.question);

    if (list.length === 0) return;

    setPracticeSource(source);
    setPracticeQuestions(list);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setSessionAnswers([]);
    setIsSessionComplete(false);
    setIsPracticing(true);
  };

  const currentQuestion = practiceQuestions[currentIndex];

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctOption;
    setIsAnswerSubmitted(true);

    setSessionAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOption,
        isCorrect,
      },
    ]);

    if (practiceSource === 'mistakes' && isCorrect) {
      const foundMistake = mistakes.find((m) => m.questionId === currentQuestion.id);
      if (foundMistake && !foundMistake.isResolved) {
        handleToggleResolve(foundMistake.id, false);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsSessionComplete(true);
    }
  };

  const handleExitPractice = () => {
    setIsPracticing(false);
    setIsSessionComplete(false);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setSessionAnswers([]);
  };

  const sessionTotal = sessionAnswers.length;
  const sessionCorrect = sessionAnswers.filter((a) => a.isCorrect).length;
  const sessionWrong = sessionTotal - sessionCorrect;
  const sessionAccuracy =
    sessionTotal > 0 ? ((sessionCorrect / sessionTotal) * 100).toFixed(1) : '0';


  return (
    <div className="space-y-4 sm:space-y-5 pb-12 pk-student-page">

      {/* =========================================================================
          PRACTICE MODE: INTERACTIVE WORKSPACE
          ========================================================================= */}
      {isPracticing && !isSessionComplete && currentQuestion && (
        <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
          {/* Practice Header & Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0158FC]">
                  {practiceSource === 'mistakes' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-[#0158FC]" />
                  )}
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {practiceSource === 'mistakes' ? 'Mistakes Revision' : 'Bookmark Practice'}
                  </h2>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    Question {currentIndex + 1} of {practiceQuestions.length}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {isBilingualEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setLanguageMode((prev) => (prev === 'bengali' ? 'english' : 'bengali'));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="Switch question language"
                  >
                    <Languages className="w-3.5 h-3.5 text-[#0158FC]" />
                    <span>{languageMode === 'bengali' ? 'বাংলা' : 'English'}</span>
                  </button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExitPractice}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                >
                  Exit
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0158FC] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-5 sm:p-7 border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
              {currentQuestion.subjectName && (
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md font-semibold text-slate-700 dark:text-slate-300">
                  {currentQuestion.subjectName}
                </span>
              )}
              {currentQuestion.chapterName && (
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md text-slate-600 dark:text-slate-400">
                  {currentQuestion.chapterName}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                <MathText>{!isBilingualEnabled || languageMode === 'bengali'
                  ? currentQuestion.questionBengaliText || currentQuestion.questionText
                  : currentQuestion.questionText || currentQuestion.questionBengaliText}</MathText>
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5 pt-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optKey = `option${opt}` as keyof Question;
                const optText = String(currentQuestion[optKey] || '');
                const isSelected = selectedOption === opt;
                const isCorrectOption = currentQuestion.correctOption === opt;

                let stateStyles =
                  'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50';

                if (isAnswerSubmitted) {
                  if (isCorrectOption) {
                    stateStyles =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500';
                  } else if (isSelected && !isCorrectOption) {
                    stateStyles =
                      'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 ring-1 ring-rose-400';
                  } else {
                    stateStyles =
                      'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-800/40';
                  }
                } else if (isSelected) {
                  stateStyles =
                    'border-[#0158FC] bg-blue-50/60 dark:bg-blue-950/40 text-slate-900 dark:text-white ring-1 ring-[#0158FC]';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${stateStyles}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border ${
                        isAnswerSubmitted && isCorrectOption
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isAnswerSubmitted && isSelected && !isCorrectOption
                            ? 'bg-rose-600 text-white border-rose-600'
                            : isSelected
                              ? 'bg-[#0158FC] text-white border-[#0158FC]'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {opt}
                    </span>
                    <span className="text-sm font-medium pt-0.5 flex-1"><MathText>{optText}</MathText></span>

                    {isAnswerSubmitted && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Explanation */}
            {isAnswerSubmitted && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                <div
                  className={`p-3 rounded-xl flex items-center gap-2.5 font-bold text-xs ${
                    selectedOption === currentQuestion.correctOption
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {selectedOption === currentQuestion.correctOption ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Correct! You identified the right answer.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                      <span>
                        Incorrect. The correct answer is{' '}
                        <strong>Option {currentQuestion.correctOption}</strong>.
                      </span>
                    </>
                  )}
                </div>

                <ShortNotesBox
                  explanation={currentQuestion.explanationBengali || currentQuestion.explanation}
                  isMathematics={isMathematicsQuestion(currentQuestion)}
                  title={
                    isMathematicsQuestion(currentQuestion)
                      ? undefined
                      : !isBilingualEnabled
                        ? 'শর্ট নোটস'
                        : 'শর্ট নোটস (Short Notes)'
                  }
                  defaultExpanded={true}
                  collapsible={false}
                />
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {isAnswerSubmitted
                  ? currentIndex < practiceQuestions.length - 1
                    ? 'Review explanation and proceed'
                    : 'Last question in session'
                  : 'Select an option to check your answer'}
              </span>

              {!isAnswerSubmitted ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOption}
                  className="font-bold text-xs sm:text-sm px-5"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="font-bold text-xs sm:text-sm px-5"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {currentIndex < practiceQuestions.length - 1
                    ? 'Next Question'
                    : 'Finish Practice'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          PRACTICE SESSION RESULTS SUMMARY
          ========================================================================= */}
      {isPracticing && isSessionComplete && (
        <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <Card className="p-6 sm:p-8 text-center border-slate-200 dark:border-slate-800 shadow-md space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-200 dark:border-emerald-800">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Practice Session Complete!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Here are your verified analytics for this revision drill:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Practiced</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {sessionTotal}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Correct</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{sessionCorrect}</p>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/60">
                <p className="text-[10px] uppercase font-bold text-rose-600">Wrong</p>
                <p className="text-xl font-black text-rose-600 mt-0.5">{sessionWrong}</p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60">
                <p className="text-[10px] uppercase font-bold text-[#0158FC]">Accuracy</p>
                <p className="text-xl font-black text-blue-950 dark:text-blue-300 mt-0.5">
                  {sessionAccuracy}%
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-4">
              <Button
                variant="outline"
                onClick={() => startPracticeSession(practiceSource)}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="w-full sm:w-auto font-bold text-xs"
              >
                Practice Again
              </Button>
              <Button onClick={handleExitPractice} className="w-full sm:w-auto font-bold text-xs">
                Back to Revision Hub
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          MAIN VIEWS (When not in interactive practice session)
          ========================================================================= */}
      {!isPracticing && (
        <>
          {/* Breadcrumb Row */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              {activeTab === 'dashboard'
                ? 'Practice'
                : activeTab === 'topics'
                  ? 'Topic Tests'
                  : activeTab === 'mistakes'
                    ? 'Mistakes Notebook'
                    : 'Saved Questions'}
            </span>
          </div>

          {/* Sub-view Navigation Bar (When on dedicated tabs) */}
          {activeTab !== 'dashboard' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTabChange('dashboard')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Practice Hub</span>
                </button>

                {/* Sub-view switcher pills */}
                <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleTabChange('topics')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'topics'
                        ? 'bg-[#0158FC] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Topic Tests
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('mistakes')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'mistakes'
                        ? 'bg-[#0158FC] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Mistakes {pendingMistakes.length > 0 ? `(${pendingMistakes.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('bookmarks')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'bookmarks'
                        ? 'bg-[#0158FC] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Saved {bookmarks.length > 0 ? `(${bookmarks.length})` : ''}
                  </button>
                </div>
              </div>

              {activeTab === 'mistakes' && pendingMistakes.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => startPracticeSession('mistakes')}
                  className="font-bold text-xs shadow-xs rounded-full bg-[#0158FC] text-white"
                  leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                >
                  Practice Mistakes ({pendingMistakes.length})
                </Button>
              )}

              {activeTab === 'bookmarks' && bookmarks.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => startPracticeSession('bookmarks')}
                  className="font-bold text-xs shadow-xs rounded-full bg-[#0158FC] text-white"
                  leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                >
                  Practice Bookmarks ({bookmarks.length})
                </Button>
              )}
            </div>
          )}

          {/* ERROR BANNER */}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between gap-3 text-rose-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void loadData();
                }}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="text-rose-700 border-rose-300 hover:bg-rose-100 font-bold text-xs"
              >
                Retry
              </Button>
            </div>
          )}

          {/* =========================================================================
              VIEW 1: PRACTICE DASHBOARD (1:1 PracticeKoro App UI)
              ========================================================================= */}
          {activeTab === 'dashboard' && (() => {
            const subjectThemes = [
              ['bg-[#EBF3FF] dark:bg-blue-950/50', 'text-[#2563EB] dark:text-blue-400', FileText],
              ['bg-[#E6F8EE] dark:bg-emerald-950/50', 'text-[#16A34A] dark:text-emerald-400', Calculator],
              ['bg-[#F3E8FF] dark:bg-purple-950/50', 'text-[#9333EA] dark:text-purple-400', BookOpen],
              ['bg-[#FFE4E6] dark:bg-rose-950/50', 'text-[#E11D48] dark:text-rose-400', Brain],
              ['bg-[#FEF3C7] dark:bg-amber-950/50', 'text-[#D97706] dark:text-amber-400', Sparkles],
              ['bg-[#E0F2FE] dark:bg-sky-950/50', 'text-[#0284C7] dark:text-sky-400', Monitor],
              ['bg-[#FCE7F3] dark:bg-pink-950/50', 'text-[#DB2777] dark:text-pink-400', Clock],
              ['bg-[#DCFCE7] dark:bg-green-950/50', 'text-[#15803D] dark:text-green-400', Globe],
            ] as const;
            const allSubjectsList = practiceCatalog.subjects.map((subject, index) => {
              const chaptersCount = practiceCatalog.chapters.filter(
                (chapter) => chapter.subjectId === subject.id
              ).length;
              const theme = subjectThemes[index % subjectThemes.length];
              const normalized = subject.name.toLowerCase();
              const symbol = normalized.includes('bengali') ? 'অ' : normalized.includes('english') ? 'A' : undefined;
              return {
                id: subject.id,
                title: subject.name,
                chaptersCount: `${chaptersCount} Chapters`,
                iconBg: theme[0],
                iconColor: theme[1],
                icon: symbol ? undefined : theme[2],
                symbol,
                symbolBg: normalized.includes('bengali')
                  ? 'bg-[#EA580C] text-white'
                  : 'bg-[#9333EA] text-white',
              };
            });
            const subjectFilters = ['All Subjects', ...allSubjectsList.map((subject) => subject.title)];

            const continueItemsList = practiceCatalog.attempts
              .filter((attempt) => attempt.status === 'in_progress')
              .slice(0, 3)
              .map((attempt, index) => {
                const completed = (attempt.correctCount || 0) + (attempt.wrongCount || 0);
                const total = Math.max(completed, attempt.totalQuestions || 0);
                return {
                id: attempt.id,
                testId: attempt.testId,
                title: attempt.testTitle || 'Test in progress',
                subtitle: attempt.examTitle || attempt.subjectName || 'Continue your test',
                completed,
                total,
                pct: total > 0 ? Math.round((completed / total) * 100) : 0,
                icon: subjectThemes[index % subjectThemes.length][2],
                iconBg: `${subjectThemes[index % subjectThemes.length][0]} ${subjectThemes[index % subjectThemes.length][1]}`,
              };
              });

            const quickItemsList = [
              {
                id: 'quick_10',
                title: '10 Questions',
                subtitle: 'Daily Practice',
                icon: Target,
                iconBg: 'bg-[#E6F8EE] text-[#16A34A]',
              },
              {
                id: 'quick_25',
                title: '25 Questions',
                subtitle: 'Mixed Practice',
                icon: FileText,
                iconBg: 'bg-[#FFEDD5] text-[#EA580C]',
              },
              {
                id: 'quick_50',
                title: '50 Questions',
                subtitle: 'Full Practice',
                icon: Award,
                iconBg: 'bg-[#F3E8FF] text-[#8B5CF6]',
              },
            ];

            const query = (searchParams.get('q') || '').trim().toLowerCase();
            const selectedFilter = searchParams.get('subject_filter') || 'All Subjects';

            const filteredSubjects = allSubjectsList.filter((item) => {
              const matchesFilter =
                selectedFilter === 'All Subjects' ||
                item.title.toLowerCase() === selectedFilter.toLowerCase();
              const matchesQuery =
                query === '' ||
                item.title.toLowerCase().includes(query) ||
                item.chaptersCount.toLowerCase().includes(query);
              return matchesFilter && matchesQuery;
            });

            return (
              <div className="space-y-4 sm:space-y-5">
                {/* ── 1. TITLE & SUBTITLE (App Practice Header) ── */}
                <div>
                  <h1 className="text-2xl sm:text-[28px] font-black text-[#051A43] dark:text-white tracking-tight leading-tight">
                    Practice
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400 font-medium mt-1">
                    Subject-wise practice to strengthen your preparation
                  </p>

                  {/* ── 2. SUBJECT CATEGORY FILTER PILLS ── */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-3 scrollbar-none">
                    {subjectFilters.map((filter) => {
                      const isSelected = selectedFilter === filter;
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            const newParams = new URLSearchParams(searchParams);
                            if (filter === 'All Subjects') {
                              newParams.delete('subject_filter');
                            } else {
                              newParams.set('subject_filter', filter);
                            }
                            setSearchParams(newParams);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-[#026BFC] text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          {filter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── 3. SEARCH BAR (App PKSearchFilterBar) ── */}
                <div className="space-y-2">
                  <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs px-3.5 py-2">
                    <Crosshair className="w-4 h-4 text-[#026BFC] shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={searchParams.get('q') || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newParams = new URLSearchParams(searchParams);
                        if (val) {
                          newParams.set('q', val);
                        } else {
                          newParams.delete('q');
                        }
                        setSearchParams(newParams);
                      }}
                      placeholder="Search subject or chapter..."
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.delete('q');
                          setSearchParams(newParams);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Quick Revision Access Chips */}
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleTabChange('mistakes')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Mistakes Notebook</span>
                      {pendingMistakes.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                          {pendingMistakes.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('bookmarks')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[#026BFC] dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Saved Questions</span>
                      {bookmarks.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#026BFC] text-white text-[10px]">
                          {bookmarks.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── 4. SECTION 1: SUBJECTS (2-Column Grid on Mobile, 3-4 Column on Desktop) ── */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#026BFC]" />
                      <h2 className="text-sm sm:text-base font-black text-[#051A43] dark:text-white tracking-tight">
                        Subjects
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('topics')}
                      className="text-xs sm:text-sm font-bold text-[#026BFC] hover:underline flex items-center gap-1"
                    >
                      <span>See All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {filteredSubjects.map((sub) => {
                      const Icon = sub.icon;
                      return (
                        <button
                          type="button"
                          key={sub.id}
                          onClick={() => handleTabChange('topics')}
                          className="w-full h-16 px-3 py-2 text-left rounded-2xl bg-white dark:bg-slate-900 border border-[#E8EEF7] dark:border-slate-800 shadow-[0_2px_8px_rgba(11,31,91,0.03)] hover:border-[#0877FF]/40 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Icon or Symbol Box */}
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${sub.iconBg} ${sub.iconColor}`}
                            >
                              {sub.symbol ? (
                                <span
                                  className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs ${sub.symbolBg}`}
                                >
                                  {sub.symbol}
                                </span>
                              ) : Icon ? (
                                <Icon className="w-4 h-4" />
                              ) : null}
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white truncate group-hover:text-[#026BFC] transition-colors leading-tight">
                                {sub.title}
                              </h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                                {sub.chaptersCount}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0877FF] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── 5. SECTION 2: CONTINUE PRACTICE ── */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#026BFC]" />
                      <h2 className="text-sm sm:text-base font-black text-[#051A43] dark:text-white tracking-tight">
                        Continue Practice
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('topics')}
                      className="text-xs sm:text-sm font-bold text-[#026BFC] hover:underline flex items-center gap-1"
                    >
                      <span>See All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {continueItemsList.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#026BFC]/60 transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-start gap-2.5 mb-2">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-[13px] font-bold text-[#051A43] dark:text-white truncate">
                                {item.title}
                              </h4>
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1 my-1">
                            <div className="flex items-center justify-between text-[10.5px] font-bold">
                              <span className="text-slate-600 dark:text-slate-400">
                                {item.completed}/{item.total} questions
                              </span>
                              <span className="text-[#026BFC]">{item.pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-[#026BFC] rounded-full"
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/exams/${item.testId}/runner?attemptId=${item.id}`)}
                            className="mt-2 w-full py-1.5 rounded-lg bg-[#026BFC] hover:bg-[#0256CA] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
                          >
                            <span>Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ── 6. SECTION 3: QUICK PRACTICE ── */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#026BFC]" />
                      <h2 className="text-sm sm:text-base font-black text-[#051A43] dark:text-white tracking-tight">
                        Quick Practice
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabChange('topics')}
                      className="text-xs sm:text-sm font-bold text-[#026BFC] hover:underline flex items-center gap-1"
                    >
                      <span>See All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {quickItemsList.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleTabChange('topics')}
                          className="h-14 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#026BFC]/60 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white truncate group-hover:text-[#026BFC] transition-colors leading-tight">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-[#026BFC] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            );
          })()}

          {/* =========================================================================
              VIEW 2: TOPIC TESTS
              ========================================================================= */}
          {activeTab === 'topics' && <TopicTests />}

          {/* =========================================================================
              VIEW 3: MISTAKES NOTEBOOK
              ========================================================================= */}
          {activeTab === 'mistakes' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong className="font-bold">Automated Mistakes Tracking:</strong> Questions
                    answered incorrectly during any mock test are auto-collected here. Practice each
                    one to reinforce your concepts.
                  </div>
                </div>

                {pendingMistakes.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => startPracticeSession('mistakes')}
                    className="font-bold text-xs shrink-0 self-stretch sm:self-auto shadow-xs"
                    leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                  >
                    Practice Mistakes
                  </Button>
                )}
              </div>

              {/* Subject Filter Chips */}
              {availableSubjects.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  <span className="text-slate-400 text-[11px] font-medium shrink-0">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border ${
                      selectedSubjectFilter === 'all'
                        ? 'bg-[#0158FC] text-white border-[#0158FC]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All Subjects
                  </button>
                  {availableSubjects.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedSubjectFilter(subj)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border ${
                        selectedSubjectFilter === subj
                          ? 'bg-[#0158FC] text-white border-[#0158FC]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredMistakes.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                    You don&apos;t have any mistakes to revise yet.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    Every question you answer incorrectly in mock tests is automatically collected
                    here so you can practice and master them.
                  </p>
                  <Button
                    onClick={() => navigate('/exams')}
                    className="mt-4 font-bold text-xs sm:text-sm shadow-xs"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Take a Mock Test
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredMistakes.map((item, idx) => {
                    const q = item.question;
                    const isExpanded = expandedId === item.id;

                    return (
                      <Card
                        key={item.id}
                        className={`p-5 transition-all border ${
                          item.isResolved
                            ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                            : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-400 uppercase">
                                Question #{idx + 1}
                              </span>
                              <Badge variant="warning" size="sm" className="text-[10px]">
                                Wrong {item.wrongCount}x
                              </Badge>
                              {item.isResolved ? (
                                <Badge variant="success" size="sm" className="text-[10px]">
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="outline" size="sm" className="text-[10px]">
                                  Pending
                                </Badge>
                              )}
                              {item.subjectName && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {item.subjectName}
                                </span>
                              )}
                              {item.chapterName && (
                                <span className="text-[10px] text-slate-400">
                                  {item.chapterName}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-0.5">
                              {!isBilingualEnabled
                                ? q.questionBengaliText || q.questionText
                                : q.questionText}
                            </h3>
                            {isBilingualEnabled && q.questionBengaliText && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium font-sans">
                                {q.questionBengaliText}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {/* Expandable Options & Explanation */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                const optKey = `option${opt}` as keyof Question;
                                const isCorrect = q.correctOption === opt;
                                return (
                                  <div
                                    key={opt}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-semibold'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center font-bold text-[10px]">
                                      {opt}
                                    </span>
                                    <span>{String(q[optKey])}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <ShortNotesBox
                              explanation={q.explanationBengali || q.explanation}
                              isMathematics={isMathematicsQuestion(q)}
                              title={
                                isMathematicsQuestion(q) ? undefined : 'শর্ট নোটস (Short Notes)'
                              }
                              defaultExpanded={true}
                              collapsible={false}
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                size="sm"
                                variant={item.isResolved ? 'outline' : 'primary'}
                                disabled={resolvingId === item.id}
                                onClick={() => handleToggleResolve(item.id, item.isResolved)}
                                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                className="text-xs font-bold"
                              >
                                {item.isResolved
                                  ? 'Mark as Unresolved'
                                  : 'Mark as Understood & Resolved'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 4: BOOKMARKED QUESTIONS
              ========================================================================= */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Bookmark className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
                    <strong className="font-bold">Bookmarked Questions:</strong> High-yield
                    questions saved during tests. Practice them to keep key concepts sharp before
                    exam day.
                  </div>
                </div>

                {bookmarks.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => startPracticeSession('bookmarks')}
                    className="font-bold text-xs shrink-0 self-stretch sm:self-auto shadow-xs"
                    leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                  >
                    Practice Bookmarks
                  </Button>
                )}
              </div>

              {/* Subject Filter Chips */}
              {availableSubjects.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  <span className="text-slate-400 text-[11px] font-medium shrink-0">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border ${
                      selectedSubjectFilter === 'all'
                        ? 'bg-[#0158FC] text-white border-[#0158FC]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All Subjects
                  </button>
                  {availableSubjects.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedSubjectFilter(subj)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border ${
                        selectedSubjectFilter === subj
                          ? 'bg-[#0158FC] text-white border-[#0158FC]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <Card className="p-10 text-center border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                    No bookmarked questions yet.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    While taking mock tests, click the bookmark icon to save important questions for
                    quick revision here.
                  </p>
                  <Button
                    onClick={() => navigate('/exams')}
                    className="mt-4 font-bold text-xs sm:text-sm shadow-xs"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Browse Mock Tests
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredBookmarks.map((bm, idx) => {
                    const q = bm.question;
                    const isExpanded = expandedId === bm.id;

                    return (
                      <Card
                        key={bm.id}
                        className="p-5 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="info" size="sm" className="text-[10px]">
                                Bookmark #{idx + 1}
                              </Badge>
                              {bm.subjectName && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {bm.subjectName}
                                </span>
                              )}
                              {bm.chapterName && (
                                <span className="text-[10px] text-slate-400">{bm.chapterName}</span>
                              )}
                              <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                                {new Date(bm.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-0.5">
                              {!isBilingualEnabled
                                ? q.questionBengaliText || q.questionText
                                : q.questionText}
                            </h3>
                            {isBilingualEnabled && q.questionBengaliText && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium font-sans">
                                {q.questionBengaliText}
                              </p>
                            )}

                            {bm.note && (
                              <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-lg text-xs text-amber-900 dark:text-amber-200 mt-2">
                                <span className="font-bold">Student Note:</span> {bm.note}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveBookmark(bm.id, bm.questionId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Remove Bookmark"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleExpand(bm.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Options & Explanation */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in duration-150">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                const optKey = `option${opt}` as keyof Question;
                                const isCorrect = q.correctOption === opt;
                                return (
                                  <div
                                    key={opt}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-semibold'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center font-bold text-[10px]">
                                      {opt}
                                    </span>
                                    <span>{String(q[optKey])}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <ShortNotesBox
                              explanation={q.explanationBengali || q.explanation}
                              isMathematics={isMathematicsQuestion(q)}
                              title={
                                isMathematicsQuestion(q) ? undefined : 'শর্ট নোটস (Short Notes)'
                              }
                              defaultExpanded={true}
                              collapsible={false}
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
