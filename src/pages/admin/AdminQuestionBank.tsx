import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { Button } from '@/components/common/Button';
import { MathText } from '@/components/common/MathText';
import {
  BookOpen,
  Plus,
  Upload,
  Search,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Award,
  LayoutGrid,
  List,
  Check,
  Minus,
  Layers,
  Tag,
  Filter,
  FileSpreadsheet,
  FileText,
  Activity,
} from 'lucide-react';
import type { Question, Exam, Subject, Chapter, MockTest } from '@/types';
import {
  parseQuestionsTxt,
  TxtParseResult,
  TxtParseError,
  ParsedTxtQuestion,
  SAMPLE_TXT_CONTENT,
  downloadSampleTxt,
} from '@/utils/txtQuestionParser';
import { downloadSampleCsvFile, parseQuestionsCsv } from '@/utils/csvParser';
import { QuestionCard } from './questionBank/QuestionCard';
import { QuestionTableRow } from './questionBank/QuestionTableRow';
import { PreviewQuestionModal } from './questionBank/PreviewQuestionModal';
import { isMathematicsQuestion, isMathematicsSubject } from '@/utils/shortNotes';
import { getErrorMessage } from '@/lib/errors';
import { Link, useSearchParams } from 'react-router-dom';

export type QuestionCategory = 'all' | 'topic' | 'full_mock' | 'pyq';

export const AdminQuestionBank: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { isBilingualEnabled } = useContentLanguage();
  const [searchParams] = useSearchParams();
  const querySource = searchParams.get('source');
  const querySubjectId = searchParams.get('subjectId');
  const queryTopicId = searchParams.get('topicId');

  // Master Entities
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalUploadedCount, setTotalUploadedCount] = useState<number>(0);
  const [expandedNotesIds, setExpandedNotesIds] = useState<Record<string, boolean>>({});

  const toggleNotes = useCallback((qId: string) => {
    setExpandedNotesIds((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  }, []);

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Unified Question Category (Single Source of Truth)
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory>(() => {
    if (querySource === 'topic') return 'topic';
    if (querySource === 'pyq') return 'pyq';
    if (querySource === 'full_mock' || querySource === 'exam') return 'full_mock';
    return 'all';
  });

  // Drill-down filters for Topic mode:
  const [filterSubjectId, setFilterSubjectId] = useState(querySubjectId || '');
  const [filterChapterId, setFilterChapterId] = useState(queryTopicId || '');
  const [filterTopicTestId, setFilterTopicTestId] = useState('');

  // Drill-down filters for Exam / Full Mock / PYQ modes:
  const [filterExamId, setFilterExamId] = useState(searchParams.get('examId') || '');
  const [filterExamTestId, setFilterExamTestId] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Master bank questions for accurate bank-wide stats
  const [allBankQuestions, setAllBankQuestions] = useState<Question[]>([]);

  // Sync with searchParams if they change
  useEffect(() => {
    const s = searchParams.get('source');
    const sub = searchParams.get('subjectId');
    const top = searchParams.get('topicId') || searchParams.get('chapterId');
    const exam = searchParams.get('examId');

    if (s === 'topic') {
      setSelectedCategory('topic');
      if (sub) setFilterSubjectId(sub);
      if (top) setFilterChapterId(top);
    } else if (s === 'pyq') {
      setSelectedCategory('pyq');
      if (exam) setFilterExamId(exam);
    } else if (s === 'full_mock' || s === 'exam') {
      setSelectedCategory('full_mock');
      if (exam) setFilterExamId(exam);
    } else if (sub) {
      setSelectedCategory('topic');
      setFilterSubjectId(sub);
      if (top) setFilterChapterId(top);
    } else if (exam) {
      setFilterExamId(exam);
    }
  }, [searchParams]);

  // Pagination (Section 5)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Single Question Modal (Section 6A)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [singleSource, setSingleSource] = useState<'topic' | 'exam'>('topic');
  const [singleSubjectId, setSingleSubjectId] = useState('');
  const [singleTopicId, setSingleTopicId] = useState('');
  const [singleTopicTestId, setSingleTopicTestId] = useState('');
  const [singleExamId, setSingleExamId] = useState('');
  const [singleExamType, setSingleExamType] = useState<'full_mock' | 'pyq'>('full_mock');
  const [singleExamTestId, setSingleExamTestId] = useState('');
  const [singleQuestionText, setSingleQuestionText] = useState('');
  const [singleOptA, setSingleOptA] = useState('');
  const [singleOptB, setSingleOptB] = useState('');
  const [singleOptC, setSingleOptC] = useState('');
  const [singleOptD, setSingleOptD] = useState('');
  const [singleCorrect, setSingleCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [singleExplanation, setSingleExplanation] = useState('');
  const [singleMarks, setSingleMarks] = useState(1.0);
  // NOTE: questions never carry negative marks (test-level policy for Full
  // Mock / PYQ only), so there is intentionally no negative-marks field here.
  const [isSavingSingle, setIsSavingSingle] = useState(false);
  const [singleError, setSingleError] = useState('');

  // Bulk TXT / CSV Upload Modal (Section 7, 8, 9)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFormat, setBulkFormat] = useState<'txt' | 'csv'>('txt');
  const [bulkStep, setBulkStep] = useState<'upload' | 'preview'>('upload');
  const [bulkSource, setBulkSource] = useState<'topic' | 'exam'>('topic');
  const [bulkSubjectId, setBulkSubjectId] = useState('');
  const [bulkTopicId, setBulkTopicId] = useState('');
  const [bulkTopicTestId, setBulkTopicTestId] = useState('');
  const [bulkExamId, setBulkExamId] = useState('');
  const [bulkExamType, setBulkExamType] = useState<'full_mock' | 'pyq'>('full_mock');
  const [bulkExamTestId, setBulkExamTestId] = useState('');
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkParseResult, setBulkParseResult] = useState<TxtParseResult | null>(null);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkActionError, setBulkActionError] = useState('');
  const [bulkActionSuccess, setBulkActionSuccess] = useState('');

  // View TXT Format Guide Modal
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);

  // Preview Question Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewingQuestion, setPreviewingQuestion] = useState<Question | null>(null);

  // Edit Question Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQOptA, setEditQOptA] = useState('');
  const [editQOptB, setEditQOptB] = useState('');
  const [editQOptC, setEditQOptC] = useState('');
  const [editQOptD, setEditQOptD] = useState('');
  const [editQCorrect, setEditQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editQExplanation, setEditQExplanation] = useState('');
  const [isUpdatingQ, setIsUpdatingQ] = useState(false);
  const [editQError, setEditQError] = useState('');

  // Card / Table View Mode & Selection
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Delete Question Modal
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Master summary loader for overall Question Bank statistics
  const loadBankSummary = useCallback(async () => {
    try {
      const all = await api.getAllAdminQuestions();
      setAllBankQuestions(all);
      setTotalUploadedCount(all.length);
    } catch (err) {
      console.error('Failed to load bank summary:', err);
    }
  }, []);

  // Load Master Metadata once on mount
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getAllAdminExams(),
      api.getAllAdminSubjects(),
      api.getAllAdminChapters(),
      api.getAllAdminTests(),
      api.getAllAdminQuestions(),
    ])
      .then(([allExams, allSubjects, allChapters, allTests, allQuestions]) => {
        if (isMounted) {
          setExams(allExams);
          setSubjects(allSubjects);
          setChapters(allChapters);
          setTests(allTests);
          setAllBankQuestions(allQuestions);
          setTotalUploadedCount(allQuestions.length);
        }
      })
      .catch((err) => {
        console.error('Failed to load Question Bank metadata:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Single source of truth for the active question filter (shared by the
  // list loader, the DB total, and cap-proof select-all).
  const buildFilterParams = useCallback((): Parameters<
    typeof api.getAllAdminQuestions
  >[0] => {
    const filterParams: Parameters<typeof api.getAllAdminQuestions>[0] = {};

    if (selectedCategory === 'topic') {
      filterParams.sourceType = 'topic';
      if (filterTopicTestId) {
        filterParams.testId = filterTopicTestId;
      } else {
        if (filterSubjectId) filterParams.subjectId = filterSubjectId;
        if (filterChapterId) {
          filterParams.chapterId = filterChapterId;
          filterParams.topicId = filterChapterId;
        }
      }
    } else if (selectedCategory === 'full_mock') {
      filterParams.sourceType = 'full_mock';
      if (filterExamTestId) {
        filterParams.testId = filterExamTestId;
      } else if (filterExamId) {
        filterParams.sourceExam = filterExamId;
      }
    } else if (selectedCategory === 'pyq') {
      filterParams.sourceType = 'pyq';
      if (filterExamTestId) {
        filterParams.testId = filterExamTestId;
      } else if (filterExamId) {
        filterParams.sourceExam = filterExamId;
      }
    } else {
      // 'all' category: user can optionally drill down by exam or subject
      if (filterExamId) filterParams.sourceExam = filterExamId;
      if (filterSubjectId) filterParams.subjectId = filterSubjectId;
    }

    if (searchTerm.trim()) {
      filterParams.search = searchTerm.trim();
    }

    return filterParams;
  }, [
    selectedCategory,
    filterSubjectId,
    filterChapterId,
    filterTopicTestId,
    filterExamId,
    filterExamTestId,
    searchTerm,
  ]);

  // Exact DB total for the active filter (null = unknown, e.g. offline).
  // Needed for honest "Select all N" labels on banks larger than one fetch.
  const [totalMatchingCount, setTotalMatchingCount] = useState<number | null>(null);

  // Load Base Questions matching chosen Category and cascading filters
  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const filterParams = buildFilterParams();

      const matching = await api.getAllAdminQuestions(filterParams);
      setQuestions(matching);

      // Resolve the exact total in the background (cap-proof count).
      if (typeof api.getAdminQuestionsCount === 'function') {
        api
          .getAdminQuestionsCount(filterParams)
          .then((total) => {
            if (typeof total === 'number') setTotalMatchingCount(total);
          })
          .catch(() => {
            // keep the loaded-length fallback below
          });
      }

      // If viewing all questions without sub-filters, update total count
      if (
        selectedCategory === 'all' &&
        !filterExamId &&
        !filterSubjectId &&
        !searchTerm.trim()
      ) {
        setTotalUploadedCount(matching.length);
        setAllBankQuestions(matching);
      }
    } catch (err) {
      console.error('Failed to load Question Bank data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    buildFilterParams,
    selectedCategory,
    filterExamId,
    filterSubjectId,
    searchTerm,
  ]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Overall Bank Statistics (Accurate permanent totals in the entire Question Bank)
  const bankStats = useMemo(() => {
    let topic = 0;
    let fullMock = 0;
    let pyq = 0;

    for (const q of allBankQuestions) {
      if (q.sourceType === 'topic') {
        topic++;
      } else if (q.sourceType === 'pyq') {
        pyq++;
      } else {
        fullMock++;
      }
    }

    return {
      total: allBankQuestions.length,
      topic,
      fullMock,
      pyq,
    };
  }, [allBankQuestions]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    filterSubjectId,
    filterChapterId,
    filterTopicTestId,
    filterExamId,
    filterExamTestId,
    searchTerm,
  ]);

  // Filtered chapters for Topic mode dropdown
  const topicFilterChapters = useMemo(() => {
    if (!filterSubjectId) return chapters;
    return chapters.filter((c) => c.subjectId === filterSubjectId);
  }, [chapters, filterSubjectId]);

  // Filtered tests for Topic mode dropdown
  const topicFilterTests = useMemo(() => {
    return tests.filter((t) => {
      const isTopic = t.testType === 'topic' || t.testType === 'chapter_mock';
      if (!isTopic) return false;
      if (filterSubjectId && t.subjectId && t.subjectId !== filterSubjectId) return false;
      if (filterChapterId && t.chapterId !== filterChapterId && t.topicId !== filterChapterId)
        return false;
      return true;
    });
  }, [tests, filterSubjectId, filterChapterId]);

  // Filtered tests for Full Mock dropdown
  const fullMockFilterTests = useMemo(() => {
    return tests.filter((t) => {
      if (t.testType !== 'full_mock') return false;
      if (filterExamId && t.examId !== filterExamId && !t.associatedExamIds?.includes(filterExamId))
        return false;
      return true;
    });
  }, [tests, filterExamId]);

  // Filtered tests for PYQ dropdown
  const pyqFilterTests = useMemo(() => {
    return tests.filter((t) => {
      if (t.testType !== 'pyq') return false;
      if (filterExamId && t.examId !== filterExamId && !t.associatedExamIds?.includes(filterExamId))
        return false;
      return true;
    });
  }, [tests, filterExamId]);

  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedCategory !== 'all' ||
    filterSubjectId ||
    filterChapterId ||
    filterTopicTestId ||
    filterExamId ||
    filterExamTestId
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setFilterSubjectId('');
    setFilterChapterId('');
    setFilterTopicTestId('');
    setFilterExamId('');
    setFilterExamTestId('');
  };

  const handleSelectCategory = (cat: QuestionCategory) => {
    setSelectedCategory(cat);
    if (cat === 'topic') {
      setFilterExamId('');
      setFilterExamTestId('');
    } else if (cat === 'full_mock' || cat === 'pyq') {
      setFilterSubjectId('');
      setFilterChapterId('');
      setFilterTopicTestId('');
      setFilterExamTestId('');
    } else {
      // 'all'
      setFilterChapterId('');
      setFilterTopicTestId('');
      setFilterExamTestId('');
    }
  };

  // Single Question Modal Cascading
  const singleTopics = useMemo(() => {
    return chapters.filter((c) => !singleSubjectId || c.subjectId === singleSubjectId);
  }, [chapters, singleSubjectId]);

  const singleTopicTests = useMemo(() => {
    return tests.filter((t) => {
      const isTopicTest = t.testType === 'topic' || t.testType === 'chapter_mock';
      if (!isTopicTest) return false;
      if (singleTopicId && t.chapterId !== singleTopicId && t.topicId !== singleTopicId)
        return false;
      if (singleSubjectId && t.subjectId !== singleSubjectId) return false;
      return true;
    });
  }, [tests, singleTopicId, singleSubjectId]);

  const singleExamFullMockTests = useMemo(() => {
    if (!singleExamId) return [];
    return tests.filter(
      (t) =>
        t.testType === 'full_mock' &&
        (t.examId === singleExamId || t.associatedExamIds?.includes(singleExamId))
    );
  }, [tests, singleExamId]);

  const singleExamPyqTests = useMemo(() => {
    if (!singleExamId) return [];
    return tests.filter(
      (t) =>
        t.testType === 'pyq' &&
        (t.examId === singleExamId || t.associatedExamIds?.includes(singleExamId))
    );
  }, [tests, singleExamId]);

  // Bulk Modal Cascading
  const bulkTopics = useMemo(() => {
    return chapters.filter((c) => !bulkSubjectId || c.subjectId === bulkSubjectId);
  }, [chapters, bulkSubjectId]);

  const bulkTopicTests = useMemo(() => {
    return tests.filter((t) => {
      const isTopicTest = t.testType === 'topic' || t.testType === 'chapter_mock';
      if (!isTopicTest) return false;
      if (bulkTopicId && t.chapterId !== bulkTopicId && t.topicId !== bulkTopicId) return false;
      if (bulkSubjectId && t.subjectId !== bulkSubjectId) return false;
      return true;
    });
  }, [tests, bulkTopicId, bulkSubjectId]);

  const bulkExamFullMockTests = useMemo(() => {
    if (!bulkExamId) return [];
    return tests.filter(
      (t) =>
        t.testType === 'full_mock' &&
        (t.examId === bulkExamId || t.associatedExamIds?.includes(bulkExamId))
    );
  }, [tests, bulkExamId]);

  const bulkExamPyqTests = useMemo(() => {
    if (!bulkExamId) return [];
    return tests.filter(
      (t) =>
        t.testType === 'pyq' &&
        (t.examId === bulkExamId || t.associatedExamIds?.includes(bulkExamId))
    );
  }, [tests, bulkExamId]);

  // Open Single Question Modal
  const handleOpenAddSingle = () => {
    const defaultSub = filterSubjectId || subjects[0]?.id || '';
    const defaultTopic =
      filterChapterId ||
      chapters.find((c) => c.subjectId === defaultSub)?.id ||
      chapters[0]?.id ||
      '';
    const defaultTopicTest =
      filterTopicTestId ||
      tests.find((t) => t.chapterId === defaultTopic || t.topicId === defaultTopic)?.id ||
      '';

    const effectiveExam = filterExamId || exams[0]?.id || '';
    const effectiveExamType: 'full_mock' | 'pyq' = selectedCategory === 'pyq' ? 'pyq' : 'full_mock';
    const effectiveTests = tests.filter(
      (t) =>
        t.testType === effectiveExamType &&
        (t.examId === effectiveExam || t.associatedExamIds?.includes(effectiveExam))
    );
    const defaultExamTest = filterExamTestId || effectiveTests[0]?.id || '';

    setSingleSource(
      selectedCategory === 'full_mock' || selectedCategory === 'pyq' ? 'exam' : 'topic'
    );
    setSingleSubjectId(defaultSub);
    setSingleTopicId(defaultTopic);
    setSingleTopicTestId(defaultTopicTest);
    setSingleExamId(effectiveExam);
    setSingleExamType(effectiveExamType);
    setSingleExamTestId(defaultExamTest);
    setSingleQuestionText('');
    setSingleOptA('');
    setSingleOptB('');
    setSingleOptC('');
    setSingleOptD('');
    setSingleCorrect('A');
    setSingleExplanation('');
    setSingleMarks(1.0);
    setSingleError('');
    setIsAddModalOpen(true);
  };

  // Submit Single Question (Section 6A)
  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleQuestionText.trim()) {
      setSingleError('Question statement is required.');
      return;
    }
    if (!singleOptA.trim() || !singleOptB.trim() || !singleOptC.trim() || !singleOptD.trim()) {
      setSingleError('All 4 options (A, B, C, D) must be provided.');
      return;
    }

    if (singleSource === 'topic') {
      if (!singleSubjectId) {
        setSingleError('Subject is required for Topic Test questions.');
        return;
      }
      if (!singleTopicId) {
        setSingleError('Topic is required for Topic Test questions.');
        return;
      }
    } else {
      if (!singleExamId) {
        setSingleError('Exam is required.');
        return;
      }
      if (!singleExamType) {
        setSingleError('Please select Type (Full Mock Test or PYQ).');
        return;
      }
      if (!singleExamTestId) {
        setSingleError(
          singleExamType === 'full_mock'
            ? 'Please select a Full Mock Test.'
            : 'Please select a PYQ Paper.'
        );
        return;
      }
    }

    try {
      setIsSavingSingle(true);
      setSingleError('');

      if (singleSource === 'exam' && singleExamTestId) {
        // Create and link directly to selected Full Mock Test or PYQ (Section 12, 15)
        await api.createQuestionForTest(singleExamTestId, {
          questionText: singleQuestionText.trim(),
          questionBengaliText: singleQuestionText.trim(),
          optionA: singleOptA.trim(),
          optionB: singleOptB.trim(),
          optionC: singleOptC.trim(),
          optionD: singleOptD.trim(),
          correctOption: singleCorrect,
          explanation: singleExplanation.trim() || undefined,
          explanationBengali: singleExplanation.trim() || undefined,
          sourceExam: singleExamId,
          sourceType: singleExamType === 'pyq' ? 'pyq' : 'other',
          defaultMarks: singleMarks,
          // Questions never carry negative marks — scoring uses the test-level scheme.
          defaultNegativeMarks: 0,
          isActive: true,
          status: 'active',
        });
      } else if (singleSource === 'topic' && singleTopicTestId) {
        // Create and assign directly to the selected Topic Test
        await api.createQuestionForTest(singleTopicTestId, {
          questionText: singleQuestionText.trim(),
          questionBengaliText: singleQuestionText.trim(),
          optionA: singleOptA.trim(),
          optionB: singleOptB.trim(),
          optionC: singleOptC.trim(),
          optionD: singleOptD.trim(),
          correctOption: singleCorrect,
          explanation: singleExplanation.trim() || undefined,
          explanationBengali: singleExplanation.trim() || undefined,
          subjectId: singleSubjectId,
          topicId: singleTopicId,
          chapterId: singleTopicId,
          sourceType: 'topic',
          defaultMarks: singleMarks,
          // Questions never carry negative marks — scoring uses the test-level scheme.
          defaultNegativeMarks: 0,
          isActive: true,
          status: 'active',
        });
      } else {
        // Save to question repository with metadata
        await api.createQuestion({
          questionText: singleQuestionText.trim(),
          questionBengaliText: singleQuestionText.trim(),
          optionA: singleOptA.trim(),
          optionB: singleOptB.trim(),
          optionC: singleOptC.trim(),
          optionD: singleOptD.trim(),
          correctOption: singleCorrect,
          explanation: singleExplanation.trim() || undefined,
          explanationBengali: singleExplanation.trim() || undefined,
          subjectId: singleSource === 'topic' ? singleSubjectId : undefined,
          topicId: singleSource === 'topic' ? singleTopicId : undefined,
          chapterId: singleSource === 'topic' ? singleTopicId : undefined,
          sourceType: singleSource === 'topic' ? 'topic' : 'other',
          sourceExam: singleSource === 'exam' ? singleExamId : undefined,
          defaultMarks: singleMarks,
          // Questions never carry negative marks — scoring uses the test-level scheme.
          defaultNegativeMarks: 0,
          isActive: true,
          status: 'active',
        });
      }

      setIsAddModalOpen(false);
      await Promise.all([loadQuestions(), loadBankSummary()]);
    } catch (err) {
      setSingleError(getErrorMessage(err, 'Failed to save question'));
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Open Bulk Modal (Section 7)
  const handleOpenBulkModal = () => {
    const defaultSub = filterSubjectId || subjects[0]?.id || '';
    const defaultTopic =
      filterChapterId ||
      chapters.find((c) => c.subjectId === defaultSub)?.id ||
      chapters[0]?.id ||
      '';
    const defaultTopicTest =
      filterTopicTestId ||
      tests.find((t) => t.chapterId === defaultTopic || t.topicId === defaultTopic)?.id ||
      '';

    const effectiveExam = filterExamId || exams[0]?.id || '';
    const effectiveExamType: 'full_mock' | 'pyq' = selectedCategory === 'pyq' ? 'pyq' : 'full_mock';
    const effectiveTests = tests.filter(
      (t) =>
        t.testType === effectiveExamType &&
        (t.examId === effectiveExam || t.associatedExamIds?.includes(effectiveExam))
    );
    const defaultExamTest = filterExamTestId || effectiveTests[0]?.id || '';

    setBulkSource(
      selectedCategory === 'full_mock' || selectedCategory === 'pyq' ? 'exam' : 'topic'
    );
    setBulkSubjectId(defaultSub);
    setBulkTopicId(defaultTopic);
    setBulkTopicTestId(defaultTopicTest);
    setBulkExamId(effectiveExam);
    setBulkExamType(effectiveExamType);
    setBulkExamTestId(defaultExamTest);
    setBulkRawText('');
    setBulkFileName('');
    setBulkFormat('txt');
    setBulkParseResult(null);
    setBulkStep('upload');
    setBulkActionError('');
    setBulkActionSuccess('');
    setIsBulkModalOpen(true);
  };

  // Handle File Input (TXT or CSV)
  const handleTxtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileName(file.name);
    if (file.name.toLowerCase().endsWith('.csv')) {
      setBulkFormat('csv');
    } else if (file.name.toLowerCase().endsWith('.txt')) {
      setBulkFormat('txt');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkRawText(content || '');
    };
    reader.readAsText(file, 'utf-8');
  };

  // Parse TXT or CSV to Preview (Section 8, 9, 10)
  const handleParseTxt = () => {
    if (!bulkRawText.trim()) {
      setBulkActionError(
        bulkFormat === 'csv'
          ? 'Please select a CSV file or paste CSV question content.'
          : 'Please select a TXT file or paste question content.'
      );
      return;
    }
    if (bulkSource === 'topic') {
      if (!bulkSubjectId) {
        setBulkActionError('Please select a Subject.');
        return;
      }
      if (!bulkTopicId) {
        setBulkActionError('Please select a Topic.');
        return;
      }
    } else {
      if (!bulkExamId) {
        setBulkActionError('Please select a Target Exam.');
        return;
      }
      if (!bulkExamType) {
        setBulkActionError('Please select Type (Full Mock Test or PYQ).');
        return;
      }
      if (!bulkExamTestId) {
        setBulkActionError(
          bulkExamType === 'full_mock'
            ? 'Please select a Full Mock Test.'
            : 'Please select a PYQ Paper.'
        );
        return;
      }
    }

    setBulkActionError('');

    if (bulkFormat === 'csv') {
      const csvParsed = parseQuestionsCsv(bulkRawText, {
        defaultSubjectId: bulkSource === 'topic' ? bulkSubjectId : undefined,
        defaultChapterId: bulkSource === 'topic' ? bulkTopicId : undefined,
      });

      const validQuestions: ParsedTxtQuestion[] = csvParsed.questions.map((q, idx) => ({
        questionNumber: idx + 1,
        questionText: q.questionBengaliText || q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanationBengali || q.explanation,
        rawText: `Question ${idx + 1}: ${q.questionText}`,
      }));

      const parseErrors: TxtParseError[] = csvParsed.errors.map((err, idx) => ({
        questionNumber: idx + 1,
        reason: err,
        rawText: '',
      }));

      setBulkParseResult({
        totalDetected: csvParsed.totalRows,
        valid: validQuestions,
        errors: parseErrors,
      });
      setBulkStep('preview');
      return;
    }

    // Pass the selected subject so TXT imports enforce Short Notes rules for
    // non-Mathematics subjects (Mathematics keeps classic Explanation).
    const result = parseQuestionsTxt(bulkRawText, {
      subjectId: bulkSource === 'topic' ? bulkSubjectId || undefined : undefined,
    });
    setBulkParseResult(result);
    setBulkStep('preview');
  };

  // Import Valid Questions from Preview (Section 9, 10, 11)
  const handleImportValidQuestions = async () => {
    if (!bulkParseResult || bulkParseResult.valid.length === 0) return;

    try {
      setIsImportingBulk(true);
      setBulkActionError('');

      const res = await api.bulkCreateQuestionsFromTxt({
        questions: bulkParseResult.valid,
        sourceType: bulkSource === 'topic' ? 'topic' : bulkExamType === 'pyq' ? 'pyq' : 'other',
        subjectId: bulkSource === 'topic' ? bulkSubjectId : undefined,
        topicId: bulkSource === 'topic' ? bulkTopicId : undefined,
        examId: bulkSource === 'exam' ? bulkExamId : undefined,
        testId: bulkSource === 'topic' ? bulkTopicTestId || undefined : bulkExamTestId,
      });

      await api.logAdminActivity({
        action: 'QUESTION_BULK_IMPORT',
        entityType: 'question',
        entityName: `${res.successCount} questions imported (${bulkFormat === 'csv' ? 'Excel/CSV' : 'Standard TXT'})`,
        details: {
          format: bulkFormat,
          successCount: res.successCount,
          sourceType: bulkSource,
          examId: bulkExamId,
          subjectId: bulkSubjectId,
        },
        adminUser: currentAdmin,
      });

      setBulkActionSuccess(
        `Successfully imported ${res.successCount} questions into Question Bank!`
      );
      await Promise.all([loadQuestions(), loadBankSummary()]);

      setTimeout(() => {
        setIsBulkModalOpen(false);
      }, 1500);
    } catch (err) {
      setBulkActionError(getErrorMessage(err, 'Failed to import questions'));
    } finally {
      setIsImportingBulk(false);
    }
  };

  // Edit Question
  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setEditQText(!isBilingualEnabled && q.questionBengaliText ? q.questionBengaliText : (q.questionBengaliText || q.questionText));
    setEditQOptA(q.optionA);
    setEditQOptB(q.optionB);
    setEditQOptC(q.optionC);
    setEditQOptD(q.optionD);
    setEditQCorrect(q.correctOption);
    setEditQExplanation(q.explanationBengali || q.explanation || '');
    setEditQError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      setIsUpdatingQ(true);
      setEditQError('');
      await api.updateQuestion(editingQuestion.id, {
        questionText: !isBilingualEnabled
          ? (editingQuestion.questionText && editingQuestion.questionText !== editingQuestion.questionBengaliText ? editingQuestion.questionText : editQText.trim())
          : editQText.trim(),
        questionBengaliText: editQText.trim(),
        optionA: editQOptA.trim(),
        optionB: editQOptB.trim(),
        optionC: editQOptC.trim(),
        optionD: editQOptD.trim(),
        correctOption: editQCorrect,
        explanation: editQExplanation.trim() || undefined,
        explanationBengali: editQExplanation.trim() || undefined,
      });

      await api.logAdminActivity({
        action: 'QUESTION_UPDATE',
        entityType: 'question',
        entityId: editingQuestion.id,
        entityName: editQText.trim().slice(0, 60),
        details: {
          correctOption: editQCorrect,
        },
        adminUser: currentAdmin,
      });

      setIsEditModalOpen(false);
      await Promise.all([loadQuestions(), loadBankSummary()]);
    } catch (err) {
      setEditQError(getErrorMessage(err, 'Failed to update question'));
    } finally {
      setIsUpdatingQ(false);
    }
  };

  // Archive Question
  const handleArchiveQuestion = async (q: Question) => {
    const isCurrentlyArchived = q.status === 'archived';
    try {
      await api.updateQuestion(q.id, {
        status: isCurrentlyArchived ? 'active' : 'archived',
        isActive: isCurrentlyArchived,
      });
      await Promise.all([loadQuestions(), loadBankSummary()]);
    } catch (err) {
      console.error('Failed to toggle question archive status:', err);
    }
  };

  // Delete Question Handlers
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      setIsDeletingQuestion(true);
      setDeleteError('');
      const success = await api.deleteQuestion(questionToDelete.id);
      if (success) {
        await api.logAdminActivity({
          action: 'QUESTION_DELETE',
          entityType: 'question',
          entityId: questionToDelete.id,
          entityName: questionToDelete.questionText.slice(0, 60),
          details: {
            questionText: questionToDelete.questionText,
          },
          adminUser: currentAdmin,
        });

        setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));
        setAllBankQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));
        setTotalUploadedCount((prev) => Math.max(0, prev - 1));
        setSelectedQuestionIds((prev) => {
          const next = new Set(prev);
          next.delete(questionToDelete.id);
          return next;
        });
        setQuestionToDelete(null);
        setBulkActionSuccess('Question deleted successfully.');
      } else {
        setDeleteError('Failed to delete question. Please try again.');
      }
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete question'));
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const handleBulkDeleteQuestions = async () => {
    if (selectedQuestionIds.size === 0) return;
    try {
      setIsDeletingQuestion(true);
      setDeleteError('');
      const ids = Array.from(selectedQuestionIds);
      const res = await api.deleteQuestions(ids);
      const count = res.deletedCount;

      await api.logAdminActivity({
        action: 'QUESTION_BULK_DELETE',
        entityType: 'question',
        entityName: `${count} questions deleted in bulk`,
        details: { count, deletedIds: ids },
        adminUser: currentAdmin,
      });

      setQuestions((prev) => prev.filter((q) => !selectedQuestionIds.has(q.id)));
      setAllBankQuestions((prev) => prev.filter((q) => !selectedQuestionIds.has(q.id)));
      setTotalUploadedCount((prev) => Math.max(0, prev - count));
      setSelectedQuestionIds(new Set());
      setIsBulkDeleteModalOpen(false);
      setBulkActionSuccess(`${count} questions deleted successfully.`);
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete selected questions'));
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Pagination calculation
  const totalCount = questions.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return questions.slice(start, start + pageSize);
  }, [questions, currentPage, pageSize]);

  // Selection state: page-level and all-level.
  // displayTotal is the honest denominator: exact DB total when known,
  // otherwise the loaded length.
  const displayTotal = totalMatchingCount ?? questions.length;
  const isPageAllSelected =
    paginatedQuestions.length > 0 &&
    paginatedQuestions.every((q) => selectedQuestionIds.has(q.id));
  const isPageIndeterminate =
    !isPageAllSelected && paginatedQuestions.some((q) => selectedQuestionIds.has(q.id));
  const isAllSelected =
    questions.length > 0 &&
    questions.every((q) => selectedQuestionIds.has(q.id)) &&
    (totalMatchingCount == null || selectedQuestionIds.size >= totalMatchingCount);

  // Toggle select current page only
  const toggleSelectPage = () => {
    if (paginatedQuestions.length === 0) return;
    if (isPageAllSelected) {
      setSelectedQuestionIds((prev) => {
        const next = new Set(prev);
        paginatedQuestions.forEach((q) => next.delete(q.id));
        return next;
      });
    } else {
      setSelectedQuestionIds((prev) => {
        const next = new Set(prev);
        paginatedQuestions.forEach((q) => next.add(q.id));
        return next;
      });
    }
  };

  // Background completion flag for cap-proof select-all.
  const [isSelectingAll, setIsSelectingAll] = useState(false);

  // Select ALL questions matching the active filter — including rows past
  // the fetch cap that were never loaded into the browser. Instant path
  // selects loaded rows synchronously; the cap-proof ID resolution merges
  // the remainder in the background.
  const toggleSelectAll = async () => {
    if (questions.length === 0 || isSelectingAll) return;
    if (isAllSelected) {
      setSelectedQuestionIds(new Set());
      return;
    }
    setSelectedQuestionIds(new Set(questions.map((q) => q.id)));
    if (typeof api.getAllAdminQuestionIds !== 'function') return;
    setIsSelectingAll(true);
    try {
      const allIds = await api.getAllAdminQuestionIds(buildFilterParams());
      setSelectedQuestionIds((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.add(id));
        return next;
      });
    } catch (err) {
      console.warn('Cap-proof select-all fell back to loaded rows:', err);
    } finally {
      setIsSelectingAll(false);
    }
  };

  const handleExportQuestionsCSV = () => {
    const headers = [
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Option',
      'Explanation',
      'Marks',
      'Subject',
      'Topic',
      'Source Type',
    ];

    const escapeCell = (cell: any) => {
      if (cell == null) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = questions.map((q) => [
      q.questionText,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.correctOption,
      q.explanation || '',
      q.defaultMarks,
      q.subjectName || subjects.find((s) => s.id === q.subjectId)?.name || '',
      q.topicName ||
        q.chapterName ||
        chapters.find((c) => c.id === (q.topicId || q.chapterId))?.name ||
        '',
      q.sourceType || 'topic',
    ]);

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `questions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Question Bank
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {totalUploadedCount} Total Uploaded Questions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Central repository of exam and practice questions. Real question records loaded directly.
            </p>
          </div>
        </div>

        {/* Action Buttons in a Single Line */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          <Link to="/admin/item-analysis" className="shrink-0">
            <Button
              variant="outline"
              className="text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 shadow-2xs whitespace-nowrap h-9 px-3 rounded-xl cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Item Analysis</span>
            </Button>
          </Link>

          <Button
            onClick={() => setIsFormatGuideOpen(true)}
            variant="outline"
            className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 h-9 px-3 rounded-xl cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>TXT Format</span>
          </Button>

          <Button
            onClick={handleExportQuestionsCSV}
            disabled={questions.length === 0}
            variant="outline"
            className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0 h-9 px-3 rounded-xl cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={handleOpenBulkModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-indigo-600/20 whitespace-nowrap shrink-0 h-9 px-3.5 rounded-xl cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Add Questions</span>
          </Button>

          <Button
            onClick={handleOpenAddSingle}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-emerald-600/20 whitespace-nowrap shrink-0 h-9 px-3.5 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </Button>
        </div>
      </div>

      {/* ─── PROMINENT QUESTION STATS & CATEGORY BREAKDOWN ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Questions Card */}
        <button
          type="button"
          onClick={() => handleSelectCategory('all')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-br from-indigo-50/90 to-white dark:from-indigo-950/40 dark:to-slate-900 border-indigo-400 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-[#0a1226] border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-black uppercase tracking-wider ${
              selectedCategory === 'all' ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-300'
            }`}>
              Total Questions
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {bankStats.total}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">questions</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Whole repository</span>
            {selectedCategory === 'all' && (
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
        </button>

        {/* Topic Practice Category Card */}
        <button
          type="button"
          onClick={() => handleSelectCategory('topic')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedCategory === 'topic'
              ? 'bg-gradient-to-br from-blue-50/90 to-white dark:from-blue-950/40 dark:to-slate-900 border-blue-400 dark:border-blue-600 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-[#0a1226] border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-black uppercase tracking-wider ${
              selectedCategory === 'topic' ? 'text-blue-950 dark:text-blue-200' : 'text-blue-600 dark:text-blue-400'
            }`}>
              Topic Tests
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {bankStats.topic}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">questions</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Chapter & Topic tests
            </span>
            {selectedCategory === 'topic' && (
              <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
        </button>

        {/* Full Mock Test Category Card */}
        <button
          type="button"
          onClick={() => handleSelectCategory('full_mock')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedCategory === 'full_mock'
              ? 'bg-gradient-to-br from-emerald-50/90 to-white dark:from-emerald-950/40 dark:to-slate-900 border-emerald-400 dark:border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-[#0a1226] border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-black uppercase tracking-wider ${
              selectedCategory === 'full_mock' ? 'text-emerald-950 dark:text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              Full Mock Tests
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {bankStats.fullMock}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">questions</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Full syllabus papers
            </span>
            {selectedCategory === 'full_mock' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
        </button>

        {/* PYQ Papers Category Card */}
        <button
          type="button"
          onClick={() => handleSelectCategory('pyq')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedCategory === 'pyq'
              ? 'bg-gradient-to-br from-amber-50/90 to-white dark:from-amber-950/40 dark:to-slate-900 border-amber-400 dark:border-amber-600 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-[#0a1226] border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-black uppercase tracking-wider ${
              selectedCategory === 'pyq' ? 'text-amber-950 dark:text-amber-200' : 'text-amber-600 dark:text-amber-400'
            }`}>
              PYQ Papers
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {bankStats.pyq}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">questions</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Previous year questions
            </span>
            {selectedCategory === 'pyq' && (
              <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
        </button>
      </div>

      {/* ─── UNIFIED CATEGORY & HIERARCHICAL FILTER BAR ─── */}
      <div className="bg-white dark:bg-[#0a1226] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Search and Header Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 select-none" />
            <input
              type="text"
              placeholder="Search questions by statement, options, or explanation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-pk-primary transition-colors shadow-2xs font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </span>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 flex items-center gap-1.5 h-9"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Bar (Single Source of Truth) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-pk-primary" />
              Question Category Filter
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedCategory === 'all' && 'Showing all questions repository'}
              {selectedCategory === 'topic' && 'Filtered by Subject, Topic & Test'}
              {selectedCategory === 'full_mock' && 'Filtered by Full Mock Test papers'}
              {selectedCategory === 'pyq' && 'Filtered by Previous Year Papers (PYQ)'}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={`p-2.5 sm:p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-50/80 dark:bg-pk-primary/20 border-pk-primary text-pk-primary dark:text-pk-blue-bright shadow-2xs ring-1 ring-pk-primary'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-pk-primary shrink-0" />
                <div className="truncate">
                  <div className={`font-bold truncate ${selectedCategory === 'all' ? 'text-pk-primary dark:text-pk-blue-bright' : 'text-slate-800 dark:text-slate-200'}`}>
                    All Questions
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
                    Whole bank
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-pk-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {bankStats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('topic')}
              className={`p-2.5 sm:p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                selectedCategory === 'topic'
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="truncate">
                  <div className={`font-bold truncate ${selectedCategory === 'topic' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    Topic Tests
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
                    Subject & Chapter
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                  selectedCategory === 'topic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {bankStats.topic}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('full_mock')}
              className={`p-2.5 sm:p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                selectedCategory === 'full_mock'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className={`font-bold truncate ${selectedCategory === 'full_mock' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    Full Mock Tests
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
                    Full syllabus mocks
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                  selectedCategory === 'full_mock'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {bankStats.fullMock}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('pyq')}
              className={`p-2.5 sm:p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                selectedCategory === 'pyq'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className={`font-bold truncate ${selectedCategory === 'pyq' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    PYQ Papers
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
                    Previous year papers
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
                  selectedCategory === 'pyq'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {bankStats.pyq}
              </span>
            </button>
          </div>
        </div>

        {/* Row 3: Cascading Sub-Filters Matching Active Category */}
        {selectedCategory === 'topic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* 1. Subject */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                1. Subject
              </label>
              <select
                value={filterSubjectId}
                onChange={(e) => {
                  setFilterSubjectId(e.target.value);
                  setFilterChapterId('');
                  setFilterTopicTestId('');
                }}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Topic / Chapter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                2. Topic / Chapter
              </label>
              <select
                value={filterChapterId}
                onChange={(e) => {
                  setFilterChapterId(e.target.value);
                  setFilterTopicTestId('');
                }}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">{filterSubjectId ? 'All Topics in Subject' : 'All Topics'}</option>
                {topicFilterChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Topic Test */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                3. Topic Test
              </label>
              <select
                value={filterTopicTestId}
                onChange={(e) => setFilterTopicTestId(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">
                  {filterChapterId ? 'All Tests in Topic' : 'All Topic Tests'}
                </option>
                {topicFilterTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedCategory === 'full_mock' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* 1. Target Exam */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                1. Target Exam
              </label>
              <select
                value={filterExamId}
                onChange={(e) => {
                  setFilterExamId(e.target.value);
                  setFilterExamTestId('');
                }}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">All Target Exams</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Full Mock Test */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                2. Full Mock Test
              </label>
              <select
                value={filterExamTestId}
                onChange={(e) => setFilterExamTestId(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">All Full Mock Tests</option>
                {fullMockFilterTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedCategory === 'pyq' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* 1. Target Exam */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                1. Target Exam
              </label>
              <select
                value={filterExamId}
                onChange={(e) => {
                  setFilterExamId(e.target.value);
                  setFilterExamTestId('');
                }}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">All Target Exams</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. PYQ Paper */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                2. PYQ Paper
              </label>
              <select
                value={filterExamTestId}
                onChange={(e) => setFilterExamTestId(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">All PYQ Papers</option>
                {pyqFilterTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedCategory === 'all' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Target Exam Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-pk-primary shrink-0" />
                Filter by Exam
              </label>
              <select
                value={filterExamId}
                onChange={(e) => setFilterExamId(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pk-primary transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">All Exams</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-pk-primary shrink-0" />
                Filter by Subject
              </label>
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-pk-primary transition-colors shadow-2xs cursor-pointer truncate"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Row 4: Active Filters Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              Active Filters:
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200 dark:border-slate-800">
                <span>Search: &ldquo;{searchTerm}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-[11px] border ${
                  selectedCategory === 'topic'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                    : selectedCategory === 'full_mock'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <span>
                  Category:{' '}
                  {selectedCategory === 'topic'
                    ? 'Topic Tests'
                    : selectedCategory === 'full_mock'
                      ? 'Full Mock Tests'
                      : 'PYQ Papers'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all')}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterSubjectId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] border border-blue-200 dark:border-blue-800/60">
                <span>
                  Subject: {subjects.find((s) => s.id === filterSubjectId)?.name || filterSubjectId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterSubjectId('');
                    setFilterChapterId('');
                    setFilterTopicTestId('');
                  }}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterChapterId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] border border-blue-200 dark:border-blue-800/60">
                <span>
                  Topic: {chapters.find((c) => c.id === filterChapterId)?.name || filterChapterId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterChapterId('');
                    setFilterTopicTestId('');
                  }}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterTopicTestId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] border border-blue-200 dark:border-blue-800/60">
                <span>
                  Test: {tests.find((t) => t.id === filterTopicTestId)?.title || filterTopicTestId}
                </span>
                <button
                  type="button"
                  onClick={() => setFilterTopicTestId('')}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterExamId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] border border-emerald-200 dark:border-emerald-800/60">
                <span>Exam: {exams.find((e) => e.id === filterExamId)?.title || filterExamId}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterExamId('');
                    setFilterExamTestId('');
                  }}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterExamTestId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] border border-emerald-200 dark:border-emerald-800/60">
                <span>
                  Paper: {tests.find((t) => t.id === filterExamTestId)?.title || filterExamTestId}
                </span>
                <button
                  type="button"
                  onClick={() => setFilterExamTestId('')}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* SELECTION TOOLBAR (Outside Question List Container) */}
      {!isLoading && questions.length > 0 && (
        <div className="space-y-0">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/80 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              {/* Page-level select checkbox */}
              <button
                type="button"
                onClick={toggleSelectPage}
                className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <div
                  className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isPageAllSelected || isPageIndeterminate
                      ? 'bg-sky-500 border-sky-500 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
                  }`}
                >
                  {isPageAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  {isPageIndeterminate && <Minus className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>
                  Select Page ({paginatedQuestions.length})
                </span>
              </button>

              {/* Separator + Select ALL matching filter (always visible) */}
              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => void toggleSelectAll()}
                  disabled={isSelectingAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer disabled:opacity-60 ${
                    isAllSelected
                      ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-sky-300 hover:text-sky-600 dark:hover:text-sky-400'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                      isAllSelected
                        ? 'bg-sky-500 border-sky-500 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isAllSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  {isAllSelected
                    ? `All (${displayTotal} Question${displayTotal === 1 ? '' : 's'}) Selected`
                    : isSelectingAll
                      ? 'Selecting all…'
                      : `Select All (${displayTotal} Question${displayTotal === 1 ? '' : 's'})`}
                </button>
              )}

              {selectedQuestionIds.size > 0 && (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                    <span className="inline-flex items-center justify-center bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-md min-w-[22px] h-5 px-1 text-[11px] font-black">
                      {selectedQuestionIds.size}
                    </span>
                    {selectedQuestionIds.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected ({selectedQuestionIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQuestionIds(new Set())}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline text-[11px] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                title="Card View (as requested)"
                className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
            </div>
          </div>

          {/* Escalation Banner: when page is fully selected, offer to select ALL */}
          {isPageAllSelected && !isAllSelected && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-50 dark:bg-sky-950/30 border border-t-0 border-sky-200 dark:border-sky-900/60 rounded-b-2xl -mt-1 text-xs">
              <span className="text-sky-700 dark:text-sky-300 font-medium">
                All {paginatedQuestions.length} questions on this page are selected.
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-sky-600 dark:text-sky-400 font-bold underline hover:text-sky-800 dark:hover:text-sky-200 cursor-pointer"
              >
                Select all {questions.length} questions
              </button>
            </div>
          )}

          {/* Confirmation Banner: when ALL are selected across pages */}
          {isAllSelected && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-100 dark:bg-sky-950/50 border border-t-0 border-sky-300 dark:border-sky-800 rounded-b-2xl -mt-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="text-sky-800 dark:text-sky-200 font-bold">
                All {questions.length} questions across {totalPages} pages are selected.
              </span>
              <button
                type="button"
                onClick={() => setSelectedQuestionIds(new Set())}
                className="text-sky-600 dark:text-sky-400 font-medium underline hover:text-sky-800 cursor-pointer"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* REAL QUESTION LIST TABLE (Section 5, 9, 16) */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <p className="font-semibold">Loading Question Bank records...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-black text-slate-900 dark:text-white">
                No questions found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {hasActiveFilters
                  ? 'No questions matched your selected filters. Try changing or resetting the filters.'
                  : 'No questions in Question Bank yet. Click "+ Add Question" to create your first question.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                </Button>
              )}
              <Button
                onClick={handleOpenAddSingle}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> + Add Question
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* CARD VIEW (Matching user reference layout exactly) */}
            {viewMode === 'card' ? (
              <div className="p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-900/30">
                {paginatedQuestions.map((q, idx) => {
                  const questionNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isSelected = selectedQuestionIds.has(q.id);
                  const subjectTitle =
                    q.topicName || q.chapterName || q.subjectName || 'bengali Literature';

                  return (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      questionNumber={questionNumber}
                      isSelected={isSelected}
                      subjectTitle={subjectTitle}
                      notesExpanded={Boolean(expandedNotesIds[q.id])}
                      onToggleSelect={() => toggleSelectQuestion(q.id)}
                      onOpenEdit={() => handleOpenEdit(q)}
                      onRequestDelete={() => setQuestionToDelete(q)}
                      onToggleNotes={() => toggleNotes(q.id)}
                      onPreview={() => {
                        setPreviewingQuestion(q);
                        setIsPreviewModalOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW (Alternative compact mode) */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3 max-w-md">Question</th>
                      <th className="px-4 py-3">Source & Assignment</th>
                      <th className="px-4 py-3">Options Overview</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {paginatedQuestions.map((q, idx) => {
                      const questionNumber = (currentPage - 1) * pageSize + idx + 1;
                      const examTitle = exams.find((e) => e.id === q.sourceExam)?.title;

                      return (
                        <QuestionTableRow
                          key={q.id}
                          q={q}
                          questionNumber={questionNumber}
                          examTitle={examTitle}
                          isSelected={selectedQuestionIds.has(q.id)}
                          onToggleSelect={() => toggleSelectQuestion(q.id)}
                          onPreview={() => {
                            setPreviewingQuestion(q);
                            setIsPreviewModalOpen(true);
                          }}
                          onOpenEdit={() => handleOpenEdit(q)}
                          onArchive={() => handleArchiveQuestion(q)}
                          onRequestDelete={() => setQuestionToDelete(q)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {questions.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span>{' '}
              questions
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-slate-900 dark:text-white px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SINGLE QUESTION MODAL (Section 6A) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" /> Add Single Question
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {singleError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSingle} className="space-y-4">
              {/* Question Source Selection (Section 6A) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Source *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSingleSource('topic')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                      singleSource === 'topic'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Topic Test (Subject → Topic → Test)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSingleSource('exam')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                      singleSource === 'exam'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Exam (Target Exam)
                  </button>
                </div>
              </div>

              {/* IF SOURCE = TOPIC TEST: Subject -> Topic -> Topic Test */}
              {singleSource === 'topic' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject *
                    </label>
                    <select
                      value={singleSubjectId}
                      onChange={(e) => {
                        setSingleSubjectId(e.target.value);
                        const firstTopic =
                          chapters.find((c) => c.subjectId === e.target.value)?.id || '';
                        setSingleTopicId(firstTopic);
                      }}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Topic *
                    </label>
                    <select
                      value={singleTopicId}
                      onChange={(e) => setSingleTopicId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select Topic</option>
                      {singleTopics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Topic Test
                    </label>
                    <select
                      value={singleTopicTestId}
                      onChange={(e) => setSingleTopicTestId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">(Optional) Link to Test</option>
                      {singleTopicTests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* IF SOURCE = EXAM: Exam -> Type (Full Mock Test | PYQ) -> specific Full Mock Test / PYQ (Section 12, 13) */}
              {singleSource === 'exam' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Exam *
                    </label>
                    <select
                      value={singleExamId}
                      onChange={(e) => {
                        const newExamId = e.target.value;
                        setSingleExamId(newExamId);
                        const testsForNewExam = tests.filter(
                          (t) =>
                            t.testType === singleExamType &&
                            (t.examId === newExamId || t.associatedExamIds?.includes(newExamId))
                        );
                        setSingleExamTestId(testsForNewExam[0]?.id || '');
                      }}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="">Select Target Exam</option>
                      {exams.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Type *
                    </label>
                    <select
                      value={singleExamType}
                      onChange={(e) => {
                        const newType = e.target.value as 'full_mock' | 'pyq';
                        setSingleExamType(newType);
                        const testsForType = tests.filter(
                          (t) =>
                            t.testType === newType &&
                            (t.examId === singleExamId ||
                              t.associatedExamIds?.includes(singleExamId))
                        );
                        setSingleExamTestId(testsForType[0]?.id || '');
                      }}
                      required
                      disabled={!singleExamId}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="full_mock">Full Mock Test</option>
                      <option value="pyq">PYQ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {singleExamType === 'full_mock' ? 'Full Mock Test *' : 'PYQ Paper *'}
                    </label>
                    <select
                      value={singleExamTestId}
                      onChange={(e) => setSingleExamTestId(e.target.value)}
                      required
                      disabled={!singleExamId}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">
                        {(singleExamType === 'full_mock'
                          ? singleExamFullMockTests
                          : singleExamPyqTests
                        ).length === 0
                          ? `No ${singleExamType === 'full_mock' ? 'Full Mock Tests' : 'PYQs'} Available`
                          : `Select ${singleExamType === 'full_mock' ? 'Full Mock Test' : 'PYQ Paper'}`}
                      </option>
                      {(singleExamType === 'full_mock'
                        ? singleExamFullMockTests
                        : singleExamPyqTests
                      ).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title || t.paperName}{' '}
                          {typeof t.totalQuestions === 'number' ? `(${t.totalQuestions} Qs)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Exam Target Destination Confirmation Pill */}
              {singleSource === 'exam' && singleExamId && singleExamTestId && (
                <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    Target Destination:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {exams.find((e) => e.id === singleExamId)?.title}
                    </strong>{' '}
                    →{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {singleExamType === 'full_mock' ? 'Full Mock Test' : 'PYQ'}
                    </strong>{' '}
                    →{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {tests.find((t) => t.id === singleExamTestId)?.title ||
                        tests.find((t) => t.id === singleExamTestId)?.paperName}
                    </strong>
                  </span>
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {!isBilingualEnabled ? 'Question Text (বাংলা প্রশ্ন) *' : 'Question Text (English or Bengali) *'}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    !isBilingualEnabled
                      ? 'সম্পূর্ণ প্রশ্নটি বাংলা ভাষায় লিখুন...'
                      : 'Type or paste the complete question text...'
                  }
                  value={singleQuestionText}
                  onChange={(e) => setSingleQuestionText(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Option A *
                  </label>
                  <input
                    type="text"
                    placeholder="Option A text..."
                    value={singleOptA}
                    onChange={(e) => setSingleOptA(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Option B *
                  </label>
                  <input
                    type="text"
                    placeholder="Option B text..."
                    value={singleOptB}
                    onChange={(e) => setSingleOptB(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Option C *
                  </label>
                  <input
                    type="text"
                    placeholder="Option C text..."
                    value={singleOptC}
                    onChange={(e) => setSingleOptC(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Option D *
                  </label>
                  <input
                    type="text"
                    placeholder="Option D text..."
                    value={singleOptD}
                    onChange={(e) => setSingleOptD(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Correct Answer Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correct Answer *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setSingleCorrect(opt)}
                      className={`py-2 text-xs font-black rounded-xl border transition-all ${
                        singleCorrect === opt
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      Option ({opt.toLowerCase()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation / Short Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isMathematicsSubject(subjects.find((s) => s.id === singleSubjectId))
                      ? 'Explanation / গাণিতিক সমাধান'
                      : 'Short Notes (শর্ট নোটস) - Bengali Bullet Points'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isMathematicsSubject(subjects.find((s) => s.id === singleSubjectId))
                      ? 'Formula & steps'
                      : '4–5 bullets starting with •'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder={
                    isMathematicsSubject(subjects.find((s) => s.id === singleSubjectId))
                      ? 'Step-by-step mathematical explanation, formulas, and working...'
                      : '• পয়েন্ট ১...\n• পয়েন্ট ২...\n• পয়েন্ট ৩...\n• পয়েন্ট ৪...\n• পয়েন্ট ৫...'
                  }
                  value={singleExplanation}
                  onChange={(e) => setSingleExplanation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                />
                {!isMathematicsSubject(subjects.find((s) => s.id === singleSubjectId)) && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    প্রতিটি বুলেট নতুন লাইনে '• ' দিয়ে শুরু করুন (৪–৫টি তথ্যবহুল পয়েন্ট)। কোনো
                    "সঠিক উত্তর" বা অপশন ঘোষণা লিখবেন না।
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingSingle}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  {isSavingSingle ? 'Saving...' : 'Save Question'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK TXT QUESTION UPLOAD MODAL (Section 7, 8, 9) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Bulk Add Questions via TXT (Section 7)
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkActionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkActionError}</span>
              </div>
            )}

            {bulkActionSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bulkActionSuccess}</span>
              </div>
            )}

            {/* STEP 1: UPLOAD & CONFIGURATION */}
            {bulkStep === 'upload' && (
              <div className="space-y-4">
                {/* Source Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select Question Source *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBulkSource('topic')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        bulkSource === 'topic'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Topic Test
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkSource('exam')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        bulkSource === 'exam'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Exam
                    </button>
                  </div>
                </div>

                {/* Assignment Dropdowns */}
                {bulkSource === 'topic' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Subject *
                      </label>
                      <select
                        value={bulkSubjectId}
                        onChange={(e) => {
                          setBulkSubjectId(e.target.value);
                          const firstTopic =
                            chapters.find((c) => c.subjectId === e.target.value)?.id || '';
                          setBulkTopicId(firstTopic);
                        }}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Topic *
                      </label>
                      <select
                        value={bulkTopicId}
                        onChange={(e) => setBulkTopicId(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="">Select Topic</option>
                        {bulkTopics.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Topic Test
                      </label>
                      <select
                        value={bulkTopicTestId}
                        onChange={(e) => setBulkTopicTestId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="">(Optional) Auto-link to Test</option>
                        {bulkTopicTests.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Exam *
                      </label>
                      <select
                        value={bulkExamId}
                        onChange={(e) => {
                          const newExamId = e.target.value;
                          setBulkExamId(newExamId);
                          const testsForNewExam = tests.filter(
                            (t) =>
                              t.testType === bulkExamType &&
                              (t.examId === newExamId || t.associatedExamIds?.includes(newExamId))
                          );
                          setBulkExamTestId(testsForNewExam[0]?.id || '');
                        }}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="">Select Target Exam</option>
                        {exams.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Type *
                      </label>
                      <select
                        value={bulkExamType}
                        onChange={(e) => {
                          const newType = e.target.value as 'full_mock' | 'pyq';
                          setBulkExamType(newType);
                          const testsForType = tests.filter(
                            (t) =>
                              t.testType === newType &&
                              (t.examId === bulkExamId || t.associatedExamIds?.includes(bulkExamId))
                          );
                          setBulkExamTestId(testsForType[0]?.id || '');
                        }}
                        required
                        disabled={!bulkExamId}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-50"
                      >
                        <option value="full_mock">Full Mock Test</option>
                        <option value="pyq">PYQ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bulkExamType === 'full_mock' ? 'Full Mock Test *' : 'PYQ Paper *'}
                      </label>
                      <select
                        value={bulkExamTestId}
                        onChange={(e) => setBulkExamTestId(e.target.value)}
                        required
                        disabled={!bulkExamId}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white disabled:opacity-50"
                      >
                        <option value="">
                          {(bulkExamType === 'full_mock' ? bulkExamFullMockTests : bulkExamPyqTests)
                            .length === 0
                            ? `No ${bulkExamType === 'full_mock' ? 'Full Mock Tests' : 'PYQs'} Available`
                            : `Select ${bulkExamType === 'full_mock' ? 'Full Mock Test' : 'PYQ Paper'}`}
                        </option>
                        {(bulkExamType === 'full_mock'
                          ? bulkExamFullMockTests
                          : bulkExamPyqTests
                        ).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title || t.paperName}{' '}
                            {typeof t.totalQuestions === 'number' ? `(${t.totalQuestions} Qs)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Exam Import Destination Confirmation Pill */}
                {bulkSource === 'exam' && bulkExamId && bulkExamTestId && (
                  <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Import Destination:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {exams.find((e) => e.id === bulkExamId)?.title}
                      </strong>{' '}
                      →{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {bulkExamType === 'full_mock' ? 'Full Mock Test' : 'PYQ'}
                      </strong>{' '}
                      →{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {tests.find((t) => t.id === bulkExamTestId)?.title ||
                          tests.find((t) => t.id === bulkExamTestId)?.paperName}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Format Selector: TXT vs Excel/CSV */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    File Format *
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBulkFormat('txt')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        bulkFormat === 'txt'
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Standard TXT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkFormat('csv')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        bulkFormat === 'csv'
                          ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel / CSV</span>
                    </button>
                  </div>
                </div>

                {/* Upload & Sample buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {bulkFormat === 'csv'
                      ? 'Upload Excel/CSV File (UTF-8)'
                      : 'Upload TXT File (UTF-8)'}
                  </span>
                  <div className="flex items-center gap-2">
                    {bulkFormat === 'txt' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsFormatGuideOpen(true)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          View TXT Format
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={() => downloadSampleTxt()}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Download Sample TXT
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => downloadSampleCsvFile()}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download Sample CSV (Excel Ready)
                      </button>
                    )}
                  </div>
                </div>

                {/* File picker */}
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-2 hover:border-indigo-500 transition-colors">
                  {bulkFormat === 'csv' ? (
                    <FileSpreadsheet className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {bulkFileName ? (
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        Selected: {bulkFileName}
                      </span>
                    ) : bulkFormat === 'csv' ? (
                      'Choose a .csv file or drag it here (UTF-8 Bengali supported)'
                    ) : (
                      'Choose a .txt file or drag it here'
                    )}
                  </p>
                  <label className="inline-block">
                    <span className="cursor-pointer text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                      Browse File
                    </span>
                    <input
                      type="file"
                      accept={
                        bulkFormat === 'csv'
                          ? '.csv,text/csv,application/vnd.ms-excel'
                          : '.txt,text/plain'
                      }
                      onChange={handleTxtFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Paste Area */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {bulkFormat === 'csv'
                      ? 'Or Paste CSV Content Directly:'
                      : 'Or Paste TXT Content Directly:'}
                  </label>
                  <textarea
                    rows={6}
                    placeholder={
                      bulkFormat === 'csv'
                        ? 'Question Text,Option A,Option B,Option C,Option D,Correct Option,Explanation\n' +
                          'ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?,ড. রাজেন্দ্র প্রসাদ,জওহরলাল নেহরু,সর্বপল্লী রাধাকৃষ্ণন,ড. বি. আর. আম্বেদকর,A,ড. রাজেন্দ্র প্রসাদ স্বাধীন ভারতের প্রথম রাষ্ট্রপতি'
                        : '1. ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?\n(a) ড. রাজেন্দ্র প্রসাদ\n(b) জওহরলাল নেহরু\n(c) সর্বপল্লী রাধাকৃষ্ণন\n(d) ড. বি. আর. আম্বেদকর\n\nসঠিক উত্তর: (a) ড. রাজেন্দ্র প্রসাদ\n\nExplanation:\n- ড. রাজেন্দ্র প্রসাদ ছিলেন স্বাধীন ভারতের প্রথম রাষ্ট্রপতি।'
                    }
                    value={bulkRawText}
                    onChange={(e) => setBulkRawText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono leading-relaxed"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Math/equations: wrap LaTeX in <code>$...$</code>, for example{' '}
                    <code>{'($^{14}\\text{C}$)'}</code>. Use <code>$$...$$</code> for a centered equation.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleParseTxt}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    {bulkFormat === 'csv'
                      ? 'Parse CSV & Preview Questions'
                      : 'Parse TXT & Preview Questions'}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: BULK UPLOAD PREVIEW (Section 9) */}
            {bulkStep === 'preview' && bulkParseResult && (
              <div className="space-y-4">
                {/* Target Destination Banner */}
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider">
                      Target Destination
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {bulkSource === 'topic'
                        ? `${subjects.find((s) => s.id === bulkSubjectId)?.name || 'Subject'} → ${chapters.find((c) => c.id === bulkTopicId)?.name || 'Topic'}${bulkTopicTestId ? ` → ${tests.find((t) => t.id === bulkTopicTestId)?.title}` : ''}`
                        : `${exams.find((e) => e.id === bulkExamId)?.title || 'Exam'} → ${bulkExamType === 'full_mock' ? 'Full Mock Test' : 'PYQ'} → ${tests.find((t) => t.id === bulkExamTestId)?.title || tests.find((t) => t.id === bulkExamTestId)?.paperName || 'Selected Test'}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkStep('upload')}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Change
                  </button>
                </div>
                {/* Validation Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                    <span className="block text-[11px] font-medium text-slate-500">
                      Detected Questions
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {bulkParseResult.totalDetected}
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-center">
                    <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Valid Questions
                    </span>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                      {bulkParseResult.valid.length}
                    </span>
                  </div>

                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-center">
                    <span className="block text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      Errors
                    </span>
                    <span className="text-xl font-black text-rose-700 dark:text-rose-400">
                      {bulkParseResult.errors.length}
                    </span>
                  </div>
                </div>

                {/* Show Problematic Blocks (Section 9) */}
                {bulkParseResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Problematic Question Blocks (Fix before
                      importing)
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {bulkParseResult.errors.map((err, i) => (
                        <div
                          key={i}
                          className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-bold">
                            <span>Question #{err.questionNumber}</span>
                            <span className="text-[10px] uppercase tracking-wider">Error</span>
                          </div>
                          <p className="text-rose-600 dark:text-rose-300 text-[11px]">
                            {err.reason}
                          </p>
                          <pre className="text-[10px] p-2 bg-black/10 dark:bg-black/40 rounded text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap font-mono">
                            {err.rawText.slice(0, 150)}...
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Questions Sample Preview */}
                {bulkParseResult.valid.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Valid Questions Preview (First 3 of {bulkParseResult.valid.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {bulkParseResult.valid.slice(0, 3).map((q) => (
                        <div
                          key={q.questionNumber}
                          className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">
                              {q.questionNumber}. <MathText>{q.questionText}</MathText>
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                            <span
                              className={
                                q.correctOption === 'A' ? 'text-emerald-500 font-bold' : ''
                              }
                            >
                              (a) <MathText>{q.optionA}</MathText>
                            </span>
                            <span
                              className={
                                q.correctOption === 'B' ? 'text-emerald-500 font-bold' : ''
                              }
                            >
                              (b) <MathText>{q.optionB}</MathText>
                            </span>
                            <span
                              className={
                                q.correctOption === 'C' ? 'text-emerald-500 font-bold' : ''
                              }
                            >
                              (c) <MathText>{q.optionC}</MathText>
                            </span>
                            <span
                              className={
                                q.correctOption === 'D' ? 'text-emerald-500 font-bold' : ''
                              }
                            >
                              (d) <MathText>{q.optionD}</MathText>
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-600 font-bold pt-0.5">
                            Correct: ({q.correctOption.toLowerCase()})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons (Section 9) */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBulkStep('upload')}
                      className="text-xs"
                    >
                      Fix / Upload Again
                    </Button>

                    <Button
                      type="button"
                      onClick={handleImportValidQuestions}
                      disabled={isImportingBulk || bulkParseResult.valid.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      {isImportingBulk
                        ? 'Importing...'
                        : `Import ${bulkParseResult.valid.length} Valid Questions`}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW TXT FORMAT GUIDE MODAL (Section 8) */}
      {isFormatGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" /> Standard TXT Question Format
                (Section 8)
              </h3>
              <button
                onClick={() => setIsFormatGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every question must follow this exact conceptual layout. The parser accommodates
              standard whitespace and English or Bengali numerals.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <pre className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                {SAMPLE_TXT_CONTENT}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsFormatGuideOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => downloadSampleTxt()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Template (.txt)
              </Button>
            </div>
          </div>
        </div>
      )}

{/* QUESTION PREVIEW MODAL */}
      {isPreviewModalOpen && previewingQuestion && (
        <PreviewQuestionModal
          question={previewingQuestion}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}

      {/* QUESTION EDIT MODAL */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-500" /> Edit Question
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editQError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                {editQError}
              </p>
            )}

            <form onSubmit={handleUpdateQuestion} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {!isBilingualEnabled ? 'Question Text (বাংলা প্রশ্ন) *' : 'Question Text *'}
                </label>
                <textarea
                  rows={3}
                  value={editQText}
                  onChange={(e) => setEditQText(e.target.value)}
                  placeholder={!isBilingualEnabled ? 'সম্পূর্ণ প্রশ্নটি বাংলা ভাষায় লিখুন...' : 'Type or paste question text...'}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option A
                  </label>
                  <input
                    type="text"
                    value={editQOptA}
                    onChange={(e) => setEditQOptA(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option B
                  </label>
                  <input
                    type="text"
                    value={editQOptB}
                    onChange={(e) => setEditQOptB(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option C
                  </label>
                  <input
                    type="text"
                    value={editQOptC}
                    onChange={(e) => setEditQOptC(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option D
                  </label>
                  <input
                    type="text"
                    value={editQOptD}
                    onChange={(e) => setEditQOptD(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correct Answer *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setEditQCorrect(opt)}
                      className={`py-1.5 text-xs font-black rounded-xl border ${
                        editQCorrect === opt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ({opt.toLowerCase()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation / Short Notes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isMathematicsQuestion(editingQuestion)
                      ? 'Explanation / গাণিতিক সমাধান'
                      : 'Short Notes (শর্ট নোটস) - Bengali Bullet Points'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isMathematicsQuestion(editingQuestion)
                      ? 'Formula & steps'
                      : '4–5 bullets starting with •'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder={
                    isMathematicsQuestion(editingQuestion)
                      ? 'Step-by-step mathematical explanation, formulas, and working...'
                      : '• পয়েন্ট ১...\n• পয়েন্ট ২...\n• পয়েন্ট ৩...\n• পয়েন্ট ৪...\n• পয়েন্ট ৫...'
                  }
                  value={editQExplanation}
                  onChange={(e) => setEditQExplanation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
                />
                {!isMathematicsQuestion(editingQuestion) && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    প্রতিটি বুলেট নতুন লাইনে '• ' দিয়ে শুরু করুন (৪–৫টি তথ্যবহুল পয়েন্ট)। কোনো
                    "সঠিক উত্তর" বা অপশন ঘোষণা লিখবেন না।
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingQ}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  {isUpdatingQ ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Question Delete Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  প্রশ্নটি ডিলিট করতে চান?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Delete Question Confirmation
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400">
                {deleteError}
              </div>
            )}

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold line-clamp-2">
                {questionToDelete.questionBengaliText || questionToDelete.questionText}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>
                  Subject:{' '}
                  {subjects.find((s) => s.id === questionToDelete.subjectId)?.name ||
                    questionToDelete.subjectName ||
                    'General'}
                </span>
                <span>•</span>
                <span>Language: BN</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              এই প্রশ্নটি স্থায়ীভাবে ডাটাবেস থেকে মুছে ফেলা হবে। আপনি কি নিশ্চিত?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuestionToDelete(null);
                  setDeleteError('');
                }}
                disabled={isDeletingQuestion}
                className="text-xs"
              >
                বাতিল করুন (Cancel)
              </Button>
              <Button
                type="button"
                onClick={handleDeleteQuestion}
                disabled={isDeletingQuestion}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                {isDeletingQuestion ? 'মুছে ফেলা হচ্ছে...' : 'ডিলিট করুন (Delete)'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  একসাথে {selectedQuestionIds.size}টি প্রশ্ন ডিলিট করবেন?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bulk Delete Confirmation
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300">
              নির্বাচিত {selectedQuestionIds.size}টি প্রশ্ন স্থায়ীভাবে ডাটাবেস ও সংশ্লিষ্ট টেস্ট
              থেকে ডিলিট করা হবে। এই পদক্ষেপটি আনডু করা যাবে না।
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBulkDeleteModalOpen(false);
                  setDeleteError('');
                }}
                disabled={isDeletingQuestion}
                className="text-xs"
              >
                বাতিল করুন (Cancel)
              </Button>
              <Button
                type="button"
                onClick={handleBulkDeleteQuestions}
                disabled={isDeletingQuestion}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                {isDeletingQuestion
                  ? 'ডিলিট হচ্ছে...'
                  : `হ্যাঁ, সবকটি ডিলিট করুন (${selectedQuestionIds.size})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
