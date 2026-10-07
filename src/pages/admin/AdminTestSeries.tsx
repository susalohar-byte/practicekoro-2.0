import { withAdminSkeleton, AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import { runConfirmedBatch, requireSuccess } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import {
  Layers,
  FileText,
  CheckCircle2,
  Users,
  Search,
  RotateCcw,
  Plus,
  Upload,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Archive,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Download,
} from 'lucide-react';
import type { TestSeries, Exam, MockTest, TestSeriesStatus, PopularTestSeriesCard } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getPageNumbers } from '@/utils/pagination';
import { PopularTestSeriesEditModal } from '@/pages/admin/PopularTestSeriesEditModal';
import {
  DEFAULT_POPULAR_TEST_SERIES,
  DEFAULT_SHOWCASE_SERIES,
} from '@/services/domains/admin.testSeries';

// Showcase default tests for selected series (e.g. WBP Constable)
const DEFAULT_WBP_SERIES_TESTS: MockTest[] = [
  {
    id: 'test-wbp-fm-01',
    testSeriesId: 'wbp-prelims-2025',
    title: 'WBP Constable Full Mock 1',
    slug: 'wbp-constable-full-mock-1',
    testType: 'full_mock',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 85,
    passingMarks: 40,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 1,
    isActive: true,
    status: 'published',
  },
  {
    id: 'test-wbp-fm-02',
    testSeriesId: 'wbp-prelims-2025',
    title: 'WBP Constable Full Mock 2',
    slug: 'wbp-constable-full-mock-2',
    testType: 'full_mock',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 85,
    passingMarks: 40,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 2,
    isActive: true,
    status: 'published',
  },
  {
    id: 'test-wbp-fm-03',
    testSeriesId: 'wbp-prelims-2025',
    title: 'WBP Constable Full Mock 3',
    slug: 'wbp-constable-full-mock-3',
    testType: 'full_mock',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 85,
    passingMarks: 40,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 3,
    isActive: true,
    status: 'published',
  },
  {
    id: 'test-wbp-topic-01',
    testSeriesId: 'wbp-prelims-2025',
    title: 'Modern India',
    slug: 'modern-india-history-test',
    testType: 'topic',
    totalQuestions: 30,
    durationMinutes: 25,
    totalMarks: 30,
    passingMarks: 15,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 4,
    isActive: true,
    status: 'published',
  },
  {
    id: 'test-wbp-topic-02',
    testSeriesId: 'wbp-prelims-2025',
    title: 'Indian Polity',
    slug: 'indian-polity-prelims-drill',
    testType: 'topic',
    totalQuestions: 30,
    durationMinutes: 25,
    totalMarks: 30,
    passingMarks: 15,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 5,
    isActive: true,
    status: 'published',
  },
  {
    id: 'test-wbp-pyq-2025',
    testSeriesId: 'wbp-prelims-2025',
    title: 'WBP Constable PYQ 2025',
    slug: 'wbp-constable-pyq-2025',
    testType: 'pyq',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 85,
    passingMarks: 40,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 6,
    isActive: true,
    status: 'published',
  },
  {
    id: 'test-wbp-pyq-2024',
    testSeriesId: 'wbp-prelims-2025',
    title: 'WBP Constable PYQ 2024',
    slug: 'wbp-constable-pyq-2024',
    testType: 'pyq',
    totalQuestions: 85,
    durationMinutes: 60,
    totalMarks: 85,
    passingMarks: 40,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 7,
    isActive: true,
    status: 'published',
  },
  {
    id: 'test-wbp-topic-03',
    testSeriesId: 'wbp-prelims-2025',
    title: 'Arithmetic Speed Mock',
    slug: 'arithmetic-speed-mock',
    testType: 'topic',
    totalQuestions: 25,
    durationMinutes: 20,
    totalMarks: 25,
    passingMarks: 12,
    negativeMarking: 0.25,
    isPremium: false,
    orderIndex: 8,
    isActive: true,
    status: 'published',
  },
];

export const AdminTestSeries: React.FC = () => {
  const [seriesList, setSeriesList] = useState<TestSeries[]>(() =>
    isSupabaseConfigured ? [] : DEFAULT_SHOWCASE_SERIES
  );
  const [exams, setExams] = useState<Exam[]>([]);
  const [allAvailableTests, setAllAvailableTests] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Selected Table Rows (for batch actions)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Active / Opened Test Series in Right Details Drawer (Defaults to null - neutral initial state)
  const [activeSeries, setActiveSeries] = useState<TestSeries | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'tests' | 'settings' | 'analytics'>(
    'overview'
  );
  const [activeSeriesTests, setActiveSeriesTests] = useState<MockTest[]>([]);
  const [isLoadingDrawerTests, setIsLoadingDrawerTests] = useState(false);

  // Drawer Inline Edit Description State
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [drawerDescriptionText, setDrawerDescriptionText] = useState('');

  // Drawer Settings State
  const [drawerSettingsForm, setDrawerSettingsForm] = useState({
    title: '',
    subtitle: '',
    examId: '',
    isPremium: false,
    isActive: true,
    orderIndex: 1,
    status: 'published' as TestSeriesStatus,
    description: '',
    iconUrl: '/images/exams/logo_wbp.png',
    bannerUrl: '',
  });

  // Row Action Dropdown state (which row's 3-dot menu is open)
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAssigningTests, setIsAssigningTests] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetSeriesId, setAssignTargetSeriesId] = useState('');
  const [selectedTestsToAssign, setSelectedTestsToAssign] = useState<Set<string>>(new Set());
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [assignTypeFilter, setAssignTypeFilter] = useState<string>('all');
  const [assignTab, setAssignTab] = useState<'available' | 'csv'>('available');
  const [csvInputText, setCsvInputText] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState<TestSeries | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Popular Showcase Modal State
  const [popularCards, setPopularCards] = useState<PopularTestSeriesCard[]>(
    DEFAULT_POPULAR_TEST_SERIES
  );
  const [editingPopularCard, setEditingPopularCard] = useState<PopularTestSeriesCard | null>(null);
  const [isPopularModalOpen, setIsPopularModalOpen] = useState(false);

  // Create / Edit Form State
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formExamId, setFormExamId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconUrl, setFormIconUrl] = useState('/images/exams/logo_wbp.png');
  const [formBannerUrl, setFormBannerUrl] = useState('');
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formOrderIndex, setFormOrderIndex] = useState(1);
  const [formStatus, setFormStatus] = useState<TestSeriesStatus>('published');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  const handleIconFileUpload = async (file: File, isDrawer = false) => {
    try {
      setIsUploadingIcon(true);
      const url = await api.uploadTestSeriesIcon(file);
      if (isDrawer) {
        setDrawerSettingsForm((prev) => ({ ...prev, iconUrl: url }));
      } else {
        setFormIconUrl(url);
      }
      setActionNotice({ message: 'Emblem image uploaded successfully!', type: 'success' });
    } catch (err) {
      alert(`Upload failed: ${getErrorMessage(err, 'Failed to upload icon')}`);
    } finally {
      setIsUploadingIcon(false);
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Tests Tab Search & Filter inside Drawer
  const [drawerTestSearch, setDrawerTestSearch] = useState('');
  const [drawerTestTypeFilter, setDrawerTestTypeFilter] = useState<
    'all' | 'full_mock' | 'topic' | 'pyq'
  >('all');

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveActionMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Notice auto-dismiss
  useEffect(() => {
    if (actionNotice) {
      const timer = setTimeout(() => setActionNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionNotice]);

  // Load Initial Data from Backend API / Supabase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allExams, allSeries, allTests, popCards] = await Promise.all([
        api.getAllAdminExams().catch(() => []),
        api.getTestSeries(),
        api.getAllAdminTests().catch(() => []),
        api
          .getPopularTestSeriesCards()
          .catch(() => (isSupabaseConfigured ? [] : DEFAULT_POPULAR_TEST_SERIES)),
      ]);

      setExams(allExams);
      setAllAvailableTests(allTests);
      if (popCards && popCards.length > 0) setPopularCards(popCards);

      if (allSeries && allSeries.length > 0) {
        setSeriesList(allSeries);
        setActiveSeries((prev) => {
          if (!prev) return null;
          const matched = allSeries.find((s) => s.id === prev.id);
          return matched || null;
        });
      } else if (isSupabaseConfigured) {
        setSeriesList([]);
        setActiveSeries(null);
      }
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: getErrorMessage(err, 'Test series could not be loaded.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load tests when activeSeries changes
  useEffect(() => {
    if (!activeSeries) {
      setActiveSeriesTests([]);
      return;
    }

    setDrawerDescriptionText(activeSeries.description || '');
    setDrawerSettingsForm({
      title: activeSeries.title,
      subtitle: activeSeries.subtitle || '',
      examId: activeSeries.examId,
      isPremium: Boolean(activeSeries.isPremium),
      isActive: Boolean(activeSeries.isActive),
      orderIndex: activeSeries.orderIndex || 1,
      status: activeSeries.status || (activeSeries.isActive ? 'published' : 'draft'),
      description: activeSeries.description || '',
      iconUrl: activeSeries.iconUrl || '/images/exams/logo_wbp.png',
      bannerUrl: activeSeries.bannerUrl || '',
    });

    const loadSeriesTests = async () => {
      try {
        setIsLoadingDrawerTests(true);

        // Check local storage first for persisted additions/removals
        let localSaved: MockTest[] | null = null;
        try {
          const raw = localStorage.getItem(`pk_series_tests_${activeSeries.id}`);
          if (raw) localSaved = JSON.parse(raw);
        } catch {
          /* Optional browser cache is unavailable. Backend remains authoritative. */
        }

        if (
          !isSupabaseConfigured &&
          localSaved &&
          Array.isArray(localSaved) &&
          localSaved.length > 0
        ) {
          setActiveSeriesTests(localSaved);
          return;
        }

        const tests = await api.getSeriesTests(activeSeries.id);
        if (tests && tests.length > 0) {
          setActiveSeriesTests(tests);
        } else if (isSupabaseConfigured) {
          setActiveSeriesTests([]);
        } else if (activeSeries.id === 'wbp-prelims-2025') {
          setActiveSeriesTests(DEFAULT_WBP_SERIES_TESTS);
        } else {
          // Generate sample tests matching series testCount
          const sampleCount = activeSeries.fullMockCount || 3;
          const sampleTopicCount = activeSeries.topicTestCount || 2;
          const samplePyqCount = activeSeries.pyqTestCount || 1;

          const samples: MockTest[] = [];
          for (let i = 1; i <= sampleCount; i++) {
            samples.push({
              id: `${activeSeries.id}-fm-${i.toString().padStart(2, '0')}`,
              testSeriesId: activeSeries.id,
              examId: activeSeries.examId,
              title: `${activeSeries.title} Full Mock ${i.toString().padStart(2, '0')}`,
              slug: `${activeSeries.slug || activeSeries.id}-full-mock-${i}`,
              testType: 'full_mock',
              totalQuestions: 85,
              durationMinutes: 60,
              totalMarks: 85,
              passingMarks: 40,
              negativeMarking: 0.25,
              isPremium: false,
              orderIndex: i,
              isActive: true,
              status: 'published',
            });
          }
          for (let i = 1; i <= sampleTopicCount; i++) {
            samples.push({
              id: `${activeSeries.id}-topic-${i.toString().padStart(2, '0')}`,
              testSeriesId: activeSeries.id,
              examId: activeSeries.examId,
              title: `General Drill ${i}`,
              slug: `${activeSeries.slug || activeSeries.id}-drill-${i}`,
              testType: 'topic',
              totalQuestions: 30,
              durationMinutes: 25,
              totalMarks: 30,
              passingMarks: 15,
              negativeMarking: 0.25,
              isPremium: false,
              orderIndex: sampleCount + i,
              isActive: true,
              status: 'published',
            });
          }
          for (let i = 1; i <= samplePyqCount; i++) {
            samples.push({
              id: `${activeSeries.id}-pyq-${i.toString().padStart(2, '0')}`,
              testSeriesId: activeSeries.id,
              examId: activeSeries.examId,
              title: `${activeSeries.title} Official PYQ ${2025 - i}`,
              slug: `${activeSeries.slug || activeSeries.id}-pyq-${2025 - i}`,
              testType: 'pyq',
              totalQuestions: 85,
              durationMinutes: 60,
              totalMarks: 85,
              passingMarks: 40,
              negativeMarking: 0.25,
              isPremium: false,
              orderIndex: sampleCount + sampleTopicCount + i,
              isActive: true,
              status: 'published',
            });
          }
          setActiveSeriesTests(samples);
        }
      } catch (err) {
        console.warn('Could not load series tests:', err);
        setActiveSeriesTests(isSupabaseConfigured ? [] : DEFAULT_WBP_SERIES_TESTS);
      } finally {
        setIsLoadingDrawerTests(false);
      }
    };

    loadSeriesTests();
  }, [activeSeries?.id]); // Only refetch when active series ID changes

  // Derived Summary Analytics
  const stats = useMemo(() => {
    const total = seriesList.length;
    let totalTests = 0;
    let published = 0;
    let draft = 0;
    let totalEnrollments = 0;

    for (const s of seriesList) {
      totalTests +=
        s.testCount ||
        s.testsCount ||
        (s.fullMockCount || 0) + (s.topicTestCount || 0) + (s.pyqTestCount || 0);
      if (s.status === 'published' || (s.isActive && !s.status)) {
        published += 1;
      } else if (s.status === 'draft' || !s.isActive) {
        draft += 1;
      }
      totalEnrollments += s.enrollmentCount || 0;
    }

    return {
      total,
      totalTests,
      published,
      draft,
      totalEnrollments,
    };
  }, [seriesList]);

  // Dynamic Exam Options for Filter
  const examFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    exams.forEach((e) => map.set(e.id, e.title));
    seriesList.forEach((s) => {
      if (s.examId && !map.has(s.examId)) {
        map.set(s.examId, s.examTitle || s.examId);
      }
    });
    return Array.from(map.entries()).map(([val, label]) => ({ val, label }));
  }, [exams, seriesList]);

  // Filtered Test Series Dataset
  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = s.title.toLowerCase().includes(query);
        const matchesSubtitle = (s.subtitle || '').toLowerCase().includes(query);
        const matchesExam = (s.examTitle || s.examId).toLowerCase().includes(query);
        if (!matchesName && !matchesSubtitle && !matchesExam) return false;
      }

      // Exam Filter
      if (selectedExamFilter !== 'all') {
        const matchesExam =
          s.examId === selectedExamFilter ||
          s.examTitle === selectedExamFilter ||
          s.title === selectedExamFilter ||
          s.title.toLowerCase().includes(selectedExamFilter.toLowerCase());
        if (!matchesExam) return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'all') {
        const sStatus = s.status || (s.isActive ? 'published' : 'draft');
        if (sStatus !== selectedStatusFilter) return false;
      }

      // Category Filter
      if (selectedCategoryFilter !== 'all') {
        if (s.examCategory !== selectedCategoryFilter) return false;
      }

      return true;
    });
  }, [seriesList, searchTerm, selectedExamFilter, selectedStatusFilter, selectedCategoryFilter]);

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredSeries.length / pageSize));
  const paginatedSeries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSeries.slice(start, start + pageSize);
  }, [filteredSeries, currentPage, pageSize]);

  // Keep currentPage within bounds when series are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Filtered Tests inside Selected Series Drawer
  const filteredDrawerTests = useMemo(() => {
    return activeSeriesTests.filter((t) => {
      if (drawerTestSearch.trim()) {
        const q = drawerTestSearch.toLowerCase();
        if (!t.title.toLowerCase().includes(q)) return false;
      }
      if (drawerTestTypeFilter !== 'all') {
        if (drawerTestTypeFilter === 'full_mock' && t.testType !== 'full_mock') return false;
        if (
          drawerTestTypeFilter === 'topic' &&
          t.testType !== 'topic' &&
          t.testType !== 'chapter_mock'
        )
          return false;
        if (drawerTestTypeFilter === 'pyq' && t.testType !== 'pyq') return false;
      }
      return true;
    });
  }, [activeSeriesTests, drawerTestSearch, drawerTestTypeFilter]);

  // Handlers for Row Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(paginatedSeries.map((s) => s.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedExamFilter('all');
    setSelectedStatusFilter('all');
    setSelectedCategoryFilter('all');
    setCurrentPage(1);
  };

  // Batch Operations
  const handleBatchPublish = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.updateTestSeries(id, { isActive: true, status: 'published' })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setSeriesList((prev) =>
      prev.map((s) => (changed.has(s.id) ? { ...s, ...changed.get(s.id) } : s))
    );
    setActiveSeries((prev) =>
      prev && changed.has(prev.id) ? { ...prev, ...changed.get(prev.id) } : prev
    );
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDraft = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.updateTestSeries(id, { isActive: false, status: 'draft' })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setSeriesList((prev) =>
      prev.map((s) => (changed.has(s.id) ? { ...s, ...changed.get(s.id) } : s))
    );
    setActiveSeries((prev) =>
      prev && changed.has(prev.id) ? { ...prev, ...changed.get(prev.id) } : prev
    );
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchArchive = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.updateTestSeries(id, { status: 'archived', isActive: false })
    );
    const saved = new Map(batch.results.map((r) => [r.input, r.value]));
    setSeriesList((prev) => prev.map((s) => saved.get(s.id) || s));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' archived; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDelete = async () => {
    if (!window.confirm('Delete selected series? Linked records will block deletion.')) return;
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.deleteTestSeries(id)
    );
    const gone = new Set(batch.results.map((r) => r.input));
    setSeriesList((prev) => prev.filter((s) => !gone.has(s.id)));
    setActiveSeries((prev) => (prev && gone.has(prev.id) ? null : prev));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        gone.size +
        ' deleted; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  // Export CSV Handler
  const handleExportCsv = (selectedOnly = false) => {
    const dataToExport = selectedOnly
      ? seriesList.filter((s) => selectedRowIds.has(s.id))
      : filteredSeries;

    if (dataToExport.length === 0) {
      alert('No test series to export.');
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Subtitle',
      'Target Exam',
      'Category',
      'Full Mocks',
      'Topic Tests',
      'PYQs',
      'Total Tests',
      'Enrollments',
      'Status',
      'Access Tier',
    ];

    const rows = dataToExport.map((s) => [
      `"${s.id}"`,
      `"${(s.title || '').replace(/"/g, '""')}"`,
      `"${(s.subtitle || '').replace(/"/g, '""')}"`,
      `"${(s.examTitle || s.examId || '').replace(/"/g, '""')}"`,
      `"${(s.examCategory || '').replace(/"/g, '""')}"`,
      s.fullMockCount || 0,
      s.topicTestCount || 0,
      s.pyqTestCount || 0,
      s.testCount ||
        s.testsCount ||
        (s.fullMockCount || 0) + (s.topicTestCount || 0) + (s.pyqTestCount || 0),
      s.enrollmentCount || 0,
      `"${s.status || (s.isActive ? 'published' : 'draft')}"`,
      `"${s.isPremium ? 'Pro' : 'Free'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `PracticeKoro_Test_Series_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionNotice({
      message: `Exported ${dataToExport.length} test series to CSV!`,
      type: 'success',
    });
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormName('');
    setFormSubtitle('');
    setFormExamId(exams[0]?.id || 'wbp-constable');
    setFormDescription('');
    setFormIconUrl('/images/exams/logo_wbp.png');
    setFormBannerUrl('');
    setFormIsPremium(false);
    setFormOrderIndex(seriesList.length + 1);
    setFormStatus('published');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (series: TestSeries) => {
    setEditingSeries(series);
    setFormName(series.title);
    setFormSubtitle(series.subtitle || '');
    setFormExamId(series.examId);
    setFormDescription(series.description || '');
    setFormIconUrl(series.iconUrl || '/images/exams/logo_wbp.png');
    setFormBannerUrl(series.bannerUrl || '');
    setFormIsPremium(Boolean(series.isPremium));
    setFormOrderIndex(series.orderIndex || 1);
    setFormStatus(series.status || (series.isActive ? 'published' : 'draft'));
    setIsEditModalOpen(true);
  };

  // Submit Create / Edit Series
  const handleSubmitSeriesForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingForm) return;
    try {
      setIsSubmittingForm(true);
      if (!formName.trim() || !formExamId) throw new Error('Title and exam are required.');
      const input = {
        title: formName.trim(),
        subtitle: formSubtitle.trim(),
        slug:
          editingSeries?.slug ||
          formName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        examId: formExamId,
        description: formDescription.trim(),
        iconUrl: formIconUrl,
        bannerUrl: formBannerUrl || undefined,
        isPremium: formIsPremium,
        orderIndex: Number(formOrderIndex),
        status: formStatus,
        isActive: formStatus === 'published',
      };
      const saved = editingSeries
        ? await api.updateTestSeries(editingSeries.id, input)
        : await api.createTestSeries(input);
      setSeriesList((prev) =>
        editingSeries ? prev.map((s) => (s.id === saved.id ? saved : s)) : [saved, ...prev]
      );
      if (activeSeries?.id === saved.id) setActiveSeries(saved);
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
      setActionNotice({ type: 'success', message: 'Test series saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Toggle Publish / Unpublish
  const handleTogglePublish = async (series: TestSeries) => {
    try {
      const status = series.status === 'published' ? 'draft' : 'published';
      const saved = await api.updateTestSeries(series.id, {
        status,
        isActive: status === 'published',
      });
      setSeriesList((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      if (activeSeries?.id === saved.id) setActiveSeries(saved);
      setActionNotice({ type: 'success', message: 'Series status saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    }
  };

  // Archive Series
  const handleArchiveSeries = async (series: TestSeries) => {
    try {
      const saved = await api.updateTestSeries(series.id, { status: 'archived', isActive: false });
      setSeriesList((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      if (activeSeries?.id === saved.id) setActiveSeries(saved);
      setActionNotice({ type: 'success', message: 'Series archived.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Archive failed') });
    }
  };

  // Duplicate Series
  const handleDuplicateSeries = async (series: TestSeries) => {
    try {
      const saved = await api.createTestSeries({
        ...series,
        title: series.title + ' (Copy)',
        slug: series.slug + '-copy-' + crypto.randomUUID().slice(0, 8),
        status: 'draft',
        isActive: false,
      });
      setSeriesList((prev) => [saved, ...prev]);
      setActionNotice({ type: 'success', message: 'Draft series created.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Duplicate failed') });
    }
  };

  // Delete Series Confirm
  const handleConfirmDelete = async () => {
    if (!seriesToDelete) return;
    try {
      const id = seriesToDelete.id;
      await api.deleteTestSeries(id);
      setSeriesList((prev) => prev.filter((s) => s.id !== id));
      setActiveSeries((prev) => (prev?.id === id ? null : prev));
      setSeriesToDelete(null);
      setIsDeleteModalOpen(false);
      setActionNotice({ type: 'success', message: 'Series deleted.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Delete failed') });
    }
  };

  // Save Description from Details Drawer
  const handleSaveDescription = async () => {
    if (!activeSeries) return;
    try {
      const saved = await api.updateTestSeries(activeSeries.id, {
        description: drawerDescriptionText,
      });
      setSeriesList((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      setActiveSeries(saved);
      setIsEditingDescription(false);
      setActionNotice({ type: 'success', message: 'Description saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    }
  };

  // Save Settings from Details Drawer
  const handleSaveDrawerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeries) return;

    try {
      const targetExam = exams.find((ex) => ex.id === drawerSettingsForm.examId);
      const updated: TestSeries = {
        ...activeSeries,
        title: drawerSettingsForm.title.trim(),
        subtitle: drawerSettingsForm.subtitle.trim() || undefined,
        examId: drawerSettingsForm.examId,
        examTitle: targetExam?.title || activeSeries.examTitle,
        examCategory: targetExam?.category || activeSeries.examCategory || 'General',
        isPremium: drawerSettingsForm.isPremium,
        isActive: drawerSettingsForm.status === 'published',
        orderIndex: Number(drawerSettingsForm.orderIndex),
        status: drawerSettingsForm.status,
        description: drawerSettingsForm.description.trim(),
        iconUrl: drawerSettingsForm.iconUrl || activeSeries.iconUrl,
        bannerUrl: drawerSettingsForm.bannerUrl || undefined,
      };

      const saved = await api.updateTestSeries(activeSeries.id, updated);
      setSeriesList((prev) => prev.map((s) => (s.id === activeSeries.id ? saved : s)));
      setActiveSeries(saved);
      setActionNotice({ message: 'Series settings saved successfully!', type: 'success' });
    } catch (err) {
      alert(`Error saving settings: ${getErrorMessage(err, 'Failed to update')}`);
    }
  };

  // Move Series up / down in Order Modal
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= seriesList.length) return;

    const reordered = [...seriesList];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
    setSeriesList(updated);

    try {
      await api.reorderTestSeries(updated);
    } catch (err) {
      console.warn('Could not save reordered list to backend:', err);
    }
  };

  // Assign Tests Modal Submit
  const handleExecuteAssignTests = async () => {
    if (!assignTargetSeriesId || isAssigningTests) return;
    setIsAssigningTests(true);
    try {
      if (assignTab === 'csv')
        throw new Error(
          'CSV test import is unavailable here. Create valid draft tests first, then assign them.'
        );
      requireSuccess(
        await api.assignTestsToSeries(Array.from(selectedTestsToAssign), assignTargetSeriesId)
      );
      const tests = await api.getSeriesTests(assignTargetSeriesId);
      if (activeSeries?.id === assignTargetSeriesId) setActiveSeriesTests(tests);
      setSeriesList(await api.getTestSeries());
      setIsAssignModalOpen(false);
      setActionNotice({ type: 'success', message: 'Tests assigned in the backend.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Assignment failed') });
    } finally {
      setIsAssigningTests(false);
    }
  };

  // Remove test from series
  const handleRemoveTestFromSeries = async (testId: string, testTitle: string) => {
    if (!activeSeries) return;
    if (!window.confirm(`Remove "${testTitle}" from ${activeSeries.title}?`)) return;

    try {
      await api.assignTestsToSeries([testId], null);

      const remainingTests = activeSeriesTests.filter((t) => t.id !== testId);
      setActiveSeriesTests(remainingTests);

      try {
        localStorage.setItem(`pk_series_tests_${activeSeries.id}`, JSON.stringify(remainingTests));
      } catch {
        /* Optional browser cache is unavailable. Backend remains authoritative. */
      }

      const fullMocks = remainingTests.filter((t) => t.testType === 'full_mock').length;
      const topicTests = remainingTests.filter((t) => t.testType === 'topic').length;
      const pyqs = remainingTests.filter((t) => t.testType === 'pyq').length;

      const countUpdates = {
        fullMockCount: fullMocks,
        topicTestCount: topicTests,
        pyqTestCount: pyqs,
        testCount: remainingTests.length,
        testsCount: remainingTests.length,
      };

      setSeriesList((prev) =>
        prev.map((s) => (s.id === activeSeries.id ? { ...s, ...countUpdates } : s))
      );

      setActiveSeries((prev) => (prev ? { ...prev, ...countUpdates } : null));

      setActionNotice({ message: `Removed "${testTitle}" from series.`, type: 'success' });
    } catch (err) {
      alert(`Error removing test: ${getErrorMessage(err, 'Error')}`);
    }
  };

  // Filtered available tests for Assign Modal
  const filteredAvailableTestsToAssign = useMemo(() => {
    return allAvailableTests.filter((t) => {
      if (assignSearchTerm.trim()) {
        const q = assignSearchTerm.toLowerCase();
        if (!t.title.toLowerCase().includes(q)) return false;
      }
      if (assignTypeFilter !== 'all' && t.testType !== assignTypeFilter) {
        return false;
      }
      return true;
    });
  }, [allAvailableTests, assignSearchTerm, assignTypeFilter]);

  return withAdminSkeleton(
    isLoading,
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div
          className={cn(
            'p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md transition-all',
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-300'
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Test Series
            </h1>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-[#026BFC]" />}
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Create and manage test series with full mocks, topic tests and official PYQs.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Full CSV */}
          <button
            type="button"
            onClick={() => handleExportCsv(false)}
            title="Export Test Series to CSV"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Import Tests */}
          <button
            type="button"
            onClick={() => {
              setAssignTargetSeriesId(activeSeries?.id || seriesList[0]?.id || '');
              setIsAssignModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Tests</span>
          </button>

          {/* Test Series Order */}
          <button
            type="button"
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Test Series Order</span>
          </button>

          {/* + Create Test Series */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test Series</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS (5 INTERACTIVE CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Test Series */}
        <div
          onClick={handleResetFilters}
          title="Click to reset filters"
          className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Total Test Series
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.total.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +20%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">vs last month</p>
        </div>

        {/* Total Tests */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Total Tests
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.totalTests.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +15%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">across all series</p>
        </div>

        {/* Published */}
        <div
          onClick={() => {
            setSelectedStatusFilter('published');
            setCurrentPage(1);
          }}
          title="Click to filter by Published"
          className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Published
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.published.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +11%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">active in apps</p>
        </div>

        {/* Draft */}
        <div
          onClick={() => {
            setSelectedStatusFilter('draft');
            setCurrentPage(1);
          }}
          title="Click to filter by Draft"
          className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Draft</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.draft.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">in preparation</p>
        </div>

        {/* Total Enrollments */}
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Total Enrollments
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.totalEnrollments.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +28%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">student attempts</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search test series..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-8 py-2 text-xs font-semibold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-[#026BFC] text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Exam Filter */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedExamFilter}
              onChange={(e) => {
                setSelectedExamFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none px-3 py-2 text-xs font-bold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 pr-8 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">All Exams</option>
              {examFilterOptions.map(({ val, label }) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none px-3 py-2 text-xs font-bold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 pr-8 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="archived">Archived</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none px-3 py-2 text-xs font-bold bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-200 pr-8 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Police">Police Exams</option>
              <option value="SSC & Central Govt.">SSC & Central Govt.</option>
              <option value="Railways (RRB)">Railways (RRB)</option>
              <option value="WBPSC">WBPSC</option>
              <option value="Teaching">Teaching (TET)</option>
              <option value="General Knowledge">General Knowledge</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Action */}
          {(searchTerm ||
            selectedExamFilter !== 'all' ||
            selectedStatusFilter !== 'all' ||
            selectedCategoryFilter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* BATCH OPERATIONS FLOATING BAR (When rows are selected) */}
      {selectedRowIds.size > 0 && (
        <div className="bg-[#0B132B] text-white p-3 px-4 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#026BFC] animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              {selectedRowIds.size} Test Series Selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBatchPublish}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Publish
            </button>
            <button
              type="button"
              onClick={handleBatchDraft}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Draft
            </button>
            <button
              type="button"
              onClick={handleBatchArchive}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Archive
            </button>
            <button
              type="button"
              onClick={() => handleExportCsv(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelectedRowIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN LAYOUT: TABLE + DETAILS DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: TEST SERIES TABLE */}
        <div
          className={cn(
            activeSeries ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12',
            'space-y-4 transition-all duration-300'
          )}
        >
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#1E293B]/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedSeries.length > 0 &&
                          paginatedSeries.every((s) => selectedRowIds.has(s.id))
                        }
                        className="rounded border-slate-300 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Test Series</th>
                    <th className="py-3 px-3 min-w-[110px]">Exam</th>
                    <th className="py-3 px-3 min-w-[170px] text-center">
                      <div>Tests</div>
                      <div className="grid grid-cols-4 gap-1 text-[9px] font-semibold text-slate-400 normal-case mt-0.5">
                        <span>Full Mock</span>
                        <span>Topic</span>
                        <span>PYQ</span>
                        <span>Total</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right min-w-[90px]">Enrollments</th>
                    <th className="py-3 px-3 text-center min-w-[95px]">Status</th>
                    <th className="py-3 px-3 text-right w-12">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {paginatedSeries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-sm">No test series found</p>
                        <p className="text-xs mt-0.5">
                          Try adjusting your filters or search keywords.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedSeries.map((series, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      const isRowActive = activeSeries?.id === series.id;
                      const isSelected = selectedRowIds.has(series.id);
                      const fullMocks = series.fullMockCount || 0;
                      const topicTests = series.topicTestCount || 0;
                      const pyqs = series.pyqTestCount || 0;
                      const totalTests =
                        series.testCount || series.testsCount || fullMocks + topicTests + pyqs;

                      return (
                        <tr
                          key={series.id}
                          onClick={() => setActiveSeries(series)}
                          className={cn(
                            'hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer select-none',
                            isRowActive && 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="p-3 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRow(series.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(series.id)}
                              className="rounded border-slate-300 text-[#026BFC] focus:ring-[#026BFC] cursor-pointer"
                            />
                          </td>

                          {/* Row Number */}
                          <td className="py-3 px-2 text-center text-slate-400 font-bold text-[11px]">
                            {rowNum}
                          </td>

                          {/* Test Series Emblem, Name & Subtitle */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                <img
                                  src={series.iconUrl || '/images/exams/logo_wbp.png'}
                                  alt={series.title}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      '/images/exams/logo_wbp.png';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                  {series.title}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {series.subtitle || series.description || 'Complete Test Series'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Associated Exam */}
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                            {series.examTitle || series.examId}
                          </td>

                          {/* Tests breakdown: Full Mock, Topic, PYQ, Total */}
                          <td className="py-3 px-3 text-center">
                            <div className="grid grid-cols-4 gap-1 items-center">
                              {/* Full Mock (Light Blue) */}
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                                {fullMocks}
                              </span>

                              {/* Topic Tests (Light Green) */}
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
                                {topicTests}
                              </span>

                              {/* PYQs (Light Rose) */}
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900">
                                {pyqs}
                              </span>

                              {/* Total */}
                              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                {totalTests}
                              </span>
                            </div>
                          </td>

                          {/* Enrollments Count */}
                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                            {(series.enrollmentCount || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {series.status === 'published' ||
                            (series.isActive && !series.status) ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                Published
                              </span>
                            ) : series.status === 'under_review' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                                Under Review
                              </span>
                            ) : series.status === 'archived' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                Archived
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Draft
                              </span>
                            )}
                          </td>

                          {/* Row Actions Menu */}
                          <td
                            className="py-3 px-3 text-right relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(
                                    activeActionMenuId === series.id ? null : series.id
                                  );
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {activeActionMenuId === series.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1 animate-in fade-in"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSeries(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3 text-blue-500" /> View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenEditModal(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3 text-indigo-500" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDuplicateSeries(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3 text-purple-500" /> Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleTogglePublish(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    {series.status === 'published' ? 'Unpublish' : 'Publish'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleArchiveSeries(series);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Archive className="w-3 h-3" /> Archive
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSeriesToDelete(series);
                                      setIsDeleteModalOpen(true);
                                      setActiveActionMenuId(null);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 border-t border-slate-200/80 dark:border-slate-800 text-xs gap-3">
              <span className="font-semibold text-slate-500">
                Showing{' '}
                {filteredSeries.length === 0
                  ? 0
                  : Math.min(filteredSeries.length, (currentPage - 1) * pageSize + 1)}
                -{Math.min(filteredSeries.length, currentPage * pageSize)} of{' '}
                {filteredSeries.length} test series
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={cn(
                        'min-w-7 h-7 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer',
                        currentPage === item
                          ? 'bg-[#026BFC] text-white shadow-2xs'
                          : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Page Size Select */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TEST SERIES DETAILS DRAWER */}
        {activeSeries && (
          <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden animate-in slide-in-from-right-4">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Test Series Details
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSeries(null);
                  }}
                  title="Close Details"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Series Identity Banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                    <img
                      src={activeSeries.iconUrl || '/images/exams/logo_wbp.png'}
                      alt={activeSeries.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {activeSeries.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {activeSeries.subtitle || 'Complete Preparation Series'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {activeSeries.status === 'published'
                      ? 'Published'
                      : activeSeries.status || 'Active'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(activeSeries)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Drawer Tabs */}
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4 text-xs font-bold text-slate-500 overflow-x-auto">
              {(['overview', 'tests', 'settings', 'analytics'] as const).map((tab) => {
                const label =
                  tab === 'overview'
                    ? 'Overview'
                    : tab === 'tests'
                      ? `Tests (${activeSeriesTests.length || activeSeries.testCount || 25})`
                      : tab === 'settings'
                        ? 'Settings'
                        : 'Analytics';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDrawerTab(tab)}
                    className={cn(
                      'py-2.5 px-3 border-b-2 transition-all capitalize whitespace-nowrap cursor-pointer',
                      drawerTab === tab
                        ? 'border-[#026BFC] text-[#026BFC] font-extrabold'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {drawerTab === 'overview' && (
              <div className="p-4 space-y-4">
                {/* 6 Metric Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Full Mock Tests */}
                  <div className="p-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.fullMockCount ?? 5}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Full Mock Tests</p>
                  </div>

                  {/* Topic Tests */}
                  <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.topicTestCount ?? 12}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Topic Tests</p>
                  </div>

                  {/* Official PYQs */}
                  <div className="p-2.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
                    <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                      <Award className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.pyqTestCount ?? 8}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Official PYQs</p>
                  </div>

                  {/* Total Enrollments */}
                  <div className="p-2.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/60">
                    <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {(activeSeries.enrollmentCount ?? 1240).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Total Enrollments</p>
                  </div>

                  {/* Avg. Completion */}
                  <div className="p-2.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60">
                    <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.avgCompletion ?? 78}%
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Avg. Completion</p>
                  </div>

                  {/* Avg. Accuracy */}
                  <div className="p-2.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/60">
                    <div className="flex items-center gap-1.5 text-teal-600 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {activeSeries.avgAccuracy ?? 82}%
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Avg. Accuracy</p>
                  </div>
                </div>

                {/* Description Section */}
                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC]/60 dark:bg-[#1E293B]/40">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Description
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(!isEditingDescription)}
                      className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> {isEditingDescription ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={drawerDescriptionText}
                        onChange={(e) => setDrawerDescriptionText(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveDescription}
                          className="px-3 py-1.5 rounded-lg bg-[#026BFC] text-white text-xs font-bold cursor-pointer"
                        >
                          Save Description
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                      {activeSeries.description || 'No description provided.'}
                    </p>
                  )}
                </div>

                {/* Tests in This Series Section */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Tests in This Series ({activeSeriesTests.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignTargetSeriesId(activeSeries.id);
                        setIsAssignModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#026BFC] hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Test
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#F8FAFC] dark:bg-[#1E293B] text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2 w-6 text-center">#</th>
                          <th className="p-2">Test Name</th>
                          <th className="p-2 text-center">Type</th>
                          <th className="p-2 text-right">Questions</th>
                          <th className="p-2 text-right w-8">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                        {isLoadingDrawerTests ? (
                          <tr>
                            <td colSpan={5} className="p-4">
                              <AdminSectionSkeleton variant="table" label="Loading series tests…" />
                            </td>
                          </tr>
                        ) : (
                          activeSeriesTests.slice(0, 5).map((test, i) => (
                            <tr
                              key={test.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <td className="p-2 text-center text-slate-400 text-[11px]">
                                {i + 1}
                              </td>
                              <td className="p-2 font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                {test.title}
                              </td>
                              <td className="p-2 text-center whitespace-nowrap">
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded text-[10px] font-black',
                                    test.testType === 'full_mock'
                                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                      : test.testType === 'pyq'
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  )}
                                >
                                  {test.testType === 'full_mock'
                                    ? 'Full Mock'
                                    : test.testType === 'pyq'
                                      ? 'PYQ'
                                      : 'Topic'}
                                </span>
                              </td>
                              <td className="p-2 text-right font-black">{test.totalQuestions}</td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTestFromSeries(test.id, test.title)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                  title="Remove test from series"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setDrawerTab('tests')}
                      className="text-xs font-bold text-[#026BFC] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      View All Tests ({activeSeriesTests.length}){' '}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TESTS */}
            {drawerTab === 'tests' && (
              <div className="p-4 space-y-3 text-xs">
                {/* Search & Filter inside Tests Tab */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tests..."
                      value={drawerTestSearch}
                      onChange={(e) => setDrawerTestSearch(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <select
                    value={drawerTestTypeFilter}
                    onChange={(e) =>
                      setDrawerTestTypeFilter(
                        e.target.value as 'all' | 'full_mock' | 'topic' | 'pyq'
                      )
                    }
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] text-xs font-bold cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="full_mock">Full Mock</option>
                    <option value="topic">Topic Test</option>
                    <option value="pyq">Official PYQ</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignTargetSeriesId(activeSeries.id);
                      setIsAssignModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Tests Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[480px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] dark:bg-[#1E293B] text-[10px] font-bold text-slate-500 uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2 w-6 text-center">#</th>
                        <th className="p-2">Test Name</th>
                        <th className="p-2 text-center">Type</th>
                        <th className="p-2 text-center">Questions</th>
                        <th className="p-2 text-center">Duration</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                      {filteredDrawerTests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No tests match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredDrawerTests.map((t, idx) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                              {t.title}
                            </td>
                            <td className="p-2 text-center whitespace-nowrap">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-[10px] font-black',
                                  t.testType === 'full_mock'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                    : t.testType === 'pyq'
                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                )}
                              >
                                {t.testType === 'full_mock'
                                  ? 'Full Mock'
                                  : t.testType === 'pyq'
                                    ? 'Official PYQ'
                                    : 'Topic Test'}
                              </span>
                            </td>
                            <td className="p-2 text-center font-bold">{t.totalQuestions} Qs</td>
                            <td className="p-2 text-center text-slate-500 whitespace-nowrap">
                              {t.durationMinutes || 60} Mins
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRemoveTestFromSeries(t.id, t.title)}
                                className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                                title="Remove test"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: SETTINGS */}
            {drawerTab === 'settings' && (
              <form onSubmit={handleSaveDrawerSettings} className="p-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Test Series Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={drawerSettingsForm.title}
                    onChange={(e) =>
                      setDrawerSettingsForm({ ...drawerSettingsForm, title: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtitle (Tagline)
                  </label>
                  <input
                    type="text"
                    value={drawerSettingsForm.subtitle}
                    onChange={(e) =>
                      setDrawerSettingsForm({ ...drawerSettingsForm, subtitle: e.target.value })
                    }
                    placeholder="e.g. Complete Preparation Series"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Exam
                    </label>
                    <select
                      value={drawerSettingsForm.examId}
                      onChange={(e) =>
                        setDrawerSettingsForm({ ...drawerSettingsForm, examId: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold cursor-pointer"
                    >
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Publish Status
                    </label>
                    <select
                      value={drawerSettingsForm.status}
                      onChange={(e) =>
                        setDrawerSettingsForm({
                          ...drawerSettingsForm,
                          status: e.target.value as TestSeriesStatus,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold cursor-pointer"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="under_review">Under Review</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={drawerSettingsForm.orderIndex}
                      onChange={(e) =>
                        setDrawerSettingsForm({
                          ...drawerSettingsForm,
                          orderIndex: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Access Tier
                    </label>
                    <select
                      value={drawerSettingsForm.isPremium ? 'pro' : 'free'}
                      onChange={(e) =>
                        setDrawerSettingsForm({
                          ...drawerSettingsForm,
                          isPremium: e.target.value === 'pro',
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-bold cursor-pointer"
                    >
                      <option value="free">Free / Public</option>
                      <option value="pro">Pro Pass Required</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Description
                  </label>
                  <textarea
                    rows={3}
                    value={drawerSettingsForm.description}
                    onChange={(e) =>
                      setDrawerSettingsForm({
                        ...drawerSettingsForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Series Emblem
                    </label>
                    <label className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {isUploadingIcon ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingIcon}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIconFileUpload(file, true);
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={drawerSettingsForm.iconUrl}
                    onChange={(e) =>
                      setDrawerSettingsForm({ ...drawerSettingsForm, iconUrl: e.target.value })
                    }
                    placeholder="/images/exams/logo_wbp.png"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-mono text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const matched = popularCards.find((c) => c.testSeriesId === activeSeries.id);
                      setEditingPopularCard(
                        matched || {
                          id: `popular-series-${Date.now()}`,
                          testSeriesId: activeSeries.id,
                          title: activeSeries.title,
                          subtitle: activeSeries.subtitle || 'Complete Test Series',
                          cardGradientStart: '#0084FF',
                          cardGradientEnd: '#0048C6',
                          cardArrowColor: '#026BFC',
                          cardBgImage: '/images/series_wbp_bg.png',
                          cardLogoUrl:
                            activeSeries.iconUrl || '/images/exams/emblem_series_wbp.png',
                          orderIndex: popularCards.length + 1,
                          route: `/test-series/${activeSeries.slug || activeSeries.id}`,
                          isActive: true,
                          fullMockCount: activeSeries.fullMockCount || 40,
                          topicTestCount: activeSeries.topicTestCount || 120,
                          pyqTestCount: activeSeries.pyqTestCount || 25,
                        }
                      );
                      setIsPopularModalOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    👑 Homepage Showcase Card
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: ANALYTICS */}
            {drawerTab === 'analytics' && (
              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Total Attempts</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {activeSeries.enrollmentCount
                        ? Math.round(activeSeries.enrollmentCount * 2.5)
                        : 0}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Unique Students</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {(activeSeries.enrollmentCount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Average Score</p>
                    <p className="text-lg font-black text-blue-600 mt-0.5">
                      {activeSeries.avgAccuracy
                        ? `${(activeSeries.avgAccuracy * 0.85).toFixed(1)} / 100`
                        : '—'}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">Completion Rate</p>
                    <p className="text-lg font-black text-emerald-600 mt-0.5">
                      {activeSeries.avgCompletion ? `${activeSeries.avgCompletion}%` : '—'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#1E293B]/40 space-y-2">
                  <p className="font-extrabold text-slate-900 dark:text-white">Highlights</p>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Most Attempted Test:</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                      {activeSeriesTests.length > 0 ? activeSeriesTests[0].title : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Average Time Spent:</span>
                    <span className="font-bold text-slate-900 dark:text-white">48.2 Minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Overall Pass Ratio:</span>
                    <span className="font-bold text-emerald-600">68.4%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. CREATE / EDIT TEST SERIES MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#026BFC]" />
                {editingSeries ? 'Edit Test Series' : 'Create New Test Series'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSeriesForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Series Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WBP Constable"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle (Tagline)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Preparation Series"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Exam *
                  </label>
                  <select
                    value={formExamId}
                    onChange={(e) => setFormExamId(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold cursor-pointer"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TestSeriesStatus)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold cursor-pointer"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="under_review">Under Review</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Icon / Emblem Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Icon / Circular Emblem
                  </label>
                  <label className="text-[11px] font-bold text-[#026BFC] hover:underline flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    {isUploadingIcon ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingIcon}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIconFileUpload(file, false);
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {[
                    '/images/exams/logo_wbp.png',
                    '/images/exams/logo_ssc.png',
                    '/images/exams/logo_railway.png',
                    '/images/exams/logo_wbpsc.png',
                    '/images/exams/logo_wbtet.png',
                    '/images/exams/icon_kolkata_police.png',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setFormIconUrl(preset)}
                      className={cn(
                        'w-9 h-9 rounded-xl border p-1 flex items-center justify-center transition-all cursor-pointer',
                        formIconUrl === preset
                          ? 'border-[#026BFC] bg-blue-50 ring-2 ring-[#026BFC]/30'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-contain" />
                    </button>
                  ))}
                  {formIconUrl && !formIconUrl.startsWith('/images/exams/') && (
                    <div className="w-9 h-9 rounded-xl border border-[#026BFC] bg-blue-50 ring-2 ring-[#026BFC]/30 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={formIconUrl}
                        alt="custom"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom image URL"
                  value={formIconUrl}
                  onChange={(e) => setFormIconUrl(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formOrderIndex}
                    onChange={(e) => setFormOrderIndex(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Access Tier
                  </label>
                  <select
                    value={formIsPremium ? 'pro' : 'free'}
                    onChange={(e) => setFormIsPremium(e.target.value === 'pro')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] font-bold cursor-pointer"
                  >
                    <option value="free">Free for all students</option>
                    <option value="pro">Pro Pass Subscription</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this series (Bengali or English)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-6 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold cursor-pointer"
                >
                  {isSubmittingForm
                    ? 'Saving...'
                    : editingSeries
                      ? 'Update Series'
                      : 'Create Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TEST SERIES ORDER MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-[#026BFC]" />
                  Test Series Order
                </h3>
                <p className="text-xs text-slate-500">
                  Control the exact sequence displayed in the mobile app and website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {seriesList.map((series, idx) => (
                <div
                  key={series.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#1E293B]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 text-center font-extrabold text-slate-400">
                      #{idx + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border p-0.5 shrink-0 overflow-hidden">
                      <img
                        src={series.iconUrl || '/images/exams/logo_wbp.png'}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate">
                      {series.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'up')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold disabled:opacity-30 text-[11px] cursor-pointer"
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      disabled={idx === seriesList.length - 1}
                      onClick={() => handleMoveOrder(idx, 'down')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold disabled:opacity-30 text-[11px] cursor-pointer"
                    >
                      ▼ Down
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setActionNotice({ message: 'Test Series order saved!', type: 'success' });
                }}
                className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. IMPORT / ASSIGN TESTS MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#026BFC]" />
                  Import / Add Tests into Series
                </h3>
                <p className="text-xs text-slate-500">
                  Select available Mock Tests or PYQs to assign to this series.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Test Series Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Test Series:
              </label>
              <select
                value={assignTargetSeriesId}
                onChange={(e) => setAssignTargetSeriesId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-xs font-bold cursor-pointer"
              >
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.examTitle || s.examId})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setAssignTab('available')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer',
                  assignTab === 'available'
                    ? 'bg-[#026BFC] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                )}
              >
                From Existing Test Catalog
              </button>
              <button
                type="button"
                onClick={() => setAssignTab('csv')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer',
                  assignTab === 'csv'
                    ? 'bg-[#026BFC] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                )}
              >
                Bulk Import from CSV
              </button>
            </div>

            {assignTab === 'available' ? (
              <div className="space-y-2.5">
                {/* Search & Filter within Assign Modal */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search mock tests..."
                      value={assignSearchTerm}
                      onChange={(e) => setAssignSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <select
                    value={assignTypeFilter}
                    onChange={(e) => setAssignTypeFilter(e.target.value)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] text-xs font-bold cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="full_mock">Full Mock</option>
                    <option value="topic">Topic Test</option>
                    <option value="pyq">Official PYQ</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTestsToAssign.size === filteredAvailableTestsToAssign.length) {
                        setSelectedTestsToAssign(new Set());
                      } else {
                        setSelectedTestsToAssign(
                          new Set(filteredAvailableTestsToAssign.map((t) => t.id))
                        );
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {selectedTestsToAssign.size === filteredAvailableTestsToAssign.length &&
                    filteredAvailableTestsToAssign.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredAvailableTestsToAssign.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No available tests found matching your search.
                    </div>
                  ) : (
                    filteredAvailableTestsToAssign.map((test) => {
                      const isChecked = selectedTestsToAssign.has(test.id);
                      return (
                        <label
                          key={test.id}
                          className="p-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const next = new Set(selectedTestsToAssign);
                              if (next.has(test.id)) next.delete(test.id);
                              else next.add(test.id);
                              setSelectedTestsToAssign(next);
                            }}
                            className="rounded border-slate-300 text-[#026BFC] cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {test.title}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {test.testType} • {test.totalQuestions} Questions •{' '}
                              {test.durationMinutes} Mins
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paste Test Details (Format: Title, TestType, Questions, Duration)
                </label>
                <textarea
                  rows={6}
                  value={csvInputText}
                  onChange={(e) => setCsvInputText(e.target.value)}
                  placeholder="WBP Constable Full Mock 4, full_mock, 85, 60&#10;History Speed Drill 1, topic, 30, 25&#10;WBP 2023 Preliminary Paper, pyq, 85, 60"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Tip: Supports Bengali exam test names. Columns:{' '}
                  <code>Title, Type, Questions, Duration</code>
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl border font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={assignTab === 'available' && selectedTestsToAssign.size === 0}
                onClick={handleExecuteAssignTests}
                className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold disabled:opacity-40 cursor-pointer"
              >
                {assignTab === 'csv'
                  ? 'Import CSV Tests'
                  : `Add ${selectedTestsToAssign.size} Tests`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION DIALOG */}
      {isDeleteModalOpen && seriesToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Delete &quot;{seriesToDelete.title}&quot;?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                If students have enrolled or completed attempts in this series, deleting will affect
                their rank records. You can archive it instead to keep student records safe.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleArchiveSeries(seriesToDelete);
                  setIsDeleteModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
              >
                Archive Series Instead (Recommended)
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Permanently Delete Series
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. HOMEPAGE POPULAR SHOWCASE MODAL */}
      {isPopularModalOpen && editingPopularCard && (
        <PopularTestSeriesEditModal
          card={editingPopularCard}
          isOpen={isPopularModalOpen}
          existingSeries={seriesList}
          onClose={() => setIsPopularModalOpen(false)}
          onSave={async (savedCard) => {
            const exists = popularCards.some((c) => c.id === savedCard.id);
            const updated = exists
              ? popularCards.map((c) => (c.id === savedCard.id ? savedCard : c))
              : [...popularCards, savedCard];
            await api.savePopularTestSeries(updated);
            setPopularCards(updated);
            setIsPopularModalOpen(false);
            setActionNotice({
              message: 'Homepage Showcase Card saved successfully!',
              type: 'success',
            });
          }}
        />
      )}
    </div>,
    { label: 'Loading test series…', variant: 'table' }
  );
};
