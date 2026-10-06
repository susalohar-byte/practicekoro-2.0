import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Globe,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { TestAttempt } from '@/types';
import { WEST_BENGAL_DISTRICTS } from '@/data/districts';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatarUrl: string;
  fallbackText: string;
  tests: number;
  avgScore: number;
  accuracy: number;
  totalMarks: number;
  streak: number;
  tag?: string;
  exam?: string;
  district?: string;
  isCurrentUser?: boolean;
}

// Laurel wreath SVG wrapping around Rank 1 avatar
const GoldenLaurelWreath: React.FC = () => (
  <svg
    className="absolute -inset-3.5 w-[130%] h-[130%] pointer-events-none select-none z-10"
    viewBox="0 0 100 100"
    fill="none"
  >
    {/* Left branch */}
    <path d="M 28 80 C 12 65 12 35 30 20" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 22 72 Q 10 70 18 64 Q 24 68 22 72 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
    <path d="M 18 58 Q 6 54 16 48 Q 21 53 18 58 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
    <path d="M 17 44 Q 6 38 18 32 Q 22 38 17 44 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
    <path d="M 22 30 Q 12 22 25 18 Q 27 24 22 30 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />

    {/* Right branch */}
    <path d="M 72 80 C 88 65 88 35 70 20" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 78 72 Q 90 70 82 64 Q 76 68 78 72 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
    <path d="M 82 58 Q 94 54 84 48 Q 79 53 82 58 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
    <path d="M 83 44 Q 94 38 82 32 Q 78 38 83 44 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
    <path d="M 78 30 Q 88 22 75 18 Q 73 24 78 30 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
  </svg>
);

export const Rank: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedExam, setSelectedExam] = useState<string>('WBP Constable');
  const [availableExams, setAvailableExams] = useState<Array<{ title: string }>>([]);
  const [selectedScope, setSelectedScope] = useState<string>('West Bengal');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    user?.district || 'Purulia'
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>('This Month');
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [platformRankings, setPlatformRankings] = useState<LeaderboardUser[]>([]);

  // Keep selectedDistrict in sync when user profile district is loaded
  useEffect(() => {
    if (user?.district) {
      setSelectedDistrict(user.district);
    }
  }, [user?.district]);

  // Keep the exam filter aligned with the active exams managed in Admin.
  useEffect(() => {
    let isMounted = true;
    api.getExams().then((exams) => {
      if (!isMounted) return;
      const activeExams = exams.filter((exam) => exam.isActive);
      setAvailableExams(activeExams.map(({ title }) => ({ title })));
      if (activeExams.length > 0 && !activeExams.some(({ title }) => title === selectedExam)) {
        setSelectedExam(activeExams[0].title);
      }
    }).catch((err) => console.error('Failed to load active exams for ranking filter:', err));
    return () => { isMounted = false; };
  }, []);

  // Load this student's attempts and the authenticated, privacy-masked app leaderboard.
  useEffect(() => {
    let isMounted = true;
    if (user) {
      api
        .getUserAttempts(user.id)
        .then((data) => {
          if (isMounted) setAttempts(data || []);
        })
        .catch((err) => {
          console.error('Failed to load user attempts for rank page:', err);
        });
    }

    const scope = selectedScope === 'District'
      ? 'district'
      : selectedScope === 'All India'
        ? 'all_india'
        : 'west_bengal';
    const now = new Date();
    let from: string | undefined;
    if (selectedPeriod === 'This Month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (selectedPeriod === 'This Week') {
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      from = weekStart.toISOString();
    }

    api
      .getAppLeaderboard(
        scope,
        scope === 'district' ? selectedDistrict : undefined,
        selectedExam,
        from,
      )
      .then((overview) => {
        if (!isMounted) return;
        const activeRanked = overview
          .filter((row) => Number(row.tests_count) > 0)
          .map((row): LeaderboardUser => {
            const initials = (row.display_name || 'S')
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return {
              rank: Number(row.rank),
              name: row.display_name || 'Student',
              avatarUrl: '/images/profile_user_avatar.jpg',
              fallbackText: initials,
              tests: Number(row.tests_count),
              avgScore: Number(row.average_percentage) || 0,
              accuracy: Math.round(Number(row.average_percentage) || 0),
              totalMarks: Math.round(Number(row.average_percentage) || 0),
              streak: 0,
              exam: selectedExam,
              district: row.district || undefined,
            };
          });
        setPlatformRankings(activeRanked);
      })
      .catch((err) => {
        console.error('Failed to load platform rankings:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user, selectedExam, selectedScope, selectedDistrict, selectedPeriod]);

  // Compute live user stats strictly from their actual test attempts
  const completedAttempts = useMemo(() => {
    return attempts.filter((a) => a.status === 'completed');
  }, [attempts]);

  const userTestCount = completedAttempts.length;
  const userAvgScore =
    completedAttempts.length > 0
      ? Number((completedAttempts.reduce((s, a) => s + (a.score || 0), 0) / completedAttempts.length).toFixed(1))
      : 0;
  const userAccuracy =
    completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((s, a) => s + (a.accuracy || 0), 0) / completedAttempts.length)
      : 0;
  const userTotalMarks =
    completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((s, a) => s + (a.score || 0), 0))
      : 0;
  const userStreak = useMemo(() => {
    if (completedAttempts.length === 0) return 0;
    return new Set(completedAttempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))).size;
  }, [completedAttempts]);

  // Active leaderboard from real platform rankings
  const currentLeaderboard = useMemo(() => {
    return platformRankings;
  }, [platformRankings]);

  const top1 = currentLeaderboard.find((u) => u.rank === 1);
  const top2 = currentLeaderboard.find((u) => u.rank === 2);
  const top3 = currentLeaderboard.find((u) => u.rank === 3);
  const restRanks = currentLeaderboard.filter((u) => u.rank > 3);

  // Student's effective district
  const userDistrict = user?.district || '';

  // Live calculation of user's rank
  const computedUserRank = useMemo(() => {
    const matched = currentLeaderboard.find((u) => u.isCurrentUser);
    if (matched) return matched.rank;
    if (completedAttempts.length === 0) return 0;
    let countAbove = 0;
    currentLeaderboard.forEach((c) => {
      if (c.avgScore > userAvgScore) countAbove++;
    });
    return countAbove + 1;
  }, [currentLeaderboard, completedAttempts.length, userAvgScore]);

  const userDistrictRank = computedUserRank;

  // Current user row
  const displayName = user?.fullName || 'Candidate';
  const currentUserRow: LeaderboardUser = {
    rank: computedUserRank,
    name: displayName,
    avatarUrl: user?.avatarUrl || '/images/student_avatar.png',
    fallbackText: displayName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    tests: userTestCount,
    avgScore: userAvgScore,
    accuracy: userAccuracy,
    totalMarks: userTotalMarks,
    streak: userStreak,
    district: userDistrict || 'West Bengal',
    isCurrentUser: true,
  };

  return (
    <div className="space-y-5 sm:space-y-6 text-slate-900 dark:text-slate-100">
      {/* 1. Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/home" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 font-bold">Leaderboard</span>
        </nav>

        {/* 2. Page Header with Trophy Illustration */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
              Leaderboard
            </h1>
            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 leading-snug">
              Compete, stay consistent and climb the ranks!
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Your hard work today builds a brighter tomorrow.</span>
              <span className="text-blue-500">💙</span>
            </p>

            {/* Filter Dropdown Pills directly under Header */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3">
              {/* Exam Selector */}
              <div className="relative">
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  aria-label="Filter by exam"
                  className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-9 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                >
                  {availableExams.map(({ title }) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[#026BFC] dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">
                  WB
                </div>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* Scope Selector */}
              <div className="relative">
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  aria-label="Filter by region scope"
                  className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-9 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                >
                  <option value="West Bengal">Statewide (West Bengal)</option>
                  <option value="District">District Wise</option>
                  <option value="All India">All India</option>
                </select>
                <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#026BFC]" />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* District Selector (visible when District is selected) */}
              {selectedScope === 'District' && (
                <div className="relative animate-in fade-in zoom-in-95 duration-150">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    aria-label="Select West Bengal District"
                    className="appearance-none rounded-xl border-2 border-[#026BFC] bg-blue-50/80 dark:bg-blue-950/60 pl-9 pr-9 py-2 text-xs sm:text-sm font-black text-[#026BFC] dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs cursor-pointer"
                  >
                    {WEST_BENGAL_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist} {userDistrict === dist ? '📍 (My District)' : ''}
                      </option>
                    ))}
                  </select>
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#026BFC]" />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#026BFC]" />
                </div>
              )}

              {/* Period Selector */}
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  aria-label="Filter by time period"
                  className="appearance-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-9 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                >
                  <option value="This Month">This Month</option>
                  <option value="This Week">This Week</option>
                  <option value="All Time">All Time</option>
                </select>
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#026BFC]" />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Top Right Exact Hero Trophy Art */}
          <div className="relative shrink-0 flex items-center justify-end">
            <img
              src="/images/leaderboard_hero_art_exact.png"
              alt="Leaderboard Trophy - Same Dream Bigger Preparation - Top Aspirants Stronger Bengal"
              className="h-28 sm:h-36 lg:h-40 w-auto object-contain select-none pointer-events-none drop-shadow-xs"
            />
          </div>
        </div>

        {/* District Active Filter Bar */}
        {selectedScope === 'District' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#026BFC] shrink-0" />
              <span>
                District Leaderboard:{' '}
                <strong className="text-slate-900 dark:text-white font-extrabold text-sm">{selectedDistrict}</strong>
                {userDistrict === selectedDistrict ? ' (Your District)' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Your District Rank: <strong className="text-[#026BFC] font-black text-sm">#{userDistrictRank}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedScope('West Bengal')}
                className="text-[11px] font-bold text-[#026BFC] hover:underline cursor-pointer"
              >
                Switch to Statewide
              </button>
            </div>
          </div>
        )}

        {/* Prompt to add District if user has none */}
        {!user?.district && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span>
                <strong>District not selected yet!</strong> Select your West Bengal district in your profile to officially compete in your district leaderboard.
              </span>
            </div>
            <Link
              to="/profile"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Set District
            </Link>
          </div>
        )}

        {/* 3. Top 3 Spotlight Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-end pt-2">
          {/* RANK 2: Silver (Left) */}
          {top2 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900 dark:to-slate-850 p-4 text-center shadow-2xs relative pt-6">
              {/* Silver Crown Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="relative">
                  <svg className="w-8 h-8 text-slate-400 fill-slate-300 drop-shadow-2xs" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-slate-800 pt-1">
                    2
                  </span>
                </div>
              </div>

              {/* Avatar */}
              <div className="mx-auto h-16 w-16 rounded-full p-0.5 flex items-center justify-center">
                <img
                  src={top2.avatarUrl}
                  alt={top2.name}
                  className="h-15 w-15 rounded-full object-cover shadow-2xs ring-3 ring-slate-200 dark:ring-slate-700"
                  onError={(e) => {
                    e.currentTarget.src = '/images/student_avatar.png';
                  }}
                />
              </div>

              {/* Name & Tag */}
              <h3 className="mt-1.5 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {top2.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                  <span>✦</span>
                  <span>{top2.tag || 'Achiever'}</span>
                </span>
                {top2.district && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                    <span>{top2.district}</span>
                  </span>
                )}
              </div>

              {/* Stats Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tests</p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">{top2.tests}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Score</p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">{top2.avgScore}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">{top2.accuracy}%</p>
                </div>
              </div>
            </div>
          )}

          {/* RANK 1: Gold (Center - Taller & Highlighted) */}
          {top1 && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/50 via-amber-50/20 to-white dark:from-slate-900 dark:to-slate-850 p-5 text-center shadow-xs relative pt-7 md:-mt-2">
              {/* Gold Crown Badge */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="relative">
                  <svg className="w-10 h-10 text-amber-500 fill-amber-400 drop-shadow-2xs" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-amber-950 pt-1.5">
                    1
                  </span>
                </div>
              </div>

              {/* Avatar with Golden Laurel Wreath */}
              <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                <GoldenLaurelWreath />
                <img
                  src={top1.avatarUrl}
                  alt={top1.name}
                  className="h-17 w-17 rounded-full object-cover shadow-xs ring-3 ring-amber-300 dark:ring-amber-500 z-0"
                  onError={(e) => {
                    e.currentTarget.src = '/images/student_avatar.png';
                  }}
                />
              </div>

              {/* Name & Tag */}
              <h3 className="mt-1.5 text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {top1.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                  <span>★</span>
                  <span>{top1.tag || 'Topper'}</span>
                </span>
                {top1.district && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/70 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800">
                    <MapPin className="w-2.5 h-2.5 text-amber-600" />
                    <span>{top1.district}</span>
                  </span>
                )}
              </div>

              {/* Stats Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-amber-100 dark:border-slate-800/80 grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tests</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">{top1.tests}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Score</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">{top1.avgScore}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">{top1.accuracy}%</p>
                </div>
              </div>
            </div>
          )}

          {/* RANK 3: Bronze (Right) */}
          {top3 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-850 p-4 text-center shadow-2xs relative pt-6">
              {/* Bronze Crown Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="relative">
                  <svg className="w-8 h-8 text-amber-700 fill-amber-600/70 drop-shadow-2xs" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-amber-950 pt-1">
                    3
                  </span>
                </div>
              </div>

              {/* Avatar */}
              <div className="mx-auto h-16 w-16 rounded-full p-0.5 flex items-center justify-center">
                <img
                  src={top3.avatarUrl}
                  alt={top3.name}
                  className="h-15 w-15 rounded-full object-cover shadow-2xs ring-3 ring-orange-200 dark:ring-orange-800"
                  onError={(e) => {
                    e.currentTarget.src = '/images/student_avatar.png';
                  }}
                />
              </div>

              {/* Name & Tag */}
              <h3 className="mt-1.5 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {top3.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800">
                  <span>★</span>
                  <span>{top3.tag || 'Star Performer'}</span>
                </span>
                {top3.district && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                    <span>{top3.district}</span>
                  </span>
                )}
              </div>

              {/* Stats Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tests</p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">{top3.tests}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Score</p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">{top3.avgScore}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                  <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5">{top3.accuracy}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Main Two-Column Grid: Rankings Table (Left) + Side Cards (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* LEFT COLUMN: Rankings Table (Col-span 8) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3 pl-5 pr-3">#</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3 text-center">Tests</th>
                    <th className="py-3 px-3 text-center">Average Score</th>
                    <th className="py-3 px-3 text-center">Accuracy</th>
                    <th className="py-3 px-3 text-center">Total Marks</th>
                    <th className="py-3 pr-5 pl-3 text-center">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm font-semibold">
                  {currentLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                        No leaderboard rankings recorded yet. Complete a mock test to be the first on the board!
                      </td>
                    </tr>
                  )}
                  {restRanks.map((student) => (
                    <tr
                      key={student.rank}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 pl-5 pr-3 font-bold text-slate-500 text-xs">
                        {student.rank}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatarUrl}
                            alt={student.name}
                            className="h-7 w-7 rounded-full object-cover shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = '/images/student_avatar.png';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white truncate block text-xs sm:text-sm">
                              {student.name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{student.district || 'West Bengal'}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 text-xs">
                        {student.tests}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white text-xs">
                        {student.avgScore}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 text-xs">
                        {student.accuracy}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 text-xs">
                        {student.totalMarks.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 pr-5 pl-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 text-xs">
                          <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                          <span>{student.streak}</span>
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* STICKY / HIGHLIGHTED CURRENT USER ROW */}
                  <tr className="bg-[#eff6ff] dark:bg-blue-950/40 border-t-2 border-blue-200 dark:border-blue-800">
                    <td className="py-2.5 pl-5 pr-3 font-black text-[#026BFC] text-xs sm:text-sm">
                      {currentUserRow.rank > 0 ? currentUserRow.rank : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentUserRow.avatarUrl}
                          alt={currentUserRow.name}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-[#026BFC] shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = '/images/student_avatar.png';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white leading-tight text-xs sm:text-sm">
                            {currentUserRow.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-[#026BFC] dark:text-blue-300 px-2 py-0.5 rounded-full">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span>{currentUserRow.district || userDistrict || 'West Bengal'}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                              {currentUserRow.rank > 0
                                ? selectedScope === 'District'
                                  ? `District Rank #${userDistrictRank}`
                                  : `Statewide Rank #${currentUserRow.rank}`
                                : 'Unranked'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#026BFC] text-xs">
                      {currentUserRow.tests}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-white text-xs">
                      {currentUserRow.avgScore}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#026BFC] text-xs">
                      {currentUserRow.accuracy}%
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                      {currentUserRow.totalMarks.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 pr-5 pl-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 text-xs">
                        <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                        <span>{currentUserRow.streak}</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT COLUMN: 3 Stacked Cards (Col-span 4) */}
          <div className="lg:col-span-4 space-y-4">
            {/* CARD 1: "Your Rank" */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Your Rank
                </h3>
                {selectedScope === 'District' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                    District Mode
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Statewide (WB)
                  </span>
                )}
              </div>

              {/* Big Rank Number */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-400 text-xl font-bold">#</span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentUserRow.rank > 0 ? currentUserRow.rank : '-'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {currentLeaderboard.length > 0
                      ? `out of ${currentLeaderboard.length} ranked aspirants`
                      : 'Complete a mock test to get ranked'}
                  </p>
                </div>
                {currentUserRow.rank > 0 && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                    <TrendingUp className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Rank Comparison: Statewide vs District */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#026BFC]" />
                    <span>Statewide (WB):</span>
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {currentUserRow.rank > 0 ? `#${currentUserRow.rank}` : '#-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>District ({userDistrict || 'Not Set'}):</span>
                  </span>
                  <span className="font-black text-[#026BFC]">
                    {userDistrictRank > 0 ? `#${userDistrictRank}` : '#-'}
                  </span>
                </div>
              </div>

              {/* Rank Status Alert */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {userTestCount > 0
                    ? `You have completed ${userTestCount} mock tests!`
                    : 'Attempt mock tests to climb the leaderboard!'}
                </span>
              </div>

              {/* 3 Metrics Row */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {userTestCount}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tests Taken</p>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {userAvgScore}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Avg. Score</p>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {userAccuracy}%
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Accuracy</p>
                </div>
              </div>

              {/* Action Button: Keep Practicing */}
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="w-full py-2 rounded-lg bg-[#026BFC] hover:bg-[#0256CA] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Keep Practicing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CARD 2: "Top Performers by Exam" */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  Top Performers
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedScope('All India')}
                  className="text-xs font-bold text-[#026BFC] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {currentLeaderboard.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  Top performers will appear as students complete mock tests.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentLeaderboard.slice(0, 5).map((item, index) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 text-sm">
                          {index === 0 && '🏆'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && (
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate text-xs">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.exam || selectedExam}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white text-xs shrink-0">
                        {item.avgScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 3: "Motivational Quote" */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="space-y-1 z-10 max-w-[75%]">
                <span className="text-[#026BFC] text-2xl font-serif font-black leading-none block">
                  &ldquo;
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug italic">
                  Discipline today creates success tomorrow.
                </p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white pt-0.5">
                  — PracticeKoro
                </p>
              </div>

              {/* Plant Illustration */}
              <div className="shrink-0 flex items-end justify-end">
                <img
                  src="/images/leaderboard_plant.png"
                  alt="Green Plant"
                  className="w-12 h-14 object-contain drop-shadow-2xs select-none pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
