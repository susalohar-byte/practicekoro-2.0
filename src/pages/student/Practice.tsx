import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import {
  usePracticeRevision,
  useRemoveBookmark,
  useResolveMistake,
} from '@/hooks/usePracticeRevision';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { QuestionImage } from '@/components/common/QuestionImage';
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
  ListChecks,
  FileText,
  XSquare,
  Crosshair,
  Table,
  Globe,
  Calculator,
  Brain,
  Monitor,
  Shuffle,
  SlidersHorizontal,
  BarChart2,
  Clock,
  Target,
  CheckSquare,
  Flame,
  Check,
} from 'lucide-react';
import type { Question } from '@/types';

type PracticeTab = 'dashboard' | 'topics' | 'mistakes' | 'bookmarks';
type PracticeModeTab = 'subjects' | 'topics' | 'pyq';

interface PracticeAnswerRecord {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

export const Practice: React.FC = () => {
  const { user } = useAuth();
  const { exams, selectedExam, setSelectedExam } = useExam();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [activeModeTab, setActiveModeTab] = useState<PracticeModeTab>('subjects');
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [activityPeriod, setActivityPeriod] = useState<'month' | 'week' | 'all'>('month');

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

  // 6 canonical subjects matching the reference UI
  const subjectsData = [
    {
      id: 'subj-gk',
      title: 'General Knowledge',
      questionsCount: '1,250',
      progress: 68,
      icon: BookOpen,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconBorder: 'border-emerald-100/70 dark:border-emerald-900/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressColor: 'bg-emerald-500',
    },
    {
      id: 'subj-ga',
      title: 'General Awareness',
      questionsCount: '980',
      progress: 54,
      icon: Globe,
      iconBg: 'bg-teal-50 dark:bg-teal-950/60',
      iconBorder: 'border-teal-100/70 dark:border-teal-900/60',
      iconColor: 'text-teal-600 dark:text-teal-400',
      progressColor: 'bg-teal-500',
    },
    {
      id: 'subj-math',
      title: 'Mathematics',
      questionsCount: '1,120',
      progress: 42,
      icon: Calculator,
      isSigma: true,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconBorder: 'border-blue-100/70 dark:border-blue-900/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      progressColor: 'bg-blue-600',
    },
    {
      id: 'subj-reasoning',
      title: 'Reasoning',
      questionsCount: '1,040',
      progress: 61,
      icon: Brain,
      iconBg: 'bg-rose-50 dark:bg-rose-950/60',
      iconBorder: 'border-rose-100/70 dark:border-rose-900/60',
      iconColor: 'text-rose-500 dark:text-rose-400',
      progressColor: 'bg-rose-500',
    },
    {
      id: 'subj-english',
      title: 'English',
      questionsCount: '860',
      progress: 48,
      icon: Languages,
      isBadgeA: true,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60',
      iconBorder: 'border-purple-100/70 dark:border-purple-900/60',
      iconColor: 'text-purple-600 dark:text-purple-400',
      progressColor: 'bg-purple-600',
    },
    {
      id: 'subj-computer',
      title: 'Computer Awareness',
      questionsCount: '420',
      progress: 35,
      icon: Monitor,
      iconBg: 'bg-sky-50 dark:bg-sky-950/60',
      iconBorder: 'border-sky-100/70 dark:border-sky-900/60',
      iconColor: 'text-sky-600 dark:text-sky-400',
      progressColor: 'bg-sky-500',
    },
  ];

  // 3 Continue Practicing items matching reference UI
  const continueItems = [
    {
      id: 'cont-1',
      title: 'Blood Relations',
      subjectSubtitle: 'Reasoning • 25 questions',
      progress: 68,
      buttonText: 'Continue',
      icon: BookOpen,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'cont-2',
      title: 'Indian History - Medieval',
      subjectSubtitle: 'General Knowledge • 30 questions',
      progress: 33,
      buttonText: 'Continue',
      icon: BookOpen,
      iconBg: 'bg-rose-50 dark:bg-rose-950/60',
      iconColor: 'text-rose-500 dark:text-rose-400',
    },
    {
      id: 'cont-3',
      title: 'Simplification',
      subjectSubtitle: 'Mathematics • 20 questions',
      progress: 0,
      buttonText: 'Start',
      icon: Calculator,
      isSigma: true,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 pb-20 pk-student-page">
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
                {!isBilingualEnabled || languageMode === 'bengali'
                  ? currentQuestion.questionBengaliText || currentQuestion.questionText
                  : currentQuestion.questionText || currentQuestion.questionBengaliText}
              </p>
            </div>

            {/* Question Diagram / Image */}
            <QuestionImage
              src={currentQuestion.imageUrl}
              alt="Practice Question Diagram"
              priority={true}
            />

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
                    <span className="text-sm font-medium pt-0.5 flex-1">{optText}</span>

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
              VIEW 1: PRACTICE DASHBOARD (100% Visual Replica of Reference Screenshot)
              ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* TOP HERO BANNER */}
              <div className="relative overflow-hidden rounded-3xl border border-blue-100/90 dark:border-blue-900/40 bg-gradient-to-r from-[#EBF5FE] via-[#E2EEFD] to-[#D5E8FD] dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 p-6 sm:p-7 md:p-8 min-h-[175px] shadow-2xs">
                <div className="max-w-xl z-10 relative">
                  <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                    Practice <span className="text-[#0158FC]">Smarter</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 font-normal leading-relaxed max-w-lg">
                    Build your concepts, improve accuracy and get exam ready with focused practice.
                  </p>

                  {/* 5 Feature Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                      <BookOpen className="w-3.5 h-3.5 text-[#0158FC]" />
                      <span>Chapter-wise Practice</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                      <Table className="w-3.5 h-3.5 text-blue-500" />
                      <span>Topic-wise Practice</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Previous Year Questions</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                      <Bookmark className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>Saved Questions</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                      <Crosshair className="w-3.5 h-3.5 text-[#0158FC]" />
                      <span>Detailed Solutions</span>
                    </div>
                  </div>
                </div>

                {/* Right Character & Books Illustration */}
                <div className="hidden md:block absolute right-0 bottom-0 h-full max-h-[185px] pointer-events-none select-none">
                  <img
                    src="/images/practice/hero_illustration_blend.png"
                    alt="Consistent Practice Creates Big Results"
                    className="h-full w-auto object-contain object-bottom"
                  />
                </div>
              </div>

              {/* TWO COLUMN GRID LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ========================================================= */}
                {/* LEFT MAIN COLUMN (~68%)                                   */}
                {/* ========================================================= */}
                <div className="lg:col-span-8 space-y-6">
                  {/* SECTION A: Choose what you want to practice */}
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          Choose what you want to practice
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Select a mode and start practicing now.
                        </p>
                      </div>

                      {/* Doodle graphic on the right */}
                      <div className="hidden sm:block shrink-0 select-none pointer-events-none">
                        <img
                          src="/images/practice/pick_mode_doodle_clean.png"
                          alt="Pick a mode & start now!"
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    </div>

                    {/* 5 Mode Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {/* Card 1: Subject Practice */}
                      <div
                        onClick={() => {
                          setActiveModeTab('subjects');
                          document
                            .getElementById('exam-subject-section')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-left shadow-2xs hover:shadow-md hover:border-purple-400/50 dark:hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100/70 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                            <BookOpen className="w-4.5 h-4.5" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug">
                            Subject Practice
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Practice by subject
                          </p>
                        </div>
                      </div>

                      {/* Card 2: Topic Practice */}
                      <div
                        onClick={() => handleTabChange('topics')}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-left shadow-2xs hover:shadow-lg hover:border-emerald-300/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/70 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <ListChecks className="w-4.5 h-4.5" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug">
                            Topic Practice
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Practice by topic
                          </p>
                        </div>
                      </div>

                      {/* Card 3: Previous Year Questions */}
                      <div
                        onClick={() => navigate('/exams')}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-left shadow-sm hover:shadow-md hover:border-amber-300/50 dark:hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100/70 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug">
                            Previous Year Questions
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Real exam questions
                          </p>
                        </div>
                      </div>

                      {/* Card 4: Saved Questions */}
                      <div
                        onClick={() => handleTabChange('bookmarks')}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-left shadow-sm hover:shadow-md hover:border-rose-300/50 dark:hover:border-rose-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100/70 dark:border-rose-900/60 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0">
                            <Bookmark className="w-4.5 h-4.5 fill-rose-500" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug">
                            Saved Questions
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Your bookmarked questions
                          </p>
                        </div>
                      </div>

                      {/* Card 5: Incorrect Questions */}
                      <div
                        onClick={() => handleTabChange('mistakes')}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-left shadow-sm hover:shadow-md hover:border-red-300/50 dark:hover:border-red-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100/70 dark:border-red-900/60 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
                            <XSquare className="w-4.5 h-4.5" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
                        </div>
                        <div className="mt-3">
                          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug">
                            Incorrect Questions
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Practice your mistakes
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION B: Select Exam & Subject */}
                  <section id="exam-subject-section" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Select Exam & Subject
                      </h2>
                      <button
                        onClick={() => navigate('/exams')}
                        className="text-xs font-semibold text-[#0158FC] hover:underline cursor-pointer transition-colors"
                      >
                        Change Exam
                      </button>
                    </div>

                    {/* Filter Controls Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Exam Dropdown Selector Pill */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsExamDropdownOpen((prev) => !prev)}
                          className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-[#0158FC] font-bold text-[9px] flex items-center justify-center shrink-0">
                            {selectedExam?.title
                              ? selectedExam.title.slice(0, 2).toUpperCase()
                              : 'WB'}
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {selectedExam?.title || 'WBP Constable'}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExamDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Dropdown Menu for Switching Exams */}
                        {isExamDropdownOpen && (
                          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Select Practice Exam
                            </div>
                            {exams.map((ex) => (
                              <button
                                key={ex.id}
                                type="button"
                                onClick={() => {
                                  setSelectedExam(ex);
                                  setIsExamDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors ${
                                  selectedExam?.id === ex.id
                                    ? 'font-bold text-[#0158FC] bg-blue-50/50 dark:bg-blue-950/40'
                                    : 'text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <span>{ex.title}</span>
                                {selectedExam?.id === ex.id && (
                                  <Check className="w-3.5 h-3.5 text-[#0158FC]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Segmented Filter Tabs: [Subjects] [Topics] [PYQ] */}
                      <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => setActiveModeTab('subjects')}
                          className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                            activeModeTab === 'subjects'
                              ? 'bg-[#0158FC] text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Subjects
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTabChange('topics')}
                          className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                            activeModeTab === 'topics'
                              ? 'bg-[#0158FC] text-white shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Topics
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/exams')}
                          className="text-xs font-semibold px-4 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                          PYQ
                        </button>
                      </div>
                    </div>

                    {/* 6 Subject Cards in 3 Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {subjectsData.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleTabChange('topics')}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-left shadow-sm hover:shadow-lg hover:border-blue-200/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-xl ${item.iconBg} border ${item.iconBorder} flex items-center justify-center ${item.iconColor} shrink-0`}
                                >
                                  {item.isSigma ? (
                                    <span className="font-serif font-black text-base leading-none">
                                      Σ
                                    </span>
                                  ) : item.isBadgeA ? (
                                    <span className="font-sans font-black text-sm leading-none">
                                      A
                                    </span>
                                  ) : (
                                    <Icon className="w-4.5 h-4.5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug truncate">
                                    {item.title}
                                  </h3>
                                  <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    {item.questionsCount} questions
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                            </div>

                            {/* Progress Bar & Percentage */}
                            <div className="flex items-center gap-2.5 mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${item.progressColor}`}
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                {item.progress}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* SECTION C: Continue Practicing */}
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          Continue Practicing
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Pick up where you left off.
                        </p>
                      </div>
                      <button
                        onClick={() => handleTabChange('topics')}
                        className="text-xs font-semibold text-[#0158FC] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 3 Continue Practicing Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      {continueItems.map((cont) => {
                        const Icon = cont.icon;
                        return (
                          <div
                            key={cont.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 text-left shadow-sm hover:shadow-lg hover:border-blue-200/50 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl ${cont.iconBg} flex items-center justify-center ${cont.iconColor} shrink-0`}
                              >
                                {cont.isSigma ? (
                                  <span className="font-serif font-black text-base leading-none">
                                    Σ
                                  </span>
                                ) : (
                                  <Icon className="w-4.5 h-4.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white leading-snug truncate">
                                  {cont.title}
                                </h3>
                                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                  {cont.subjectSubtitle}
                                </p>
                              </div>
                            </div>

                            {/* Progress bar + Action Button */}
                            <div className="flex items-center justify-between gap-3 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[#0158FC]"
                                    style={{ width: `${cont.progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                  {cont.progress}%
                                </span>
                              </div>

                              <button
                                onClick={() => handleTabChange('topics')}
                                className="px-3.5 py-1.5 bg-[#0158FC] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all"
                              >
                                {cont.buttonText}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* ========================================================= */}
                {/* RIGHT SIDEBAR COLUMN (~32%)                               */}
                {/* ========================================================= */}
                <div className="lg:col-span-4 space-y-5">
                  {/* CARD 1: Your Practice Activity */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
                        Your Practice Activity
                      </h2>
                      <div className="relative">
                        <select
                          value={activityPeriod}
                          onChange={(e) =>
                            setActivityPeriod(e.target.value as 'month' | 'week' | 'all')
                          }
                          className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-1 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="month">This Month</option>
                          <option value="week">This Week</option>
                          <option value="all">All Time</option>
                        </select>
                      </div>
                    </div>

                    {/* 2x2 Stats Grid */}
                    <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                      {/* Stat 1: Questions Practiced */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0158FC] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                            342
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-tight">
                            Questions Practiced
                          </div>
                        </div>
                      </div>

                      {/* Stat 2: Accuracy */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                            78%
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-tight">
                            Accuracy
                          </div>
                        </div>
                      </div>

                      {/* Stat 3: Topics Completed */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                            12
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-tight">
                            Topics Completed
                          </div>
                        </div>
                      </div>

                      {/* Stat 4: Day Streak */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                            7
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1 leading-tight">
                            Day Streak
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Quick Tools */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
                    <h2 className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
                      Quick Tools
                    </h2>

                    <div className="space-y-2 pt-1">
                      {/* Tool 1: Random Practice */}
                      <div
                        onClick={() => handleTabChange('topics')}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center shrink-0">
                            <Shuffle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">
                              Random Practice
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              Get random questions
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      {/* Tool 2: Custom Practice */}
                      <div
                        onClick={() => handleTabChange('topics')}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                            <SlidersHorizontal className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">
                              Custom Practice
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              Create your own set
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      {/* Tool 3: Weak Topic Practice */}
                      <div
                        onClick={() => handleTabChange('mistakes')}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                            <BarChart2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">
                              Weak Topic Practice
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              Focus on low accuracy topics
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      {/* Tool 4: Time-based Practice */}
                      <div
                        onClick={() => handleTabChange('topics')}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0158FC] flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white">
                              Time-based Practice
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                              Improve speed & accuracy
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Motivational Quote Card with Succulent Plant */}
                  <div className="bg-gradient-to-br from-[#EEF6FF] via-[#E8F2FC] to-[#E3EFFF] dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-blue-100/70 dark:border-blue-900/40 p-5 shadow-2xs flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-3xl sm:text-4xl text-[#2563EB]/40 font-serif leading-none block">
                        “
                      </span>
                      <p className="italic font-bold text-xs sm:text-[13px] text-blue-950 dark:text-blue-200 leading-snug">
                        &ldquo;Discipline today
                        <br />
                        Success tomorrow.&rdquo;
                      </p>
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 pt-1">
                        — PracticeKoro
                      </div>
                    </div>

                    {/* Plant image */}
                    <div className="w-14 sm:w-16 h-auto shrink-0 select-none pointer-events-none">
                      <img
                        src="/images/practice/quote_plant_clean.png"
                        alt="PracticeKoro Growth"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

                            <QuestionImage
                              src={q.imageUrl}
                              alt="Mistake Question Diagram"
                              maxHeightClass="max-h-44"
                              className="!my-2 !justify-start"
                            />
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

                            <QuestionImage
                              src={q.imageUrl}
                              alt="Bookmark Question Diagram"
                              maxHeightClass="max-h-44"
                              className="!my-2 !justify-start"
                            />

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
