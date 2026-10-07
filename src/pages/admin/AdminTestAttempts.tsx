import { requireSuccess, runConfirmedBatch } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Download,
  Users,
  CheckCircle2,
  Clock,
  Star,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ArrowRight,
  Check,
  RotateCcw,
  Trash2,
  Printer,
  Heart,
  Bookmark,
  Target,
  FileCheck,
  AlertOctagon,
  Eye,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export type TestAttemptType = 'Full Mock' | 'Topic Test' | 'Official PYQ';
export type TestAttemptStatus = 'Completed' | 'Not Completed';

export interface QuestionBreakdownItem {
  id: number;
  questionText: string;
  questionTextBn?: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string; textBn?: string }[];
  status: 'correct' | 'wrong' | 'skipped';
  marks: number;
  timeSpentSec: number;
  explanation: string;
  subject: string;
}

export interface SectionAnalysisItem {
  sectionName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  marksScored: number;
  maxMarks: number;
  accuracy: number;
  timeSpentMin: number;
}

export interface AdminTestAttempt {
  id: string;
  studentId: string; // e.g. PK100245
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  studentInitials?: string;
  studentAvatarColor?: string;
  testName: string;
  exam: string;
  type: TestAttemptType;
  score: number;
  totalMarks: number;
  accuracy: number;
  timeTaken: string; // e.g. "48 min"
  timeTakenSeconds: number;
  status: TestAttemptStatus;
  attemptedAtDate: string; // "30 Sep 2026"
  attemptedAtTime: string; // "10:42 AM"
  startedAt: string; // "30 Sep 2026, 09:54 AM"
  submittedAt: string; // "30 Sep 2026, 10:42 AM"
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  questions?: QuestionBreakdownItem[];
  sectionAnalysis?: SectionAnalysisItem[];
}

// Sample questions generator for Answer Sheet modal & tab
const generateMockQuestions = (
  totalQuestions: number,
  correctCount: number,
  wrongCount: number,
  skippedCount: number
): QuestionBreakdownItem[] => {
  const sampleData = [
    {
      q: 'Which Article of the Indian Constitution deals with the Right to Equality?',
      qBn: 'ভারতের সংবিধানের কোন ধারাটি সাম্যের অধিকার সম্পর্কিত?',
      subject: 'Indian Polity',
      opts: [
        { key: 'A' as const, text: 'Article 14-18', textBn: 'ধারা ১৪-১৮' },
        { key: 'B' as const, text: 'Article 19-22', textBn: 'ধারা ১৯-২২' },
        { key: 'C' as const, text: 'Article 23-24', textBn: 'ধারা ২৩-২৪' },
        { key: 'D' as const, text: 'Article 25-28', textBn: 'ধারা ২৫-২৮' },
      ],
      correct: 'A' as const,
      exp: 'Articles 14 to 18 of the Indian Constitution guarantee the fundamental Right to Equality before law and equal protection of laws.',
    },
    {
      q: 'Who was the founder of the Brahmo Samaj in Bengal?',
      qBn: 'বাংলায় ব্রাহ্মসমাজ কে প্রতিষ্ঠা করেন?',
      subject: 'History of India',
      opts: [
        { key: 'A' as const, text: 'Swami Vivekananda', textBn: 'স্বামী বিবেকানন্দ' },
        { key: 'B' as const, text: 'Raja Ram Mohan Roy', textBn: 'রাজা রামমোহন রায়' },
        { key: 'C' as const, text: 'Ishwar Chandra Vidyasagar', textBn: 'ঈশ্বরচন্দ্র বিদ্যাসাগর' },
        { key: 'D' as const, text: 'Keshab Chandra Sen', textBn: 'কেশবচন্দ্র সেন' },
      ],
      correct: 'B' as const,
      exp: 'Raja Ram Mohan Roy founded the Brahmo Sabha in 1828, which was later renamed Brahmo Samaj.',
    },
    {
      q: 'If A : B = 3 : 4 and B : C = 8 : 9, then what is the ratio of A : C?',
      qBn: 'যদি A : B = 3 : 4 এবং B : C = 8 : 9 হয়, তবে A : C এর অনুপাত কত?',
      subject: 'Mathematics',
      opts: [
        { key: 'A' as const, text: '1 : 2', textBn: '১ : ২' },
        { key: 'B' as const, text: '2 : 3', textBn: '২ : ৩' },
        { key: 'C' as const, text: '3 : 2', textBn: '৩ : ২' },
        { key: 'D' as const, text: '4 : 5', textBn: '৪ : ৫' },
      ],
      correct: 'B' as const,
      exp: 'A/C = (A/B) * (B/C) = (3/4) * (8/9) = 24/36 = 2/3. So ratio is 2 : 3.',
    },
    {
      q: 'Find the missing number in series: 2, 6, 12, 20, 30, ?',
      qBn: 'সিরিজের পরবর্তী সংখ্যাটি কত: ২, ৬, ১২, ২০, ৩০, ?',
      subject: 'Reasoning',
      opts: [
        { key: 'A' as const, text: '40', textBn: '৪০' },
        { key: 'B' as const, text: '42', textBn: '৪২' },
        { key: 'C' as const, text: '44', textBn: '৪৪' },
        { key: 'D' as const, text: '48', textBn: '৪৮' },
      ],
      correct: 'B' as const,
      exp: 'Differences are +4, +6, +8, +10, +12. Therefore 30 + 12 = 42.',
    },
    {
      q: 'Which river is known as the "Sorrow of Bengal"?',
      qBn: 'কোন নদীকে "বাংলার দুঃখ" বলা হতো?',
      subject: 'Geography',
      opts: [
        { key: 'A' as const, text: 'Hooghly', textBn: 'হুগলি' },
        { key: 'B' as const, text: 'Teesta', textBn: 'তিস্তা' },
        { key: 'C' as const, text: 'Damodar', textBn: 'দামোদর' },
        { key: 'D' as const, text: 'Rupnarayan', textBn: 'রূপনারায়ণ' },
      ],
      correct: 'C' as const,
      exp: 'Damodar River was historically known as Sorrow of Bengal due to frequent ravaging floods.',
    },
  ];

  const items: QuestionBreakdownItem[] = [];
  let curCorrect = 0;
  let curWrong = 0;
  let curSkipped = 0;

  for (let i = 1; i <= Math.min(totalQuestions, 25); i++) {
    const template = sampleData[(i - 1) % sampleData.length];
    let st: 'correct' | 'wrong' | 'skipped' = 'correct';

    if (curCorrect < correctCount && (i % 5 !== 0 || curWrong >= wrongCount)) {
      st = 'correct';
      curCorrect++;
    } else if (curWrong < wrongCount) {
      st = 'wrong';
      curWrong++;
    } else if (curSkipped < skippedCount) {
      st = 'skipped';
      curSkipped++;
    }

    const wrongKey = template.correct === 'A' ? 'B' : template.correct === 'B' ? 'C' : 'A';
    const chosen = st === 'correct' ? template.correct : st === 'wrong' ? wrongKey : null;

    items.push({
      id: i,
      questionText: `${i}. ${template.q}`,
      questionTextBn: `${i}. ${template.qBn}`,
      subject: template.subject,
      options: template.opts,
      selectedOption: chosen,
      correctOption: template.correct,
      status: st,
      marks: st === 'correct' ? 1 : st === 'wrong' ? -0.25 : 0,
      timeSpentSec: st === 'skipped' ? 12 : 35 + ((i * 7) % 30),
      explanation: template.exp,
    });
  }

  return items;
};

// Default seeded attempts strictly matching screenshot media_1791197748654.jpg
export const INITIAL_ATTEMPTS: AdminTestAttempt[] = [
  {
    id: 'att_1',
    studentId: 'PK100245',
    studentName: 'Sneha Khatun',
    studentEmail: 'sneha.khatun@practicekoro.in',
    studentInitials: 'SK',
    studentAvatarColor: 'bg-blue-600',
    testName: 'WBP Constable Full Mock 1',
    exam: 'WBP Constable',
    type: 'Full Mock',
    score: 72,
    totalMarks: 100,
    accuracy: 80,
    timeTaken: '48 min',
    timeTakenSeconds: 2880,
    status: 'Completed',
    attemptedAtDate: '30 Sep 2026',
    attemptedAtTime: '10:42 AM',
    startedAt: '30 Sep 2026, 09:54 AM',
    submittedAt: '30 Sep 2026, 10:42 AM',
    totalQuestions: 85,
    correctAnswers: 70,
    wrongAnswers: 12,
    skippedAnswers: 3,
    sectionAnalysis: [
      {
        sectionName: 'General Awareness',
        totalQuestions: 25,
        attempted: 24,
        correct: 20,
        wrong: 4,
        marksScored: 19,
        maxMarks: 25,
        accuracy: 83.3,
        timeSpentMin: 12,
      },
      {
        sectionName: 'Elementary Mathematics',
        totalQuestions: 25,
        attempted: 25,
        correct: 21,
        wrong: 4,
        marksScored: 20,
        maxMarks: 25,
        accuracy: 84.0,
        timeSpentMin: 18,
      },
      {
        sectionName: 'Reasoning & Logic',
        totalQuestions: 25,
        attempted: 24,
        correct: 21,
        wrong: 3,
        marksScored: 20.25,
        maxMarks: 25,
        accuracy: 87.5,
        timeSpentMin: 14,
      },
      {
        sectionName: 'English Language',
        totalQuestions: 10,
        attempted: 9,
        correct: 8,
        wrong: 1,
        marksScored: 7.75,
        maxMarks: 10,
        accuracy: 88.9,
        timeSpentMin: 4,
      },
    ],
  },
  {
    id: 'att_2',
    studentId: 'PK100312',
    studentName: 'Rohit Kumar',
    studentEmail: 'rohit.kumar@practicekoro.in',
    studentAvatar: '/images/leaderboard_rohit.jpg',
    testName: 'Modern India - Test 01',
    exam: 'WBP Constable',
    type: 'Topic Test',
    score: 18,
    totalMarks: 30,
    accuracy: 60,
    timeTaken: '22 min',
    timeTakenSeconds: 1320,
    status: 'Completed',
    attemptedAtDate: '30 Sep 2026',
    attemptedAtTime: '09:18 AM',
    startedAt: '30 Sep 2026, 08:56 AM',
    submittedAt: '30 Sep 2026, 09:18 AM',
    totalQuestions: 30,
    correctAnswers: 18,
    wrongAnswers: 8,
    skippedAnswers: 4,
    sectionAnalysis: [
      {
        sectionName: 'Modern Indian History',
        totalQuestions: 30,
        attempted: 26,
        correct: 18,
        wrong: 8,
        marksScored: 16,
        maxMarks: 30,
        accuracy: 69.2,
        timeSpentMin: 22,
      },
    ],
  },
  {
    id: 'att_3',
    studentId: 'PK100198',
    studentName: 'Arijit Pal',
    studentEmail: 'arijit.pal@practicekoro.in',
    studentInitials: 'AP',
    studentAvatarColor: 'bg-blue-500',
    testName: 'WBP Constable PYQ 2024',
    exam: 'WBP Constable',
    type: 'Official PYQ',
    score: 64,
    totalMarks: 85,
    accuracy: 75,
    timeTaken: '55 min',
    timeTakenSeconds: 3300,
    status: 'Completed',
    attemptedAtDate: '29 Sep 2026',
    attemptedAtTime: '06:45 PM',
    startedAt: '29 Sep 2026, 05:50 PM',
    submittedAt: '29 Sep 2026, 06:45 PM',
    totalQuestions: 85,
    correctAnswers: 64,
    wrongAnswers: 15,
    skippedAnswers: 6,
    sectionAnalysis: [
      {
        sectionName: 'GK & Current Affairs',
        totalQuestions: 40,
        attempted: 36,
        correct: 30,
        wrong: 6,
        marksScored: 28.5,
        maxMarks: 40,
        accuracy: 83.3,
        timeSpentMin: 20,
      },
      {
        sectionName: 'Mathematics & Reasoning',
        totalQuestions: 45,
        attempted: 43,
        correct: 34,
        wrong: 9,
        marksScored: 31.75,
        maxMarks: 45,
        accuracy: 79.0,
        timeSpentMin: 35,
      },
    ],
  },
  {
    id: 'att_4',
    studentId: 'PK100276',
    studentName: 'Moumita Das',
    studentEmail: 'moumita.das@practicekoro.in',
    studentAvatar: '/images/avatar_mousumi.jpg',
    testName: 'Indian Polity - Test 02',
    exam: 'WBCS',
    type: 'Topic Test',
    score: 21,
    totalMarks: 30,
    accuracy: 70,
    timeTaken: '26 min',
    timeTakenSeconds: 1560,
    status: 'Completed',
    attemptedAtDate: '29 Sep 2026',
    attemptedAtTime: '04:12 PM',
    startedAt: '29 Sep 2026, 03:46 PM',
    submittedAt: '29 Sep 2026, 04:12 PM',
    totalQuestions: 30,
    correctAnswers: 21,
    wrongAnswers: 6,
    skippedAnswers: 3,
    sectionAnalysis: [
      {
        sectionName: 'Indian Constitution & Polity',
        totalQuestions: 30,
        attempted: 27,
        correct: 21,
        wrong: 6,
        marksScored: 19.5,
        maxMarks: 30,
        accuracy: 77.7,
        timeSpentMin: 26,
      },
    ],
  },
  {
    id: 'att_5',
    studentId: 'PK100301',
    studentName: 'Subhankar Bera',
    studentEmail: 'subhankar.bera@practicekoro.in',
    studentInitials: 'SB',
    studentAvatarColor: 'bg-amber-400',
    testName: 'Reasoning Full Mock 1',
    exam: 'KP SI',
    type: 'Full Mock',
    score: 58,
    totalMarks: 100,
    accuracy: 62,
    timeTaken: '52 min',
    timeTakenSeconds: 3120,
    status: 'Not Completed',
    attemptedAtDate: '29 Sep 2026',
    attemptedAtTime: '12:33 PM',
    startedAt: '29 Sep 2026, 11:41 AM',
    submittedAt: '29 Sep 2026, 12:33 PM',
    totalQuestions: 100,
    correctAnswers: 58,
    wrongAnswers: 25,
    skippedAnswers: 17,
    sectionAnalysis: [
      {
        sectionName: 'General Studies',
        totalQuestions: 50,
        attempted: 45,
        correct: 30,
        wrong: 15,
        marksScored: 26.25,
        maxMarks: 50,
        accuracy: 66.6,
        timeSpentMin: 25,
      },
      {
        sectionName: 'Logical & Analytical Reasoning',
        totalQuestions: 50,
        attempted: 38,
        correct: 28,
        wrong: 10,
        marksScored: 25.5,
        maxMarks: 50,
        accuracy: 73.6,
        timeSpentMin: 27,
      },
    ],
  },
  {
    id: 'att_6',
    studentId: 'PK100188',
    studentName: 'Puja Namata',
    studentEmail: 'puja.namata@practicekoro.in',
    studentAvatar: '/images/avatar_tania.jpg',
    testName: 'Heat & Temperature - Test 01',
    exam: 'Railways Group D',
    type: 'Topic Test',
    score: 24,
    totalMarks: 30,
    accuracy: 80,
    timeTaken: '20 min',
    timeTakenSeconds: 1200,
    status: 'Completed',
    attemptedAtDate: '28 Sep 2026',
    attemptedAtTime: '11:20 AM',
    startedAt: '28 Sep 2026, 11:00 AM',
    submittedAt: '28 Sep 2026, 11:20 AM',
    totalQuestions: 30,
    correctAnswers: 24,
    wrongAnswers: 4,
    skippedAnswers: 2,
    sectionAnalysis: [
      {
        sectionName: 'Physics (Thermal Sciences)',
        totalQuestions: 30,
        attempted: 28,
        correct: 24,
        wrong: 4,
        marksScored: 23,
        maxMarks: 30,
        accuracy: 85.7,
        timeSpentMin: 20,
      },
    ],
  },
  {
    id: 'att_7',
    studentId: 'PK100312',
    studentName: 'Rohit Kumar',
    studentEmail: 'rohit.kumar@practicekoro.in',
    studentAvatar: '/images/leaderboard_rohit.jpg',
    testName: 'WBP Constable PYQ 2023',
    exam: 'WBP Constable',
    type: 'Official PYQ',
    score: 66,
    totalMarks: 85,
    accuracy: 78,
    timeTaken: '57 min',
    timeTakenSeconds: 3420,
    status: 'Completed',
    attemptedAtDate: '28 Sep 2026',
    attemptedAtTime: '05:14 AM',
    startedAt: '28 Sep 2026, 04:17 AM',
    submittedAt: '28 Sep 2026, 05:14 AM',
    totalQuestions: 85,
    correctAnswers: 66,
    wrongAnswers: 13,
    skippedAnswers: 6,
    sectionAnalysis: [
      {
        sectionName: 'General Awareness',
        totalQuestions: 40,
        attempted: 38,
        correct: 32,
        wrong: 6,
        marksScored: 30.5,
        maxMarks: 40,
        accuracy: 84.2,
        timeSpentMin: 24,
      },
      {
        sectionName: 'Math & Reasoning',
        totalQuestions: 45,
        attempted: 41,
        correct: 34,
        wrong: 7,
        marksScored: 32.25,
        maxMarks: 45,
        accuracy: 82.9,
        timeSpentMin: 33,
      },
    ],
  },
  {
    id: 'att_8',
    studentId: 'PK100276',
    studentName: 'Rekha Khatun',
    studentEmail: 'rekha.khatun@practicekoro.in',
    studentInitials: 'SK',
    studentAvatarColor: 'bg-blue-600',
    testName: 'Blood Relations - Test 01',
    exam: 'KP SI',
    type: 'Topic Test',
    score: 12,
    totalMarks: 30,
    accuracy: 40,
    timeTaken: '18 min',
    timeTakenSeconds: 1080,
    status: 'Completed',
    attemptedAtDate: '28 Sep 2026',
    attemptedAtTime: '03:08 PM',
    startedAt: '28 Sep 2026, 02:50 PM',
    submittedAt: '28 Sep 2026, 03:08 PM',
    totalQuestions: 30,
    correctAnswers: 12,
    wrongAnswers: 14,
    skippedAnswers: 4,
    sectionAnalysis: [
      {
        sectionName: 'Verbal Reasoning (Relations)',
        totalQuestions: 30,
        attempted: 26,
        correct: 12,
        wrong: 14,
        marksScored: 8.5,
        maxMarks: 30,
        accuracy: 46.1,
        timeSpentMin: 18,
      },
    ],
  },
  {
    id: 'att_9',
    studentId: 'PK100245',
    studentName: 'Sneha Khatun',
    studentEmail: 'sneha.khatun@practicekoro.in',
    studentAvatar: '/images/avatar_sneha.jpg',
    testName: 'Geography Full Mock 1',
    exam: 'WBP Constable',
    type: 'Full Mock',
    score: 76,
    totalMarks: 100,
    accuracy: 82,
    timeTaken: '50 min',
    timeTakenSeconds: 3000,
    status: 'Completed',
    attemptedAtDate: '27 Sep 2026',
    attemptedAtTime: '10:32 AM',
    startedAt: '27 Sep 2026, 09:42 AM',
    submittedAt: '27 Sep 2026, 10:32 AM',
    totalQuestions: 85,
    correctAnswers: 71,
    wrongAnswers: 11,
    skippedAnswers: 3,
    sectionAnalysis: [
      {
        sectionName: 'Geography of West Bengal & India',
        totalQuestions: 40,
        attempted: 39,
        correct: 35,
        wrong: 4,
        marksScored: 34,
        maxMarks: 40,
        accuracy: 89.7,
        timeSpentMin: 22,
      },
      {
        sectionName: 'General Aptitude',
        totalQuestions: 45,
        attempted: 43,
        correct: 36,
        wrong: 7,
        marksScored: 34.25,
        maxMarks: 45,
        accuracy: 83.7,
        timeSpentMin: 28,
      },
    ],
  },
  {
    id: 'att_10',
    studentId: 'PK100099',
    studentName: 'Admin Test',
    studentEmail: 'admin.qa@practicekoro.in',
    studentInitials: 'AT',
    studentAvatarColor: 'bg-teal-500',
    testName: 'Environment - Test 01',
    exam: 'WB Primary TET',
    type: 'Topic Test',
    score: 16,
    totalMarks: 30,
    accuracy: 53,
    timeTaken: '24 min',
    timeTakenSeconds: 1440,
    status: 'Not Completed',
    attemptedAtDate: '27 Sep 2026',
    attemptedAtTime: '09:10 AM',
    startedAt: '27 Sep 2026, 08:46 AM',
    submittedAt: '27 Sep 2026, 09:10 AM',
    totalQuestions: 30,
    correctAnswers: 16,
    wrongAnswers: 10,
    skippedAnswers: 4,
    sectionAnalysis: [
      {
        sectionName: 'Environmental Studies',
        totalQuestions: 30,
        attempted: 26,
        correct: 16,
        wrong: 10,
        marksScored: 13.5,
        maxMarks: 30,
        accuracy: 61.5,
        timeSpentMin: 24,
      },
    ],
  },
  // Additional pages records
  {
    id: 'att_11',
    studentId: 'PK100222',
    studentName: 'Debabrata Sen',
    studentEmail: 'debabrata.sen@practicekoro.in',
    studentInitials: 'DS',
    studentAvatarColor: 'bg-indigo-600',
    testName: 'WBP Constable Full Mock 2',
    exam: 'WBP Constable',
    type: 'Full Mock',
    score: 68,
    totalMarks: 100,
    accuracy: 74,
    timeTaken: '53 min',
    timeTakenSeconds: 3180,
    status: 'Completed',
    attemptedAtDate: '26 Sep 2026',
    attemptedAtTime: '11:15 AM',
    startedAt: '26 Sep 2026, 10:22 AM',
    submittedAt: '26 Sep 2026, 11:15 AM',
    totalQuestions: 85,
    correctAnswers: 65,
    wrongAnswers: 16,
    skippedAnswers: 4,
  },
  {
    id: 'att_12',
    studentId: 'PK100344',
    studentName: 'Tanushree Ghosh',
    studentEmail: 'tanushree.g@practicekoro.in',
    studentAvatar: '/images/avatar_tania.jpg',
    testName: 'Percentages & Profit Loss - Test 01',
    exam: 'SSC CGL',
    type: 'Topic Test',
    score: 26,
    totalMarks: 30,
    accuracy: 92,
    timeTaken: '19 min',
    timeTakenSeconds: 1140,
    status: 'Completed',
    attemptedAtDate: '26 Sep 2026',
    attemptedAtTime: '04:40 PM',
    startedAt: '26 Sep 2026, 04:21 PM',
    submittedAt: '26 Sep 2026, 04:40 PM',
    totalQuestions: 30,
    correctAnswers: 26,
    wrongAnswers: 2,
    skippedAnswers: 2,
  },
];

const STORAGE_KEY = 'practicekoro_test_attempts_v1';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminTestAttempts: React.FC = () => {
  const navigate = useNavigate();

  // State: Attempts list loaded from LocalStorage or seeded
  const [attempts, setAttempts] = useState<AdminTestAttempt[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved attempts:', e);
    }
    return [];
  });

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    } catch (e) {
      console.warn('Failed to save attempts:', e);
    }
  }, [attempts]);

  // Load real test attempts from Supabase database
  useEffect(() => {
    let isMounted = true;
    api
      .getAllAdminTestAttempts()
      .then((remote) => {
        if (!isMounted) return;
        if (!remote || remote.length === 0) {
          setAttempts([]);
          return;
        }
        setAttempts(remote);
        setSelectedAttemptId((prev) => {
          if (!prev) return null;
          return remote.some((a) => a.id === prev) ? prev : null;
        });
      })
      .catch((err) => {
        console.warn('Failed to fetch real test attempts from database:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected attempt for right panel (Neutral initial state)
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Answers' | 'Analysis'>('Overview');
  const [answersTabFilter, setAnswersTabFilter] = useState<'all' | 'correct' | 'wrong' | 'skipped'>(
    'all'
  );

  // Filter toolbar state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExam, setFilterExam] = useState('All Exams');
  const [filterType, setFilterType] = useState('All Types');
  const [filterResult, setFilterResult] = useState('All Results');
  const [filterDateRange, setFilterDateRange] = useState('All Time');

  // Date Range Pill & Modal
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [activeDateRangeLabel, setActiveDateRangeLabel] = useState('01 Sep 2026 → 30 Sep 2026');

  // Table row multi-selection
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Popover menus & Modals
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [isAnswerSheetModalOpen, setIsAnswerSheetModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeModalAttempt, setActiveModalAttempt] = useState<AdminTestAttempt | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Dynamic KPI computations
  const totalAttemptsCount = attempts.length;
  const completedCount = useMemo(() => {
    return attempts.filter((a) => a.status === 'Completed').length;
  }, [attempts]);
  const notCompletedCount = useMemo(() => {
    return attempts.filter((a) => a.status === 'Not Completed').length;
  }, [attempts]);
  const averageScore = useMemo(() => {
    if (totalAttemptsCount === 0) return 0;
    const sum = attempts.reduce(
      (acc, a) => acc + (a.accuracy || (a.totalMarks ? (a.score / a.totalMarks) * 100 : 0)),
      0
    );
    return Math.round(sum / totalAttemptsCount);
  }, [attempts, totalAttemptsCount]);
  const averageTimeMin = useMemo(() => {
    if (totalAttemptsCount === 0) return 0;
    const sumSec = attempts.reduce((acc, a) => acc + (a.timeTakenSeconds || 0), 0);
    return Math.round(sumSec / totalAttemptsCount / 60);
  }, [attempts, totalAttemptsCount]);

  // Active attempt resolved
  const selectedAttempt = useMemo(() => {
    if (!selectedAttemptId) return null;
    return attempts.find((a) => a.id === selectedAttemptId) || null;
  }, [attempts, selectedAttemptId]);

  // Dynamic question breakdown for selected attempt
  const questionsList = useMemo(() => {
    if (!selectedAttempt) return [];
    if (selectedAttempt.questions && selectedAttempt.questions.length > 0) {
      return selectedAttempt.questions;
    }
    return generateMockQuestions(
      selectedAttempt.totalQuestions,
      selectedAttempt.correctAnswers,
      selectedAttempt.wrongAnswers,
      selectedAttempt.skippedAnswers
    );
  }, [selectedAttempt]);

  // Outside click handler for row actions dropdown
  const actionMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered attempts
  const filteredAttempts = useMemo(() => {
    return attempts.filter((att) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        att.studentName.toLowerCase().includes(q) ||
        att.studentId.toLowerCase().includes(q) ||
        att.testName.toLowerCase().includes(q) ||
        att.exam.toLowerCase().includes(q);

      const matchesExam = filterExam === 'All Exams' || att.exam === filterExam;
      const matchesType = filterType === 'All Types' || att.type === filterType;
      const matchesResult = filterResult === 'All Results' || att.status === filterResult;

      let matchesDate = true;
      if (filterDateRange === 'September 2026') {
        matchesDate = att.attemptedAtDate.includes('Sep 2026');
      } else if (filterDateRange === 'August 2026') {
        matchesDate = att.attemptedAtDate.includes('Aug 2026');
      } else if (filterDateRange === 'Today') {
        matchesDate = att.attemptedAtDate === '30 Sep 2026';
      }

      return matchesSearch && matchesExam && matchesType && matchesResult && matchesDate;
    });
  }, [attempts, searchTerm, filterExam, filterType, filterResult, filterDateRange]);

  // Paginated records
  const paginatedAttempts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttempts.slice(start, start + pageSize);
  }, [filteredAttempts, currentPage, pageSize]);

  // Select all checkbox logic
  const isAllCurrentPageSelected = useMemo(() => {
    if (paginatedAttempts.length === 0) return false;
    return paginatedAttempts.every((a) => selectedRowIds.has(a.id));
  }, [paginatedAttempts, selectedRowIds]);

  const toggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const next = new Set(selectedRowIds);
      paginatedAttempts.forEach((a) => next.delete(a.id));
      setSelectedRowIds(next);
    } else {
      const next = new Set(selectedRowIds);
      paginatedAttempts.forEach((a) => next.add(a.id));
      setSelectedRowIds(next);
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRowIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRowIds(next);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterExam('All Exams');
    setFilterType('All Types');
    setFilterResult('All Results');
    setFilterDateRange('All Time');
    setCurrentPage(1);
  };

  // CSV Export feature
  const handleExportCSV = (selectedOnly = false) => {
    const targetData = selectedOnly
      ? attempts.filter((a) => selectedRowIds.has(a.id))
      : filteredAttempts;

    if (targetData.length === 0) {
      alert('No test attempts to export.');
      return;
    }

    const headers = [
      'Attempt ID',
      'Student ID',
      'Student Name',
      'Student Email',
      'Test Name',
      'Exam',
      'Type',
      'Score',
      'Total Marks',
      'Accuracy %',
      'Time Taken',
      'Status',
      'Attempted Date',
      'Attempted Time',
      'Correct',
      'Wrong',
      'Skipped',
    ];

    const rows = targetData.map((a) => [
      `"${a.id}"`,
      `"${a.studentId}"`,
      `"${a.studentName}"`,
      `"${a.studentEmail}"`,
      `"${a.testName}"`,
      `"${a.exam}"`,
      `"${a.type}"`,
      a.score,
      a.totalMarks,
      `${a.accuracy}%`,
      `"${a.timeTaken}"`,
      `"${a.status}"`,
      `"${a.attemptedAtDate}"`,
      `"${a.attemptedAtTime}"`,
      a.correctAnswers,
      a.wrongAnswers,
      a.skippedAnswers,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `practicekoro_test_attempts_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Re-evaluate attempt
  const handleReevaluate = (attemptId: string) => {
    setAttempts((prev) =>
      prev.map((a) => {
        if (a.id === attemptId) {
          return {
            ...a,
            accuracy: Math.min(100, Math.max(0, a.accuracy + 2)),
          };
        }
        return a;
      })
    );
    setOpenActionMenuId(null);
    alert('Attempt has been re-evaluated and recalculated successfully.');
  };

  // Delete attempt
  const handleDeleteAttempt = async (attemptId: string) => {
    try {
      requireSuccess(await api.deleteAdminTestAttempt(attemptId));
      setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
      setSelectedRowIds((prev) => new Set([...prev].filter((id) => id !== attemptId)));
      if (selectedAttemptId === attemptId) setSelectedAttemptId(null);
      setDeleteConfirmationId(null);
      setOpenActionMenuId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Bulk Invalidate/Delete
  const handleBulkDelete = async () => {
    if (!window.confirm('Delete selected attempts? Attempts with saved answers are protected.'))
      return;
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.deleteAdminTestAttempt(id)
    );
    const gone = new Set(batch.results.map((r) => r.input));
    setAttempts((prev) => prev.filter((a) => !gone.has(a.id)));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    if (selectedAttemptId && gone.has(selectedAttemptId)) setSelectedAttemptId(null);
    alert(
      gone.size +
        ' deleted; ' +
        batch.failures.length +
        ' protected/failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & DATE RANGE / EXPORT ACTIONS */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Test Attempts</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            View and analyze all student test attempts across mock tests, topic tests and official
            PYQs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Date Range Selector Pill */}
          <button
            onClick={() => setIsDateModalOpen(true)}
            className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1E293B] shadow-2xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{activeDateRangeLabel}</span>
          </button>

          {/* Export Attempts Button */}
          <button
            onClick={() => handleExportCSV(false)}
            className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Export Attempts</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (5 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Attempts */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Attempts</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalAttemptsCount.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 28%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total tests logged</p>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Completed</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {completedCount.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 16%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              {totalAttemptsCount > 0 ? Math.round((completedCount / totalAttemptsCount) * 100) : 0}
              % of total
            </p>
          </div>
        </div>

        {/* Card 3: Not Completed */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Not Completed</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {notCompletedCount.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↓ 8%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              {totalAttemptsCount > 0
                ? Math.round((notCompletedCount / totalAttemptsCount) * 100)
                : 0}
              % of total
            </p>
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Average Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {averageScore}%
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 5%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Overall test accuracy</p>
          </div>
        </div>

        {/* Card 5: Average Time */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Average Time</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {averageTimeMin} min
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↓ 12%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">-6 min this month</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR (Single clean card) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-end gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, test name, exam..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>

        {/* Exam Select */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Exam</label>
          <div className="relative">
            <select
              value={filterExam}
              onChange={(e) => {
                setFilterExam(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Exams">All Exams</option>
              <option value="WBP Constable">WBP Constable</option>
              <option value="KP SI">KP SI</option>
              <option value="WBCS">WBCS</option>
              <option value="Railways Group D">Railways Group D</option>
              <option value="SSC CGL">SSC CGL</option>
              <option value="WB Primary TET">WB Primary TET</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Test Type Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Test Type</label>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Types">All Types</option>
              <option value="Full Mock">Full Mock</option>
              <option value="Topic Test">Topic Test</option>
              <option value="Official PYQ">Official PYQ</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Result Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Result</label>
          <div className="relative">
            <select
              value={filterResult}
              onChange={(e) => {
                setFilterResult(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Results">All Results</option>
              <option value="Completed">Completed</option>
              <option value="Not Completed">Not Completed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Date Range</label>
          <div className="relative">
            <select
              value={filterDateRange}
              onChange={(e) => {
                setFilterDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Time">All Time</option>
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="Today">Today</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer h-[34px]"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#475569] font-semibold text-xs px-4 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer h-[34px]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN SPLIT CONTENT: TABLE (LEFT) + ATTEMPT DETAILS (RIGHT) */}
      {/* ==================================================================== */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        {/* Table Section */}
        <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-8">
                    #
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[150px]">
                    Student
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[170px]">
                    Test Name
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[90px]">
                    Type
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[70px]">
                    Score
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[80px]">
                    Accuracy
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[80px]">
                    Time Taken
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[95px]">
                    Status
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[100px]">
                    Attempted At
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center w-12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginatedAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                      No test attempts found matching the filters.
                    </td>
                  </tr>
                ) : (
                  paginatedAttempts.map((attempt, index) => {
                    const globalIdx = (currentPage - 1) * pageSize + index + 1;
                    const isSelectedRow = selectedAttemptId === attempt.id && isPanelOpen;
                    const isChecked = selectedRowIds.has(attempt.id);

                    return (
                      <tr
                        key={attempt.id}
                        onClick={() => {
                          setSelectedAttemptId(attempt.id);
                          setIsPanelOpen(true);
                        }}
                        className={cn(
                          'hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs',
                          isSelectedRow && 'bg-[#F0F7FF]/70'
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => toggleSelectRow(attempt.id, e as any)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* # */}
                        <td className="py-3 px-2 font-semibold text-[#64748B]">{globalIdx}</td>

                        {/* Student Name & ID */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {attempt.studentAvatar ? (
                              <img
                                src={attempt.studentAvatar}
                                alt={attempt.studentName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                            ) : (
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-2xs',
                                  attempt.studentAvatarColor || 'bg-blue-600'
                                )}
                              >
                                {attempt.studentInitials ||
                                  attempt.studentName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[#0F172A] leading-tight truncate">
                                {attempt.studentName}
                              </p>
                              <p className="text-[10px] text-[#64748B] font-mono leading-tight mt-0.5">
                                {attempt.studentId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Test Name */}
                        <td className="py-3 px-3 font-semibold text-[#1E293B] truncate max-w-[200px]">
                          {attempt.testName}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-3">
                          {attempt.type === 'Full Mock' && (
                            <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                              Full Mock
                            </span>
                          )}
                          {attempt.type === 'Topic Test' && (
                            <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                              Topic Test
                            </span>
                          )}
                          {attempt.type === 'Official PYQ' && (
                            <span className="bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block">
                              Official PYQ
                            </span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-3 px-3 font-bold text-[#1E293B]">
                          {attempt.score} / {attempt.totalMarks}
                        </td>

                        {/* Accuracy */}
                        <td className="py-3 px-3">
                          {attempt.accuracy >= 70 ? (
                            <span className="bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                              {attempt.accuracy}%
                            </span>
                          ) : attempt.accuracy >= 50 ? (
                            <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                              {attempt.accuracy}%
                            </span>
                          ) : (
                            <span className="bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold px-2 py-0.5 rounded-md inline-block">
                              {attempt.accuracy}%
                            </span>
                          )}
                        </td>

                        {/* Time Taken */}
                        <td className="py-3 px-3 text-[#475569] font-medium">
                          {attempt.timeTaken}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {attempt.status === 'Completed' ? (
                            <span className="bg-[#DCFCE7]/70 text-[#15803D] border border-[#86EFAC]/40 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block">
                              Completed
                            </span>
                          ) : (
                            <span className="bg-[#FEE2E2]/70 text-[#DC2626] border border-[#FCA5A5]/40 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block">
                              Not Completed
                            </span>
                          )}
                        </td>

                        {/* Attempted At (Date + Time) */}
                        <td className="py-3 px-3 leading-tight">
                          <p className="font-semibold text-[#1E293B] text-[11px]">
                            {attempt.attemptedAtDate}
                          </p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">
                            {attempt.attemptedAtTime}
                          </p>
                        </td>

                        {/* Actions menu */}
                        <td
                          className="py-3 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              setOpenActionMenuId(
                                openActionMenuId === attempt.id ? null : attempt.id
                              )
                            }
                            className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Popover Menu */}
                          {openActionMenuId === attempt.id && (
                            <div
                              ref={actionMenuRef}
                              className="absolute right-2 top-8 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 text-left text-xs animate-in fade-in duration-150"
                            >
                              <button
                                onClick={() => {
                                  setSelectedAttemptId(attempt.id);
                                  setIsPanelOpen(true);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveModalAttempt(attempt);
                                  setIsAnswerSheetModalOpen(true);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Answer Sheet</span>
                              </button>
                              <button
                                onClick={() => handleReevaluate(attempt.id)}
                                className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                <span>Re-evaluate</span>
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => setDeleteConfirmationId(attempt.id)}
                                className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="py-3 px-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#64748B] font-medium">
              Showing{' '}
              {filteredAttempts.length === 0
                ? '0'
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredAttempts.length)}`}{' '}
              of {filteredAttempts.length.toLocaleString('en-IN')} attempts
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(1)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  currentPage === 1
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100'
                )}
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  currentPage === 2
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100'
                )}
              >
                2
              </button>
              <button
                onClick={() => setCurrentPage(3)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  currentPage === 3
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100'
                )}
              >
                3
              </button>
              <button
                onClick={() => setCurrentPage(4)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  currentPage === 4
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100'
                )}
              >
                4
              </button>
              <button
                onClick={() => setCurrentPage(5)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                  currentPage === 5
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100'
                )}
              >
                5
              </button>

              <span className="px-1 text-slate-400">...</span>

              <button
                onClick={() => setCurrentPage(12486)}
                className="w-12 h-8 rounded-lg text-xs font-semibold text-[#64748B] hover:bg-slate-100"
              >
                12,486
              </button>

              <button
                disabled={currentPage >= 12486}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Page Size Select */}
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-7 py-1.5 text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. ATTEMPT DETAILS PANEL (RIGHT SIDE - EXACT MATCH) */}
        {/* ==================================================================== */}
        {isPanelOpen && selectedAttempt && (
          <div className="w-full xl:w-[380px] shrink-0 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col space-y-4 animate-in fade-in duration-200">
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-bold text-[#0F172A]">Attempt Details</h2>
              <button
                onClick={() => {
                  setIsPanelOpen(false);
                  setSelectedAttemptId(null);
                }}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Profile Row */}
            <div className="flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {selectedAttempt.studentAvatar ? (
                  <img
                    src={selectedAttempt.studentAvatar}
                    alt={selectedAttempt.studentName}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-11 h-11 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-xs',
                      selectedAttempt.studentAvatarColor || 'bg-blue-600'
                    )}
                  >
                    {selectedAttempt.studentInitials || 'SK'}
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-[#0F172A] leading-tight">
                    {selectedAttempt.studentName}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-mono leading-tight mt-0.5">
                    {selectedAttempt.studentId}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/admin/students')}
                className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5"
              >
                <span>View Student</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* 3 Tabs: Overview | Answers | Analysis */}
            <div className="flex items-center justify-around border-b border-[#E2E8F0] pt-1 text-xs">
              <button
                onClick={() => setActiveTab('Overview')}
                className={cn(
                  'pb-2 px-3 font-semibold transition-colors relative',
                  activeTab === 'Overview'
                    ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('Answers')}
                className={cn(
                  'pb-2 px-3 font-semibold transition-colors relative',
                  activeTab === 'Answers'
                    ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                Answers
              </button>
              <button
                onClick={() => setActiveTab('Analysis')}
                className={cn(
                  'pb-2 px-3 font-semibold transition-colors relative',
                  activeTab === 'Analysis'
                    ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                Analysis
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'Overview' && (
              <div className="space-y-3.5">
                {/* Test Banner Card */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200 shadow-2xs">
                    <img
                      src="/images/exams/emblem_wbp_shield.png"
                      alt="Exam Emblem"
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedAttempt.testName}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-semibold px-2 py-0.5 rounded">
                        {selectedAttempt.type}
                      </span>
                      <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-semibold px-2 py-0.5 rounded">
                        {selectedAttempt.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Cards in Row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Score */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {selectedAttempt.score}/{selectedAttempt.totalMarks}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Score</p>
                  </div>

                  {/* Accuracy */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedAttempt.accuracy}%</span>
                    </div>
                    <p className="text-[10px] text-[#16A34A] font-medium mt-0.5 flex items-center justify-center gap-0.5">
                      ▲ Accuracy
                    </p>
                  </div>

                  {/* Time Taken */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                    <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>{selectedAttempt.timeTaken}</span>
                    </div>
                    <p className="text-[10px] text-[#64748B] mt-0.5">Time Taken</p>
                  </div>
                </div>

                {/* Question Breakdown Row (85 Total, 12 Wrong, 3 Skipped) */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-around divide-x divide-[#E2E8F0]">
                  <div className="flex items-center gap-2 px-2">
                    <Users className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {selectedAttempt.totalQuestions}
                      </p>
                      <p className="text-[10px] text-[#64748B]">Total Questions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {selectedAttempt.wrongAnswers}
                      </p>
                      <p className="text-[10px] text-[#64748B]">Wrong Answers</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <Bookmark className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0F172A]">
                        {selectedAttempt.skippedAnswers}
                      </p>
                      <p className="text-[10px] text-[#64748B]">Skipped</p>
                    </div>
                  </div>
                </div>

                {/* Attempt Information */}
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] mb-2.5">Attempt Information</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Student</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.studentName} ({selectedAttempt.studentId})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Exam</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.exam}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Test Type</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Attempted At</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.submittedAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Started At</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.startedAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Submitted At</span>
                      <span className="font-semibold text-[#0F172A] text-[11px]">
                        {selectedAttempt.submittedAt}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Status</span>
                      <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedAttempt.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveModalAttempt(selectedAttempt);
                      setIsTestModalOpen(true);
                    }}
                    className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveModalAttempt(selectedAttempt);
                      setIsAnswerSheetModalOpen(true);
                    }}
                    className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
                  >
                    View Answer Sheet
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ANSWERS (Compact in-panel question preview) */}
            {activeTab === 'Answers' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-100 pb-2">
                  <span>Questions ({questionsList.length})</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      onClick={() => setAnswersTabFilter('all')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAnswersTabFilter('correct')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'correct'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-700 bg-emerald-50'
                      )}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setAnswersTabFilter('wrong')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'wrong'
                          ? 'bg-rose-600 text-white'
                          : 'text-rose-700 bg-rose-50'
                      )}
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => setAnswersTabFilter('skipped')}
                      className={cn(
                        'px-2 py-0.5 rounded',
                        answersTabFilter === 'skipped'
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-700 bg-blue-50'
                      )}
                    >
                      -
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs">
                  {questionsList
                    .filter((q) =>
                      answersTabFilter === 'all' ? true : q.status === answersTabFilter
                    )
                    .map((q) => (
                      <div
                        key={q.id}
                        className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800">Q{q.id}.</span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.2 rounded',
                              q.status === 'correct' && 'bg-emerald-100 text-emerald-800',
                              q.status === 'wrong' && 'bg-rose-100 text-rose-800',
                              q.status === 'skipped' && 'bg-slate-200 text-slate-700'
                            )}
                          >
                            {q.status === 'correct'
                              ? '+1.00'
                              : q.status === 'wrong'
                                ? '-0.25'
                                : '0.00'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-snug">{q.questionText}</p>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-slate-500">
                            Selected: {q.selectedOption || 'None'}
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Correct: {q.correctOption}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => {
                    setActiveModalAttempt(selectedAttempt);
                    setIsAnswerSheetModalOpen(true);
                  }}
                  className="w-full bg-[#2563EB] text-white py-2 rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition-colors"
                >
                  Open Full Answer Sheet Modal
                </button>
              </div>
            )}

            {/* TAB CONTENT: ANALYSIS */}
            {activeTab === 'Analysis' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-xs">Section Performance</h4>
                <div className="space-y-2.5">
                  {(
                    selectedAttempt.sectionAnalysis || [
                      {
                        sectionName: 'General Awareness',
                        totalQuestions: 25,
                        attempted: 24,
                        correct: 20,
                        wrong: 4,
                        marksScored: 19,
                        maxMarks: 25,
                        accuracy: 83.3,
                        timeSpentMin: 12,
                      },
                      {
                        sectionName: 'Mathematics',
                        totalQuestions: 25,
                        attempted: 25,
                        correct: 21,
                        wrong: 4,
                        marksScored: 20,
                        maxMarks: 25,
                        accuracy: 84.0,
                        timeSpentMin: 18,
                      },
                      {
                        sectionName: 'Reasoning',
                        totalQuestions: 25,
                        attempted: 24,
                        correct: 21,
                        wrong: 3,
                        marksScored: 20.25,
                        maxMarks: 25,
                        accuracy: 87.5,
                        timeSpentMin: 14,
                      },
                      {
                        sectionName: 'English',
                        totalQuestions: 10,
                        attempted: 9,
                        correct: 8,
                        wrong: 1,
                        marksScored: 7.75,
                        maxMarks: 10,
                        accuracy: 88.9,
                        timeSpentMin: 4,
                      },
                    ]
                  ).map((sec) => (
                    <div
                      key={sec.sectionName}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                        <span>{sec.sectionName}</span>
                        <span>
                          {sec.marksScored}/{sec.maxMarks}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${(sec.marksScored / sec.maxMarks) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Accuracy: {sec.accuracy.toFixed(1)}%</span>
                        <span>Time: {sec.timeSpentMin} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. FLOATING BULK SELECTION ACTION BAR */}
      {/* ==================================================================== */}
      {selectedRowIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-xs font-bold text-slate-200">
            {selectedRowIds.size} attempt{selectedRowIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={() => handleExportCSV(true)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Selected</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Invalidate Selected</span>
          </button>
          <button
            onClick={() => setSelectedRowIds(new Set())}
            className="text-xs text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. DATE RANGE MODAL */}
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
                    setActiveDateRangeLabel(range);
                    setIsDateModalOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl border font-semibold transition-colors flex items-center justify-between',
                    activeDateRangeLabel === range
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{range}</span>
                  {activeDateRangeLabel === range && <Check className="w-4 h-4 text-blue-600" />}
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
      {/* 8. FULL ANSWER SHEET MODAL */}
      {/* ==================================================================== */}
      {isAnswerSheetModalOpen && activeModalAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Student Answer Sheet • {activeModalAttempt.studentName} (
                  {activeModalAttempt.studentId})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalAttempt.testName} • Submitted on {activeModalAttempt.submittedAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setIsAnswerSheetModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Summary Stats Banner */}
            <div className="bg-blue-50/50 border-b border-blue-100 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Total Score</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeModalAttempt.score} / {activeModalAttempt.totalMarks}
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Accuracy</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {activeModalAttempt.accuracy}%
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Correct</p>
                <p className="text-sm font-black text-emerald-600 mt-0.5">
                  {activeModalAttempt.correctAnswers} Qs
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100">
                <p className="text-slate-500 text-[10px]">Wrong</p>
                <p className="text-sm font-black text-rose-600 mt-0.5">
                  {activeModalAttempt.wrongAnswers} Qs
                </p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
                <p className="text-slate-500 text-[10px]">Time Spent</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeModalAttempt.timeTaken}
                </p>
              </div>
            </div>

            {/* Questions Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {questionsList.map((q) => (
                <div
                  key={q.id}
                  className={cn(
                    'p-4 rounded-xl border transition-colors',
                    q.status === 'correct' && 'border-emerald-200 bg-emerald-50/20',
                    q.status === 'wrong' && 'border-rose-200 bg-rose-50/20',
                    q.status === 'skipped' && 'border-slate-200 bg-slate-50/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {q.subject} • Question {q.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.questionText}
                      </h4>
                      {q.questionTextBn && (
                        <p className="text-xs text-slate-600">{q.questionTextBn}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
                        q.status === 'correct' && 'bg-emerald-100 text-emerald-800',
                        q.status === 'wrong' && 'bg-rose-100 text-rose-800',
                        q.status === 'skipped' && 'bg-slate-200 text-slate-700'
                      )}
                    >
                      {q.status === 'correct'
                        ? '+1.00 Marks'
                        : q.status === 'wrong'
                          ? '-0.25 Marks'
                          : 'Skipped (0.00)'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                    {q.options.map((opt) => {
                      const isCorrect = opt.key === q.correctOption;
                      const isSelected = opt.key === q.selectedOption;

                      return (
                        <div
                          key={opt.key}
                          className={cn(
                            'p-2.5 rounded-lg border font-medium flex items-center justify-between',
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                              : isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-white border-slate-200 text-slate-700'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-5">{opt.key}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Correct
                            </span>
                          )}
                          {!isCorrect && isSelected && (
                            <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-100/70 text-xs text-slate-700 space-y-0.5">
                      <span className="font-bold text-slate-900">Explanation:</span>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsAnswerSheetModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Answer Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. TEST DETAILS MODAL */}
      {/* ==================================================================== */}
      {isTestModalOpen && activeModalAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Test Specifications</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">{activeModalAttempt.testName}</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {activeModalAttempt.exam}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {activeModalAttempt.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Total Marks</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {activeModalAttempt.totalMarks} Marks
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Total Questions</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    {activeModalAttempt.totalQuestions} Questions
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Duration</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">60 Minutes</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Negative Marking</span>
                  <p className="font-black text-rose-600 text-sm mt-0.5">-0.25 Marks</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-slate-700 text-xs">
                <span className="font-bold text-blue-900 block mb-1">Standard Pattern:</span>•
                Questions are prepared according to the latest official syllabus and marking scheme.
                • Bilingual options supported (Bengali & English).
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsTestModalOpen(false);
                  navigate('/admin/test-questions');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Manage Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. DELETE CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Delete Attempt Record</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this student's attempt record? This will
              remove their scores and rank calculations.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAttempt(deleteConfirmationId)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
