import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  Clock,
  Bookmark,
  ChevronLeft,
  Send,
  AlertTriangle,
  Languages,
  Grid,
  X,
  RotateCcw,
} from 'lucide-react';
import { formatSeconds } from '@/lib/utils';
import type { MockTest, StudentTestQuestion, AttemptAnswerState } from '@/types';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { QuestionImage } from '@/components/common/QuestionImage';
import { isMathematicsQuestion } from '@/utils/shortNotes';

export const TestRunner: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const [attemptId, setAttemptId] = useState<string>(() => searchParams.get('attemptId') || '');
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<StudentTestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Question error report modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportSubject] = useState('');
  const [supportIssue] = useState('');

  // Attempt State
  const [answers, setAnswers] = useState<Record<string, AttemptAnswerState>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  // Question language follows the global setting.
  const { lang: language, setLang: setLanguage } = useLanguage();
  const { isBilingualEnabled } = useContentLanguage();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submitTestRef = useRef<() => void>(() => undefined);

  // 1. Initialize Test Data, Questions, and Attempt
  useEffect(() => {
    async function init() {
      if (!testId || !user) return;
      setLoading(true);
      try {
        // Check platform maintenance mode
        try {
          const settings = await api.getAppSettings();
          const maintSetting = settings.find((s) => s.key === 'maintenance_mode');
          const isMaint = maintSetting?.value === true || maintSetting?.value === 'true';
          if (isMaint && !isAdmin) {
            setIsMaintenanceMode(true);
            setLoading(false);
            return;
          }
        } catch {
          // ignore setting fetch failure
        }

        let activeAttemptId = attemptId;
        if (!activeAttemptId) {
          const newAttempt = await api.startTestAttempt(testId);
          activeAttemptId = newAttempt.attemptId;
          setAttemptId(activeAttemptId);
          navigate(`/exams/${testId}/runner?attemptId=${activeAttemptId}`, { replace: true });
        }

        const [testData, qData, attemptData] = await Promise.all([
          api.getTestById(testId),
          api.getStudentTestQuestions(testId),
          api.getTestAttempt(activeAttemptId),
        ]);

        // If attempt is already completed, redirect to results immediately (idempotency)
        if (attemptData?.status === 'completed') {
          navigate(`/exams/${testId}/results/${activeAttemptId}`, { replace: true });
          return;
        }

        setTest(testData);
        setQuestions(qData);

        // Load or initialize attempt answers from localStorage
        const savedCache = localStorage.getItem(`practicekoro_attempt_${activeAttemptId}`);
        if (savedCache) {
          try {
            const parsed = JSON.parse(savedCache);
            if (Array.isArray(parsed.answers)) {
              const map: Record<string, AttemptAnswerState> = {};
              parsed.answers.forEach((a: AttemptAnswerState) => {
                map[a.questionId] = a;
              });
              setAnswers(map);
            }
          } catch {
            // ignore
          }
        }

        // SERVER-SYNCHRONIZED COUNTDOWN TIMER:
        // Duration is locked to attempt.startTime + test.durationMinutes
        const totalDurationSecs = (testData?.durationMinutes || 15) * 60;
        const startTimestamp = attemptData?.startTime
          ? new Date(attemptData.startTime).getTime()
          : Date.now();
        const elapsedSecs = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
        const remainingSecs = Math.max(0, totalDurationSecs - elapsedSecs);

        setTimeRemaining(remainingSecs);
        setTimeSpent(elapsedSecs);

        if (qData.length > 0) {
          setVisited(new Set([qData[0].id]));
        }

        // If test time has already elapsed on load, submit immediately
        if (remainingSecs <= 0 && attemptData?.status === 'in_progress') {
          submitTestRef.current();
        }
      } catch (err) {
        console.error('Failed to load test runner data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [testId, attemptId, user, isAdmin, navigate]);

  // Submit test handler (Server-authoritative identity via auth.uid())
  const handleSubmitTest = useCallback(async () => {
    if (submitting || !user || !testId) return;
    setSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const answersArray = Object.values(answers);
      const submitRes = await api.submitTestAttempt(attemptId, answersArray, timeSpent, testId);

      const liveTestId = searchParams.get('liveTestId');
      if (liveTestId && user?.id) {
        try {
          await api.recordLiveTestSubmission(liveTestId, user.id, {
            attemptId,
            score: submitRes?.score ?? 0,
            accuracy: submitRes?.accuracy ?? 0,
            timeTaken: timeSpent,
          });
        } catch (liveErr) {
          console.warn('Failed to record live test submission:', liveErr);
        }
      }

      const resultsUrl = `/exams/${testId}/results/${attemptId}${liveTestId ? `?liveTestId=${encodeURIComponent(liveTestId)}` : ''}`;
      navigate(resultsUrl, { replace: true });
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Error submitting test. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, user, testId, answers, attemptId, timeSpent, navigate, searchParams]);

  submitTestRef.current = handleSubmitTest;

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitTest(); // Auto-submit when time reaches zero
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, timeRemaining, handleSubmitTest]);

  // 3. Debounced Autosave to Server
  useEffect(() => {
    if (loading || Object.keys(answers).length === 0) return;

    const handler = setTimeout(() => {
      api.saveAnswers(attemptId, Object.values(answers), timeSpent);
    }, 2000);

    return () => clearTimeout(handler);
  }, [answers, attemptId, timeSpent, loading]);

  const currentQ = questions[currentIndex];

  // Resolve accurate subject name for question badge (never false Mathematics)
  const currentSubjectName = useMemo(() => {
    if (!currentQ) return 'General Awareness';
    if (currentQ.subjectName && currentQ.subjectName.trim()) {
      return currentQ.subjectName.trim();
    }
    if (test?.subjectName && test.subjectName.trim()) {
      return test.subjectName.trim();
    }
    if (isMathematicsQuestion(currentQ)) {
      return 'Mathematics';
    }
    return 'General Awareness';
  }, [currentQ, test]);

  const subjectBadgeClass = useMemo(() => {
    const sub = currentSubjectName.toLowerCase();
    if (sub.includes('math') || sub.includes('গণিত')) {
      return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800';
    }
    if (sub.includes('reason') || sub.includes('যুক্তি')) {
      return 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800';
    }
    if (sub.includes('science') || sub.includes('বিজ্ঞান')) {
      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
    }
    if (sub.includes('history') || sub.includes('ইতিহাস') || sub.includes('bengali') || sub.includes('বাংলা')) {
      return 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800';
    }
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  }, [currentSubjectName]);

  // Mark question as visited when changing questions
  const goToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    const qId = questions[index].id;
    setVisited((prev) => new Set(prev).add(qId));
    setPaletteOpen(false);
  };

  // Option selection
  const handleSelectOption = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || {
        questionId: currentQ.id,
        selectedOption: null,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
      };

      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          selectedOption: option,
        },
      };
    });
  };

  // Clear answer
  const handleClearAnswer = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id];
      if (!existing) return prev;
      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          selectedOption: null,
        },
      };
    });
  };

  // Toggle Mark for Review
  const handleToggleMarkForReview = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || {
        questionId: currentQ.id,
        selectedOption: null,
        isMarkedForReview: false,
        timeSpentSeconds: 0,
      };

      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          isMarkedForReview: !existing.isMarkedForReview,
        },
      };
    });
  };

  // Question status derivation for the Question Palette
  const getQuestionState = (qId: string) => {
    const ans = answers[qId];
    const isAnswered = ans && ans.selectedOption !== null;
    const isMarked = ans && ans.isMarkedForReview;
    const isVisited = visited.has(qId);

    if (isAnswered && isMarked) return 'answered_and_marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    if (isVisited) return 'skipped';
    return 'unvisited';
  };

  // Summary counts
  const answeredCount = Object.values(answers).filter((a) => a.selectedOption !== null).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = questions.length - answeredCount;
  const isTimeWarning = timeRemaining > 0 && timeRemaining <= 600 && timeRemaining > 300; // < 10 mins (Amber)
  const isTimeCritical = timeRemaining > 0 && timeRemaining <= 300; // < 5 mins (Red Pulse)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pk-primary-bright mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Loading Secure Exam Session...</p>
        </div>
      </div>
    );
  }

  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  if (!currentQ) {
    return null;
  }

  const currentAnswer = answers[currentQ.id]?.selectedOption || null;
  const isCurrentMarked = answers[currentQ.id]?.isMarkedForReview || false;

  // Language content fallback: When bilingual is OFF, ALWAYS use Bengali.
  const displayedQuestionText = !isBilingualEnabled
    ? currentQ.questionBengaliText || currentQ.questionText
    : language === 'bn' && currentQ.questionBengaliText
      ? currentQ.questionBengaliText
      : currentQ.questionText;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* 1. TOP EXAM HEADER (Screen 11) */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label="Exit test"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-md">
            {test?.title || 'WBSSC Group D'}
          </h1>
          {searchParams.get('liveTestId') && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Live Test
            </span>
          )}
        </div>

        {/* Right Tools: Language Toggle & Submit */}
        <div className="flex items-center gap-2">
          {/* Language Toggle (only visible when Bilingual mode is ON) */}
          {isBilingualEnabled && (
            <button
              onClick={() => {
                setLanguage(language === 'bn' ? 'en' : 'bn');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors active:scale-95"
              title="Toggle Question Language"
            >
              <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{language === 'bn' ? 'বাংলা' : 'ENG'}</span>
            </button>
          )}

          {/* Palette Drawer Toggle */}
          <button
            onClick={() => setPaletteOpen(!paletteOpen)}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
            title="Question Palette"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Submit CTA */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            Submit
          </button>
        </div>
      </header>

      {/* SUB-HEADER STATUS BAR (Screen 11: Timer, Question Counter, Grid) */}
      <div className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Timer Pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
            isTimeCritical
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
              : isTimeWarning
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs'
          }`}
        >
          <Clock
            className={`w-3.5 h-3.5 ${
              isTimeCritical
                ? 'text-rose-600 dark:text-rose-400'
                : isTimeWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          />
          <span>{formatSeconds(timeRemaining)}</span>
        </div>

        {/* Center Progress Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
          <span>
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        {/* Section Pill or Palette indicator */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="p-1 rounded-full text-slate-500 hover:text-blue-600 transition-colors"
          title="Open Palette"
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* 2. MAIN BODY (QUESTION PANE & PALETTE) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER: QUESTION AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between max-w-4xl mx-auto w-full">
          <div className="space-y-4">
            {/* Subject Pill */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border transition-colors ${subjectBadgeClass}`}>
                {currentSubjectName}
              </span>

              {isCurrentMarked && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Bookmark className="w-3 h-3 fill-amber-500" />
                  Marked
                </span>
              )}
            </div>

            {/* Question Card (Screen 11) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {displayedQuestionText}
              </h2>

              {/* Question Figure / Diagram (Global Question Feature) */}
              <QuestionImage
                src={currentQ.imageUrl}
                alt={`Question ${currentIndex + 1} Diagram`}
                priority={true}
              />
            </div>

            {/* Options List (Screen 11: Rounded cards with letter radio) */}
            <div className="space-y-2.5 pt-1">
              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                const optText = currentQ[`option${optKey}` as keyof StudentTestQuestion] as string;
                const isSelected = currentAnswer === optKey;

                return (
                  <div
                    key={optKey}
                    onClick={() => handleSelectOption(optKey)}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 select-none ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Radio circle with letter */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {optKey}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug">
                      {optText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM NAVIGATION FOOTER (Screen 11) */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {/* Primary Previous / Next Row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => goToQuestion(currentIndex - 1)}
                className="py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-40 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 transition-colors"
              >
                &lt; Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentIndex < questions.length - 1) {
                    goToQuestion(currentIndex + 1);
                  } else {
                    setShowSubmitModal(true);
                  }
                }}
                className="py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-transform active:scale-[0.98]"
              >
                {currentIndex < questions.length - 1 ? 'Next >' : 'Finish Test'}
              </button>
            </div>

            {/* Sub actions: Mark | Clear */}
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
              <button
                type="button"
                onClick={handleToggleMarkForReview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Bookmark
                  className={`w-4 h-4 ${isCurrentMarked ? 'fill-amber-500 text-amber-600' : ''}`}
                />
                <span>{isCurrentMarked ? 'Unmark' : 'Mark'}</span>
              </button>

              {currentAnswer && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT: QUESTION PALETTE (DESKTOP & MOBILE DRAWER) */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xl lg:shadow-none transition-transform duration-200 ${
            paletteOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Grid className="w-4 h-4 text-blue-600" />
                Question Palette
              </h3>
              <button
                onClick={() => setPaletteOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Semantic State Legend */}
            <div className="grid grid-cols-2 gap-2 my-4 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                <span>Skipped ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-purple-600 shrink-0" />
                <span>Marked ({markedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700 shrink-0" />
                <span>Unvisited</span>
              </div>
            </div>

            {/* Numbered Palette Grid */}
            <div className="grid grid-cols-5 gap-2.5 max-h-[55vh] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const state = getQuestionState(q.id);
                const isCurrent = currentIndex === idx;

                const bgColors = {
                  answered: 'bg-emerald-500 text-white hover:bg-emerald-600',
                  marked: 'bg-purple-600 text-white hover:bg-purple-700',
                  answered_and_marked:
                    'bg-purple-600 text-white ring-2 ring-emerald-400 hover:bg-purple-700',
                  skipped: 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200',
                  unvisited: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                };

                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all relative ${bgColors[state]} ${
                      isCurrent ? 'ring-2 ring-pk-primary ring-offset-2 scale-105 shadow-md' : ''
                    }`}
                  >
                    {idx + 1}
                    {state === 'answered_and_marked' && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
              onClick={() => setShowSubmitModal(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Test ({answeredCount}/{questions.length})
            </Button>
          </div>
        </aside>
      </div>

      {/* 3. SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-100 dark:border-blue-900/60">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Submit Mock Test?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to complete and submit your exam attempt?
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 my-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Answered</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{answeredCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Unanswered</p>
                <p className="text-base font-black text-amber-600 dark:text-amber-400">{unansweredCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Marked</p>
                <p className="text-base font-black text-purple-600 dark:text-purple-400">{markedCount}</p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs rounded-xl border border-amber-200 dark:border-amber-800/80 mb-5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  You still have <strong>{unansweredCount} unanswered questions</strong>.
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
                isLoading={submitting}
                onClick={handleSubmitTest}
              >
                Yes, Submit My Test
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
              >
                Return to Exam
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Question Error / Support Ticket Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        defaultCategory="Test Issue"
        defaultSubject={supportSubject}
        defaultIssue={supportIssue}
      />
    </div>
  );
};
