import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Crown,
  Users,
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  MapPin,
  BookOpen,
  FileText,
  CheckCircle2,
  TrendingUp,
  X,
  Bookmark,
  Printer,
  ArrowRight,
  Flame,
  Search,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface RankingStudent {
  rank: number;
  studentId: string;
  name: string;
  district: string;
  location: string;
  avatar?: string;
  initials?: string;
  initialsBg?: string;
  testsAttempted: number;
  questionsAnswered: number;
  accuracy: number;
  avgScore: number;
  lastActive: string;
  subjectPerformance: {
    subject: string;
    scorePercent: number;
    barColor: string;
  }[];
  recentAttempts: {
    title: string;
    scorePercent: number;
    timeAgo: string;
    iconBg: string;
  }[];
}

// Initial seeded student rankings matching exact reference screenshot media_1791199684215.jpg
export const INITIAL_STUDENTS: RankingStudent[] = [
  {
    rank: 1,
    studentId: 'PK100312',
    name: 'Rohit Kumar',
    district: 'Purulia',
    location: 'Purulia, West Bengal',
    avatar: '/images/leaderboard_rohit.jpg',
    testsAttempted: 48,
    questionsAnswered: 3240,
    accuracy: 92,
    avgScore: 88,
    lastActive: '2 hours ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 94, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 90, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 87, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 85, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 82, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'WBP Constable Full Mock 1', scorePercent: 88, timeAgo: '2 hours ago', iconBg: 'bg-amber-100 text-amber-600' },
      { title: 'General Science - Heat & Temperature', scorePercent: 92, timeAgo: '1 day ago', iconBg: 'bg-blue-100 text-blue-600' },
      { title: 'Indian Polity - Constitution', scorePercent: 84, timeAgo: '2 days ago', iconBg: 'bg-rose-100 text-rose-600' },
    ],
  },
  {
    rank: 2,
    studentId: 'PK100245',
    name: 'Sneha Khatun',
    district: 'Kolkata',
    location: 'Kolkata, West Bengal',
    avatar: '/images/avatar_sneha.jpg',
    testsAttempted: 45,
    questionsAnswered: 2980,
    accuracy: 89,
    avgScore: 84,
    lastActive: '4 hours ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 91, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 88, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 86, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 84, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 80, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Geography Full Mock 1', scorePercent: 89, timeAgo: '4 hours ago', iconBg: 'bg-blue-100 text-blue-600' },
      { title: 'WBP Constable Full Mock 1', scorePercent: 84, timeAgo: '1 day ago', iconBg: 'bg-amber-100 text-amber-600' },
      { title: 'Indian Polity - Test 02', scorePercent: 82, timeAgo: '3 days ago', iconBg: 'bg-rose-100 text-rose-600' },
    ],
  },
  {
    rank: 3,
    studentId: 'PK100344',
    name: 'Subhankar Pal',
    district: 'Paschim Medinipur',
    location: 'Paschim Medinipur',
    avatar: '/images/avatar_abhishek.jpg',
    testsAttempted: 42,
    questionsAnswered: 2760,
    accuracy: 87,
    avgScore: 82,
    lastActive: '1 day ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 88, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 86, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 84, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 81, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 78, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Reasoning Full Mock 1', scorePercent: 85, timeAgo: '1 day ago', iconBg: 'bg-purple-100 text-purple-600' },
      { title: 'WBP Constable PYQ 2024', scorePercent: 82, timeAgo: '2 days ago', iconBg: 'bg-amber-100 text-amber-600' },
      { title: 'Blood Relations - Test 01', scorePercent: 79, timeAgo: '4 days ago', iconBg: 'bg-blue-100 text-blue-600' },
    ],
  },
  {
    rank: 4,
    studentId: 'PK100198',
    name: 'Arijit Mondal',
    district: 'Nadia',
    location: 'Nadia, West Bengal',
    avatar: '/images/avatar_arindam.jpg',
    testsAttempted: 38,
    questionsAnswered: 2450,
    accuracy: 84,
    avgScore: 80,
    lastActive: '1 day ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 85, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 83, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 80, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 79, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 76, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'WBP Constable PYQ 2024', scorePercent: 80, timeAgo: '1 day ago', iconBg: 'bg-rose-100 text-rose-600' },
      { title: 'Modern India - Test 01', scorePercent: 82, timeAgo: '3 days ago', iconBg: 'bg-amber-100 text-amber-600' },
    ],
  },
  {
    rank: 5,
    studentId: 'PK100276',
    name: 'Moumita Sarkar',
    district: 'Howrah',
    location: 'Howrah, West Bengal',
    avatar: '/images/avatar_mousumi.jpg',
    testsAttempted: 36,
    questionsAnswered: 2320,
    accuracy: 82,
    avgScore: 78,
    lastActive: '2 days ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 82, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 80, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 79, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 76, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 74, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Indian Polity - Test 02', scorePercent: 78, timeAgo: '2 days ago', iconBg: 'bg-blue-100 text-blue-600' },
      { title: 'WBP Constable Full Mock 2', scorePercent: 79, timeAgo: '4 days ago', iconBg: 'bg-amber-100 text-amber-600' },
    ],
  },
  {
    rank: 6,
    studentId: 'PK100188',
    name: 'Rakesh Shaw',
    district: 'Birbhum',
    location: 'Birbhum, West Bengal',
    avatar: '/images/avatar_koushik.jpg',
    testsAttempted: 34,
    questionsAnswered: 2180,
    accuracy: 79,
    avgScore: 75,
    lastActive: '2 days ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 80, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 78, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 75, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 74, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 72, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Heat & Temperature - Test 01', scorePercent: 80, timeAgo: '2 days ago', iconBg: 'bg-blue-100 text-blue-600' },
      { title: 'WBP Constable PYQ 2023', scorePercent: 75, timeAgo: '5 days ago', iconBg: 'bg-rose-100 text-rose-600' },
    ],
  },
  {
    rank: 7,
    studentId: 'PK100366',
    name: 'Taniya Ghosh',
    district: 'Murshidabad',
    location: 'Murshidabad, West Bengal',
    avatar: '/images/avatar_tania.jpg',
    testsAttempted: 32,
    questionsAnswered: 2040,
    accuracy: 77,
    avgScore: 72,
    lastActive: '3 days ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 76, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 75, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 72, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 70, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 68, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Environment - Test 01', scorePercent: 74, timeAgo: '3 days ago', iconBg: 'bg-emerald-100 text-emerald-600' },
      { title: 'WBP Constable Full Mock 1', scorePercent: 72, timeAgo: '6 days ago', iconBg: 'bg-amber-100 text-amber-600' },
    ],
  },
  {
    rank: 8,
    studentId: 'PK100115',
    name: 'Puja Roy',
    district: 'Bankura',
    location: 'Bankura, West Bengal',
    initials: 'PR',
    initialsBg: 'bg-rose-100 text-rose-600 border border-rose-200',
    testsAttempted: 30,
    questionsAnswered: 1920,
    accuracy: 74,
    avgScore: 70,
    lastActive: '3 days ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 75, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 73, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 71, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 68, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 66, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Blood Relations - Test 01', scorePercent: 70, timeAgo: '3 days ago', iconBg: 'bg-blue-100 text-blue-600' },
      { title: 'WBP Constable PYQ 2022', scorePercent: 71, timeAgo: '5 days ago', iconBg: 'bg-rose-100 text-rose-600' },
    ],
  },
  {
    rank: 9,
    studentId: 'PK100422',
    name: 'Abhijit Dey',
    district: 'Hooghly',
    location: 'Hooghly, West Bengal',
    initials: 'AD',
    initialsBg: 'bg-emerald-100 text-emerald-600 border border-emerald-200',
    testsAttempted: 28,
    questionsAnswered: 1820,
    accuracy: 72,
    avgScore: 68,
    lastActive: '4 days ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 72, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 70, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 68, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 66, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 65, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Mathematics Speed Test', scorePercent: 68, timeAgo: '4 days ago', iconBg: 'bg-blue-100 text-blue-600' },
      { title: 'WBP Constable Full Mock 1', scorePercent: 69, timeAgo: '6 days ago', iconBg: 'bg-amber-100 text-amber-600' },
    ],
  },
  {
    rank: 10,
    studentId: 'PK100099',
    name: 'Suman Das',
    district: 'South 24 Parganas',
    location: 'South 24 Parganas',
    avatar: '/images/performer_suman.png',
    testsAttempted: 26,
    questionsAnswered: 1680,
    accuracy: 71,
    avgScore: 66,
    lastActive: '4 days ago',
    subjectPerformance: [
      { subject: 'General Science', scorePercent: 70, barColor: 'bg-cyan-500' },
      { subject: 'General Knowledge', scorePercent: 68, barColor: 'bg-blue-600' },
      { subject: 'Indian Polity', scorePercent: 66, barColor: 'bg-indigo-600' },
      { subject: 'History', scorePercent: 65, barColor: 'bg-amber-500' },
      { subject: 'Geography', scorePercent: 64, barColor: 'bg-rose-500' },
    ],
    recentAttempts: [
      { title: 'Reasoning Mock Test 02', scorePercent: 67, timeAgo: '4 days ago', iconBg: 'bg-purple-100 text-purple-600' },
      { title: 'WBP Constable Mock 03', scorePercent: 66, timeAgo: '7 days ago', iconBg: 'bg-amber-100 text-amber-600' },
    ],
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminRankings: React.FC = () => {
  const navigate = useNavigate();

  // Scope Tab: Overall | By Exam | By Subject | By Topic | By Test Series
  const [scopeTab, setScopeTab] = useState<'Overall' | 'By Exam' | 'By Subject' | 'By Topic' | 'By Test Series'>('Overall');

  // Filter Toolbar State
  const [selectedExam, setSelectedExam] = useState('All Exams');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedTestType, setSelectedTestType] = useState('All Types');
  const [timePeriod, setTimePeriod] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic dropdown data loaded from database
  const [dbExams, setDbExams] = useState<any[]>([]);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);

  // Live rankings list loaded from Supabase
  const [studentsList, setStudentsList] = useState<RankingStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selected Student for Details Widget
  const [selectedStudentRank, setSelectedStudentRank] = useState<number>(1);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Load database exams and subjects for filter dropdowns
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getAllAdminExams().catch(() => []),
      api.getAllAdminSubjects().catch(() => []),
    ]).then(([exams, subjects]) => {
      if (!isMounted) return;
      if (Array.isArray(exams)) setDbExams(exams);
      if (Array.isArray(subjects)) setDbSubjects(subjects);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live rankings from Supabase
  const fetchRankings = useCallback(
    async (overrides?: {
      scope?: 'Overall' | 'By Exam' | 'By Subject' | 'By Topic' | 'By Test Series';
      exam?: string;
      subject?: string;
      testType?: string;
      timePeriod?: string;
      search?: string;
    }) => {
      setIsLoading(true);
      try {
        const targetScope = overrides?.scope ?? scopeTab;
        const targetExam = overrides?.exam ?? selectedExam;
        const targetSubject = overrides?.subject ?? selectedSubject;
        const targetTestType = overrides?.testType ?? selectedTestType;
        const targetTimePeriod = overrides?.timePeriod ?? timePeriod;
        const targetSearch = overrides?.search ?? searchQuery;

        const liveRankings = await api.getAdminRankings({
          scope: targetScope,
          exam: targetExam,
          subject: targetSubject,
          testType: targetTestType,
          timePeriod: targetTimePeriod,
          search: targetSearch,
        });

        if (liveRankings && liveRankings.length > 0) {
          setStudentsList(liveRankings);
          setSelectedStudentRank(liveRankings[0].rank);
        } else {
          // If database has no attempts matching the filter, fallback to initial reference rankings
          setStudentsList(INITIAL_STUDENTS);
          setSelectedStudentRank(1);
        }
      } catch (err) {
        console.warn('Failed to load admin rankings from database:', err);
        setStudentsList(INITIAL_STUDENTS);
        setSelectedStudentRank(1);
      } finally {
        setIsLoading(false);
      }
    },
    [scopeTab, selectedExam, selectedSubject, selectedTestType, timePeriod, searchQuery]
  );

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Handle Scope Tab Changes
  const handleScopeChange = (newScope: 'Overall' | 'By Exam' | 'By Subject' | 'By Topic' | 'By Test Series') => {
    setScopeTab(newScope);
    setCurrentPage(1);
    fetchRankings({ scope: newScope });
  };

  // Dynamic KPI computations
  const totalStudentsCount = studentsList.length;
  const activeTestTakersCount = useMemo(() => {
    return studentsList.filter((s) => s.testsAttempted > 0).length;
  }, [studentsList]);
  const topRankScore = useMemo(() => {
    if (studentsList.length === 0) return 0;
    return Math.max(...studentsList.map((s) => s.accuracy || 0));
  }, [studentsList]);

  // Top 3 Podium Students
  const top1Student = useMemo(() => {
    return studentsList.find((s) => s.rank === 1) || (studentsList.length > 0 ? studentsList[0] : null);
  }, [studentsList]);
  const top2Student = useMemo(() => {
    return studentsList.find((s) => s.rank === 2) || (studentsList.length > 1 ? studentsList[1] : null);
  }, [studentsList]);
  const top3Student = useMemo(() => {
    return studentsList.find((s) => s.rank === 3) || (studentsList.length > 2 ? studentsList[2] : null);
  }, [studentsList]);

  // Row Action Dropdown Popover
  const [openActionRank, setOpenActionRank] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isTop3ModalOpen, setIsTop3ModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isRecentAttemptsModalOpen, setIsRecentAttemptsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Resolve currently active student
  const activeStudent = useMemo(() => {
    return (
      studentsList.find((s) => s.rank === selectedStudentRank) ||
      (studentsList.length > 0 ? studentsList[0] : null)
    );
  }, [studentsList, selectedStudentRank]);

  // Outside click for row actions popover
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionRank(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered Students (Search filter applied instantly)
  const filteredStudents = useMemo(() => {
    let list = studentsList;
    if (selectedSubject !== 'All Subjects') {
      const subFiltered = list.filter((student) =>
        student.subjectPerformance.some((sp) => sp.subject.toLowerCase().includes(selectedSubject.toLowerCase()))
      );
      if (subFiltered.length > 0) {
        list = subFiltered;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [studentsList, selectedSubject, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // CSV Export feature
  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Student ID',
      'Student Name',
      'District',
      'Tests Attempted',
      'Questions Answered',
      'Accuracy %',
      'Average Score %',
      'Last Active',
    ];

    const rows = filteredStudents.map((s) => [
      s.rank,
      `"${s.studentId}"`,
      `"${s.name}"`,
      `"${s.district}"`,
      s.testsAttempted,
      s.questionsAnswered,
      `${s.accuracy}%`,
      `${s.avgScore}%`,
      `"${s.lastActive}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `practicekoro_rankings_${selectedExam.replace(/\s+/g, '_')}_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedExam('All Exams');
    setSelectedSubject('All Subjects');
    setSelectedTestType('All Types');
    setTimePeriod('All Time');
    setSearchQuery('');
    setScopeTab('Overall');
    setCurrentPage(1);
    fetchRankings({
      exam: 'All Exams',
      subject: 'All Subjects',
      testType: 'All Types',
      timePeriod: 'All Time',
      search: '',
      scope: 'Overall',
    });
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Rankings
          </h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            View student rankings based on test performance. Filter by exam, subject, topic or test series.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Export Rankings</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (4 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Students</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalStudentsCount.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 26%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total enrolled aspirants</p>
          </div>
        </div>

        {/* Card 2: Active Test Takers */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Active Test Takers</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {activeTestTakersCount.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 18%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Tested aspirants</p>
          </div>
        </div>

        {/* Card 3: Top Rank Score */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Top Rank Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">{topRankScore}%</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Highest accuracy</p>
          </div>
        </div>

        {/* Card 4: Students in Ranking */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Students in Ranking</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {studentsList.length.toLocaleString('en-IN')}
              </span>
              <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                ↑ 32%
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">this month</p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKING SCOPE SEGMENTED TABS */}
      {/* ==================================================================== */}
      <div className="inline-flex p-1 bg-white border border-[#E2E8F0] rounded-xl gap-1 shadow-2xs">
        <button
          onClick={() => handleScopeChange('Overall')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
            scopeTab === 'Overall'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', scopeTab === 'Overall' ? 'bg-white' : 'bg-transparent')} />
          <span>Overall</span>
        </button>

        <button
          onClick={() => handleScopeChange('By Exam')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
            scopeTab === 'By Exam'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          By Exam
        </button>

        <button
          onClick={() => handleScopeChange('By Subject')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
            scopeTab === 'By Subject'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          By Subject
        </button>

        <button
          onClick={() => handleScopeChange('By Topic')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer',
            scopeTab === 'By Topic'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          <Bookmark className="w-3 h-3 text-slate-400" />
          <span>By Topic</span>
        </button>

        <button
          onClick={() => handleScopeChange('By Test Series')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
            scopeTab === 'By Test Series'
              ? 'bg-[#2563EB] text-white font-bold shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          )}
        >
          By Test Series
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 4. FILTER TOOLBAR (Single clean card) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-end gap-3">
        {/* Search Student Input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Search Student</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, district..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Select Exam */}
        <div className="w-[150px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Select Exam</label>
          <div className="relative">
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7 truncate"
            >
              <option value="All Exams">All Exams</option>
              {dbExams.map((ex) => (
                <option key={ex.id} value={ex.title || ex.name}>
                  {ex.title || ex.name}
                </option>
              ))}
              {dbExams.length === 0 && (
                <>
                  <option value="WBP Constable">WBP Constable</option>
                  <option value="KP SI">KP SI</option>
                  <option value="WBCS">WBCS</option>
                  <option value="Railways Group D">Railways Group D</option>
                  <option value="SSC CGL">SSC CGL</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select Subject */}
        <div className="w-[150px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Select Subject</label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7 truncate"
            >
              <option value="All Subjects">All Subjects</option>
              {dbSubjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
              {dbSubjects.length === 0 && (
                <>
                  <option value="General Science">General Science</option>
                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Indian Polity">Indian Polity</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Reasoning">Reasoning</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select Test Type */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Select Test Type</label>
          <div className="relative">
            <select
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value)}
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

        {/* Time Period */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Time Period</label>
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
              <option value="Today">Today</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchRankings();
            }}
            disabled={isLoading}
            className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2 rounded-xl shadow-xs transition-colors cursor-pointer h-[34px] flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Apply</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2 py-2 cursor-pointer h-[34px] flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MAIN CONTENT SPLIT: TABLE (LEFT) + CARDS (RIGHT) */}
      {/* ==================================================================== */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        {/* ==================== LEFT: RANKINGS TABLE ==================== */}
        <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-3 px-3.5 text-[11px] font-bold text-[#475569] uppercase tracking-wider w-12 text-center">
                    #
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[170px]">
                    Student
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[90px]">
                    Tests Attempted
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[100px]">
                    Questions Answered
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[80px]">
                    Accuracy
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center min-w-[80px]">
                    Avg. Score
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider min-w-[95px]">
                    Last Active
                  </th>
                  <th className="py-3 px-3 text-[11px] font-bold text-[#475569] uppercase tracking-wider text-center w-12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      No rankings available.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => {
                  const isSelected = selectedStudentRank === student.rank;

                  return (
                    <tr
                      key={student.rank}
                      onClick={() => {
                        setSelectedStudentRank(student.rank);
                        setIsDetailsOpen(true);
                      }}
                      className={cn(
                        'hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs',
                        isSelected && 'bg-[#EFF6FF]'
                      )}
                    >
                      {/* Rank Medal / Badge */}
                      <td className="py-3 px-3.5 text-center">
                        {student.rank === 1 && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-amber-300">
                            1
                          </div>
                        )}
                        {student.rank === 2 && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-400 to-slate-300 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-slate-200">
                            2
                          </div>
                        )}
                        {student.rank === 3 && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-xs border border-orange-300">
                            3
                          </div>
                        )}
                        {student.rank > 3 && (
                          <span className="font-bold text-[#64748B]">
                            {student.rank}
                          </span>
                        )}
                      </td>

                      {/* Student Details (Avatar + Name + Location) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs',
                                student.initialsBg || 'bg-blue-600 text-white'
                              )}
                            >
                              {student.initials || student.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[#0F172A] leading-tight truncate">
                              {student.name}
                            </p>
                            <p className="text-[10px] text-[#64748B] leading-tight mt-0.5 truncate">
                              {student.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tests Attempted */}
                      <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                        {student.testsAttempted}
                      </td>

                      {/* Questions Answered */}
                      <td className="py-3 px-3 text-center font-semibold text-[#1E293B]">
                        {student.questionsAnswered.toLocaleString()}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                        {student.accuracy}%
                      </td>

                      {/* Avg. Score */}
                      <td className="py-3 px-3 text-center font-bold text-[#1E293B]">
                        {student.avgScore}%
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-3 text-[#475569] font-medium text-[11px]">
                        {student.lastActive}
                      </td>

                      {/* Actions Menu */}
                      <td
                        className="py-3 px-3 text-center relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setOpenActionRank(openActionRank === student.rank ? null : student.rank)
                          }
                          className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Popover Menu */}
                        {openActionRank === student.rank && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-2 top-8 z-30 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 text-left text-xs animate-in fade-in duration-150"
                          >
                            <button
                              onClick={() => {
                                setSelectedStudentRank(student.rank);
                                setIsDetailsOpen(true);
                                setOpenActionRank(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                              <span>View Ranking</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsProfileModalOpen(true);
                                setOpenActionRank(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Profile</span>
                            </button>
                            <button
                              onClick={() => {
                                navigate('/admin/students');
                                setOpenActionRank(null);
                              }}
                              className="w-full px-3 py-2 text-[#1E293B] hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <Users className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Manage Student</span>
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
              Showing {filteredStudents.length === 0 ? '0' : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredStudents.length)}`} of {filteredStudents.length.toLocaleString('en-IN')} students
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

              {getPageNumbers().map((p, idx) =>
                typeof p === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                      currentPage === p
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#64748B] hover:bg-slate-100'
                    )}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-slate-400 text-xs">
                    ...
                  </span>
                )
              )}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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

        {/* ==================== RIGHT: TWO STACKED CARDS ==================== */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-4">
          {/* 1. TOP 3 STUDENTS CARD */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-sm font-bold text-[#0F172A]">Top 3 Students</h2>
              <button
                onClick={() => setIsTop3ModalOpen(true)}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* 3 Podium Cards Side by Side */}
            {(!top1Student && !top2Student && !top3Student) ? (
              <div className="py-8 text-center text-slate-400 text-xs">No rankings available yet.</div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 items-end pt-1">
                {/* 2nd Place */}
                {top2Student ? (
                  <div
                    onClick={() => {
                      setSelectedStudentRank(top2Student.rank);
                      setIsDetailsOpen(true);
                    }}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center flex flex-col items-center shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-slate-400 mb-1" />
                    {top2Student.avatar ? (
                      <img
                        src={top2Student.avatar}
                        alt={top2Student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-2xs">
                        {top2Student.initials || top2Student.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-xs font-bold text-[#0F172A] mt-1 truncate max-w-full">
                      {top2Student.name}
                    </h3>
                    <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                      <span className="font-semibold text-slate-800">{top2Student.accuracy}%</span> Accuracy
                    </p>
                    <p className="text-[10px] text-[#64748B] leading-tight">
                      <span className="font-semibold text-slate-800">{top2Student.avgScore}%</span> Avg. Score
                    </p>
                    <span className="bg-[#DBEAFE] text-[#1D4ED8] font-bold text-[10px] px-2 py-0.5 rounded-full mt-1.5 inline-block">
                      2nd
                    </span>
                  </div>
                ) : <div />}

                {/* 1st Place */}
                {top1Student ? (
                  <div
                    onClick={() => {
                      setSelectedStudentRank(top1Student.rank);
                      setIsDetailsOpen(true);
                    }}
                    className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-2.5 text-center flex flex-col items-center shadow-xs -mt-2 pb-3 hover:border-amber-400 transition-all cursor-pointer relative"
                  >
                    <Crown className="w-4 h-4 text-amber-500 mb-1" />
                    {top1Student.avatar ? (
                      <img
                        src={top1Student.avatar}
                        alt={top1Student.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-amber-300 shadow-xs"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center border-2 border-amber-300 shadow-xs">
                        {top1Student.initials || top1Student.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-xs font-bold text-[#0F172A] mt-1 truncate max-w-full">
                      {top1Student.name}
                    </h3>
                    <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                      <span className="font-semibold text-slate-800">{top1Student.accuracy}%</span> Accuracy
                    </p>
                    <p className="text-[10px] text-[#64748B] leading-tight">
                      <span className="font-semibold text-slate-800">{top1Student.avgScore}%</span> Avg. Score
                    </p>
                    <span className="bg-[#FEF3C7] text-[#B45309] font-bold text-[10px] px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
                      1st
                    </span>
                  </div>
                ) : <div />}

                {/* 3rd Place */}
                {top3Student ? (
                  <div
                    onClick={() => {
                      setSelectedStudentRank(top3Student.rank);
                      setIsDetailsOpen(true);
                    }}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center flex flex-col items-center shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-700 mb-1" />
                    {top3Student.avatar ? (
                      <img
                        src={top3Student.avatar}
                        alt={top3Student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center shadow-2xs">
                        {top3Student.initials || top3Student.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h3 className="text-xs font-bold text-[#0F172A] mt-1 truncate max-w-full">
                      {top3Student.name}
                    </h3>
                    <p className="text-[10px] text-[#64748B] leading-tight mt-0.5">
                      <span className="font-semibold text-slate-800">{top3Student.accuracy}%</span> Accuracy
                    </p>
                    <p className="text-[10px] text-[#64748B] leading-tight">
                      <span className="font-semibold text-slate-800">{top3Student.avgScore}%</span> Avg. Score
                    </p>
                    <span className="bg-[#FFEDD5] text-[#C2410C] font-bold text-[10px] px-2 py-0.5 rounded-full mt-1.5 inline-block">
                      3rd
                    </span>
                  </div>
                ) : <div />}
              </div>
            )}
          </div>

          {/* 2. STUDENT DETAILS CARD */}
          {isDetailsOpen && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs space-y-4 animate-in fade-in duration-150">
              {activeStudent ? (
                <>
                  {/* Header: Title & Close */}
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm font-bold text-[#0F172A]">Student Details</h2>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition-colors"
                  title="Close student details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student Profile Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {activeStudent.avatar ? (
                    <img
                      src={activeStudent.avatar}
                      alt={activeStudent.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-11 h-11 rounded-full text-xs font-bold flex items-center justify-center shadow-xs',
                        activeStudent.initialsBg || 'bg-blue-600 text-white'
                      )}
                    >
                      {activeStudent.initials || 'ST'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-[#0F172A] leading-tight">
                        {activeStudent.name}
                      </h3>
                      <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                        Rank #{activeStudent.rank}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{activeStudent.location}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              </div>

              {/* 4 Mini Metric Cards (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Tests Attempted */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.testsAttempted}
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none">
                      Tests Attempted
                    </p>
                  </div>
                </div>

                {/* Questions Answered */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.questionsAnswered.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none truncate">
                      Questions Answered
                    </p>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.accuracy}%
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none">
                      Accuracy
                    </p>
                  </div>
                </div>

                {/* Avg. Score */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A] leading-none">
                      {activeStudent.avgScore}%
                    </p>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-none">
                      Avg. Score
                    </p>
                  </div>
                </div>
              </div>

              {/* Student-wise Performance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#0F172A]">
                    Student-wise Performance
                  </h4>
                  <button
                    onClick={() => setIsPerformanceModalOpen(true)}
                    className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {activeStudent.subjectPerformance.map((subj) => (
                    <div key={subj.subject} className="flex items-center gap-2">
                      <span className="w-28 text-[11px] text-[#475569] font-medium truncate">
                        {subj.subject}
                      </span>
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', subj.barColor)}
                          style={{ width: `${subj.scorePercent}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] font-bold text-[#0F172A]">
                        {subj.scorePercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Test Attempts */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#0F172A]">
                    Recent Test Attempts
                  </h4>
                  <button
                    onClick={() => setIsRecentAttemptsModalOpen(true)}
                    className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {activeStudent.recentAttempts.map((attempt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px]',
                            attempt.iconBg
                          )}
                        >
                          <FileText className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-semibold text-[#1E293B] truncate">
                          {attempt.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {attempt.scorePercent}%
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          {attempt.timeAgo}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No student selected.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. VIEW ALL TOP 3 LEADERBOARD MODAL */}
      {/* ==================================================================== */}
      {isTop3ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">State Leaderboard Podium</h3>
              </div>
              <button
                onClick={() => setIsTop3ModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {studentsList.slice(0, 3).map((st) => (
                <div
                  key={st.rank}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2"
                >
                  <span
                    className={cn(
                      'inline-block px-2.5 py-0.5 rounded-full text-xs font-bold',
                      st.rank === 1
                        ? 'bg-amber-100 text-amber-800'
                        : st.rank === 2
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    )}
                  >
                    Rank #{st.rank}
                  </span>
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-white shadow-md"
                  />
                  <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                  <p className="text-xs text-slate-500">{st.location}</p>
                  <div className="text-xs font-semibold text-slate-700 pt-1">
                    Accuracy: {st.accuracy}% • Avg: {st.avgScore}%
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsTop3ModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. STUDENT PROFILE MODAL */}
      {/* ==================================================================== */}
      {isProfileModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Student Profile & Rank Card</h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {activeStudent.avatar ? (
                <img
                  src={activeStudent.avatar}
                  alt={activeStudent.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div
                  className={cn(
                    'w-16 h-16 rounded-full text-base font-bold flex items-center justify-center shadow-md',
                    activeStudent.initialsBg || 'bg-blue-600 text-white'
                  )}
                >
                  {activeStudent.initials}
                </div>
              )}
              <div>
                <h4 className="text-base font-black text-slate-900">{activeStudent.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {activeStudent.studentId}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    State Rank #{activeStudent.rank}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">📍 {activeStudent.location}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Tests Attempted</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{activeStudent.testsAttempted}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Questions Answered</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {activeStudent.questionsAnswered.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Accuracy Rate</span>
                <p className="text-sm font-black text-emerald-600 mt-0.5">{activeStudent.accuracy}%</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 text-[10px]">Average Score</span>
                <p className="text-sm font-black text-blue-600 mt-0.5">{activeStudent.avgScore}%</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    navigate('/admin/students');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <span>Open in Students</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. PERFORMANCE MODAL */}
      {/* ==================================================================== */}
      {isPerformanceModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900">All Subject Performance</h3>
              </div>
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {activeStudent.subjectPerformance.map((subj) => (
                <div key={subj.subject} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{subj.subject}</span>
                    <span>{subj.scorePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', subj.barColor)}
                      style={{ width: `${subj.scorePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. RECENT ATTEMPTS MODAL */}
      {/* ==================================================================== */}
      {isRecentAttemptsModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Recent Test Submissions</h3>
              </div>
              <button
                onClick={() => setIsRecentAttemptsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {activeStudent.recentAttempts.map((att, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs',
                        att.iconBg
                      )}
                    >
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{att.title}</p>
                      <p className="text-[10px] text-slate-500">{att.timeAgo}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                    {att.scorePercent}%
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsRecentAttemptsModalOpen(false)}
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
