import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { ResultRankingCard } from '@/components/student/ResultRankingCard';
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
  BarChart3,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { formatSeconds, cn } from '@/lib/utils';
import type {
  GradedResult,
  QuestionSolution,
  LiveTest,
  LiveTestParticipant,
  StudentApplicableCutoff,
  AttemptRankings,
} from '@/types';
import { CATEGORY_LABELS, GENDER_LABELS } from '@/types';

export const TestResult: React.FC = () => {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const [searchParams] = useSearchParams();
  const liveTestId = searchParams.get('liveTestId');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [result, setResult] = useState<GradedResult | null>(null);
  const [solutions, setSolutions] = useState<QuestionSolution[]>([]);
  const [negativeMarksDeducted, setNegativeMarksDeducted] = useState<number | null>(null);
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<LiveTestParticipant[]>([]);
  const [attemptRankings, setAttemptRankings] = useState<AttemptRankings | null>(null);
  const [applicableCutoff, setApplicableCutoff] = useState<StudentApplicableCutoff | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to detect exam identifier based on test title or student's target exam
  const detectExamId = (title?: string, fallbackTarget?: string): string => {
    const text = `${title || ''} ${fallbackTarget || ''}`.toLowerCase();
    if (text.includes('clerkship')) return 'wbpsc-clerkship';
    if (text.includes('kp si') || text.includes('kolkata police')) return 'kp-si';
    if (text.includes('wbcs')) return 'wbcs-exe';
    if (text.includes('tet') || text.includes('primary')) return 'wb-primary-tet';
    if (text.includes('constable') || text.includes('wbp')) return 'wbp-constable';
    return 'wbp-constable';
  };

  useEffect(() => {
    async function loadResult() {
      if (!attemptId) return;
      setLoading(true);
      try {
        const [data, sols, lt, lb, savedNegativeMarks, rkData] = await Promise.all([
          api.getAttemptResult(attemptId),
          testId ? api.getAttemptSolutions(attemptId, testId).catch(() => []) : Promise.resolve([]),
          liveTestId ? api.getLiveTestById(liveTestId).catch(() => null) : Promise.resolve(null),
          liveTestId && typeof api.getLiveTestLeaderboard === 'function'
            ? api.getLiveTestLeaderboard(liveTestId).catch(() => [])
            : Promise.resolve([]),
          testId && typeof api.getAttemptNegativeMarks === 'function'
            ? api.getAttemptNegativeMarks(attemptId, testId).catch(() => null)
            : Promise.resolve(null),
          typeof api.getAttemptRankings === 'function'
            ? api.getAttemptRankings(attemptId).catch(() => null)
            : Promise.resolve(null),
        ]);
        setResult(data);
        setSolutions(sols || []);
        const solutionNegativeMarks = (sols || []).reduce(
          (total, solution) => total + Math.max(0, -solution.marksAwarded),
          0
        );
        setNegativeMarksDeducted(savedNegativeMarks ?? (sols?.length ? solutionNegativeMarks : null));
        setLiveTest(lt);
        setLiveLeaderboard(lb || []);
        setAttemptRankings(rkData);

        // Fetch category-aware applicable cutoff benchmarks for this student
        const targetExamId = detectExamId(data?.testTitle, user?.targetExamTitle);
        if (typeof api.getStudentApplicableCutoff === 'function') {
          try {
            const cutoffInfo = await api.getStudentApplicableCutoff(targetExamId, user || undefined);
            setApplicableCutoff(cutoffInfo);
          } catch (cutoffErr) {
            console.warn('Could not load applicable cutoff benchmark:', cutoffErr);
          }
        }
      } catch (err) {
        console.error('Failed to load attempt result:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId, testId, liveTestId, user]);

  const studentLiveEntry = useMemo(() => {
    if (!liveTestId || !liveLeaderboard.length) return null;
    return liveLeaderboard.find(
      (p) => p.attemptId === attemptId || (user?.id && p.userId === user.id)
    );
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
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Unable to locate the test attempt result.
        </p>
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
              <h2 className="text-base font-bold text-white mt-1">{liveTest.title}</h2>
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

      {/* Top Banner Card (Solid Primary Blue #026BFC — Reference Screen 8) */}
      <Card className="p-6 sm:p-8 bg-[#026BFC] text-white border-0 shadow-xl shadow-blue-500/20 relative overflow-hidden rounded-3xl">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="success"
              className="bg-white/20 text-white border-white/30 backdrop-blur-xs font-bold"
            >
              Passed
            </Badge>
            <span className="text-xs text-blue-100 font-mono">
              Attempt ID: {result.attemptId.slice(0, 12)}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {result.testTitle || 'Mock Test Performance Report'}
          </h1>

          {/* Main Scorecard Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-blue-100">Your Score</p>
              <p className="text-2xl font-black text-white mt-0.5">
                {result.score.toFixed(2)}{' '}
                <span className="text-xs text-blue-200 font-normal">/ {result.totalMarks}</span>
              </p>
              <p className="text-[10px] text-blue-100 font-semibold mt-0.5">
                {result.percentage.toFixed(1)}% Marks
              </p>
            </div>

            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-blue-100">Accuracy</p>
              <p className="text-2xl font-black text-white mt-0.5">
                {result.accuracy.toFixed(1)}%
              </p>
              <p className="text-[10px] text-blue-100 font-semibold mt-0.5">
                {result.correctCount}/{result.correctCount + result.wrongCount} Attempted
              </p>
            </div>

            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-blue-100">
                {liveTest
                  ? liveTest.rankingEnabled
                    ? 'Live State Rank'
                    : 'Live Mode'
                  : 'State Rank'}
              </p>
              <p className="text-2xl font-black text-white mt-0.5">
                {liveTest
                  ? liveTest.rankingEnabled
                    ? studentLiveEntry?.rank
                      ? `#${studentLiveEntry.rank}`
                      : '—'
                    : 'Practice'
                  : result.rank !== null
                    ? `#${result.rank}`
                    : '—'}{' '}
                <span className="text-xs text-blue-200 font-normal">
                  {liveTest && liveTest.rankingEnabled && studentLiveEntry?.rank
                    ? `/ ${liveLeaderboard.length || result.totalCandidates}`
                    : result.rank !== null
                      ? `/ ${result.totalCandidates}`
                      : ''}
                </span>
              </p>
              <p className="text-[10px] text-blue-100 font-semibold mt-0.5">
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

            <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
              <p className="text-[10px] uppercase font-bold text-blue-100">Time Taken</p>
              <p className="text-2xl font-black text-white mt-0.5">
                {formatSeconds(result.timeSpentSeconds)}
              </p>
              <p className="text-[10px] text-blue-100 font-semibold mt-0.5">Completed</p>
            </div>
          </div>
        </div>

        {/* Decorative background trophy icon */}
        <Award className="absolute right-4 -bottom-6 w-56 h-56 text-white/5 pointer-events-none" />
      </Card>

      <ResultRankingCard attemptId={result.attemptId} />

      {/* ==================================================================== */}
      {/* SECTIONS 14, 15, 16: REAL COMPETITIVE EXAM CUTOFF BENCHMARK & COMPARISON */}
      {/* ==================================================================== */}
      {applicableCutoff && (
        <Card className="p-6 sm:p-7 border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 rounded-3xl space-y-6 shadow-md">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#026BFC]/10 text-[#026BFC] dark:bg-[#026BFC]/20 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Competitive Exam Cutoff Benchmark
                  </h2>
                  <Badge variant="brand" className="text-[10px] uppercase font-bold tracking-wider">
                    {applicableCutoff.examTitle}
                  </Badge>
                  {applicableCutoff.expectedCutoff?.stage && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {applicableCutoff.expectedCutoff.stage} Stage
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Demographic category-aware performance comparison against expected benchmarks and verified official cutoffs
                </p>
              </div>
            </div>

            {/* Student Context Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Category: {CATEGORY_LABELS[applicableCutoff.studentCategory] || 'General / UR'}
              </span>
              {applicableCutoff.isGenderApplicable ? (
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Gender: {GENDER_LABELS[applicableCutoff.studentGender] || 'Specified'}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Gender: Common Merit (All Genders)
                </span>
              )}
            </div>
          </div>

          {/* Section 15 Non-Guarantee Advisory Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important Educational Benchmark Notice:</span> PracticeKoro{' '}
              <strong>Expected Cutoffs</strong> are algorithmic target estimates calculated to guide your study plan.
              Mock examination scores provide diagnostic preparation feedback and do{' '}
              <strong>NOT</strong> guarantee recruitment qualification or final government selection.
            </div>
          </div>

          {/* Section 15: The 7 Core Benchmark Performance Numbers */}
          {(() => {
            const expCutoff = applicableCutoff.expectedCutoff?.cutoffMarks ?? null;
            const maxMarks = result.totalMarks;
            const wbRank = attemptRankings?.westBengal?.rank ?? result.rank ?? null;
            const distRank = attemptRankings?.district?.rank ?? null;
            const distName = attemptRankings?.district?.name || user?.district || 'District';

            // Calculate score difference relative to expected cutoff
            const diff = expCutoff !== null ? Number((result.score - expCutoff).toFixed(2)) : null;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {/* 1. Your Score */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Your Score
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {result.score.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">out of {maxMarks}</p>
                </div>

                {/* 2. Maximum Marks */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Max Marks
                  </p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1">
                    {maxMarks}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Total Paper</p>
                </div>

                {/* 3. Accuracy */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Accuracy
                  </p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {result.accuracy.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {result.correctCount} / {result.correctCount + result.wrongCount} attempted
                  </p>
                </div>

                {/* 4. West Bengal Rank */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    WB Rank
                  </p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {wbRank ? `#${wbRank}` : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">West Bengal State</p>
                </div>

                {/* 5. District Rank */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    District Rank
                  </p>
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {distRank ? `#${distRank}` : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{distName}</p>
                </div>

                {/* 6. Expected Cutoff */}
                <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Expected Cutoff
                    </p>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      Estimate
                    </span>
                  </div>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {expCutoff !== null ? expCutoff.toFixed(2) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PracticeKoro Benchmark</p>
                </div>

                {/* 7. Difference from Expected Cutoff */}
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border shadow-2xs col-span-2 sm:col-span-1',
                    diff === null
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
                      : diff >= 0
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                  )}
                >
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Difference
                  </p>
                  <p
                    className={cn(
                      'text-xl font-black mt-1',
                      diff === null
                        ? 'text-slate-600 dark:text-slate-300'
                        : diff >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {diff === null
                      ? '—'
                      : diff >= 0
                        ? `+${diff.toFixed(2)} marks`
                        : `${diff.toFixed(2)} marks`}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] font-semibold mt-0.5 truncate',
                      diff === null
                        ? 'text-slate-400'
                        : diff >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {diff === null
                      ? 'No benchmark'
                      : diff >= 0
                        ? 'Ahead of expected cutoff'
                        : 'Below expected cutoff'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Section 16: Visual Cutoff Comparison */}
          <div className="p-5 bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Cutoff Comparison: Your Score vs Expected Cutoff vs Official Cutoff
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Standardized on {applicableCutoff.examTitle} scoring rules
              </span>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-3.5 pt-1">
              {/* Bar 1: Your Score */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#026BFC]" />
                    <span>Your Mock Score</span>
                  </span>
                  <span className="font-black text-[#026BFC]">
                    {result.score.toFixed(2)}{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      / {result.totalMarks} ({((result.score / result.totalMarks) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#026BFC] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, (result.score / result.totalMarks) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bar 2: Expected Cutoff */}
              {applicableCutoff.expectedCutoff && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>
                        Expected Cutoff ({applicableCutoff.expectedCutoff.year} {applicableCutoff.expectedCutoff.stage})
                      </span>
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        EXPECTED
                      </span>
                    </span>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {applicableCutoff.expectedCutoff.cutoffMarks.toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        / {applicableCutoff.expectedCutoff.maxMarks} (
                        {((applicableCutoff.expectedCutoff.cutoffMarks / applicableCutoff.expectedCutoff.maxMarks) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (applicableCutoff.expectedCutoff.cutoffMarks / applicableCutoff.expectedCutoff.maxMarks) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bar 3: Previous Official Cutoff */}
              {applicableCutoff.previousOfficialCutoff && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>
                        Previous Official Cutoff ({applicableCutoff.previousOfficialCutoff.year} {applicableCutoff.previousOfficialCutoff.stage})
                      </span>
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        OFFICIAL VERIFIED
                      </span>
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {applicableCutoff.previousOfficialCutoff.cutoffMarks.toFixed(2)}{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        / {applicableCutoff.previousOfficialCutoff.maxMarks} (
                        {((applicableCutoff.previousOfficialCutoff.cutoffMarks / applicableCutoff.previousOfficialCutoff.maxMarks) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            (applicableCutoff.previousOfficialCutoff.cutoffMarks /
                              applicableCutoff.previousOfficialCutoff.maxMarks) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Historical Official Cutoff Cycle Badges */}
            {applicableCutoff.historicalOfficialCutoffs.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Multi-Year Official Recruitment History:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {applicableCutoff.historicalOfficialCutoffs.map((hist) => (
                    <div
                      key={hist.id}
                      className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {hist.year} {hist.stage}:
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {hist.cutoffMarks.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/ {hist.maxMarks}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Metadata Footnote */}
            {applicableCutoff.previousOfficialCutoff && (
              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  Official cutoff verified against{' '}
                  <strong className="text-slate-600 dark:text-slate-300">
                    {applicableCutoff.previousOfficialCutoff.source}
                  </strong>
                  . Verification status: {applicableCutoff.previousOfficialCutoff.verificationStatus}
                  {applicableCutoff.previousOfficialCutoff.verifiedBy ? ` (${applicableCutoff.previousOfficialCutoff.verifiedBy})` : ''}.
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="p-5 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Questions
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {result.correctCount + result.wrongCount + result.skippedCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">In this test</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/60">
            <Target className="w-6 h-6" />
          </div>
        </Card>
        <Card className="p-5 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Correct Answers
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {result.correctCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Full marks awarded
            </p>
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
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {result.wrongCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Negative marks deducted
            </p>
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
            <p className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">
              {result.skippedCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">0 marks change</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700">
            <MinusCircle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Negative Marks
            </span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {negativeMarksDeducted === null ? '—' : `−${negativeMarksDeducted.toFixed(2)}`}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Deducted for wrong answers
            </p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/60">
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
                  <th className="px-3.5 py-2.5 text-center text-emerald-600 dark:text-emerald-400">
                    Correct
                  </th>
                  <th className="px-3.5 py-2.5 text-center text-rose-600 dark:text-rose-400">
                    Wrong
                  </th>
                  <th className="px-3.5 py-2.5 text-center">Accuracy</th>
                  <th className="px-3.5 py-2.5 text-right font-bold">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sectionBreakdown.map((sec) => {
                  const secAccuracy =
                    sec.attempted > 0 ? Math.round((sec.correct / sec.attempted) * 100) : 0;
                  return (
                    <tr
                      key={sec.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                        {sec.name}
                      </td>
                      <td className="px-3.5 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {sec.totalQs}
                      </td>
                      <td className="px-3.5 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {sec.attempted}
                      </td>
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
