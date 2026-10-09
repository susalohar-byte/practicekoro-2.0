import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { StudentLoading, StudentLoadError } from '@/components/student/StudentLoadState';
import { getErrorMessage } from '@/lib/errors';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { CheckCircle2, AlertTriangle, Play, Lock, ChevronLeft, FileCheck2 } from 'lucide-react';
import type { MockTest } from '@/types';

export const TestDetails: React.FC = () => {
  const { id, testId: routeTestId } = useParams<{ id?: string; testId?: string }>();
  const testId = routeTestId ?? id;
  const { user } = useAuth();
  const { hasAccessToTest } = useSubscription();
  const navigate = useNavigate();

  const [test, setTest] = useState<MockTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryLoad, setRetryLoad] = useState(0);
  const startLock = useRef(false);
  const [startError, setStartError] = useState('');
  const [starting, setStarting] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadTest() {
      if (!testId) { setLoading(false); setTest(null); return; }
      setLoading(true);
      setLoadError('');
      try {
        const data = await api.getTestById(testId);
        if (active) setTest(data);
      } catch (err) {
        if (active) setLoadError(getErrorMessage(err, 'Unable to load test details. Please retry.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTest();
    return () => { active = false; };
  }, [testId, retryLoad]);

  if (loading) return <StudentLoading label="Loading test details" />;
  if (loadError) return <StudentLoadError message={loadError} onRetry={() => setRetryLoad(v => v + 1)} />;

  if (!test) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Mock Test Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested test may have been moved or removed.
        </p>
        <Link to="/exams" className="mt-4 inline-block">
          <Button size="sm">Back to Tests</Button>
        </Link>
      </div>
    );
  }

  const marksPerQuestion = (test.totalMarks / (test.totalQuestions || 1)).toFixed(2);
  const isAccessible = hasAccessToTest(test.isPremium);

  const handleStartTest = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/exams/${test.id}` } } });
      return;
    }

    if (!isAccessible) {
      setShowSubModal(true);
      return;
    }

    if (startLock.current) return;
    startLock.current = true;
    setStartError('');
    setStarting(true);
    try {
      const attemptInfo = await api.startTestAttempt(test.id);
      navigate(`/exams/${test.id}/runner?attemptId=${attemptInfo.attemptId}`);
    } catch (err) {
      console.error('Failed to start attempt:', err);
      setStartError(getErrorMessage(err, 'Failed to initialize test attempt. Please try again.'));
    } finally {
      setStarting(false);
      startLock.current = false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {startError && <p role="alert" className="p-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 rounded-xl">{startError}</p>}
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Test List
      </button>

      {/* Main Header Card */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={test.isPremium ? 'premium' : 'free'}>
                {test.isPremium ? 'PRO PASS TEST' : 'FREE MOCK TEST'}
              </Badge>
              {test.testType === 'full_mock' && (
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🎯 Full Mock
                </span>
              )}
              {test.testType === 'pyq' && (
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  📜 PYQ Paper {test.year ? `• ${test.year}` : ''}
                </span>
              )}
              {(test.testType === 'topic' ||
                test.testType === 'chapter_mock' ||
                test.testType === 'subject_mock') && (
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  📚 Topic Test
                </span>
              )}
              {test.testSeriesTitle && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  ✨ Series: {test.testSeriesTitle}
                </span>
              )}
              {test.examTitle && (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {test.examTitle}
                </span>
              )}
              {test.subjectName && (
                <span className="text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {test.subjectName}
                </span>
              )}
              {test.chapterName && (
                <span className="text-xs text-slate-500 font-medium">
                  {test.chapterName}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {test.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {test.description ||
                'Comprehensive exam simulation with live countdown timer and negative marking.'}
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <Button
              size="lg"
              variant={!isAccessible ? 'pro' : 'primary'}
              isLoading={starting}
              onClick={handleStartTest}
              leftIcon={
                !isAccessible ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )
              }
              className="w-full sm:w-auto font-bold text-sm shadow-md"
            >
              {!isAccessible ? 'Unlock Pro Pass' : 'Start Test Now'}
            </Button>
          </div>
        </div>

        {/* Dynamic Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Questions</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{test.totalQuestions}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Time Limit</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{test.durationMinutes} Mins</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Marks</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{test.totalMarks}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Marking Scheme</p>
            <p className="text-sm font-black text-slate-900 mt-1">
              <span className="text-emerald-600">+{marksPerQuestion}</span>
              {test.negativeMarking > 0 && (
                <>
                  {' / '}
                  <span className="text-rose-600">-{test.negativeMarking}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Pro Pass Callout for Free Students on Premium Tests (PART G) */}
        {!isAccessible && (
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    🔒 Premium Mock Test
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    ₹299 / 365 Days
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Unlock this and every other premium mock test with Pro Pass. One subscription,
                  universal access.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="pro"
              onClick={() => navigate('/subscription')}
              className="w-full sm:w-auto font-bold text-xs shrink-0 shadow-xs"
            >
              Get Pro Pass
            </Button>
          </div>
        )}
      </Card>

      {/* Instructions & Guidelines */}
      <Card className="p-6 border-slate-200 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-brand-600" />
          Exam Instructions & Rules (নির্দেশাবলি)
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Negative Marking Notice:</span>{' '}
              {test.negativeMarking > 0 ? (
                <>
                  Every incorrect answer will deduct <strong>{test.negativeMarking} marks</strong>.
                  Unanswered questions do not carry negative marks.
                </>
              ) : (
                <>
                  There is <strong>no negative marking</strong> in this test. Unanswered
                  questions do not carry negative marks.
                </>
              )}
            </div>
          </div>

          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Total Duration:</strong> You will have{' '}
              <strong>{test.durationMinutes} minutes</strong> to complete all{' '}
              <strong>{test.totalQuestions} questions</strong>.
            </li>
            <li>
              <strong>Language Support:</strong> Questions can be viewed in{' '}
              <strong>বাংলা (Bengali)</strong> or <strong>English</strong> using the language toggle
              in the exam runner without losing your selected answers.
            </li>
            <li>
              <strong>Mark for Review:</strong> You can mark doubtful questions to revisit later
              before final submission.
            </li>
            <li>
              <strong>Auto-Submission:</strong> Once the countdown timer reaches zero, your test
              will be submitted automatically with your saved answers.
            </li>
            <li>
              <strong>Mistakes Notebook:</strong> Any wrong answers will automatically be archived
              in your <strong>Mistakes Notebook</strong> for focused post-test revision.
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Clicking Start Test begins your countdown session immediately.
          </span>
          <Button
            size="md"
            variant={!isAccessible ? 'pro' : 'primary'}
            isLoading={starting}
            onClick={handleStartTest}
            leftIcon={
              !isAccessible ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )
            }
            className="w-full sm:w-auto font-bold"
          >
            {!isAccessible ? 'Unlock with Pro Pass' : 'Start Test'}
          </Button>
        </div>
      </Card>

      {/* Subscription Modal (PART A & G: NON-PUNITIVE PRO PASS LOCK UX) */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              🔒 Premium Mock Test
            </span>

            <h3 className="text-lg font-black text-slate-900 mt-2">{test.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {test.examTitle || 'WBP Constable'} {test.chapterName ? `• ${test.chapterName}` : ''}
            </p>

            <div className="my-5 p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-xl border border-amber-200 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    PracticeKoro Pro Pass
                  </span>
                  <span className="text-[11px] text-slate-500">Universal All-Access Pass</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-700 block">₹299</span>
                  <span className="text-[10px] font-semibold text-slate-500">/ 365 Days</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pt-1 border-t border-amber-200/60">
                Unlock this and every other premium mock test with Pro Pass. No individual test
                purchases required.
              </p>

              <ul className="text-[11px] text-slate-700 space-y-1 pt-1">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Access ALL Premium Mock Tests across all exams
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Automated Mistakes Notebook & detailed solutions
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Full re-attempt support across all test series
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                variant="pro"
                className="w-full font-bold"
                onClick={() => {
                  setShowSubModal(false);
                  navigate('/subscription');
                }}
              >
                Get Pro Pass — ₹299
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-500"
                onClick={() => setShowSubModal(false)}
              >
                Continue with Free Tests
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
