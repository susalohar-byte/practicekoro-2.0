import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  FileText,
  Target,
  TrendingUp,
  Info,
  ChevronDown,
  X,
  ArrowRight,
  Shield,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface WrongQuestionItem {
  id: number;
  questionText: string;
  questionTextBn?: string;
  subject: string;
  subjectColor: string;
  wrongPercentage: number;
  totalAttempts: number;
  correctOption: string;
  explanation: string;
}

export interface TopicMetricItem {
  rank: number;
  topic: string;
  subject: string;
  subjectBadgeColor: string;
  avgScore: number;
  attempts: number;
}

export interface ExamMetricItem {
  rank: number;
  exam: string;
  logo: string;
  students: number;
  testsAttempted: number;
  avgScore: number;
}

// Initial datasets strictly matching screenshot media_1791200542429.jpg
const WRONG_QUESTIONS: WrongQuestionItem[] = [
  {
    id: 1,
    questionText: 'Under which article of the Constitution of India is the Right to Constitutional Remedies guaranteed?',
    questionTextBn: 'ভারতের সংবিধানের কোন অনুচ্ছেদে সাংবিধানিক প্রতিকারের অধিকার নিশ্চিত করা হয়েছে?',
    subject: 'Polity',
    subjectColor: 'bg-blue-50 text-blue-700 border-blue-200',
    wrongPercentage: 82,
    totalAttempts: 18450,
    correctOption: 'Article 32',
    explanation: 'Article 32 gives the right to individuals to move to the Supreme Court to seek justice when they feel that their right has been '
      + 'unduly deprived. Dr. B.R. Ambedkar termed it the "Heart and Soul of the Constitution".',
  },
  {
    id: 2,
    questionText: 'Which of the following is a molecule with a double covalent bond?',
    questionTextBn: 'নিচের কোনটি একটি দ্বিবন্ধনযুক্ত অণু?',
    subject: 'General Science',
    subjectColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    wrongPercentage: 78,
    totalAttempts: 16210,
    correctOption: 'Oxygen (O2)',
    explanation: 'Oxygen (O2) forms a double covalent bond (O=O) by sharing two pairs of electrons between the two oxygen atoms.',
  },
  {
    id: 3,
    questionText: 'What is the LCM of 12 and 18?',
    questionTextBn: '১২ এবং ১৮ এর ল.সা.গু কত?',
    subject: 'Math',
    subjectColor: 'bg-amber-50 text-amber-700 border-amber-200',
    wrongPercentage: 76,
    totalAttempts: 21400,
    correctOption: '36',
    explanation: 'Multiples of 12: 12, 24, 36, 48... Multiples of 18: 18, 36, 54... The lowest common multiple is 36.',
  },
  {
    id: 4,
    questionText: 'Who was the first woman President of India?',
    questionTextBn: 'ভারতের প্রথম নারী রাষ্ট্রপতি কে?',
    subject: 'History',
    subjectColor: 'bg-rose-50 text-rose-700 border-rose-200',
    wrongPercentage: 74,
    totalAttempts: 19800,
    correctOption: 'Pratibha Patil',
    explanation: 'Smt. Pratibha Devisingh Patil served as the 12th President of India from 2007 to 2012, being the first woman to hold the office.',
  },
  {
    id: 5,
    questionText: 'What is the primary factor responsible for the internal meandering of rivers?',
    questionTextBn: 'নদীর অভ্যন্তরীণ প্রবাহের প্রধান কারণ কী?',
    subject: 'Geography',
    subjectColor: 'bg-sky-50 text-sky-700 border-sky-200',
    wrongPercentage: 72,
    totalAttempts: 15920,
    correctOption: 'Centrifugal force & lateral erosion',
    explanation: 'Lateral erosion combined with reduced velocity and gradient causes winding course formations in the mature and old stages of a river.',
  },
];

const WEAKEST_TOPICS: TopicMetricItem[] = [
  { rank: 1, topic: 'Constitution & Fundamental Rights', subject: 'Polity', subjectBadgeColor: 'bg-amber-50 text-amber-700', avgScore: 42, attempts: 24500 },
  { rank: 2, topic: 'Chemical Reactions', subject: 'General Science', subjectBadgeColor: 'bg-cyan-50 text-cyan-700', avgScore: 48, attempts: 19800 },
  { rank: 3, topic: 'Percentage', subject: 'Math', subjectBadgeColor: 'bg-emerald-50 text-emerald-700', avgScore: 52, attempts: 31200 },
  { rank: 4, topic: 'Medieval India', subject: 'History', subjectBadgeColor: 'bg-purple-50 text-purple-700', avgScore: 54, attempts: 22100 },
  { rank: 5, topic: 'Blood Relations', subject: 'Reasoning', subjectBadgeColor: 'bg-indigo-50 text-indigo-700', avgScore: 56, attempts: 27800 },
];

const TOP_PERFORMING_TOPICS: TopicMetricItem[] = [
  { rank: 1, topic: 'Forces and Motion', subject: 'General Science', subjectBadgeColor: 'bg-cyan-50 text-cyan-700', avgScore: 88, attempts: 28400 },
  { rank: 2, topic: 'Indian Geography', subject: 'Geography', subjectBadgeColor: 'bg-emerald-50 text-emerald-700', avgScore: 86, attempts: 32100 },
  { rank: 3, topic: 'Simplification', subject: 'Math', subjectBadgeColor: 'bg-amber-50 text-amber-700', avgScore: 84, attempts: 41200 },
  { rank: 4, topic: 'Coding-Decoding', subject: 'Reasoning', subjectBadgeColor: 'bg-purple-50 text-purple-700', avgScore: 82, attempts: 35600 },
  { rank: 5, topic: 'Modern India', subject: 'History', subjectBadgeColor: 'bg-rose-50 text-rose-700', avgScore: 80, attempts: 29400 },
];

const EXAM_PERFORMANCE: ExamMetricItem[] = [
  { rank: 1, exam: 'WBP Constable', logo: '/images/exams/emblem_wbp_shield.png', students: 8240, testsAttempted: 214560, avgScore: 72 },
  { rank: 2, exam: 'WBSSC Group C', logo: '/images/exams/emblem_wbpsc_coin.png', students: 2480, testsAttempted: 62430, avgScore: 64 },
  { rank: 3, exam: 'WBSSC Group D', logo: '/images/exams/emblem_wbpsc.png', students: 1760, testsAttempted: 41890, avgScore: 58 },
  { rank: 4, exam: 'ICDS', logo: '/images/exams/emblem_ssc_crest.png', students: 980, testsAttempted: 22680, avgScore: 62 },
  { rank: 5, exam: 'Railway', logo: '/images/popular_exams/bg_wbpsc.png', students: 720, testsAttempted: 18240, avgScore: 66 },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminPerformance: React.FC = () => {
  const navigate = useNavigate();

  // Date range modal
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [dateRangeLabel, setDateRangeLabel] = useState('01 Sep 2026 → 30 Sep 2026');

  // Chart dropdowns
  const [trendGranularity, setTrendGranularity] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [subjectMetric, setSubjectMetric] = useState('Average Score');
  const [distributionExam, setDistributionExam] = useState('All Exams');

  // Modals
  const [isWrongQuestionsModalOpen, setIsWrongQuestionsModalOpen] = useState(false);
  const [isWeakestTopicsModalOpen, setIsWeakestTopicsModalOpen] = useState(false);
  const [isTopTopicsModalOpen, setIsTopTopicsModalOpen] = useState(false);
  const [isExamPerformanceModalOpen, setIsExamPerformanceModalOpen] = useState(false);

  // Subject data with vertical bars
  const subjectBars = useMemo(
    () => [
      { name: 'General Science', score: 82, color: 'bg-sky-500' },
      { name: 'General Knowledge', score: 76, color: 'bg-emerald-500' },
      { name: 'Math', score: 68, color: 'bg-amber-400' },
      { name: 'Reasoning', score: 62, color: 'bg-purple-500' },
      { name: 'English', score: 58, color: 'bg-pink-400' },
      { name: 'Bengali', score: 54, color: 'bg-teal-500' },
    ],
    []
  );

  // Heatmap hourly data: 7 days x 24 hours
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      {/* ==================================================================== */}
      {/* 1. HEADER & DATE PICKER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Performance
          </h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            Analyze student performance, identify strengths and weaknesses, and track progress across exams, subjects and topics.
          </p>
        </div>

        {/* Date Range Picker Pill with calendar icon on the right */}
        <button
          onClick={() => setIsDateModalOpen(true)}
          className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1E293B] shadow-2xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>{dateRangeLabel}</span>
          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (4 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Students</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">12,480</span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 26%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">vs last month</p>
          </div>
        </div>

        {/* Card 2: Tests Attempted */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Tests Attempted</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">3,24,680</span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 32%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">vs last month</p>
          </div>
        </div>

        {/* Card 3: Questions Answered */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Questions Answered</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">8,45,320</span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 28%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">vs last month</p>
          </div>
        </div>

        {/* Card 4: Overall Accuracy */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Overall Accuracy</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">68%</span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 6%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">vs last month</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. ROW 2: CHARTS ROW (Trend on Left + Subject-wise on Right) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT CHART: Performance Trend (~60% / 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-[#0F172A]">Performance Trend</h3>
              <Info className="w-3 h-3 text-[#94A3B8]" />
            </div>

            {/* Legends */}
            <div className="flex items-center gap-3 text-[10px] font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span>Tests Attempted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Accuracy (%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                <span>Active Students</span>
              </div>
            </div>

            {/* Dropdown */}
            <div className="relative">
              <select
                value={trendGranularity}
                onChange={(e) => setTrendGranularity(e.target.value as any)}
                className="appearance-none bg-white border border-[#E2E8F0] rounded-lg pl-2.5 pr-6 py-1 text-[11px] font-semibold text-[#1E293B] focus:outline-none cursor-pointer"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* SVG Line / Area Graph */}
          <div className="relative h-[220px] w-full pt-4">
            <svg viewBox="0 0 540 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="20" x2="510" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="30" y1="55" x2="510" y2="55" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="30" y1="90" x2="510" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="30" y1="125" x2="510" y2="125" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="30" y1="160" x2="510" y2="160" stroke="#E2E8F0" />

              {/* Y Axis Left labels */}
              <text x="5" y="24" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">2,000</text>
              <text x="5" y="59" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">1,500</text>
              <text x="5" y="94" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">1,000</text>
              <text x="12" y="129" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">500</text>
              <text x="20" y="163" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">0</text>

              {/* Y Axis Right labels */}
              <text x="515" y="24" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">100%</text>
              <text x="515" y="59" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">80%</text>
              <text x="515" y="94" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">60%</text>
              <text x="515" y="129" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">40%</text>
              <text x="515" y="148" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">20%</text>
              <text x="515" y="163" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">0%</text>

              {/* Curve 1: Accuracy (Green) */}
              <path
                d="M 35 48 C 75 52, 105 40, 145 28 C 185 35, 225 38, 265 28 C 305 32, 345 22, 385 36 C 425 40, 465 32, 505 24"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {[
                { cx: 35, cy: 48 },
                { cx: 105, cy: 40 },
                { cx: 185, cy: 35 },
                { cx: 265, cy: 28 },
                { cx: 345, cy: 22 },
                { cx: 425, cy: 40 },
                { cx: 505, cy: 24 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#10B981" />
              ))}

              {/* Curve 2: Tests Attempted (Blue) */}
              <path
                d="M 35 108 C 75 110, 105 92, 145 74 C 185 86, 225 90, 265 72 C 305 84, 345 72, 385 76 C 425 72, 465 68, 505 60"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {[
                { cx: 35, cy: 108 },
                { cx: 105, cy: 92 },
                { cx: 185, cy: 86 },
                { cx: 265, cy: 72 },
                { cx: 345, cy: 72 },
                { cx: 425, cy: 72 },
                { cx: 505, cy: 60 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#2563EB" />
              ))}

              {/* Curve 3: Active Students (Purple) */}
              <path
                d="M 35 138 C 75 142, 105 134, 145 125 C 185 124, 225 126, 265 128 C 305 125, 345 120, 385 124 C 425 123, 465 120, 505 114"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {[
                { cx: 35, cy: 138 },
                { cx: 105, cy: 134 },
                { cx: 185, cy: 124 },
                { cx: 265, cy: 128 },
                { cx: 345, cy: 120 },
                { cx: 425, cy: 123 },
                { cx: 505, cy: 114 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#8B5CF6" />
              ))}
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between pl-8 pr-8 text-[9px] font-semibold text-[#94A3B8] -mt-1">
              <span>1 Sep</span>
              <span>5 Sep</span>
              <span>10 Sep</span>
              <span>15 Sep</span>
              <span>20 Sep</span>
              <span>25 Sep</span>
              <span>30 Sep</span>
            </div>
          </div>
        </div>

        {/* RIGHT CHART: Subject-wise Performance (~40% / 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-[#0F172A]">Subject-wise Performance</h3>
            <div className="relative">
              <select
                value={subjectMetric}
                onChange={(e) => setSubjectMetric(e.target.value)}
                className="appearance-none bg-white border border-[#E2E8F0] rounded-lg pl-2.5 pr-6 py-1 text-[11px] font-semibold text-[#1E293B] focus:outline-none cursor-pointer"
              >
                <option>Average Score</option>
                <option>Accuracy</option>
                <option>Attempts</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="relative h-[220px] w-full flex items-end pt-4 pb-2">
            {/* Y Axis Guide lines */}
            <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">100%</div>
            <div className="absolute inset-x-0 top-16 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">80%</div>
            <div className="absolute inset-x-0 top-26 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">60%</div>
            <div className="absolute inset-x-0 top-36 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">40%</div>
            <div className="absolute inset-x-0 top-46 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">20%</div>
            <div className="absolute inset-x-0 bottom-6 border-b border-slate-200 flex items-center justify-start text-[8px] text-slate-400">0%</div>

            {/* Vertical Bars */}
            <div className="w-full h-full flex items-end justify-around pl-5 pr-1 z-10 pb-6">
              {subjectBars.map((bar) => (
                <div key={bar.name} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-800 mb-1 group-hover:scale-110 transition-transform">
                    {bar.score}%
                  </span>
                  <div
                    className={cn(
                      'w-7 sm:w-8 rounded-t-lg transition-all hover:brightness-105',
                      bar.color
                    )}
                    style={{ height: `${(bar.score / 100) * 140}px` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-600 mt-2 text-center w-12 truncate leading-tight">
                    {bar.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. ROW 3: 3 TOPIC DIAGNOSTIC CARDS (3 Equal Columns) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Most Wrong Questions */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Most Wrong Questions</h3>
            <button
              onClick={() => setIsWrongQuestionsModalOpen(true)}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {WRONG_QUESTIONS.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0',
                      q.id === 1 && 'bg-rose-100 text-rose-600',
                      q.id === 2 && 'bg-blue-100 text-blue-600',
                      q.id === 3 && 'bg-amber-100 text-amber-600',
                      q.id > 3 && 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {q.id}
                  </span>
                  <p className="font-semibold text-slate-800 text-[11px] truncate">
                    {q.questionTextBn || q.questionText}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border', q.subjectColor)}>
                    {q.subject}
                  </span>
                  <div className="text-right leading-none">
                    <p className="text-[10px] font-black text-rose-600">{q.wrongPercentage}%</p>
                    <p className="text-[8px] text-rose-400">wrong</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Weakest Topics */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Weakest Topics</h3>
            <button
              onClick={() => setIsWeakestTopicsModalOpen(true)}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="pb-1 font-bold w-5">#</th>
                  <th className="pb-1 font-bold">Topic</th>
                  <th className="pb-1 font-bold">Subject</th>
                  <th className="pb-1 font-bold text-right">Avg. Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {WEAKEST_TOPICS.map((t) => (
                  <tr key={t.rank} className="text-[11px]">
                    <td className="py-2 font-bold text-slate-500">{t.rank}</td>
                    <td className="py-2 font-semibold text-slate-800 truncate max-w-[140px]">
                      {t.topic}
                    </td>
                    <td className="py-2">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', t.subjectBadgeColor)}>
                        {t.subject}
                      </span>
                    </td>
                    <td className="py-2 text-right font-black text-rose-600">
                      {t.avgScore}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Top Performing Topics */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Top Performing Topics</h3>
            <button
              onClick={() => setIsTopTopicsModalOpen(true)}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="pb-1 font-bold w-5">#</th>
                  <th className="pb-1 font-bold">Topic</th>
                  <th className="pb-1 font-bold">Subject</th>
                  <th className="pb-1 font-bold text-right">Avg. Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TOP_PERFORMING_TOPICS.map((t) => (
                  <tr key={t.rank} className="text-[11px]">
                    <td className="py-2 font-bold text-slate-500">{t.rank}</td>
                    <td className="py-2 font-semibold text-slate-800 truncate max-w-[140px]">
                      {t.topic}
                    </td>
                    <td className="py-2">
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', t.subjectBadgeColor)}>
                        {t.subject}
                      </span>
                    </td>
                    <td className="py-2 text-right font-black text-emerald-600">
                      {t.avgScore}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. ROW 4: BOTTOM ANALYTICS CARDS (Exam-wise + Heatmap + Distribution) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Exam-wise Performance (~33% / 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Exam-wise Performance</h3>
            <button
              onClick={() => setIsExamPerformanceModalOpen(true)}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="pt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100">
                  <th className="pb-1 font-bold w-4">#</th>
                  <th className="pb-1 font-bold">Exam</th>
                  <th className="pb-1 font-bold text-center">Students</th>
                  <th className="pb-1 font-bold text-center">Tests Attempted</th>
                  <th className="pb-1 font-bold text-right">Avg. Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EXAM_PERFORMANCE.map((ex) => (
                  <tr key={ex.rank} className="text-[11px]">
                    <td className="py-2 font-bold text-slate-500">{ex.rank}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={ex.logo}
                          alt={ex.exam}
                          className="w-4 h-4 rounded-full object-contain shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="font-bold text-slate-800 truncate max-w-[90px]">{ex.exam}</span>
                      </div>
                    </td>
                    <td className="py-2 text-center font-semibold text-slate-600">
                      {ex.students.toLocaleString()}
                    </td>
                    <td className="py-2 text-center font-semibold text-slate-600">
                      {ex.testsAttempted.toLocaleString()}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          ex.avgScore >= 70
                            ? 'bg-[#DCFCE7] text-[#16A34A]'
                            : ex.avgScore >= 60
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#FFEDD5] text-[#EA580C]'
                        )}
                      >
                        {ex.avgScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Student Activity Heatmap (~42% / 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Student Activity Heatmap</h3>
          </div>

          <div className="pt-2">
            {/* Heatmap Grid */}
            <div className="space-y-1">
              {heatmapDays.map((day, dIdx) => (
                <div key={day} className="flex items-center gap-1.5">
                  <span className="w-6 text-[9px] font-bold text-slate-400">{day}</span>
                  <div className="flex-1 grid grid-cols-24 gap-0.5 h-3.5">
                    {Array.from({ length: 24 }).map((_, hIdx) => {
                      // Generate heat map intensities matching screenshot (blue peaks from 9 AM to 10 PM)
                      let heatClass = 'bg-blue-50';
                      if (hIdx >= 8 && hIdx <= 22) {
                        const intensity = ((dIdx * 3 + hIdx * 7) % 5);
                        if (intensity === 4) heatClass = 'bg-[#1D4ED8]';
                        else if (intensity === 3) heatClass = 'bg-[#2563EB]';
                        else if (intensity === 2) heatClass = 'bg-[#3B82F6]';
                        else if (intensity === 1) heatClass = 'bg-[#60A5FA]';
                        else heatClass = 'bg-[#93C5FD]';
                      }

                      return (
                        <div
                          key={hIdx}
                          className={cn('rounded-[2px] transition-colors hover:ring-1 hover:ring-blue-400', heatClass)}
                          title={`${day} ${hIdx}:00`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Time ticks */}
            <div className="flex justify-between pl-8 pr-1 text-[8px] font-semibold text-slate-400 pt-2">
              <span>12 AM</span>
              <span>4 AM</span>
              <span>8 AM</span>
              <span>12 PM</span>
              <span>4 PM</span>
              <span>8 PM</span>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-semibold text-slate-500 pt-2 border-t border-slate-100 mt-2">
              <span>Less Active</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-50" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#93C5FD]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#60A5FA]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1D4ED8]" />
              <span>More Active</span>
            </div>
          </div>
        </div>

        {/* Performance Distribution (~25% / 3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-[#0F172A]">Performance Distribution</h3>
            <div className="relative">
              <select
                value={distributionExam}
                onChange={(e) => setDistributionExam(e.target.value)}
                className="appearance-none bg-white border border-[#E2E8F0] rounded-lg pl-2 pr-5 py-0.5 text-[10px] font-semibold text-[#1E293B] focus:outline-none cursor-pointer"
              >
                <option value="All Exams">All Exams</option>
                <option value="WBP Constable">WBP Constable</option>
                <option value="KP SI">KP SI</option>
                <option value="WBCS">WBCS</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#94A3B8] absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2 flex flex-col items-center">
            {/* Donut Chart SVG */}
            <div className="relative w-28 h-28 my-1 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* 90-100%: 12% */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4.5" strokeDasharray="12 88" strokeDashoffset="0" />
                {/* 70-89%: 28% */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#84CC16" strokeWidth="4.5" strokeDasharray="28 72" strokeDashoffset="-12" />
                {/* 50-69%: 34% */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#FBBF24" strokeWidth="4.5" strokeDasharray="34 66" strokeDashoffset="-40" />
                {/* 30-49%: 18% */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F97316" strokeWidth="4.5" strokeDasharray="18 82" strokeDashoffset="-74" />
                {/* 0-29%: 8% */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#EF4444" strokeWidth="4.5" strokeDasharray="8 92" strokeDashoffset="-92" />
              </svg>

              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-black text-slate-900 leading-tight">12,480</span>
                <span className="text-[9px] text-slate-400 font-medium">Students</span>
              </div>
            </div>

            {/* Legend with percentages */}
            <div className="w-full space-y-1 text-[10px] font-semibold text-[#475569] pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>90% - 100%</span>
                </div>
                <span>12% (1,498)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
                  <span>70% - 89%</span>
                </div>
                <span>28% (3,494)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                  <span>50% - 69%</span>
                </div>
                <span>34% (4,241)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                  <span>30% - 49%</span>
                </div>
                <span>18% (2,246)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <span>0% - 29%</span>
                </div>
                <span>8% (1,001)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. MODAL: DATE RANGE PICKER */}
      {/* ==================================================================== */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Date Range</h3>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                '01 Sep 2026 → 30 Sep 2026',
                'Today (30 Sep 2026)',
                'Yesterday (29 Sep 2026)',
                'Last 7 Days (24 Sep → 30 Sep 2026)',
                'Last 30 Days (01 Sep → 30 Sep 2026)',
                'August 2026 (01 Aug → 31 Aug 2026)',
                'All Time',
              ].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRangeLabel(range);
                    setIsDateModalOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl border font-semibold transition-colors flex items-center justify-between',
                    dateRangeLabel === range
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{range}</span>
                  {dateRangeLabel === range && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. MODAL: MOST WRONG QUESTIONS DETAILS */}
      {/* ==================================================================== */}
      {isWrongQuestionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-extrabold text-slate-900">Most Frequently Failed Questions</h3>
              <button
                onClick={() => setIsWrongQuestionsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {WRONG_QUESTIONS.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Question #{q.id} • {q.subject}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{q.questionText}</h4>
                      {q.questionTextBn && (
                        <p className="text-xs text-slate-600 mt-0.5">{q.questionTextBn}</p>
                      )}
                    </div>
                    <span className="bg-rose-100 text-rose-800 text-xs font-black px-2 py-0.5 rounded-full shrink-0">
                      {q.wrongPercentage}% Failed
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                    <span className="font-bold">Correct Answer:</span> {q.correctOption}
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700">
                    <span className="font-bold block text-slate-900 mb-0.5">Explanation:</span>
                    <p>{q.explanation}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsWrongQuestionsModalOpen(false)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL: WEAKEST TOPICS */}
      {/* ==================================================================== */}
      {isWeakestTopicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Weakest Topics Breakdown</h3>
              <button
                onClick={() => setIsWeakestTopicsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {WEAKEST_TOPICS.map((t) => (
                <div key={t.rank} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{t.topic}</p>
                    <p className="text-[10px] text-slate-500">{t.subject} • {t.attempts.toLocaleString()} Attempts</p>
                  </div>
                  <span className="bg-rose-100 text-rose-800 font-black text-xs px-2 py-0.5 rounded">
                    {t.avgScore}% Avg
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsWeakestTopicsModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. MODAL: TOP TOPICS */}
      {/* ==================================================================== */}
      {isTopTopicsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Highest Scoring Topics</h3>
              <button
                onClick={() => setIsTopTopicsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {TOP_PERFORMING_TOPICS.map((t) => (
                <div key={t.rank} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{t.topic}</p>
                    <p className="text-[10px] text-slate-500">{t.subject} • {t.attempts.toLocaleString()} Attempts</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded">
                    {t.avgScore}% Avg
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTopTopicsModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. MODAL: EXAM PERFORMANCE FULL VIEW */}
      {/* ==================================================================== */}
      {isExamPerformanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">All Exams Performance Metrics</h3>
              </div>
              <button
                onClick={() => setIsExamPerformanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {EXAM_PERFORMANCE.map((ex) => (
                <div key={ex.rank} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={ex.logo} alt={ex.exam} className="w-6 h-6 object-contain" />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{ex.exam}</p>
                      <p className="text-[10px] text-slate-500">
                        {ex.students.toLocaleString()} Students • {ex.testsAttempted.toLocaleString()} Attempts
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2 py-0.5 rounded">
                    {ex.avgScore}% Avg
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setIsExamPerformanceModalOpen(false);
                  navigate('/admin/exams');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Manage Exams</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExamPerformanceModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
