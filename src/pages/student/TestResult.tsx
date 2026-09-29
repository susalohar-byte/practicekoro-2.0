import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Award,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Layers,
  Target,
  Zap,
  Trophy,
} from 'lucide-react';
import { formatSeconds } from '@/lib/utils';
import type { GradedResult, QuestionSolution, LiveTest, LiveTestParticipant } from '@/types';

export const TestResult: React.FC = () => {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const [searchParams] = useSearchParams();
  const liveTestId = searchParams.get('liveTestId');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [result, setResult] = useState<GradedResult | null>(null);
  const [solutions, setSolutions] = useState<QuestionSolution[]>([]);
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<LiveTestParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) return;
      setLoading(true);
      try {
        const [data, sols, lt, lb] = await Promise.all([
          api.getAttemptResult(attemptId),
          testId ? api.getAttemptSolutions(attemptId, testId).catch(() => []) : Promise.resolve([]),
          liveTestId ? api.getLiveTestById(liveTestId).catch(() => null) : Promise.resolve(null),
          liveTestId ? api.getLiveTestLeaderboard(liveTestId).catch(() => []) : Promise.resolve([]),
        ]);
        setResult(data);
        setSolutions(sols || []);
        setLiveTest(lt);
        setLiveLeaderboard(lb || []);
      } catch (err) {
        console.error('Failed to load attempt result:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId, testId, liveTestId]);

  const studentLiveEntry = useMemo(() => {
    if (!liveTestId || !liveLeaderboard.length) return null;
    return liveLeaderboard.find((p) => p.attemptId === attemptId || (user?.id && p.userId === user.id));
  }, [liveTestId, liveLeaderboard, attemptId, user?.id]);

  // Compute section-wise breakdown
  const sectionBreakdown = useMemo(() => {
    if (!solutions || solutions.length === 0) return [];
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        totalQs: number;
        attempted: number;
        correct: number;
        wrong: number;
        skipped: number;
        score: number;
      }
    >();

    solutions.forEach((sol) => {
      const sId = sol.subjectId || 'general';
      const sName = sol.subjectName || 'General Section';
      if (!map.has(sId)) {
        map.set(sId, {
          id: sId,
          name: sName,
          totalQs: 0,
          attempted: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
          score: 0,
        });
      }
      const sec = map.get(sId)!;
      sec.totalQs++;
      if (sol.selectedOption !== null) {
        sec.attempted++;
        if (sol.isCorrect) {
          sec.correct++;
          sec.score += sol.marksAwarded;
        } else {
          sec.wrong++;
          sec.score += sol.marksAwarded; // negative deduction
        }
      } else {
        sec.skipped++;
      }
    });

    return Array.from(map.values());
  }, [solutions]);

  // Weakest sections first: attempted + accuracy below 70%. These drive the
  // "practice loop" cards below (Result -> targeted Practice -> Re-test).
  const weakSections = useMemo(() => {
    return sectionBreakdown
      .filter((sec) => sec.attempted > 0)
      .map((sec) => ({
        ...sec,
        accuracy: Math.round((sec.correct / sec.attempted) * 100),
      }))
      .filter((sec) => sec.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);
  }, [sectionBreakdown]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center pk-student-page">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Result Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unable to locate the test attempt result.</p>
        <Link to="/exams" className="mt-4 inline-block">
          <Button size="sm">Back to Tests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Live Test Event Banner */}
      {liveTest && (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-rose-950/70 via-slate-900 to-indigo-950 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-inner">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  Live Test Event
                </span>
                {liveTest.rankingEnabled && studentLiveEntry?.rank && (
                  <span className="text-xs font-black text-amber-300">
                    Statewide Rank #{studentLiveEntry.rank}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white mt-1">
                {liveTest.title}
              </h2>
            </div>
          </div>

          <Link
            to="/live-test"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-md active:scale-95 shrink-0"
          >
            <span>Statewide Leaderboard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Top Banner Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white border-0 shadow-lg relative overflow-hidden rounded-3xl">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="success"
              className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
            >
              Exam Attempt Completed
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Attempt ID: {result.attemptId.slice(0, 12)}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {result.testTitle || 'Mock Test Performance Report'}
          </h1>

          {/* Main Scorecard Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-300">Total Score</p>
              <p className="text-2xl font-black text-white mt-0.5">
                {result.score.toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {result.totalMarks}</span>
              </p>
              <p className="text-[10px] text-indigo-300 font-semibold mt-0.5">
                {result.percentage.toFixed(1)}% Marks
              </p>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-300">Accuracy</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">
                {result.accuracy.toFixed(1)}%
              </p>
              <p className="text-[10px] text-emerald-300/80 font-semibold mt-0.5">
                {result.correctCount}/{result.correctCount + result.wrongCount} Attempted
              </p>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-300">
                {liveTest ? (liveTest.rankingEnabled ? 'Live State Rank' : 'Live Mode') : 'State Rank'}
              </p>
              <p className="text-2xl font-black text-blue-400 mt-0.5">
                {liveTest
                  ? liveTest.rankingEnabled
                    ? studentLiveEntry?.rank
                      ? `#${studentLiveEntry.rank}`
                      : '—'
                    : 'Practice'
                  : result.rank !== null
                    ? `#${result.rank}`
                    : '—'}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  {liveTest && liveTest.rankingEnabled && studentLiveEntry?.rank
                    ? `/ ${liveLeaderboard.length || result.totalCandidates}`
                    : result.rank !== null
                      ? `/ ${result.totalCandidates}`
                      : ''}
                </span>
              </p>
              <p className="text-[10px] text-blue-300/80 font-semibold mt-0.5">
                {liveTest
                  ? liveTest.rankingEnabled
                    ? studentLiveEntry?.rank
                      ? 'Verified Live Rank'
                      : 'Calculating Rank'
                    : 'Ranking Disabled'
                  : result.percentile !== null
                    ? `${result.percentile}th %ile`
                    : 'Rank Pending'}
              </p>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-300">Time Taken</p>
              <p className="text-2xl font-black text-slate-200 mt-0.5">
                {formatSeconds(result.timeSpentSeconds)}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Completed</p>
            </div>
          </div>
        </div>

        {/* Decorative background trophy icon */}
        <Award className="absolute right-4 -bottom-6 w-56 h-56 text-white/5 pointer-events-none" />
      </Card>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Correct Answers
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{result.correctCount}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Full marks awarded</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Incorrect Answers
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{result.wrongCount}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Negative marks deducted</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/60">
            <XCircle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Skipped / Unanswered
            </span>
            <p className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">{result.skippedCount}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">0 marks change</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700">
            <MinusCircle className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Section-Wise Performance Breakdown */}
      {sectionBreakdown.length > 0 && (
        <Card className="p-5 sm:p-6 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Section-Wise Performance Breakdown
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              {sectionBreakdown.length} Section{sectionBreakdown.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">Section</th>
                  <th className="px-3.5 py-2.5 text-center">Questions</th>
                  <th className="px-3.5 py-2.5 text-center">Attempted</th>
                  <th className="px-3.5 py-2.5 text-center text-emerald-600 dark:text-emerald-400">Correct</th>
                  <th className="px-3.5 py-2.5 text-center text-rose-600 dark:text-rose-400">Wrong</th>
                  <th className="px-3.5 py-2.5 text-center">Accuracy</th>
                  <th className="px-3.5 py-2.5 text-right font-bold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sectionBreakdown.map((sec) => {
                  const secAccuracy =
                    sec.attempted > 0 ? Math.round((sec.correct / sec.attempted) * 100) : 0;
                  return (
                    <tr key={sec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">{sec.name}</td>
                      <td className="px-3.5 py-2.5 text-center text-slate-600 dark:text-slate-300">{sec.totalQs}</td>
                      <td className="px-3.5 py-2.5 text-center text-slate-600 dark:text-slate-300">{sec.attempted}</td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {sec.correct}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-bold text-rose-600 dark:text-rose-400">
                        {sec.wrong}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {sec.attempted > 0 ? `${secAccuracy}%` : '—'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                        {sec.score.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Improve Weak Areas: close the Mock -> Practice -> Re-test loop */}
      {weakSections.length > 0 && (
        <Card className="p-5 sm:p-6 border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Focus on Your Weak Areas
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Practice these sections, then re-test to track improvement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {weakSections.map((sec) => (
              <div
                key={sec.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {sec.name}
                  </p>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shrink-0">
                    {sec.accuracy}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all"
                    style={{ width: `${sec.accuracy}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {sec.wrong} wrong · {sec.skipped} skipped of {sec.totalQs}
                </p>
                <Link
                  to={`/practice?tab=mistakes&subject=${encodeURIComponent(sec.name)}`}
                  className="mt-auto"
                >
                  <Button
                    size="sm"
                    className="w-full text-xs font-bold"
                    leftIcon={<Zap className="w-3.5 h-3.5" />}
                  >
                    Practice Mistakes
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Automatic Mistakes Notebook Banner */}
      {result.wrongCount > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Automated Mistakes Notebook Linkage:</span> We detected{' '}
            <strong>{result.wrongCount} wrong answers</strong>. These questions have been
            automatically added to your <strong>Mistakes Notebook</strong> so you can revise them
            without repeating mistakes.
          </div>
          <Link to="/practice">
            <Button
              size="sm"
              variant="outline"
              className="bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 shrink-0"
            >
              Open Notebook
            </Button>
          </Link>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          size="lg"
          className="w-full sm:w-auto font-bold shadow-md active:scale-95"
          rightIcon={<ChevronRight className="w-4 h-4" />}
          onClick={() => navigate(`/exams/${testId}/solutions/${attemptId}`)}
        >
          Review Detailed Question Solutions
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-xs active:scale-95"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={() => navigate(`/exams/${testId}`)}
          >
            Retake Mock Test
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto text-xs active:scale-95"
            onClick={() => navigate('/exams')}
          >
            Back to Tests
          </Button>
        </div>
      </div>
    </div>
  );
};
