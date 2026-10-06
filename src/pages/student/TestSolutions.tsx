import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { isMathematicsSubject, isMathematicsQuestion } from '@/utils/shortNotes';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Bookmark,
  ArrowLeft,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { MathText } from '@/components/common/MathText';
import type { QuestionSolution, MockTest } from '@/types';

export const TestSolutions: React.FC = () => {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const { user } = useAuth();
  const { isBilingualEnabled } = useContentLanguage();
  const navigate = useNavigate();

  const [solutions, setSolutions] = useState<QuestionSolution[]>([]);
  const [testMeta, setTestMeta] = useState<MockTest | null>(null);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct' | 'skipped'>('all');
  const [loading, setLoading] = useState(true);

  // Support / Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSubject, setReportSubject] = useState('');
  const [reportIssue, setReportIssue] = useState('');

  const handleReportQuestion = (sol: QuestionSolution, index: number) => {
    setReportSubject(`Question #${index + 1} Issue: ${sol.questionText.slice(0, 45)}...`);
    setReportIssue(
      `Test: ${testMeta?.title || 'Mock Test'}\nQuestion #${index + 1} (ID: ${sol.id})\nQuestion: ${sol.questionText}\n\nProblem details (e.g. wrong answer key, typo, translation error):\n`
    );
    setReportModalOpen(true);
  };

  useEffect(() => {
    async function loadSolutions() {
      if (!testId || !attemptId) return;
      setLoading(true);
      try {
        const [data, test] = await Promise.all([
          api.getAttemptSolutions(attemptId, testId),
          api.getTestById(testId).catch(() => null),
        ]);
        setSolutions(data);
        setTestMeta(test);
      } catch (err) {
        console.error('Failed to load solutions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSolutions();
  }, [testId, attemptId]);

  const handleToggleBookmark = async (qId: string) => {
    if (!user) return;
    const isNowBookmarked = await api.toggleBookmark(user.id, qId);
    setSolutions((prev) =>
      prev.map((s) => (s.id === qId ? { ...s, isBookmarked: isNowBookmarked } : s))
    );
  };

  const filteredSolutions = solutions.filter((s) => {
    if (filter === 'wrong') return s.selectedOption !== null && !s.isCorrect;
    if (filter === 'correct') return s.isCorrect;
    if (filter === 'skipped') return s.selectedOption === null;
    return true;
  });

  const correctCount = solutions.filter((s) => s.isCorrect).length;
  const wrongCount = solutions.filter((s) => s.selectedOption !== null && !s.isCorrect).length;
  const skippedCount = solutions.filter((s) => s.selectedOption === null).length;

  // Mathematics tests keep the classic step-by-step Explanation;
  // every other subject renders শর্ট নোটস (Short Notes) bullets.
  const isMathTest = isMathematicsSubject(testMeta?.subjectName || testMeta?.subjectId, {
    chapterName: testMeta?.chapterName,
    topicName: testMeta?.topicName,
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center pk-student-page">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/exams/${testId}/results/${attemptId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scorecard
        </button>

        <div className="flex items-center gap-2">
          <Link to="/practice">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            >
              Open Mistakes Notebook
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Detailed Solutions & Explanations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Question-wise authoritative answer key, student selection comparison, and detailed notes
        </p>
      </div>

      {/* Filter Tabs (Stitch rounded-full pills — Reference Screen 9) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#026BFC] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Questions ({solutions.length})
        </button>

        <button
          onClick={() => setFilter('wrong')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filter === 'wrong'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          Incorrect Answers ({wrongCount})
        </button>

        <button
          onClick={() => setFilter('correct')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filter === 'correct'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Correct Answers ({correctCount})
        </button>

        <button
          onClick={() => setFilter('skipped')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filter === 'skipped'
              ? 'bg-slate-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Skipped ({skippedCount})
        </button>
      </div>

      {/* Solutions List */}
      <div className="space-y-4">
        {filteredSolutions.map((sol, idx) => {
          const isWrong = sol.selectedOption !== null && !sol.isCorrect;
          const isSkipped = sol.selectedOption === null;

          return (
            <Card key={sol.id} className="p-6 border-slate-200 space-y-4">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700">
                    Q {sol.questionOrder}
                  </span>

                  {sol.subjectName && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md">
                      {sol.subjectName}
                    </span>
                  )}

                  {sol.isCorrect && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{sol.marksAwarded})
                    </Badge>
                  )}
                  {isWrong && (
                    <Badge
                      variant="warning"
                      className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Incorrect (
                      {sol.marksAwarded})
                    </Badge>
                  )}
                  {isSkipped && (
                    <Badge variant="default" className="gap-1">
                      <MinusCircle className="w-3.5 h-3.5 text-slate-400" /> Skipped (0)
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReportQuestion(sol, idx)}
                    className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Report question discrepancy / ডিসক্রিপেন্সি রিপোর্ট"
                  >
                    <Flag className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Report</span>
                  </button>

                  <button
                    onClick={() => handleToggleBookmark(sol.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      sol.isBookmarked
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    title={sol.isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
                  >
                    <Bookmark className={`w-4 h-4 ${sol.isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  <MathText>{!isBilingualEnabled
                    ? sol.questionBengaliText || sol.questionText
                    : sol.questionText}</MathText>
                </h3>
                {isBilingualEnabled && sol.questionBengaliText && (
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    <MathText>{sol.questionBengaliText}</MathText>
                  </p>
                )}
              </div>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const optText = sol[`option${opt}` as keyof QuestionSolution] as string;
                  const isAnswer = sol.correctOption === opt;
                  const isUserChoice = sol.selectedOption === opt;

                  let style = 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';

                  if (isAnswer) {
                    style =
                      'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 font-bold ring-1 ring-emerald-400 dark:ring-emerald-600';
                  } else if (isUserChoice && !sol.isCorrect) {
                    style =
                      'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-200 font-bold ring-1 ring-rose-400 dark:ring-rose-600';
                  }

                  return (
                    <div
                      key={opt}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${style}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center font-bold text-[10px] shrink-0">
                          {opt}
                        </span>
                        <span><MathText>{optText}</MathText></span>
                      </div>

                      {isAnswer && (
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 shrink-0">
                          Correct
                        </span>
                      )}
                      {isUserChoice && !sol.isCorrect && (
                        <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 shrink-0">
                          Your Choice
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Short Notes (non-Math) / Explanation (Math) */}
              {(() => {
                const isSolMath = isMathTest || isMathematicsQuestion(sol);
                return (
                  <ShortNotesBox
                    explanation={sol.explanationBengali || sol.explanation}
                    isMathematics={isSolMath}
                    title={
                      isSolMath
                        ? undefined
                        : !isBilingualEnabled
                          ? 'শর্ট নোটস'
                          : 'শর্ট নোটস (Short Notes)'
                    }
                    defaultExpanded={true}
                    collapsible={false}
                  />
                );
              })()}
            </Card>
          );
        })}
      </div>

      <StudentSupportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        defaultCategory="Test Issue"
        defaultSubject={reportSubject}
        defaultIssue={reportIssue}
      />
    </div>
  );
};
