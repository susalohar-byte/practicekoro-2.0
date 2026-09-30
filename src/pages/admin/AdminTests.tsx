import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import {
  Layers,
  Plus,
  Edit2,
  Search,
  Clock,
  X,
  AlertCircle,
  FolderTree,
  Target,
  ScrollText,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Trash2,
  Crown,
  ChevronRight,
  Power,
  ArrowRight,
  ListPlus,
  PlusCircle,
  HelpCircle,
  RotateCcw,
  Copy,
  Users,
  ListOrdered,
  Download,
  FileSpreadsheet,
  Radio,
} from 'lucide-react';
import type {
  MockTest,
  Exam,
  Subject,
  Chapter,
  PublishValidationResult,
  TestSeries,
} from '@/types';
import { getErrorMessage } from '@/lib/errors';

type MockTab = 'topic' | 'full_mock' | 'pyq' | 'structure';

export const AdminTests: React.FC = () => {
  const { user: currentAdmin, hasPermission } = useAuth();
  const canDeleteTests = hasPermission('canDeleteTests');
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<MockTab>(() => {
    if (initialTab === 'full_mock' || initialTab === 'pyq' || initialTab === 'structure') {
      return initialTab;
    }
    return 'topic';
  });

  // Entities
  const [tests, setTests] = useState<MockTest[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState(() => searchParams.get('subjectId') || '');
  const [filterTopicId, setFilterTopicId] = useState(() => searchParams.get('topicId') || '');
  const [filterExamId, setFilterExamId] = useState(() => searchParams.get('examId') || '');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>(
    'all'
  );

  // Sync state if URL query params change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'topic' ||
      tabParam === 'full_mock' ||
      tabParam === 'pyq' ||
      tabParam === 'structure'
    ) {
      setActiveTab(tabParam);
    }
    const examParam = searchParams.get('examId');
    if (examParam !== null) {
      setFilterExamId(examParam);
    }
    const subParam = searchParams.get('subjectId');
    if (subParam !== null) {
      setFilterSubjectId(subParam);
    }
    const topParam = searchParams.get('topicId');
    if (topParam !== null) {
      setFilterTopicId(topParam);
    }
  }, [searchParams]);

  // Structure Management State
  const [selectedStructureSubjectId, setSelectedStructureSubjectId] = useState<string>('');
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [isSavingStructure, setIsSavingStructure] = useState(false);
  const [structureError, setStructureError] = useState('');

  // Test Modal State (Shared for Create/Edit across tabs)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [modalType, setModalType] = useState<'topic' | 'full_mock' | 'pyq'>('topic');
  const [newlyCreatedTest, setNewlyCreatedTest] = useState<MockTest | null>(null);

  // Test Form Fields
  const [formExamId, setFormExamId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTopicId, setFormTopicId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState(15);
  const [formTotalMarks, setFormTotalMarks] = useState(25);
  const [formPassingMarks, setFormPassingMarks] = useState(10);
  const [formNegativeMarking, setFormNegativeMarking] = useState(0.25);
  // Optional scheme: only Full Mock & PYQ tests may carry negative marking.
  // Topic tests always save 0 (field hidden in the form).
  const [formNegativeEnabled, setFormNegativeEnabled] = useState(false);
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formPaperName, setFormPaperName] = useState('Preliminary');
  const [formShift, setFormShift] = useState('');
  const [testSeriesList, setTestSeriesList] = useState<TestSeries[]>([]);
  const [formTestSeriesId, setFormTestSeriesId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSavingTest, setIsSavingTest] = useState(false);

  // Publish Validation Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [testToPublish, setTestToPublish] = useState<MockTest | null>(null);
  const [validationResult, setValidationResult] = useState<PublishValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Archive Modal State
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [testToArchive, setTestToArchive] = useState<MockTest | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<MockTest | null>(null);
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [deleteTestError, setDeleteTestError] = useState('');

  // Global Settings Defaults State
  const [globalDefaults, setGlobalDefaults] = useState({
    durationMinutes: 60,
    marksPerQuestion: 1.0,
    negativeMarks: 0.25,
    passingPercentage: 35,
  });

  // Duplication State
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  // Attempts Modal State
  const [viewingAttemptsTest, setViewingAttemptsTest] = useState<MockTest | null>(null);
  const [attemptsList, setAttemptsList] = useState<any[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  // Make Live Modal State
  const [makeLiveTest, setMakeLiveTest] = useState<MockTest | null>(null);
  const [liveStartDate, setLiveStartDate] = useState('');
  const [liveStartTime, setLiveStartTime] = useState('20:00');
  const [liveRegDeadlineTime, setLiveRegDeadlineTime] = useState('19:55');
  const [liveRankingEnabled, setLiveRankingEnabled] = useState(true);
  const [liveSubscriptionRequired, setLiveSubscriptionRequired] = useState(false);
  const [isSchedulingLive, setIsSchedulingLive] = useState(false);
  const [makeLiveError, setMakeLiveError] = useState('');
  const [makeLiveSuccess, setMakeLiveSuccess] = useState(false);
  const [lockedTestIds, setLockedTestIds] = useState<Set<string>>(new Set());

  const handleOpenMakeLiveModal = (test: MockTest) => {
    setMakeLiveTest(test);
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    setLiveStartDate(tomorrow.toISOString().split('T')[0]);
    setLiveStartTime('20:00');
    setLiveRegDeadlineTime('19:55');
    setLiveRankingEnabled(true);
    setLiveSubscriptionRequired(Boolean(test.isPremium));
    setMakeLiveError('');
    setMakeLiveSuccess(false);
  };

  const handleScheduleLiveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeLiveTest) return;
    setIsSchedulingLive(true);
    setMakeLiveError('');
    try {
      const startAt = new Date(`${liveStartDate}T${liveStartTime}:00`).toISOString();
      const regDeadline = liveRegDeadlineTime
        ? new Date(`${liveStartDate}T${liveRegDeadlineTime}:00`).toISOString()
        : startAt;

      await api.scheduleLiveTest({
        testId: makeLiveTest.id,
        startAt,
        registrationDeadline: regDeadline,
        rankingEnabled: liveRankingEnabled,
        subscriptionRequired: liveSubscriptionRequired,
      });

      setMakeLiveSuccess(true);
      await loadData();
      setTimeout(() => {
        setMakeLiveTest(null);
        setMakeLiveSuccess(false);
      }, 1200);
    } catch (err: any) {
      setMakeLiveError(err?.message || 'Failed to schedule Live Test.');
    } finally {
      setIsSchedulingLive(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allExams, allSubjects, allChapters, allTests, allSeries, allLive] = await Promise.all([
        api.getAllAdminExams(),
        api.getAllAdminSubjects(),
        api.getAllAdminChapters(),
        api.getAllAdminTests(),
        api.getTestSeries(),
        api.getLiveTests().catch(() => []),
      ]);
      setExams(allExams);
      setSubjects(allSubjects);
      setChapters(allChapters);
      setTests(allTests);
      setTestSeriesList(allSeries);

      const locked = new Set<string>(
        (allLive || [])
          .filter((lt) => lt.status === 'upcoming' || lt.status === 'live')
          .map((lt) => lt.testId)
      );
      setLockedTestIds(locked);

      // Fetch global settings defaults for tests
      try {
        const settings = await api.getAppSettings();
        const dur = settings.find((s) => s.key === 'default_duration_minutes')?.value;
        const marks = settings.find((s) => s.key === 'default_marks_per_q')?.value;
        const neg = settings.find((s) => s.key === 'default_negative_marks')?.value;
        const pass = settings.find((s) => s.key === 'default_passing_percentage')?.value;
        setGlobalDefaults({
          durationMinutes: dur ? Number(dur) : 60,
          marksPerQuestion: marks ? Number(marks) : 1.0,
          negativeMarks: neg ? Number(neg) : 0.25,
          passingPercentage: pass ? Number(pass) : 35,
        });
      } catch (err) {
        console.warn('Could not load global settings for tests defaults:', err);
      }

      if (!selectedStructureSubjectId && allSubjects.length > 0) {
        setSelectedStructureSubjectId(allSubjects[0].id);
      }
    } catch (err) {
      console.error('Error loading tests data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStructureSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDuplicateTest = async (testId: string) => {
    try {
      setIsDuplicating(testId);
      const dup = await api.duplicateTest(testId);
      if (dup) {
        await loadData();
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to duplicate test'));
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleOpenAttempts = async (test: MockTest) => {
    setViewingAttemptsTest(test);
    setIsLoadingAttempts(true);
    try {
      const attempts = await api.getTestAttempts(test.id);
      setAttemptsList(attempts);
    } catch (err) {
      console.error('Failed to load attempts:', err);
      setAttemptsList([]);
    } finally {
      setIsLoadingAttempts(false);
    }
  };

  // Export Results / Rank Sheet to CSV
  const [isExportingResults, setIsExportingResults] = useState(false);
  const handleExportResults = async (test?: MockTest) => {
    const targetTest = test || viewingAttemptsTest;
    if (!targetTest) return;
    setIsExportingResults(true);
    try {
      const rows = await api.getTestResultsForExport(targetTest.id);
      if (!rows || rows.length === 0) {
        alert('No candidate attempts recorded yet for this test.');
        return;
      }
      api.exportTestResultsToCsv(targetTest.title, rows);
    } catch (err) {
      console.error('Failed to export test results:', err);
      alert('Failed to export test results: ' + getErrorMessage(err, 'Export failed'));
    } finally {
      setIsExportingResults(false);
    }
  };

  // Export Test Questions to CSV
  const [exportingQuestionsTestId, setExportingQuestionsTestId] = useState<string | null>(null);
  const handleExportQuestions = async (test: MockTest) => {
    setExportingQuestionsTestId(test.id);
    try {
      const qs = await api.getTestQuestions(test.id);
      if (!qs || qs.length === 0) {
        alert('This test has no questions to export.');
        return;
      }
      api.exportTestQuestionsToCsv(test.title, qs);
    } catch (err) {
      console.error('Failed to export questions:', err);
      alert('Failed to export questions: ' + getErrorMessage(err, 'Export failed'));
    } finally {
      setExportingQuestionsTestId(null);
    }
  };

  // Open Create Test modal pre-configured for the active tab with global defaults
  const handleOpenCreateTest = (type: 'topic' | 'full_mock' | 'pyq') => {
    setEditingTest(null);
    setModalType(type);
    setFormError('');

    const defaultExam = filterExamId || exams[0]?.id || '';
    const defaultSubject = filterSubjectId || subjects[0]?.id || '';
    const defaultTopic =
      filterTopicId || chapters.find((c) => c.subjectId === defaultSubject)?.id || '';

    const defDuration =
      type === 'topic' ? 15 : type === 'full_mock' ? globalDefaults.durationMinutes : 90;
    const defMarks = type === 'topic' ? 25 : 100;
    const defPassMarks = Math.round((defMarks * globalDefaults.passingPercentage) / 100);

    setFormExamId(type === 'topic' ? filterExamId || '' : defaultExam);
    setFormSubjectId(defaultSubject);
    setFormTopicId(defaultTopic);
    setFormTitle('');
    setFormDescription('');
    setFormDuration(defDuration);
    setFormTotalMarks(defMarks);
    setFormPassingMarks(defPassMarks);
    // Each test owns its scoring rule; start with no deduction until selected.
    setFormNegativeEnabled(false);
    setFormNegativeMarking(globalDefaults.negativeMarks);
    setFormIsPremium(false);
    setFormYear(new Date().getFullYear());
    setFormPaperName('Preliminary');
    setFormShift('');
    const seriesParam = searchParams.get('seriesId');
    setFormTestSeriesId(seriesParam || '');
    setIsTestModalOpen(true);
  };

  const handleOpenEditTest = (test: MockTest) => {
    setEditingTest(test);
    const inferredType =
      test.testType === 'pyq' ? 'pyq' : test.testType === 'full_mock' ? 'full_mock' : 'topic';
    setModalType(inferredType);
    setFormError('');

    setFormExamId(test.examId || '');
    setFormSubjectId(test.subjectId || subjects[0]?.id || '');
    setFormTopicId(test.topicId || test.chapterId || '');
    setFormTestSeriesId(test.testSeriesId || '');
    setFormTitle(test.title);
    setFormDescription(test.description || '');
    setFormDuration(test.durationMinutes);
    setFormTotalMarks(test.totalMarks);
    setFormPassingMarks(test.passingMarks);
    // Restore the test's saved rule regardless of test type.
    const editNegValue = test.negativeMarking ?? 0;
    setFormNegativeEnabled(editNegValue > 0);
    setFormNegativeMarking(editNegValue > 0 ? editNegValue : globalDefaults.negativeMarks);
    setFormIsPremium(test.isPremium);
    setFormYear(test.year || new Date().getFullYear());
    setFormPaperName(test.paperName || 'Preliminary');
    setFormShift(test.shift || '');
    setIsTestModalOpen(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Test name is required.');
      return;
    }

    if (modalType === 'topic') {
      if (!formSubjectId) {
        setFormError('Subject must be selected.');
        return;
      }
      if (!formTopicId) {
        setFormError('Topic must be selected.');
        return;
      }
    } else {
      if (!formExamId) {
        setFormError('Exam must be selected.');
        return;
      }
    }

    try {
      setIsSavingTest(true);
      setFormError('');

      const mappedTestType =
        modalType === 'pyq' ? 'pyq' : modalType === 'full_mock' ? 'full_mock' : 'topic';

      // Negative marking is optional and saved per test. Zero means disabled.
      const resolvedNegativeMarking = formNegativeEnabled
        ? Math.max(0, Number(formNegativeMarking) || 0)
        : 0;

      if (editingTest) {
        await api.updateTest(editingTest.id, {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          examId: formExamId ? formExamId : undefined,
          subjectId: modalType === 'topic' ? formSubjectId : undefined,
          chapterId: modalType === 'topic' ? formTopicId : undefined,
          topicId: modalType === 'topic' ? formTopicId : undefined,
          testSeriesId: formTestSeriesId || undefined,
          durationMinutes: Number(formDuration),
          totalMarks: Number(formTotalMarks),
          passingMarks: Number(formPassingMarks),
          negativeMarking: resolvedNegativeMarking,
          isPremium: formIsPremium,
          testType: mappedTestType,
          year: modalType === 'pyq' ? Number(formYear) : undefined,
          paperName: modalType === 'pyq' ? formPaperName.trim() : undefined,
          shift: modalType === 'pyq' ? formShift.trim() : undefined,
        });

        await api.logAdminActivity({
          action: 'TEST_UPDATE',
          entityType: 'test',
          entityId: editingTest.id,
          entityName: formTitle.trim(),
          details: {
            testType: mappedTestType,
            examId: formExamId,
            duration: Number(formDuration),
          },
          adminUser: currentAdmin,
        });
      } else {
        const created = await api.createTest({
          title: formTitle.trim(),
          slug: formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: formDescription.trim() || undefined,
          examId: formExamId ? formExamId : undefined,
          subjectId: modalType === 'topic' ? formSubjectId : undefined,
          chapterId: modalType === 'topic' ? formTopicId : undefined,
          topicId: modalType === 'topic' ? formTopicId : undefined,
          testSeriesId: formTestSeriesId || undefined,
          durationMinutes: Number(formDuration),
          totalQuestions: 0,
          totalMarks: Number(formTotalMarks),
          passingMarks: Number(formPassingMarks),
          negativeMarking: resolvedNegativeMarking,
          isPremium: formIsPremium,
          testType: mappedTestType,
          year: modalType === 'pyq' ? Number(formYear) : undefined,
          paperName: modalType === 'pyq' ? formPaperName.trim() : undefined,
          shift: modalType === 'pyq' ? formShift.trim() : undefined,
          orderIndex: tests.length + 1,
          isActive: true,
          status: 'draft',
        });
        setNewlyCreatedTest(created);

        await api.logAdminActivity({
          action: 'TEST_CREATE',
          entityType: 'test',
          entityId: created.id,
          entityName: created.title,
          details: {
            testType: mappedTestType,
            examId: created.examId,
            duration: created.durationMinutes,
          },
          adminUser: currentAdmin,
        });
      }

      setIsTestModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save test'));
    } finally {
      setIsSavingTest(false);
    }
  };

  // Subject / Topic creation
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setStructureError('Subject name is required.');
      return;
    }
    try {
      setIsSavingStructure(true);
      setStructureError('');
      const slug = subjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const created = await api.createSubject({
        name: subjectName.trim(),
        slug,
        description: subjectDesc.trim() || undefined,
        iconName: 'BookOpen',
        orderIndex: subjects.length + 1,
        isActive: true,
      });
      setSubjects((prev) => [...prev, created]);
      setSelectedStructureSubjectId(created.id);
      setIsSubjectModalOpen(false);
      setSubjectName('');
      setSubjectDesc('');
    } catch (err) {
      setStructureError(getErrorMessage(err, 'Failed to create subject'));
    } finally {
      setIsSavingStructure(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setStructureError('Topic name is required.');
      return;
    }
    if (!selectedStructureSubjectId) {
      setStructureError('Please select a subject first.');
      return;
    }
    try {
      setIsSavingStructure(true);
      setStructureError('');
      const slug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const created = await api.createChapter({
        subjectId: selectedStructureSubjectId,
        name: topicName.trim(),
        slug,
        description: topicDesc.trim() || undefined,
        orderIndex: chapters.length + 1,
        isActive: true,
      });
      setChapters((prev) => [...prev, created]);
      setIsTopicModalOpen(false);
      setTopicName('');
      setTopicDesc('');
    } catch (err) {
      setStructureError(getErrorMessage(err, 'Failed to create topic'));
    } finally {
      setIsSavingStructure(false);
    }
  };

  // Publish Validation
  const handleOpenPublishModal = async (test: MockTest) => {
    setTestToPublish(test);
    setIsPublishModalOpen(true);
    setValidationResult(null);
    setPublishMessage(null);
    setIsValidating(true);
    try {
      const result = await api.validateTestForPublish(test.id);
      setValidationResult(result);
    } catch (err) {
      setPublishMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to validate test'),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!testToPublish) return;
    try {
      setIsValidating(true);
      await api.publishTest(testToPublish.id);
      setPublishMessage({
        type: 'success',
        text: `Test "${testToPublish.title}" published successfully!`,
      });
      await loadData();
      setTimeout(() => {
        setIsPublishModalOpen(false);
        setTestToPublish(null);
      }, 1200);
    } catch (err) {
      setPublishMessage({ type: 'error', text: getErrorMessage(err, 'Failed to publish test') });
    } finally {
      setIsValidating(false);
    }
  };

  // Archive
  const handleConfirmArchive = async () => {
    if (!testToArchive) return;
    try {
      await api.archiveTest(testToArchive.id);
      setIsArchiveModalOpen(false);
      setTestToArchive(null);
      await loadData();
    } catch (err) {
      console.error('Failed to archive test:', err);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (test: MockTest) => {
    // If activating a test that has 0 questions, prevent activation
    if (!test.isActive && (!test.totalQuestions || test.totalQuestions === 0)) {
      alert(`This test has no questions yet. Add questions before activating "${test.title}".`);
      return;
    }
    try {
      const nextActive = !test.isActive;
      await api.updateTest(test.id, { isActive: nextActive });
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, isActive: nextActive } : t)));
    } catch (err) {
      console.error('Failed to toggle test active status:', err);
    }
  };

  // Delete
  const handleOpenDeleteModal = (test: MockTest) => {
    setTestToDelete(test);
    setDeleteTestError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    try {
      setIsDeletingTest(true);
      setDeleteTestError('');
      await api.deleteTest(testToDelete.id);

      await api.logAdminActivity({
        action: 'TEST_DELETE',
        entityType: 'test',
        entityId: testToDelete.id,
        entityName: testToDelete.title,
        details: {
          examId: testToDelete.examId,
          testType: testToDelete.testType,
          totalQuestions: testToDelete.totalQuestions,
          totalMarks: testToDelete.totalMarks,
        },
        adminUser: currentAdmin,
      });

      setIsDeleteModalOpen(false);
      setTestToDelete(null);
      await loadData();
    } catch (err) {
      setDeleteTestError(getErrorMessage(err, 'Failed to delete test'));
    } finally {
      setIsDeletingTest(false);
    }
  };

  // Filtered lists for each tab
  const topicTests = tests.filter((t) => {
    const isTopic = t.testType === 'topic' || t.testType === 'chapter_mock';
    if (!isTopic) return false;
    if (filterExamId && t.examId && t.examId !== filterExamId) return false;
    if (filterSubjectId && t.subjectId !== filterSubjectId) return false;
    if (filterTopicId && t.chapterId !== filterTopicId && t.topicId !== filterTopicId) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const fullMockTests = tests.filter((t) => {
    if (t.testType !== 'full_mock') return false;
    if (filterExamId && t.examId !== filterExamId) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const pyqTests = tests.filter((t) => {
    if (t.testType !== 'pyq') return false;
    if (filterExamId && t.examId !== filterExamId) return false;
    if (filterYear && String(t.year) !== filterYear) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const structureTopics = chapters.filter((c) => c.subjectId === selectedStructureSubjectId);
  const selectedSubjectObj = subjects.find((s) => s.id === selectedStructureSubjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Mock Test Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage Topic Tests, Full Mocks, PYQs, and centralized Subject-Topic
            structures.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Link
            to="/admin/test-series"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors shadow-2xs"
          >
            <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
            <span>Test Series</span>
          </Link>

          {/* Tab-specific primary action */}
          {activeTab === 'topic' && (
            <button
              type="button"
              onClick={() => handleOpenCreateTest('topic')}
              className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 border border-indigo-400/25 cursor-pointer whitespace-nowrap"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[2.5] text-white" />
              </span>
              <span>Create Topic Test</span>
            </button>
          )}
          {activeTab === 'full_mock' && (
            <button
              type="button"
              onClick={() => handleOpenCreateTest('full_mock')}
              className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 border border-indigo-400/25 cursor-pointer whitespace-nowrap"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[2.5] text-white" />
              </span>
              <span>Create Full Mock Test</span>
            </button>
          )}
          {activeTab === 'pyq' && (
            <button
              type="button"
              onClick={() => handleOpenCreateTest('pyq')}
              className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 border border-indigo-400/25 cursor-pointer whitespace-nowrap"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[2.5] text-white" />
              </span>
              <span>Create PYQ Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Post Test-Creation Banner with Direct Manage Questions Action */}
      {newlyCreatedTest && (
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-blue-500/15 to-indigo-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  ✓ Test Created Successfully
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {newlyCreatedTest.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ready for questions! Click below to add questions from the Question Bank or import
                from a TXT file.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setNewlyCreatedTest(null)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Dismiss
            </button>
            <Link
              to={`/admin/tests/${newlyCreatedTest.id}/questions`}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Add Questions Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 4 Primary Tabs (Section 15) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('topic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'topic'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Topic Tests
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 dark:bg-white/10">
            {tests.filter((t) => t.testType === 'topic' || t.testType === 'chapter_mock').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('full_mock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'full_mock'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Target className="w-4 h-4" />
          Full Mock Tests
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 dark:bg-white/10">
            {tests.filter((t) => t.testType === 'full_mock').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pyq')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pyq'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          PYQ
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 dark:bg-white/10">
            {tests.filter((t) => t.testType === 'pyq').length}
          </span>
        </button>

        <Link
          to="/admin/test-series"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 ml-auto"
        >
          <ListOrdered className="w-4 h-4" />
          <span>Test Series Packages</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* TAB 1: TOPIC TESTS */}
      {activeTab === 'topic' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search topic tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Exams & Universal</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>

            <select
              value={filterSubjectId}
              onChange={(e) => {
                setFilterSubjectId(e.target.value);
                setFilterTopicId('');
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={filterTopicId}
              onChange={(e) => setFilterTopicId(e.target.value)}
              disabled={!filterSubjectId}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white disabled:opacity-50"
            >
              <option value="">All Topics</option>
              {chapters
                .filter((c) => !filterSubjectId || c.subjectId === filterSubjectId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {(searchTerm || filterSubjectId || filterTopicId || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterSubjectId('');
                  setFilterTopicId('');
                  setFilterStatus('all');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ml-auto sm:ml-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Topic Tests Table */}
          <TestTable
            tests={topicTests}
            isLoading={isLoading}
            emptyMessage="No Topic Tests found. Create one using the button above."
            onEdit={handleOpenEditTest}
            onPublish={handleOpenPublishModal}
            onArchive={(t) => {
              setTestToArchive(t);
              setIsArchiveModalOpen(true);
            }}
            onDelete={canDeleteTests ? handleOpenDeleteModal : undefined}
            onToggleActive={handleToggleActive}
            onDuplicate={(t) => handleDuplicateTest(t.id)}
            onAttempts={handleOpenAttempts}
            onExportResults={handleExportResults}
            onExportQuestions={handleExportQuestions}
            onMakeLive={handleOpenMakeLiveModal}
            lockedTestIds={lockedTestIds}
            isExportingQuestions={exportingQuestionsTestId}
            isDuplicating={isDuplicating}
          />
        </div>
      )}

      {/* TAB 2: FULL MOCK TESTS */}
      {activeTab === 'full_mock' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search full mock tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Target Exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {(searchTerm || filterExamId || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterExamId('');
                  setFilterStatus('all');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ml-auto sm:ml-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <TestTable
            tests={fullMockTests}
            isLoading={isLoading}
            emptyMessage="No Full Mock Tests found. Click '+ Create Full Mock Test' to add one."
            onEdit={handleOpenEditTest}
            onPublish={handleOpenPublishModal}
            onArchive={(t) => {
              setTestToArchive(t);
              setIsArchiveModalOpen(true);
            }}
            onDelete={canDeleteTests ? handleOpenDeleteModal : undefined}
            onToggleActive={handleToggleActive}
            onDuplicate={(t) => handleDuplicateTest(t.id)}
            onAttempts={handleOpenAttempts}
            onExportResults={handleExportResults}
            onExportQuestions={handleExportQuestions}
            onMakeLive={handleOpenMakeLiveModal}
            lockedTestIds={lockedTestIds}
            isExportingQuestions={exportingQuestionsTestId}
            isDuplicating={isDuplicating}
          />
        </div>
      )}

      {/* TAB 3: PYQ */}
      {activeTab === 'pyq' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search PYQ papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Year (e.g. 2024)"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {(searchTerm || filterExamId || filterYear || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterExamId('');
                  setFilterYear('');
                  setFilterStatus('all');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ml-auto sm:ml-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <TestTable
            tests={pyqTests}
            isLoading={isLoading}
            emptyMessage="No PYQ tests found. Click '+ Create PYQ Test' to add one."
            onEdit={handleOpenEditTest}
            onPublish={handleOpenPublishModal}
            onArchive={(t) => {
              setTestToArchive(t);
              setIsArchiveModalOpen(true);
            }}
            onDelete={canDeleteTests ? handleOpenDeleteModal : undefined}
            onToggleActive={handleToggleActive}
            onDuplicate={(t) => handleDuplicateTest(t.id)}
            onAttempts={handleOpenAttempts}
            onExportResults={handleExportResults}
            onExportQuestions={handleExportQuestions}
            onMakeLive={handleOpenMakeLiveModal}
            lockedTestIds={lockedTestIds}
            isExportingQuestions={exportingQuestionsTestId}
            isDuplicating={isDuplicating}
          />
        </div>
      )}

      {/* TAB 4: TOPIC STRUCTURE (Section 3A, 15) */}
      {activeTab === 'structure' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Subjects Column */}
          <div className="md:col-span-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Subjects
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Master repository of academic subjects
                </p>
              </div>
              <Button
                onClick={() => {
                  setStructureError('');
                  setSubjectName('');
                  setSubjectDesc('');
                  setIsSubjectModalOpen(true);
                }}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 h-auto flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </Button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedStructureSubjectId;
                const count = chapters.filter((c) => c.subjectId === sub.id).length;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedStructureSubjectId(sub.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-600/50 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {sub.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {count} Topics defined
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 translate-x-1'
                          : 'text-slate-400'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topics Column */}
          <div className="md:col-span-7 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-cyan-500" />
                  Topics under: {selectedSubjectObj?.name || 'Select Subject'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Topics are selected in dropdowns when adding questions or topic tests
                </p>
              </div>
              <Button
                onClick={() => {
                  setStructureError('');
                  setTopicName('');
                  setTopicDesc('');
                  setIsTopicModalOpen(true);
                }}
                disabled={!selectedStructureSubjectId}
                className="text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1.5 h-auto flex items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add Topic
              </Button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {structureTopics.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FolderTree className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500">
                    No topics created under this subject yet.
                  </p>
                  <Button
                    onClick={() => setIsTopicModalOpen(true)}
                    className="mt-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 h-auto py-1 px-3"
                  >
                    + Add First Topic
                  </Button>
                </div>
              ) : (
                structureTopics.map((top) => {
                  const testsCount = tests.filter(
                    (t) => t.chapterId === top.id || t.topicId === top.id
                  ).length;
                  return (
                    <div
                      key={top.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {top.name}
                        </h4>
                        {top.description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {top.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {testsCount} Tests
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TEST MODAL */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                {editingTest
                  ? 'Edit Test'
                  : modalType === 'topic'
                    ? 'Create Topic Test'
                    : modalType === 'full_mock'
                      ? 'Create Full Mock Test'
                      : 'Create PYQ Paper'}
              </h3>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {editingTest && lockedTestIds.has(editingTest.id) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Live Test Active:</span> This test is currently
                  scheduled for an active or upcoming Live Test event. Critical parameters
                  (duration, marks, negative marking) are locked until the Live Test event
                  concludes.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveTest} className="space-y-4">
              {/* TOPIC TEST FLOW: Target Exam (Optional/Universal) + Subject -> Topic */}
              {modalType === 'topic' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Exam (Optional)
                    </label>
                    <select
                      value={formExamId}
                      onChange={(e) => setFormExamId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">All Exams / Universal (Available to all)</option>
                      {exams.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Topic tests are available by default across all exams or can be specifically
                      tagged to one exam.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Subject *
                      </label>
                      <select
                        value={formSubjectId}
                        onChange={(e) => {
                          setFormSubjectId(e.target.value);
                          const firstTop =
                            chapters.find((c) => c.subjectId === e.target.value)?.id || '';
                          setFormTopicId(firstTop);
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
                        value={formTopicId}
                        onChange={(e) => setFormTopicId(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="">Select Topic</option>
                        {chapters
                          .filter((c) => c.subjectId === formSubjectId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* FULL MOCK / PYQ FLOW: Target Exam */}
              {modalType !== 'topic' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Exam *
                  </label>
                  <select
                    value={formExamId}
                    onChange={(e) => setFormExamId(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Select Exam</option>
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* PYQ SPECIFIC: Year & Paper / Shift */}
              {modalType === 'pyq' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Exam Year *
                    </label>
                    <input
                      type="number"
                      value={formYear}
                      onChange={(e) => setFormYear(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Paper Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Preliminary"
                      value={formPaperName}
                      onChange={(e) => setFormPaperName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Shift / Session
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shift 1"
                      value={formShift}
                      onChange={(e) => setFormShift(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Assign to Test Series (Optional for Full Mock, Topic, and PYQ tests) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Assign to Test Series (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Full Mock, Topic, or PYQ
                  </span>
                </label>
                <select
                  value={formTestSeriesId}
                  onChange={(e) => setFormTestSeriesId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">None (Independent / Standalone Test)</option>
                  {testSeriesList
                    .filter((s) => !formExamId || s.examId === formExamId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} (
                        {s.examTitle || exams.find((e) => e.id === s.examId)?.title || 'Series'})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Attaches this test to a curated Test Series category (Full Mock, Topic Test, or
                  PYQ).
                </p>
              </div>

              {/* Test Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  placeholder={
                    modalType === 'topic'
                      ? 'e.g. Blood Practice Test 01'
                      : modalType === 'full_mock'
                        ? 'e.g. WBP Constable Full Mock Test 01'
                        : 'e.g. 2024 Preliminary Official Paper'
                  }
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional brief test description or guidelines..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Duration & Marks */}
              <div
                className={
                  modalType === 'topic' ? 'grid grid-cols-3 gap-2.5' : 'grid grid-cols-4 gap-2.5'
                }
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    min={1}
                    disabled={Boolean(editingTest && lockedTestIds.has(editingTest.id))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(Number(e.target.value))}
                    disabled={Boolean(editingTest && lockedTestIds.has(editingTest.id))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Pass Marks
                  </label>
                  <input
                    type="number"
                    value={formPassingMarks}
                    onChange={(e) => setFormPassingMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Negative Marks per Wrong Answer
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    value={formNegativeMarking}
                    disabled={
                      !formNegativeEnabled ||
                      Boolean(editingTest && lockedTestIds.has(editingTest.id))
                    }
                    onChange={(e) => setFormNegativeMarking(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  Negative marking
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="negativeMarkingMode"
                      checked={!formNegativeEnabled}
                      onChange={() => setFormNegativeEnabled(false)}
                      disabled={Boolean(editingTest && lockedTestIds.has(editingTest.id))}
                    />
                    No Negative Marking
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="negativeMarkingMode"
                      checked={formNegativeEnabled}
                      onChange={() => setFormNegativeEnabled(true)}
                      disabled={Boolean(editingTest && lockedTestIds.has(editingTest.id))}
                    />
                    Enable Negative Marking
                  </label>
                </div>
                {formNegativeEnabled && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    This deduction is applied by the shared result engine for this test.
                  </p>
                )}
              </div>

              {/* Premium toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsPremium"
                  checked={formIsPremium}
                  onChange={(e) => setFormIsPremium(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="formIsPremium"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  Premium Test (Requires Active Pro Pass)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTestModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingTest}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {isSavingTest ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUBJECT MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Add Academic Subject
            </h3>

            {structureError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                {structureError}
              </p>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Biology, History, Mathematics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional description..."
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingStructure}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {isSavingStructure ? 'Creating...' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TOPIC MODAL */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-500" />
              Add Topic under {selectedSubjectObj?.name}
            </h3>

            {structureError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                {structureError}
              </p>
            )}

            <form onSubmit={handleCreateTopic} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blood, Cell Structure, Ancient India"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional topic scope or chapter summary..."
                  value={topicDesc}
                  onChange={(e) => setTopicDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingStructure}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  {isSavingStructure ? 'Creating...' : 'Create Topic'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH VALIDATION MODAL */}
      {isPublishModalOpen && testToPublish && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Publish Test: {testToPublish.title}
              </h3>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isValidating && (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                Validating questions and marks...
              </p>
            )}

            {publishMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  publishMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                }`}
              >
                {publishMessage.text}
              </div>
            )}

            {validationResult && (
              <div className="space-y-3">
                {validationResult.isValid ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> All checks passed!
                    </p>
                    <p className="text-[11px] opacity-90">
                      This test has valid questions, correct options, and marks matching
                      specifications. Ready to publish.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Validation Warnings (
                      {validationResult.errors.length})
                    </p>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90">
                      {validationResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsPublishModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPublish}
                disabled={isValidating || !validationResult?.isValid}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Confirm & Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {isArchiveModalOpen && testToArchive && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-500" /> Archive Test?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to archive <strong>"{testToArchive.title}"</strong>? It will no
              longer be visible to students, but existing student results and attempts remain
              completely preserved.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmArchive}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                Archive
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && testToDelete && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900/50 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" /> Delete Test?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete <strong>"{testToDelete.title}"</strong>?
              This action cannot be undone and will delete all associated test questions and
              records.
            </p>
            {deleteTestError && (
              <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                {deleteTestError}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeletingTest}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {isDeletingTest ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Attempts & Leaderboard Modal */}
      {viewingAttemptsTest && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Student Attempts: {viewingAttemptsTest.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total Attempts: {attemptsList.length} • Max Marks:{' '}
                    {viewingAttemptsTest.totalMarks}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingAttemptsTest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingAttempts ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <div className="w-7 h-7 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading candidate attempts...
                </div>
              ) : attemptsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No students have attempted this test yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5">Rank</th>
                        <th className="px-3 py-2.5">Student</th>
                        <th className="px-3 py-2.5">Score</th>
                        <th className="px-3 py-2.5">Accuracy</th>
                        <th className="px-3 py-2.5">Time Taken</th>
                        <th className="px-3 py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attemptsList.map((att, idx) => (
                        <tr
                          key={att.id || idx}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                        >
                          <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-300">
                            #{idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {att.userName || 'Student Candidate'}
                            </div>
                            {att.userEmail && (
                              <div className="text-[10px] text-slate-400">{att.userEmail}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-black text-indigo-600 dark:text-indigo-400">
                              {att.score}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {' '}
                              / {att.totalMarks || viewingAttemptsTest.totalMarks}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                              {att.accuracy != null ? `${Math.round(att.accuracy)}%` : 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {att.timeSpentSeconds != null
                              ? `${Math.floor(att.timeSpentSeconds / 60)}m ${att.timeSpentSeconds % 60}s`
                              : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-400">
                            {att.createdAt ? new Date(att.createdAt).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                disabled={isExportingResults || attemptsList.length === 0}
                onClick={() => handleExportResults(viewingAttemptsTest)}
                className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <Download className="w-3.5 h-3.5" />
                {isExportingResults ? 'Exporting...' : 'Export Rank Sheet (CSV)'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingAttemptsTest(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAKE LIVE MODAL (Thin Event Layer on existing Test) */}
      {makeLiveTest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Make Live Test
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Schedule this test as a live exam event
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMakeLiveTest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Summary Card (Read-only, inherited) */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/80">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                Selected Mock Test
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                {makeLiveTest.title}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                <span>⏱️ {makeLiveTest.durationMinutes} mins</span>
                <span>📝 {makeLiveTest.totalQuestions} questions</span>
                <span>🏆 {makeLiveTest.totalMarks} marks</span>
              </div>
            </div>

            {makeLiveError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{makeLiveError}</span>
              </div>
            )}

            {makeLiveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Live Test scheduled successfully! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleScheduleLiveTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={liveStartDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLiveStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={liveStartTime}
                    onChange={(e) => setLiveStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="time"
                  value={liveRegDeadlineTime}
                  onChange={(e) => setLiveRegDeadlineTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Students can register until this time on the start date.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Statewide Ranking
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Enable leaderboard rank for participants
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveRankingEnabled(!liveRankingEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      liveRankingEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        liveRankingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Pro / Subscription Required
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Require active membership to participate
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLiveSubscriptionRequired(!liveSubscriptionRequired)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      liveSubscriptionRequired ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        liveSubscriptionRequired ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMakeLiveTest(null)}
                  disabled={isSchedulingLive}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSchedulingLive || makeLiveSuccess}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{isSchedulingLive ? 'Scheduling...' : 'Make Live'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Test Table Component
interface TestTableProps {
  tests: MockTest[];
  isLoading: boolean;
  emptyMessage: string;
  onEdit: (test: MockTest) => void;
  onPublish: (test: MockTest) => void;
  onArchive: (test: MockTest) => void;
  onDelete?: (test: MockTest) => void;
  onToggleActive: (test: MockTest) => void;
  onDuplicate?: (test: MockTest) => void;
  onAttempts?: (test: MockTest) => void;
  onExportResults?: (test: MockTest) => void;
  onExportQuestions?: (test: MockTest) => void;
  onMakeLive?: (test: MockTest) => void;
  lockedTestIds?: Set<string>;
  isDuplicating?: string | null;
  isExportingQuestions?: string | null;
}

const TestTable: React.FC<TestTableProps> = ({
  tests,
  isLoading,
  emptyMessage,
  onEdit,
  onPublish,
  onArchive,
  onDelete,
  onToggleActive,
  onDuplicate,
  onAttempts,
  onExportResults,
  onExportQuestions,
  onMakeLive,
  lockedTestIds,
  isDuplicating,
  isExportingQuestions,
}) => {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">Loading test records...</p>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-100 dark:border-indigo-900/50">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          No Tests Found
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50/90 dark:bg-slate-900/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Test Title</th>
              <th className="px-5 py-3.5">Category / Assignment</th>
              <th className="px-5 py-3.5">Duration & Marks</th>
              <th className="px-5 py-3.5">Questions</th>
              <th className="px-5 py-3.5">Status & State</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {tests.map((test) => {
              const status = test.status || 'draft';
              const isActive = test.isActive !== false;
              const questionsCount = test.totalQuestions || 0;
              const hasNoQuestions = questionsCount === 0;

              return (
                <tr
                  key={test.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group"
                >
                  {/* Column 1: Test Title */}
                  <td className="px-5 py-4 font-bold text-slate-900 dark:text-white max-w-[280px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        {test.isPremium && (
                          <span title="Premium Mock Test" className="inline-flex items-center">
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          </span>
                        )}
                        <Link
                          to={`/admin/tests/${test.id}/questions`}
                          title="Click to view and manage questions"
                          className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {test.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">
                          ID: {test.id.slice(0, 8)}
                        </span>
                        {test.negativeMarking ? (
                          <span className="text-rose-500 font-medium">
                            -{test.negativeMarking} Neg
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Category / Assignment */}
                  <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                    {test.testType === 'topic' || test.testType === 'chapter_mock' ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{test.subjectName || 'Subject'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 truncate">
                          ↳ {test.chapterName || 'All Topics'}
                        </div>
                      </div>
                    ) : test.testType === 'pyq' ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                          <ScrollText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{test.examTitle || 'Exam'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 truncate">
                          {test.year ? `${test.year} PYQ` : 'PYQ'}{' '}
                          {test.paperName ? `• ${test.paperName}` : ''}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <Target className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{test.examTitle || 'Full Mock Exam'}</span>
                      </div>
                    )}
                    {test.testSeriesTitle && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/60 w-fit">
                        <Layers className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[180px]">{test.testSeriesTitle}</span>
                      </div>
                    )}
                  </td>

                  {/* Column 3: Duration & Marks */}
                  <td className="px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{test.durationMinutes}m</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {test.totalMarks} Marks
                      </span>
                    </div>
                  </td>

                  {/* Column 4: Questions Count & Status Badge */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Link
                      to={`/admin/tests/${test.id}/questions`}
                      title={
                        hasNoQuestions
                          ? 'No questions added yet - Click to add questions!'
                          : 'Click to view and manage questions'
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                        hasNoQuestions
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                          : 'bg-slate-100/90 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300'
                      }`}
                    >
                      {hasNoQuestions ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>0 Questions</span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1 rounded bg-amber-200/70 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                            Empty
                          </span>
                        </>
                      ) : (
                        <>
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{questionsCount} Questions</span>
                        </>
                      )}
                    </Link>
                  </td>

                  {/* Column 5: Status & State */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          status === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                            : status === 'draft'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {status === 'published' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {status}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        />
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                      {lockedTestIds?.has(test.id) && (
                        <span
                          title="Active or Upcoming Live Test Event Scheduled"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                        >
                          <Radio className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
                          Live Event
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 6: Actions - Clear Hierarchy & Self-Explanatory Buttons */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* Make Live Action (Thin Event Layer) */}
                      {onMakeLive && (
                        <button
                          type="button"
                          onClick={() => onMakeLive(test)}
                          disabled={lockedTestIds?.has(test.id)}
                          title={
                            lockedTestIds?.has(test.id)
                              ? 'This test is currently scheduled as an active Live Test'
                              : 'Schedule this test as a Live Test event'
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 ${
                            lockedTestIds?.has(test.id)
                              ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                              : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 active:scale-95'
                          }`}
                        >
                          <Radio
                            className={`w-3.5 h-3.5 ${lockedTestIds?.has(test.id) ? 'text-slate-400' : 'text-rose-600 dark:text-rose-400 animate-pulse'}`}
                          />
                          <span>
                            {lockedTestIds?.has(test.id) ? 'Live Scheduled' : 'Make Live'}
                          </span>
                        </button>
                      )}

                      {/* Primary Question Management Action: Add / Manage Questions */}
                      <Link
                        to={`/admin/tests/${test.id}/questions`}
                        title={
                          hasNoQuestions
                            ? 'Add questions to this test from Question Bank or upload'
                            : 'Manage questions, scoring, and upload files'
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 group ${
                          hasNoQuestions
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 hover:shadow-md'
                            : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80'
                        }`}
                      >
                        {hasNoQuestions ? (
                          <>
                            <PlusCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span>Add Questions</span>
                          </>
                        ) : (
                          <>
                            <ListPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span>Manage Questions</span>
                          </>
                        )}
                      </Link>

                      {/* Secondary Action Toolbar */}
                      <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                        {/* Edit Details */}
                        <button
                          onClick={() => onEdit(test)}
                          title="Edit Test Details & Settings"
                          aria-label="Edit Details"
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* View Student Attempts */}
                        {onAttempts && (
                          <button
                            onClick={() => onAttempts(test)}
                            title="View Student Attempts & Leaderboard"
                            aria-label="View Student Attempts"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Export Student Results / Rank Sheet (CSV) */}
                        {onExportResults && (
                          <button
                            onClick={() => onExportResults(test)}
                            title="Export Student Results / Rank Sheet (CSV)"
                            aria-label="Export Results (CSV)"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Export Test Questions (CSV) */}
                        {onExportQuestions && (
                          <button
                            onClick={() => onExportQuestions(test)}
                            disabled={isExportingQuestions === test.id}
                            title="Export Test Questions (CSV)"
                            aria-label="Export Questions (CSV)"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            {isExportingQuestions === test.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Duplicate Test */}
                        {onDuplicate && (
                          <button
                            onClick={() => onDuplicate(test)}
                            disabled={isDuplicating === test.id}
                            title="Duplicate Test"
                            aria-label="Duplicate Test"
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                          >
                            {isDuplicating === test.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Toggle Active / Disabled */}
                        <button
                          onClick={() => onToggleActive(test)}
                          title={
                            isActive
                              ? 'Deactivate Test (Hide from students)'
                              : 'Activate Test (Make available to students)'
                          }
                          aria-label={isActive ? 'Deactivate Test' : 'Activate Test'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'text-emerald-600 hover:bg-white dark:hover:bg-slate-800'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Validate & Publish (if draft) */}
                        {status === 'draft' && (
                          <button
                            onClick={() => onPublish(test)}
                            title="Validate & Publish Test"
                            aria-label="Validate and Publish"
                            className="p-1.5 rounded-lg text-amber-600 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Archive (if not archived) */}
                        {status !== 'archived' && (
                          <button
                            onClick={() => onArchive(test)}
                            title="Archive Test"
                            aria-label="Archive Test"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {onDelete && (
                          <>
                            <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                            {/* Delete Test (Super Admin only) */}
                            <button
                              onClick={() => onDelete(test)}
                              title="Delete Test Permanently (Super Admin Only)"
                              aria-label="Delete Test"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
