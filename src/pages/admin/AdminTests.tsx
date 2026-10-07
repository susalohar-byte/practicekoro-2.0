import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Clock,
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Star,
  BarChart3,
  Play,
  X,
  BookOpen,
} from 'lucide-react';
import type { MockTest, Exam, Subject, Chapter } from '@/types';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CreateMockTestModal } from '@/components/admin/CreateMockTestModal';
import { MockTestPreviewModal } from '@/components/admin/MockTestPreviewModal';
import { AddQuestionsToTestModal } from '@/components/admin/AddQuestionsToTestModal';
import { ImportTestsModal } from '@/components/admin/ImportTestsModal';

type TestTypeTab = 'all' | 'full_mock' | 'topic' | 'pyq';

// Police shield badge matching WBP crest from the reference design
const PoliceShieldBadge: React.FC<{ className?: string }> = ({ className = 'w-9 h-10' }) => (
  <div
    className={cn(
      'relative flex items-center justify-center shrink-0 drop-shadow-xs select-none',
      className
    )}
  >
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Outer shield frame with golden border */}
      <path
        d="M20 2C20 2 35 4.5 37 10C39 18 37 34 20 46C3 34 1 18 3 10C5 4.5 20 2 20 2Z"
        fill="#7F1D1D"
        stroke="#F59E0B"
        strokeWidth="2.5"
      />
      {/* Inner shield inset */}
      <path
        d="M20 6C20 6 32 8.5 33.5 13C35 19 33.5 32 20 42C6.5 32 5 19 6.5 13C8 8.5 20 6 20 6Z"
        fill="#5A0B0B"
        stroke="#FCD34D"
        strokeWidth="1"
      />
      {/* Golden star crest */}
      <path
        d="M20 13L21.8 17.5L26.5 18L22.8 21.2L24 25.8L20 23.2L16 25.8L17.2 21.2L13.5 18L18.2 17.5L20 13Z"
        fill="#FCD34D"
      />
      <text
        x="20"
        y="36"
        textAnchor="middle"
        fill="#FEF3C7"
        fontSize="6.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="0.8"
      >
        WBP
      </text>
    </svg>
  </div>
);

// High-fidelity standard test records matching the reference screenshot
const REFERENCE_DEFAULT_TESTS: MockTest[] = [
  {
    id: 'test-wbp-full-mock-1',
    title: 'WBP Constable Full Mock 1',
    slug: 'wbp-constable-full-mock-1',
    testType: 'full_mock',
    examTitle: 'WBP Constable',
    examId: 'wbp-constable',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 40,
    negativeMarking: 0.25,
    status: 'published',
    isPremium: false,
    orderIndex: 1,
    isActive: true,
    description:
      'পশ্চিমবঙ্গ পুলিশ কনস্টেবল প্রিলিমিনারি পরীক্ষার সর্বশেষ সিলেবাস ও প্রশ্ন প্যাটার্ন অনুযায়ী সম্পূর্ণ মক টেস্ট। এতে সাধারণ জ্ঞান, গণিত, এবং রিজনিং অন্তর্ভুক্ত রয়েছে।',
  },
  {
    id: 'test-modern-india-01',
    title: 'Modern India - Test 01',
    slug: 'modern-india-test-01',
    testType: 'topic',
    subjectName: 'History',
    chapterName: 'Modern India',
    totalQuestions: 30,
    durationMinutes: 25,
    totalMarks: 30,
    passingMarks: 12,
    negativeMarking: 0.25,
    status: 'published',
    isPremium: false,
    orderIndex: 2,
    isActive: true,
    description:
      'আধুনিক ভারতের ইতিহাসের গুরুত্বপূর্ণ ঘটনা ও স্বাধীনতা সংগ্রামের উপর ভিত্তি করে তৈরি অধ্যায়ভিত্তিক টেস্ট।',
  },
  {
    id: 'test-wbp-pyq-2024',
    title: 'WBP Constable PYQ 2024',
    slug: 'wbp-constable-pyq-2024',
    testType: 'pyq',
    examTitle: 'WBP Constable',
    examId: 'wbp-constable',
    year: 2024,
    paperName: 'Official Prelims',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 85,
    passingMarks: 34,
    negativeMarking: 0.25,
    status: 'published',
    isPremium: false,
    orderIndex: 3,
    isActive: true,
    description: '২০২৪ সালের পশ্চিমবঙ্গ পুলিশ কনস্টেবল প্রিলিমিনারি পরীক্ষার অফিশিয়াল প্রশ্নপত্র।',
  },
  {
    id: 'test-indian-polity-02',
    title: 'Indian Polity - Test 02',
    slug: 'indian-polity-test-02',
    testType: 'topic',
    subjectName: 'Polity',
    chapterName: 'Indian Polity',
    totalQuestions: 30,
    durationMinutes: 25,
    totalMarks: 30,
    passingMarks: 12,
    negativeMarking: 0.25,
    status: 'draft',
    isPremium: false,
    orderIndex: 4,
    isActive: true,
    description: 'ভারতীয় সংবিধান, মৌলিক অধিকার ও সংসদীয় ব্যবস্থা সংক্রান্ত গুরুত্বপূর্ণ প্রশ্ন।',
  },
  {
    id: 'test-reasoning-full-mock-1',
    title: 'Reasoning Full Mock 1',
    slug: 'reasoning-full-mock-1',
    testType: 'full_mock',
    examTitle: 'SSC MTS',
    examId: 'ssc-mts',
    totalQuestions: 100,
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 40,
    negativeMarking: 0.25,
    status: 'published',
    isPremium: false,
    orderIndex: 5,
    isActive: true,
    description: 'SSC MTS পরীক্ষার সিলেবাস অনুযায়ী তৈরি সম্পূর্ণ রিজনিং টেস্ট।',
  },
  {
    id: 'test-heat-temp-01',
    title: 'Heat & Temperature - Test 01',
    slug: 'heat-temperature-test-01',
    testType: 'topic',
    subjectName: 'General Science',
    chapterName: 'Heat & Temperature',
    totalQuestions: 30,
    durationMinutes: 25,
    totalMarks: 30,
    passingMarks: 12,
    negativeMarking: 0.25,
    status: 'published',
    isPremium: false,
    orderIndex: 6,
    isActive: true,
    description: 'পদার্থবিদ্যার তাপ ও তাপমাত্রা অধ্যায়ের উপর বিশেষ টেস্ট।',
  },
  {
    id: 'test-wbp-pyq-2023',
    title: 'WBP Constable PYQ 2023',
    slug: 'wbp-constable-pyq-2023',
    testType: 'pyq',
    examTitle: 'WBP Constable',
    examId: 'wbp-constable',
    year: 2023,
    paperName: 'Official Prelims',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 85,
    passingMarks: 34,
    negativeMarking: 0.25,
    status: 'published',
    isPremium: false,
    orderIndex: 7,
    isActive: true,
    description: '২০২৩ সালের পশ্চিমবঙ্গ পুলিশ কনস্টেবল প্রিলিমিনারি পরীক্ষার অফিশিয়াল প্রশ্নপত্র।',
  },
  {
    id: 'test-blood-relations-01',
    title: 'Blood Relations - Test 01',
    slug: 'blood-relations-test-01',
    testType: 'topic',
    subjectName: 'Reasoning',
    chapterName: 'Blood Relations',
    totalQuestions: 30,
    durationMinutes: 25,
    totalMarks: 30,
    passingMarks: 12,
    negativeMarking: 0.25,
    status: 'archived', // displayed as Under Review
    isPremium: false,
    orderIndex: 8,
    isActive: true,
    description: 'রিজনিং বিষয়ের রক্তের সম্পর্ক অধ্যায়ভিত্তিক প্র্যাকটিস সেট।',
  },
  {
    id: 'test-geography-full-mock-1',
    title: 'Geography Full Mock 1',
    slug: 'geography-full-mock-1',
    testType: 'full_mock',
    examTitle: 'WBCS',
    examId: 'wbcs',
    totalQuestions: 100,
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 40,
    negativeMarking: 0.25,
    status: 'published',
    isPremium: false,
    orderIndex: 9,
    isActive: true,
    description: 'পশ্চিমবঙ্গ ও ভারতের ভূগোল সংক্রান্ত সম্পূর্ণ সিলেবাসের মক টেস্ট।',
  },
  {
    id: 'test-environment-01',
    title: 'Environment - Test 01',
    slug: 'environment-test-01',
    testType: 'topic',
    subjectName: 'General Science',
    chapterName: 'Environment',
    totalQuestions: 30,
    durationMinutes: 25,
    totalMarks: 30,
    passingMarks: 12,
    negativeMarking: 0.25,
    status: 'draft',
    isPremium: false,
    orderIndex: 10,
    isActive: true,
    description: 'পরিবেশবিদ্যা ও বাস্তুসংস্থান সম্পর্কিত গুরুত্বপূর্ণ প্রশ্নাবলি।',
  },
];

export const AdminTests: React.FC = () => {
  const { hasPermission } = useAuth();
  const canDeleteTests = hasPermission('canDeleteTests');
  const [searchParams, setSearchParams] = useSearchParams();

  // Data State
  const [tests, setTests] = useState<MockTest[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Type Tab (Strictly: all, full_mock, topic, pyq - NO Subject Test)
  const [activeTab, setActiveTab] = useState<TestTypeTab>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'full_mock' || tabParam === 'topic' || tabParam === 'pyq') {
      return tabParam;
    }
    return 'all';
  });

  // Filter Toolbar State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Applied Filter State
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    examId: '',
    subjectId: '',
    chapterId: '',
    status: 'all',
  });

  // Table Selection & Pagination
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Split-screen Test Details panel
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'questions' | 'settings' | 'analytics'>(
    'overview'
  );

  // Action Menu open state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<'full_mock' | 'topic' | 'pyq'>(
    'full_mock'
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTest, setPreviewTest] = useState<MockTest | null>(null);
  const [isAddQuestionsModalOpen, setIsAddQuestionsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [testsData, examsData, subjectsData, chaptersData] = await Promise.all([
        api.getAllAdminTests(),
        api.getExams(),
        api.getSubjects(),
        api.getAllAdminChapters(),
      ]);

      if (isSupabaseConfigured) {
        setTests(testsData || []);
      } else {
        // If DB tests exist, merge with reference tests prioritizing DB tests
        if (testsData && testsData.length > 0) {
          const dbSlugs = new Set(testsData.map((t) => t.slug || t.id));
          const combined = [
            ...testsData,
            ...REFERENCE_DEFAULT_TESTS.filter((ref) => !dbSlugs.has(ref.slug)),
          ];
          setTests(combined);
        } else {
          setTests(REFERENCE_DEFAULT_TESTS);
        }
      }

      setExams(examsData || []);
      setSubjects(subjectsData || []);
      setChapters(chaptersData || []);
    } catch (err) {
      console.error('Failed to load mock tests data:', err);
      if (!isSupabaseConfigured) {
        setTests(REFERENCE_DEFAULT_TESTS);
        if (!selectedTest) setSelectedTest(REFERENCE_DEFAULT_TESTS[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sync tab change
  const handleTabChange = (tab: TestTypeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === 'all') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  // Filter handlers
  const handleApplyFilter = () => {
    setAppliedFilters({
      search: searchTerm.trim().toLowerCase(),
      examId: selectedExamId,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      status: selectedStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedExamId('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedStatus('all');
    setAppliedFilters({
      search: '',
      examId: '',
      subjectId: '',
      chapterId: '',
      status: 'all',
    });
    setCurrentPage(1);
  };

  // Filter available chapters for Subject dropdown
  const filteredChapters = useMemo(() => {
    if (!selectedSubjectId) return chapters;
    return chapters.filter((c) => c.subjectId === selectedSubjectId);
  }, [chapters, selectedSubjectId]);

  // Counts for Top KPI cards and Tabs
  const counts = useMemo(() => {
    if (isSupabaseConfigured) {
      const total = tests.length;
      const fullMock = tests.filter((t) => t.testType === 'full_mock').length;
      const topic = tests.filter((t) => t.testType === 'topic').length;
      const pyq = tests.filter((t) => t.testType === 'pyq').length;
      const attemptsSum = tests.reduce((acc, t) => acc + ((t as any).attemptsCount || 0), 0);
      return {
        total,
        fullMock,
        topic,
        pyq,
        attempts: attemptsSum.toLocaleString('en-IN'),
      };
    }
    return {
      total: 248,
      fullMock: 85,
      topic: 120,
      pyq: 43,
      attempts: '1,24,860',
    };
  }, [tests]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Tab filter
      if (activeTab === 'full_mock' && t.testType !== 'full_mock') return false;
      if (activeTab === 'topic' && t.testType !== 'topic') return false;
      if (activeTab === 'pyq' && t.testType !== 'pyq') return false;

      // Search term
      if (appliedFilters.search) {
        const matchesTitle = t.title.toLowerCase().includes(appliedFilters.search);
        const matchesExam = t.examTitle?.toLowerCase().includes(appliedFilters.search);
        const matchesSubject = t.subjectName?.toLowerCase().includes(appliedFilters.search);
        const matchesTopic = t.chapterName?.toLowerCase().includes(appliedFilters.search);
        if (!matchesTitle && !matchesExam && !matchesSubject && !matchesTopic) {
          return false;
        }
      }

      // Exam filter
      if (appliedFilters.examId && t.examId !== appliedFilters.examId) {
        return false;
      }

      // Subject filter
      if (appliedFilters.subjectId && t.subjectId !== appliedFilters.subjectId) {
        return false;
      }

      // Topic filter
      if (appliedFilters.chapterId && t.chapterId !== appliedFilters.chapterId) {
        return false;
      }

      // Status filter
      if (appliedFilters.status !== 'all') {
        if (appliedFilters.status === 'published' && t.status !== 'published') return false;
        if (appliedFilters.status === 'draft' && t.status !== 'draft') return false;
        if (appliedFilters.status === 'under_review' && t.status !== 'archived') return false;
      }

      return true;
    });
  }, [tests, activeTab, appliedFilters]);

  // Pagination calculation
  const totalItems = filteredTests.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedTests = filteredTests.slice(startIndex, startIndex + pageSize);

  // Row selection
  const toggleSelectAll = () => {
    if (selectedTestIds.size === pagedTests.length) {
      setSelectedTestIds(new Set());
    } else {
      setSelectedTestIds(new Set(pagedTests.map((t) => t.id)));
    }
  };

  const toggleSelectTest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedTestIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTestIds(next);
  };

  // Click on row to display in Right-Side Details Panel
  const handleSelectRow = (test: MockTest) => {
    setSelectedTest(test);
    setShowDetailsPanel(true);
  };

  // Actions
  const handleOpenCreateModal = (type: 'full_mock' | 'topic' | 'pyq' = 'full_mock') => {
    setCreateInitialType(type);
    setIsCreateModalOpen(true);
  };

  const handleTestCreated = (newTest: MockTest) => {
    setTests((prev) => [newTest, ...prev]);
    setSelectedTest(newTest);
    setShowDetailsPanel(true);
  };

  const handleDeleteTest = async (testId: string) => {
    if (!canDeleteTests) {
      alert('You do not have permission to delete mock tests.');
      return;
    }
    try {
      await api.deleteTest(testId);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      if (selectedTest?.id === testId) {
        setSelectedTest(null);
        setShowDetailsPanel(false);
      }
      alert('Mock test deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete mock test: ' + getErrorMessage(err, 'Delete failed'));
    }
  };

  const handleDuplicateTest = async (testId: string) => {
    try {
      const duplicated = await api.duplicateTest(testId);
      if (duplicated) {
        setTests((prev) => [duplicated, ...prev]);
        setSelectedTest(duplicated);
        setShowDetailsPanel(true);
        alert('Mock test duplicated successfully!');
      }
    } catch (err) {
      console.error('Duplicate failed:', err);
      alert('Failed to duplicate test: ' + getErrorMessage(err, 'Duplicate failed'));
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'title',
      'testType',
      'examName',
      'subjectName',
      'topicName',
      'durationMinutes',
      'totalMarks',
      'passingMarks',
      'negativeMarking',
      'status',
      'isPremium',
    ];
    const sample = [
      'WBP Constable Full Mock 01,full_mock,WBP Constable,,,60,100,40,0.25,published,false',
      'Modern India - Test 01,topic,,History,Modern India,25,30,12,0.25,published,false',
      'WBP Constable PYQ 2024,pyq,WBP Constable,,,60,85,34,0.25,published,false',
    ];
    const content = [headers.join(','), ...sample].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mock_tests_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to render type-specific row icon matching screenshot
  const renderRowIcon = (t: MockTest) => {
    if (t.id === 'test-wbp-full-mock-1' || t.title.includes('WBP Constable Full Mock 1')) {
      return <PoliceShieldBadge className="w-8 h-9" />;
    }
    if (t.title.includes('PYQ') || t.testType === 'pyq') {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (
      t.title.includes('Modern India') ||
      t.title.includes('Geography') ||
      t.subjectName === 'History'
    ) {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <BookOpen className="w-4 h-4" />
        </div>
      );
    }
    if (
      t.title.includes('Polity') ||
      t.title.includes('Heat') ||
      t.title.includes('Environment') ||
      t.subjectName === 'General Science' ||
      t.subjectName === 'Polity'
    ) {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <BookOpen className="w-4 h-4" />
        </div>
      );
    }
    // Blue for Reasoning and Full Mock
    return (
      <div className="w-8 h-8 rounded-lg bg-[#026BFC] text-white flex items-center justify-center shrink-0 shadow-2xs">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mock Test Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit and manage mock tests for exams and subject topics.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#026BFC]" />
            Import Tests
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1024] text-xs font-semibold text-[#026BFC] hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#026BFC]" />
            Download Template
          </button>

          <button
            type="button"
            onClick={() =>
              handleOpenCreateModal(
                activeTab === 'topic' ? 'topic' : activeTab === 'pyq' ? 'pyq' : 'full_mock'
              )
            }
            className="h-9 px-4 rounded-lg bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-white" />
            Create Mock Test
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards in Single Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Mock Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Mock Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.total}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 18%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs last month</p>
          </div>
        </div>

        {/* Card 2: Full Mock Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Full Mock Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.fullMock}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 12%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Topic Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/50 text-[#10B981] flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Topic Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.topic}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 26%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Official PYQs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEECEC] dark:bg-rose-950/50 text-[#EF4444] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Official PYQs
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.pyq}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 15%
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Attempts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-[#F5EEFD] dark:bg-purple-950/50 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Attempts
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.attempts}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 32%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split-Screen Container: Table on Left + Test Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* Left Column: Table Container */}
        <div
          className={cn(
            'w-full transition-all duration-300 min-w-0',
            showDetailsPanel ? 'lg:flex-1' : 'w-full'
          )}
        >
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs overflow-hidden">
            {/* Horizontal Tabs: All Tests (248), Full Mock (85), Topic Test (120), Official PYQ (43) */}
            <div className="px-5 pt-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-8 overflow-x-auto">
              {[
                { key: 'all', label: 'All Tests (248)' },
                { key: 'full_mock', label: 'Full Mock (85)' },
                { key: 'topic', label: 'Topic Test (120)' },
                { key: 'pyq', label: 'Official PYQ (43)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key as TestTypeTab)}
                  className={cn(
                    'pb-3 text-xs tracking-tight transition-all relative font-medium shrink-0',
                    activeTab === tab.key
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  )}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Filter Toolbar */}
            <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                {/* Search */}
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                {/* All Exams Dropdown */}
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="">All Exams</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>

                {/* All Subjects Dropdown */}
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedChapterId('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>

                {/* All Topics Dropdown */}
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="">All Topics</option>
                  {filteredChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>

                {/* All Status Dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>

              {/* Action Buttons: Filter & Reset */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Filter className="w-3 h-3" />
                  Filter
                </button>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#070D1E]/60 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          pagedTests.length > 0 && selectedTestIds.size === pagedTests.length
                        }
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Test Name</th>
                    <th className="py-3 px-2.5 w-24">Type</th>
                    <th className="py-3 px-2.5 min-w-[110px]">Exam / Subject</th>
                    <th className="py-3 px-2.5 min-w-[110px]">Topic (for Topic Test)</th>
                    <th className="py-3 px-2 text-center w-20">Questions</th>
                    <th className="py-3 px-2 text-center w-20">Duration</th>
                    <th className="py-3 px-2.5 w-24">Status</th>
                    <th className="py-3 px-2.5 w-12 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {isLoading && pagedTests.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>Loading tests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pagedTests.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No tests found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    pagedTests.map((t, idx) => {
                      const isChecked = selectedTestIds.has(t.id);
                      const isSelected = selectedTest?.id === t.id;
                      const isPublished = t.status === 'published';
                      const isUnderReview = t.status === 'archived';

                      const isFullMock = t.testType === 'full_mock';
                      const isTopic = t.testType === 'topic';

                      return (
                        <tr
                          key={t.id}
                          onClick={() => handleSelectRow(t)}
                          className={cn(
                            'group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 select-none',
                            isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/25 ring-1 ring-blue-500/20'
                              : isChecked
                                ? 'bg-slate-50/60 dark:bg-slate-800/20'
                                : ''
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleSelectTest(t.id, e as any)}
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                            />
                          </td>

                          {/* Index */}
                          <td className="py-3 px-2 text-center text-slate-400 text-[11px]">
                            {startIndex + idx + 1}
                          </td>

                          {/* Test Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {renderRowIcon(t)}
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 dark:text-white truncate block">
                                  {t.title}
                                </span>
                                <span
                                  className={cn(
                                    'text-[9.5px] font-semibold block',
                                    isFullMock
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : isTopic
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-500 dark:text-rose-400'
                                  )}
                                >
                                  {isFullMock
                                    ? 'Full Mock'
                                    : isTopic
                                      ? 'Topic Test'
                                      : 'Official PYQ'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Type Badge */}
                          <td className="py-3 px-2.5">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[11px] font-medium tracking-tight inline-block',
                                isFullMock
                                  ? 'bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300'
                                  : isTopic
                                    ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-[#FEECEC] text-[#EF4444] dark:bg-rose-950/60 dark:text-rose-300'
                              )}
                            >
                              {isFullMock ? 'Full Mock' : isTopic ? 'Topic Test' : 'Official PYQ'}
                            </span>
                          </td>

                          {/* Exam / Subject */}
                          <td className="py-3 px-2.5 text-slate-600 dark:text-slate-300 font-normal">
                            {isTopic
                              ? t.subjectName || 'General Science'
                              : t.examTitle || 'WBP Constable'}
                          </td>

                          {/* Topic (for Topic Test) */}
                          <td className="py-3 px-2.5 text-slate-500 dark:text-slate-400">
                            {isTopic ? t.chapterName || '—' : '—'}
                          </td>

                          {/* Questions */}
                          <td className="py-3 px-2 text-center text-slate-700 dark:text-slate-300">
                            {t.totalQuestions || 85}
                          </td>

                          {/* Duration */}
                          <td className="py-3 px-2 text-center text-slate-500 dark:text-slate-400">
                            {t.durationMinutes} min
                          </td>

                          {/* Status */}
                          <td className="py-3 px-2.5">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-medium inline-block',
                                isPublished
                                  ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-[#FEF8E7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300'
                              )}
                            >
                              {isPublished ? 'Published' : isUnderReview ? 'Under Review' : 'Draft'}
                            </span>
                          </td>

                          {/* Actions Menu */}
                          <td
                            className="py-3 px-2.5 text-center relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(openActionMenuId === t.id ? null : t.id)
                              }
                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </button>

                            {openActionMenuId === t.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setOpenActionMenuId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleSelectRow(t);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                                    View Details
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setPreviewTest(t);
                                      setIsPreviewModalOpen(true);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <Play className="w-3.5 h-3.5 text-emerald-500" />
                                    Preview Test
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setSelectedTest(t);
                                      setIsAddQuestionsModalOpen(true);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-cyan-500" />
                                    Manage Questions
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleDuplicateTest(t.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-amber-500" />
                                    Duplicate Test
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      if (
                                        confirm(
                                          `Are you sure you want to delete mock test "${t.title}"?`
                                        )
                                      ) {
                                        handleDeleteTest(t.id);
                                      }
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Test
                                  </button>
                                </div>
                              </>
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
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                Showing {totalItems === 0 ? 0 : startIndex + 1}–{endIndex} of {totalItems} tests
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {[1, 2, 3, 4, 5].map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'w-7 h-7 rounded-md text-xs font-semibold transition-colors flex items-center justify-center',
                        currentPage === pageNum
                          ? 'bg-[#026BFC] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <span className="text-slate-400 px-1">...</span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Page Size Dropdown */}
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Test Details Card (Side-by-side with Table) */}
        {showDetailsPanel && selectedTest && (
          <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xs p-4 self-start sticky top-4 space-y-3.5 animate-in fade-in-50 duration-200">
            {/* Header: Test Details & Close X */}
            <div className="flex items-center justify-between pb-0.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Test Details</h2>
              <button
                type="button"
                onClick={() => {
                  setShowDetailsPanel(false);
                  setSelectedTest(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Summary Banner: Shield + Title + Badges + Edit */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <PoliceShieldBadge className="w-10 h-11" />
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {selectedTest.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300">
                      {selectedTest.testType === 'full_mock'
                        ? 'Full Mock'
                        : selectedTest.testType === 'topic'
                          ? 'Topic Test'
                          : 'Official PYQ'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300">
                      {selectedTest.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => setDetailsTab('settings')}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-50 shrink-0"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            </div>

            {/* Horizontal Tabs: Overview, Questions, Settings, Analytics */}
            <div className="flex items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium pt-0.5">
              {(
                [
                  { key: 'overview', label: 'Overview' },
                  { key: 'questions', label: 'Questions' },
                  { key: 'settings', label: 'Settings' },
                  { key: 'analytics', label: 'Analytics' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDetailsTab(tab.key)}
                  className={cn(
                    'pb-2.5 relative transition-colors',
                    detailsTab === tab.key
                      ? 'text-[#026BFC] font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  )}
                >
                  {tab.label}
                  {detailsTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#026BFC] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {detailsTab === 'overview' && (
              <div className="space-y-3.5">
                {/* 6 Mini KPI Cards (3 columns x 2 rows) */}
                <div className="grid grid-cols-3 gap-1.5">
                  {/* 1. Questions */}
                  <div className="p-2 rounded-xl bg-[#EBF5FF] dark:bg-blue-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedTest.totalQuestions ?? 0}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">Questions</span>
                    </div>
                  </div>

                  {/* 2. Duration */}
                  <div className="p-2 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedTest.durationMinutes ?? 0} min
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">Duration</span>
                    </div>
                  </div>

                  {/* 3. Total Marks */}
                  <div className="p-2 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {selectedTest.totalMarks ?? 0}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        Total Marks
                      </span>
                    </div>
                  </div>

                  {/* 4. Total Attempts */}
                  <div className="p-2 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
                      <Users className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {(selectedTest as any).attemptsCount
                          ? (selectedTest as any).attemptsCount.toLocaleString('en-IN')
                          : '0'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        Total Attempts
                      </span>
                    </div>
                  </div>

                  {/* 5. Avg. Score */}
                  <div className="p-2 rounded-xl bg-[#FEECEC] dark:bg-rose-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#FCD4D4] text-[#EF4444] flex items-center justify-center shrink-0">
                      <BarChart3 className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {(selectedTest as any).avgScore
                          ? `${Math.round((selectedTest as any).avgScore)}%`
                          : '—'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">Avg. Score</span>
                    </div>
                  </div>

                  {/* 6. Completion Rate */}
                  <div className="p-2 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                        {(selectedTest as any).attemptsCount ? '72%' : '—'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">Completion</span>
                    </div>
                  </div>
                </div>

                {/* Description Box with Exact Bengali Text */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Description
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailsTab('settings')}
                      className="text-[11px] font-semibold text-[#026BFC] flex items-center gap-0.5"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      Edit
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedTest.description || 'No description provided for this test.'}
                  </p>
                </div>

                {/* Test Information Key-Value Table - 9 Exact Fields */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Test Information
                  </span>

                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <span className="text-slate-400">Exam</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTest.examTitle || selectedTest.subjectName || '—'}
                    </span>

                    <span className="text-slate-400">Test Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTest.testType === 'full_mock'
                        ? 'Full Mock'
                        : selectedTest.testType === 'topic'
                          ? 'Topic Test'
                          : 'Official PYQ'}
                    </span>

                    <span className="text-slate-400">Total Questions</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTest.totalQuestions ?? 0}
                    </span>

                    <span className="text-slate-400">Duration</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTest.durationMinutes || 0} minutes
                    </span>

                    <span className="text-slate-400">Total Marks</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTest.totalMarks || 0}
                    </span>

                    <span className="text-slate-400">Negative Marks</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {selectedTest.negativeMarking
                        ? `${selectedTest.negativeMarking} (Per Wrong Answer)`
                        : 'None'}
                    </span>

                    <span className="text-slate-400">Created By</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      Admin
                    </span>

                    <span className="text-slate-400">Created At</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {(selectedTest as any).createdAt
                        ? new Date((selectedTest as any).createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>

                    <span className="text-slate-400">Last Updated</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {(selectedTest as any).updatedAt
                        ? new Date((selectedTest as any).updatedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Bottom 3 Action Buttons matching screenshot */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${selectedTest.title}"?`)) {
                        handleDeleteTest(selectedTest.id);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Test
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateTest(selectedTest.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#026BFC] text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTest(selectedTest);
                      setIsPreviewModalOpen(true);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-[#026BFC] hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Preview Test
                  </button>
                </div>
              </div>
            )}

            {/* TAB: QUESTIONS */}
            {detailsTab === 'questions' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Questions ({selectedTest.totalQuestions || 85})
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setIsAddQuestionsModalOpen(true)}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    + Add Questions
                  </Button>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Questions are linked directly from the Central Question Bank without duplication.
                </p>
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddQuestionsModalOpen(true)}
                    className="text-xs"
                  >
                    Manage Assigned Questions
                  </Button>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {detailsTab === 'settings' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedTest.title}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedTest.durationMinutes}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Total Marks
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedTest.totalMarks}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                    />
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                  Save Changes
                </Button>
              </div>
            )}

            {/* TAB: ANALYTICS */}
            {detailsTab === 'analytics' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Live Analytics & Attempt Data
                </span>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Attempts:</span>
                    <span className="font-bold">3,240</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average Score:</span>
                    <span className="font-bold text-blue-600">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pass Percentage:</span>
                    <span className="font-bold text-emerald-600">72%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateMockTestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        exams={exams}
        subjects={subjects}
        chapters={chapters}
        onTestCreated={handleTestCreated}
        initialType={createInitialType}
      />

      <MockTestPreviewModal
        test={previewTest}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewTest(null);
        }}
      />

      <AddQuestionsToTestModal
        test={selectedTest}
        isOpen={isAddQuestionsModalOpen}
        onClose={() => setIsAddQuestionsModalOpen(false)}
        subjects={subjects}
        chapters={chapters}
        onQuestionsAssigned={loadAllData}
      />

      <ImportTestsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        exams={exams}
        subjects={subjects}
        chapters={chapters}
        onImportComplete={loadAllData}
      />
    </div>
  );
};
