import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
  CheckCircle2,
  Search,
  FileQuestion,
  Layers,
  X,
  Wand2,
  Shuffle,
  CheckSquare,
  Upload,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FolderTree,
  Award,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  Target,
  Sparkles,
  Check,
  Radio,
} from 'lucide-react';
import type { MockTest, Question, TestQuestionAssignment, Subject, Chapter, Exam } from '@/types';
import { parseQuestionsTxt, SAMPLE_TXT_CONTENT } from '@/utils/txtQuestionParser';
import { resolveTestNegativeMarking } from '@/utils/negativeMarking';
import { getErrorMessage } from '@/lib/errors';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { isMathematicsQuestion, isMathematicsSubject } from '@/utils/shortNotes';
import { MathText } from '@/components/common/MathText';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';

export const AdminTestQuestions: React.FC = () => {
  const { testId: routeTestId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { isBilingualEnabled } = useContentLanguage();

  // ---------------------------------------------------------------------------
  // Data States
  // ---------------------------------------------------------------------------
  const [allTests, setAllTests] = useState<MockTest[]>([]);
  const [currentTestId, setCurrentTestId] = useState<string>(routeTestId || '');
  const [test, setTest] = useState<MockTest | null>(null);
  const [assignedQuestions, setAssignedQuestions] = useState<TestQuestionAssignment[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'assigned' (Questions currently in test) vs 'select' (Question Bank selector)
  const [activeTab, setActiveTab] = useState<'assigned' | 'select'>('assigned');

  // Save / Action Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  // ---------------------------------------------------------------------------
  // Question Selection States (Manage Questions Flow)
  // ---------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [countPreset, setCountPreset] = useState<number | 'custom'>(20);
  const [customCount, setCustomCount] = useState<number>(20);
  const [rangeFrom, setRangeFrom] = useState<number>(1);
  const [rangeTo, setRangeTo] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // ---------------------------------------------------------------------------
  // Bulk TXT Modal State
  // ---------------------------------------------------------------------------
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // ---------------------------------------------------------------------------
  // Direct Single Question Create Modal State
  // ---------------------------------------------------------------------------
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionBengali, setNewQuestionBengali] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectOption, setNewCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newExplanation, setNewExplanation] = useState('');
  const [newMarks, setNewMarks] = useState(1.0);
  // NOTE: questions never carry negative marks (test-level policy), so there
  // is intentionally no per-question negative-marks field anywhere here.

  // Sync route param with state
  useEffect(() => {
    if (routeTestId && routeTestId !== currentTestId) {
      setCurrentTestId(routeTestId);
    }
  }, [routeTestId, currentTestId]);

  // Load tests list
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const tests = await api.getAllAdminTests();
        setAllTests(tests);
        if (!routeTestId && tests.length > 0) {
          setCurrentTestId(tests[0].id);
        }
      } catch (err) {
        console.error('Error loading tests list:', err);
      }
    };
    fetchTests();
  }, [routeTestId]);

  const [isTestLocked, setIsTestLocked] = useState(false);

  // Load test details, assigned questions, question bank, and taxonomy
  const loadData = useCallback(async () => {
    if (!currentTestId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [testData, assigned, bank, allSubjects, allChapters, allExams, locked] =
        await Promise.all([
          api.getTestById(currentTestId),
          api.getTestAssignedQuestions(currentTestId),
          api.getAllAdminQuestions(),
          api.getAllAdminSubjects(),
          api.getAllAdminChapters(),
          api.getAllAdminExams(),
          api.isTestLockedForEditing(currentTestId).catch(() => false),
        ]);

      setTest(testData);
      setAssignedQuestions(assigned);
      setBankQuestions(bank);
      setSubjects(allSubjects);
      setChapters(allChapters);
      setExams(allExams);
      setIsTestLocked(Boolean(locked));

      // If the test has 0 questions (freshly created), default directly to question selection
      if (assigned.length === 0) {
        setActiveTab('select');
      }
    } catch (err) {
      console.error('Error loading test questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentTestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectTest = (id: string) => {
    setCurrentTestId(id);
    navigate(`/admin/tests/${id}/questions`);
  };

  // ---------------------------------------------------------------------------
  // Context-Aware Metadata Detection
  // ---------------------------------------------------------------------------
  const testSubject = useMemo(() => {
    if (!test?.subjectId) return null;
    return subjects.find((s) => s.id === test.subjectId) || null;
  }, [test, subjects]);

  const testChapter = useMemo(() => {
    const chapterId = test?.chapterId || test?.topicId;
    if (!chapterId) return null;
    return chapters.find((c) => c.id === chapterId) || null;
  }, [test, chapters]);

  const testExam = useMemo(() => {
    if (!test?.examId) return null;
    return exams.find((e) => e.id === test.examId) || null;
  }, [test, exams]);

  // Only show tests created in this same Topic (or same Exam for Full Mock/PYQ)
  const availableSwitchTests = useMemo(() => {
    if (!test) return allTests;

    if (test.testType === 'topic' || test.testType === 'chapter_mock') {
      const targetTopicId = test.chapterId || test.topicId;
      const targetTopicName = (test.chapterName || test.topicName || testChapter?.name || '')
        .trim()
        .toLowerCase();

      const matching = allTests.filter((t) => {
        const isTopic =
          t.testType === 'topic' ||
          t.testType === 'chapter_mock' ||
          (!t.testType && (t.chapterId || t.topicId));
        if (!isTopic) return false;

        if (targetTopicId && (t.chapterId === targetTopicId || t.topicId === targetTopicId)) {
          return true;
        }
        if (targetTopicName) {
          const tName = (t.chapterName || t.topicName || '').trim().toLowerCase();
          if (tName && tName === targetTopicName) return true;
        }
        return false;
      });

      if (matching.length > 0) return matching;
      return [test];
    } else if (test.testType === 'full_mock' || test.testType === 'pyq') {
      if (test.examId) {
        const matching = allTests.filter(
          (t) =>
            t.testType === test.testType &&
            (t.examId === test.examId || t.associatedExamIds?.includes(test.examId!))
        );
        if (matching.length > 0) return matching;
      }
      return [test];
    }

    return allTests.filter((t) => t.id === test.id);
  }, [test, allTests, testChapter]);

  // Set of already assigned Question IDs for this test
  const assignedQuestionIds = useMemo(() => {
    return new Set(assignedQuestions.map((q) => q.questionId));
  }, [assignedQuestions]);

  // ---------------------------------------------------------------------------
  // Context-Bound Eligible Question Bank Questions
  // ---------------------------------------------------------------------------
  const eligibleBankQuestions = useMemo(() => {
    if (!test) return [];

    return bankQuestions.filter((q) => {
      // 1. Context Matching
      if (test.testType === 'topic' || test.testType === 'chapter_mock') {
        const targetTopicId = test.chapterId || test.topicId;
        if (targetTopicId) {
          const matchTopic = q.chapterId === targetTopicId || q.topicId === targetTopicId;
          if (!matchTopic) return false;
        } else if (test.subjectId) {
          if (q.subjectId !== test.subjectId) return false;
        }
      } else if (test.testType === 'pyq') {
        if (test.year && q.sourceYear && q.sourceYear !== test.year) {
          return false;
        }
        if (test.examId && q.sourceExam && test.examTitle) {
          if (!q.sourceExam.toLowerCase().includes(test.examTitle.toLowerCase())) {
            return false;
          }
        }
      } else if (test.testType === 'full_mock') {
        if (test.examId && q.sourceExam && test.examTitle) {
          const isExamMatch = q.sourceExam.toLowerCase().includes(test.examTitle.toLowerCase());
          if (!isExamMatch && q.subjectId && testSubject?.id && q.subjectId !== testSubject.id) {
            return false;
          }
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim();
        const eng = q.questionText.toLowerCase().includes(term);
        const ben = q.questionBengaliText && q.questionBengaliText.toLowerCase().includes(term);
        if (!eng && !ben) return false;
      }

      return true;
    });
  }, [test, bankQuestions, searchQuery, testSubject]);

  // Unassigned eligible questions in this context
  const unassignedEligibleQuestions = useMemo(() => {
    return eligibleBankQuestions.filter((q) => !assignedQuestionIds.has(q.id));
  }, [eligibleBankQuestions, assignedQuestionIds]);

  // Paginated questions for the UI view
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return eligibleBankQuestions.slice(start, start + pageSize);
  }, [eligibleBankQuestions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(eligibleBankQuestions.length / pageSize));

  // Keep currentPage within bounds when eligible questions change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ---------------------------------------------------------------------------
  // Multi-Select & Random Selection Handlers
  // ---------------------------------------------------------------------------
  const handleToggleSelectQuestion = (id: string) => {
    if (assignedQuestionIds.has(id)) return; // Prevent selecting already added questions
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const unassignedIds = unassignedEligibleQuestions.map((q) => q.id);
    setSelectedQuestionIds(unassignedIds);
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const handleSelectRandom = () => {
    const targetCount = countPreset === 'custom' ? customCount : countPreset;
    if (targetCount <= 0) return;

    // Pull from all eligible questions that are NOT already in the test
    const pool = [...unassignedEligibleQuestions];
    if (pool.length === 0) return;

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const pickedIds = pool.slice(0, targetCount).map((q) => q.id);
    setSelectedQuestionIds(pickedIds);
  };

  // Computed batch segments for range selection (fixed 10-by-10 batches: 1-10, 11-20, 21-30, 31-40...)
  const quickRangeBatches = useMemo(() => {
    const total = eligibleBankQuestions.length;
    if (total === 0) return [];
    const step = 10; // Fixed 10 questions per batch (1-10, 11-20, 21-30...)
    const batches: { from: number; to: number; label: string }[] = [];
    for (let i = 1; i <= total; i += step) {
      const to = Math.min(i + step - 1, total);
      batches.push({ from: i, to, label: `${i} - ${to}` });
    }
    return batches;
  }, [eligibleBankQuestions.length]);

  const handleSelectRange = (fromNum?: number, toNum?: number) => {
    const total = eligibleBankQuestions.length;
    if (total === 0) return;

    const rawFrom = fromNum !== undefined ? fromNum : rangeFrom;
    const rawTo = toNum !== undefined ? toNum : rangeTo;

    const from = Math.max(1, Math.min(rawFrom, rawTo));
    const to = Math.min(total, Math.max(rawFrom, rawTo));

    setRangeFrom(from);
    setRangeTo(to);

    // Slice from index (from - 1) to (to)
    const targetSlice = eligibleBankQuestions.slice(from - 1, to);
    const unassignedSlice = targetSlice.filter((q) => !assignedQuestionIds.has(q.id));

    if (unassignedSlice.length === 0) {
      return;
    }

    const unassignedIds = unassignedSlice.map((q) => q.id);
    setSelectedQuestionIds(unassignedIds);

    // Jump pagination to the page of the first selected item
    const targetPage = Math.ceil(from / pageSize);
    if (targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
    }
  };

  // ---------------------------------------------------------------------------
  // Add Selected Questions to Test
  // ---------------------------------------------------------------------------
  const handleAddSelectedQuestions = async () => {
    if (selectedQuestionIds.length === 0 || !test) return;

    const questionsToAdd = bankQuestions.filter((q) => selectedQuestionIds.includes(q.id));
    const defMarks =
      test.totalMarks && test.totalQuestions
        ? Number((test.totalMarks / test.totalQuestions).toFixed(2))
        : 1.0;
    const defNeg = resolveTestNegativeMarking(test.testType, test.negativeMarking);

    const newAssignments: TestQuestionAssignment[] = questionsToAdd.map((q, idx) => ({
      questionId: q.id,
      questionOrder: assignedQuestions.length + idx + 1,
      marks: q.defaultMarks || defMarks,
      // Negative marking always follows the test-level scheme (never per-question).
      negativeMarks: defNeg,
      questionText: q.questionText,
      questionBengaliText: q.questionBengaliText,
      correctOption: q.correctOption,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      explanation: q.explanation,
      explanationBengali: q.explanationBengali,
      difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    }));

    const updated = [...assignedQuestions, ...newAssignments];
    setAssignedQuestions(updated);
    setSelectedQuestionIds([]);

    try {
      setIsSaving(true);
      setSaveError('');
      const payload = updated.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        // Negative marking always follows the test-level scheme (never per-question).
        negativeMarks: resolveTestNegativeMarking(test.testType, test.negativeMarking),
      }));

      const res = await api.saveTestQuestions(test.id, payload);
      if (res.success) {
        setSaveSuccess(true);
        setSaveMessage(
          `Successfully attached ${questionsToAdd.length} questions to ${test.title}!`
        );
        setTimeout(() => setSaveSuccess(false), 4000);
        const updatedTest = await api.getTestById(test.id);
        if (updatedTest) setTest(updatedTest);
        setActiveTab('assigned'); // Switch to view the updated questions list
      } else {
        setSaveError(res.error || 'Failed to attach questions to test.');
      }
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Failed to save test questions'));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Manage Assigned Questions (Reorder, Marks, Remove)
  // ---------------------------------------------------------------------------
  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= assignedQuestions.length) return;
    const updated = [...assignedQuestions];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    const reordered = updated.map((q, idx) => ({ ...q, questionOrder: idx + 1 }));
    setAssignedQuestions(reordered);
    setSaveSuccess(false);
  };

  const handleRemoveQuestion = async (index: number) => {
    if (!test) return;
    const updated = assignedQuestions.filter((_, idx) => idx !== index);
    const reordered = updated.map((q, idx) => ({ ...q, questionOrder: idx + 1 }));

    try {
      setIsSaving(true);
      const payload = reordered.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        // Negative marking always follows the test-level scheme (never per-question).
        negativeMarks: resolveTestNegativeMarking(test.testType, test.negativeMarking),
      }));

      const saved = await api.saveTestQuestions(test.id, payload);
      if (!saved.success) throw new Error(saved.error || 'Assignment save failed.');
      setAssignedQuestions(reordered);
      const updatedTest = await api.getTestById(test.id);
      if (updatedTest) setTest(updatedTest);

      setSaveSuccess(true);
      setSaveMessage('Question removed from test. It remains safe in Question Bank.');
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Failed to update test questions'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuestionMarks = (index: number, marks: number) => {
    const updated = [...assignedQuestions];
    updated[index] = {
      ...updated[index],
      marks,
      // Negative marking always follows the test-level scheme (never per-question).
      negativeMarks: resolveTestNegativeMarking(test?.testType, test?.negativeMarking),
    };
    setAssignedQuestions(updated);
    setSaveSuccess(false);
  };

  const handleApplyDefaultsToAll = () => {
    const defMarks =
      test?.totalMarks && test?.totalQuestions
        ? Number((test.totalMarks / test.totalQuestions).toFixed(2))
        : 1.0;
    const defNeg = resolveTestNegativeMarking(test?.testType, test?.negativeMarking);
    setAssignedQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        marks: defMarks,
        negativeMarks: defNeg,
      }))
    );
    setSaveSuccess(false);
  };

  // Sectional Marking States & Logic
  const assignedSections = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    assignedQuestions.forEach((q) => {
      const sId = q.subjectId || 'general';
      const sName =
        q.subjectName || subjects.find((s) => s.id === q.subjectId)?.name || 'General Section';
      if (!map.has(sId)) {
        map.set(sId, { id: sId, name: sName, count: 1 });
      } else {
        map.get(sId)!.count++;
      }
    });
    return Array.from(map.values());
  }, [assignedQuestions, subjects]);

  const [sectionalSubjectId, setSectionalSubjectId] = useState<string>('');
  const [sectionalMarks, setSectionalMarks] = useState<number>(1);
  const [isSectionalOpen, setIsSectionalOpen] = useState(false);

  // Set default sectional subject when assignedSections updates
  useEffect(() => {
    if (assignedSections.length > 0 && !sectionalSubjectId) {
      setSectionalSubjectId(assignedSections[0].id);
    }
  }, [assignedSections, sectionalSubjectId]);

  const handleApplySectionalMarks = () => {
    if (!sectionalSubjectId) {
      alert('Please select a section / subject.');
      return;
    }
    setAssignedQuestions((prev) =>
      prev.map((q) => {
        const qSubId = q.subjectId || 'general';
        if (sectionalSubjectId === 'all' || qSubId === sectionalSubjectId) {
          return {
            ...q,
            marks: Number(sectionalMarks),
            // Negative marking always follows the test-level scheme (never per-question).
            negativeMarks: resolveTestNegativeMarking(test?.testType, test?.negativeMarking),
          };
        }
        return q;
      })
    );
    setSaveSuccess(true);
    setSaveMessage(`Applied ${sectionalMarks} Marks to selected section questions.`);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveAssigned = async () => {
    if (!currentTestId) return;
    try {
      setIsSaving(true);
      setSaveError('');
      const payload = assignedQuestions.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        // Negative marking always follows the test-level scheme (never per-question).
        negativeMarks: resolveTestNegativeMarking(test?.testType, test?.negativeMarking),
      }));

      const res = await api.saveTestQuestions(currentTestId, payload);
      if (res.success) {
        setSaveSuccess(true);
        setSaveMessage('Test questions order and scoring saved successfully!');
        setTimeout(() => setSaveSuccess(false), 4000);
        const updatedTest = await api.getTestById(currentTestId);
        if (updatedTest) setTest(updatedTest);
      } else {
        setSaveError(res.error || 'Failed to save test questions');
      }
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Error saving questions'));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Bulk TXT Upload Workflow
  // ---------------------------------------------------------------------------
  const parsedBulkResult = useMemo(() => {
    if (!bulkRawText.trim()) return null;
    // Subject context enforces Short Notes rules for non-Mathematics tests.
    return parseQuestionsTxt(bulkRawText, { subjectId: test?.subjectId });
  }, [bulkRawText, test?.subjectId]);

  const handleImportBulk = async () => {
    if (!test || !parsedBulkResult || parsedBulkResult.valid.length === 0) return;

    try {
      setIsImportingBulk(true);
      setBulkError('');
      setBulkSuccessMsg('');

      let successCount = 0;
      for (const q of parsedBulkResult.valid) {
        const res = await api.createQuestionForTest(test.id, {
          subjectId: test.subjectId,
          chapterId: test.chapterId || test.topicId,
          topicId: test.chapterId || test.topicId,
          questionText: q.questionText,
          questionBengaliText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          explanation: q.explanation,
          // Mirror notes into both columns so Short Notes display keeps working.
          explanationBengali: q.explanation,
          difficulty: 'medium',
          defaultMarks: 1.0,
          // Questions never carry negative marks — scoring uses the test-level scheme.
          defaultNegativeMarks: 0,
          isActive: true,
          status: 'active',
        });
        if (res.success) successCount++;
      }

      setBulkSuccessMsg(
        `Successfully imported and attached ${successCount} questions to ${test.title}!`
      );
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkRawText('');
        setBulkSuccessMsg('');
      }, 1500);

      await loadData();
    } catch (err) {
      setBulkError(getErrorMessage(err, 'Bulk import failed'));
    } finally {
      setIsImportingBulk(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Direct Question Creation
  // ---------------------------------------------------------------------------
  const handleCreateQuestion = async () => {
    if (!currentTestId || !test) return;
    if (!newQuestionText.trim()) {
      setCreateError('Question text is required.');
      return;
    }
    if (!newOptionA.trim() || !newOptionB.trim() || !newOptionC.trim() || !newOptionD.trim()) {
      setCreateError('All four options (A, B, C, D) are required.');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError('');
      const effectiveQuestionBengali = !isBilingualEnabled
        ? newQuestionText.trim()
        : newQuestionBengali.trim() || newQuestionText.trim();

      const res = await api.createQuestionForTest(currentTestId, {
        subjectId: test.subjectId,
        chapterId: test.chapterId || test.topicId,
        topicId: test.chapterId || test.topicId,
        questionText: newQuestionText.trim(),
        questionBengaliText: effectiveQuestionBengali,
        optionA: newOptionA.trim(),
        optionB: newOptionB.trim(),
        optionC: newOptionC.trim(),
        optionD: newOptionD.trim(),
        correctOption: newCorrectOption,
        explanation: newExplanation.trim() || undefined,
        explanationBengali: newExplanation.trim() || undefined,
        difficulty: 'medium',
        defaultMarks: newMarks,
        // Questions never carry negative marks — scoring uses the test-level scheme.
        defaultNegativeMarks: 0,
        isActive: true,
        status: 'active',
      });

      if (!res.success) {
        setCreateError(res.error || 'Failed to create question.');
        return;
      }

      setIsCreateModalOpen(false);
      await loadData();
      setSaveSuccess(true);
      setSaveMessage('Question created and attached to test!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Error while creating question'));
    } finally {
      setIsCreating(false);
    }
  };

  const totalAssignedMarks = assignedQuestions.reduce((acc, q) => acc + (q.marks || 0), 0);

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-400 space-y-4">
        <div className="w-10 h-10 border-3 border-[#0075FF] border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-[#0075FF]/20" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800 dark:text-white">Loading Test Workspace</p>
          <p className="text-xs text-slate-500">
            Preparing contextual questions & scoring engine...
          </p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] rounded-3xl my-12 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-[#0075FF]/15 text-[#0075FF] flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Select a Mock Test</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose a test from the database to manage its question associations.
        </p>
        <select
          value={currentTestId}
          onChange={(e) => handleSelectTest(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#172852] text-xs text-slate-900 dark:text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0075FF] font-medium"
        >
          <option value="">-- Choose a Mock Test --</option>
          {allTests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.totalQuestions || 0} Qs)
            </option>
          ))}
        </select>
        <div className="pt-2">
          <Link to="/admin/tests" className="text-xs font-bold text-[#0075FF] hover:underline">
            ← Return to Mock Tests List
          </Link>
        </div>
      </div>
    );
  }

  const targetQuestionCount = test.totalQuestions || 0;
  const currentRandomTarget = countPreset === 'custom' ? customCount : countPreset;
  const completionPercentage =
    targetQuestionCount > 0
      ? Math.min(100, Math.round((assignedQuestions.length / targetQuestionCount) * 100))
      : 100;
  const isTargetAchieved =
    targetQuestionCount > 0 && assignedQuestions.length >= targetQuestionCount;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & CONTEXT COMMAND CENTER (Subject -> Topic -> Test)      */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#060c1d] via-[#09142f] to-[#0c1b3f] border border-[#1b2b57] p-6 sm:p-8 shadow-2xl admin-dark-card text-white">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0075FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 max-w-4xl">
            {/* Navigation & Switch Test Pill */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/admin/tests"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 hover:text-white font-semibold transition-all border border-white/10 shadow-xs"
                style={{ color: '#e2e8f0' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Mock Tests
              </Link>

              {availableSwitchTests.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#091124]/90 border border-[#1d3163] shadow-xs">
                  <span
                    className="text-[10px] uppercase font-black text-sky-400 tracking-wider flex items-center gap-1"
                    style={{ color: '#38bdf8' }}
                  >
                    <Shuffle className="w-3 h-3" />
                    Switch Test:
                  </span>
                  <select
                    value={currentTestId}
                    onChange={(e) => handleSelectTest(e.target.value)}
                    style={{
                      backgroundColor: '#091124',
                      color: '#ffffff',
                      borderColor: 'transparent',
                    }}
                    className="text-xs font-bold rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0075FF] max-w-[280px] truncate cursor-pointer"
                  >
                    {availableSwitchTests.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        style={{ backgroundColor: '#091124', color: '#ffffff' }}
                      >
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Test Hierarchy & Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Specific Context Hierarchy Badge */}
                {(test.testType === 'topic' || test.testType === 'chapter_mock') && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#0075FF]/20 text-[#38bdf8] border border-[#0075FF]/40 shadow-xs">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-sky-300" />
                      {testSubject?.name || test.subjectName || 'Subject'}
                    </span>
                    <span className="text-slate-500 font-normal">→</span>
                    <span
                      className="flex items-center gap-1 text-white"
                      style={{ color: '#ffffff' }}
                    >
                      <FolderTree className="w-3.5 h-3.5 text-[#0075FF]" />
                      {testChapter?.name || test.chapterName || test.topicName || 'Topic'}
                    </span>
                  </div>
                )}
                {test.testType === 'full_mock' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {testExam?.title || test.examTitle || 'Full Mock Exam'} • Full Mock Test
                    </span>
                  </div>
                )}
                {test.testType === 'pyq' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {testExam?.title || test.examTitle || 'Exam'} • PYQ (
                      {test.year || 'Previous Year'} {test.shift || ''})
                    </span>
                  </div>
                )}

                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800/90 text-slate-300 border border-slate-700"
                  style={{ color: '#cbd5e1' }}
                >
                  {test.testType.replace('_', ' ')}
                </span>
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug"
                style={{ color: '#ffffff' }}
              >
                {test.title}
              </h1>

              {/* Sub-meta specs bar */}
              <div
                className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5"
                style={{ color: '#cbd5e1' }}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Duration:</span>
                  <strong className="text-white font-mono" style={{ color: '#ffffff' }}>
                    {test.durationMinutes}m
                  </strong>
                </div>
                <span className="text-slate-600 dark:text-slate-500">•</span>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Marks:</span>
                  <strong className="text-white font-mono" style={{ color: '#ffffff' }}>
                    {test.totalMarks}
                  </strong>
                  <span className="text-slate-400">
                    (Assigned:{' '}
                    <strong className="text-emerald-400 font-mono" style={{ color: '#34d399' }}>
                      {totalAssignedMarks}
                    </strong>
                    )
                  </span>
                </div>
                <span className="text-slate-600 dark:text-slate-500">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-bold">Negative:</span>
                  <strong className="text-white font-mono" style={{ color: '#ffffff' }}>
                    {test.negativeMarking > 0 ? `-${test.negativeMarking}` : 'None'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Test Readiness Live Progress Bar */}
            {targetQuestionCount > 0 && (
              <div className="pt-2 max-w-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span
                    className="text-slate-300 flex items-center gap-1.5"
                    style={{ color: '#cbd5e1' }}
                  >
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    Test Readiness: {assignedQuestions.length} of {targetQuestionCount} Questions
                  </span>
                  <span
                    className={`font-mono text-xs font-black ${
                      isTargetAchieved ? 'text-emerald-400' : 'text-sky-300'
                    }`}
                    style={{ color: isTargetAchieved ? '#34d399' : '#7dd3fc' }}
                  >
                    {completionPercentage}%{' '}
                    {isTargetAchieved
                      ? '• Ready'
                      : `• (${targetQuestionCount - assignedQuestions.length} needed)`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800/80 border border-slate-700/60 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTargetAchieved
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                        : 'bg-gradient-to-r from-[#0075FF] via-sky-400 to-indigo-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={isTestLocked}
              className="border-slate-700 text-xs font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#091124', color: '#ffffff', borderColor: '#1d3163' }}
              leftIcon={<Upload className="w-3.5 h-3.5 text-sky-400" />}
              onClick={() => {
                if (isTestLocked) return;
                setIsBulkModalOpen(true);
              }}
              title={
                isTestLocked
                  ? 'Questions locked for active Live Test'
                  : 'Bulk import questions from TXT file directly into this test'
              }
            >
              + Bulk Add (TXT)
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isTestLocked}
              className="border-slate-700 text-xs font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#091124', color: '#ffffff', borderColor: '#1d3163' }}
              leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-400" />}
              onClick={() => {
                if (isTestLocked) return;
                setNewQuestionText('');
                setNewOptionA('');
                setNewOptionB('');
                setNewOptionC('');
                setNewOptionD('');
                setNewExplanation('');
                setCreateError('');
                setIsCreateModalOpen(true);
              }}
              title={
                isTestLocked
                  ? 'Questions locked for active Live Test'
                  : 'Create new question for this test'
              }
            >
              + Create Question
            </Button>

            {activeTab === 'assigned' && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-bold shadow-lg shadow-[#0075FF]/30 hover:scale-[1.02] transition-transform"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveAssigned}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Order & Marks'}
              </Button>
            )}
          </div>
        </div>

        {/* 3 Core Metric KPI Counters */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-slate-800/80"
          style={{ borderColor: '#1b2c58' }}
        >
          {/* KPI 1 */}
          <div className="p-4 rounded-2xl bg-[#081229]/90 border border-[#172852] flex items-center justify-between shadow-sm hover:border-[#0075FF]/40 transition-colors">
            <div className="space-y-0.5">
              <p
                className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                style={{ color: '#94a3b8' }}
              >
                Available in Topic / Bank
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-2xl sm:text-3xl font-black text-white"
                  style={{ color: '#ffffff' }}
                >
                  {eligibleBankQuestions.length}
                </span>
                <span className="text-xs font-semibold text-sky-400" style={{ color: '#38bdf8' }}>
                  ({unassignedEligibleQuestions.length} unassigned)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#0075FF]/15 text-[#38bdf8] flex items-center justify-center border border-[#0075FF]/30 shrink-0 shadow-inner">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-4 rounded-2xl bg-[#081229]/90 border border-[#172852] flex items-center justify-between shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="space-y-0.5">
              <p
                className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                style={{ color: '#94a3b8' }}
              >
                Already in Test
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-2xl sm:text-3xl font-black text-emerald-400"
                  style={{ color: '#34d399' }}
                >
                  {assignedQuestions.length}
                </span>
                {targetQuestionCount > 0 && (
                  <span
                    className="text-xs font-semibold text-slate-400"
                    style={{ color: '#94a3b8' }}
                  >
                    / {targetQuestionCount} Target
                  </span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-4 rounded-2xl bg-[#081229]/90 border border-[#172852] flex items-center justify-between shadow-sm hover:border-sky-500/40 transition-colors">
            <div className="space-y-0.5">
              <p
                className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                style={{ color: '#94a3b8' }}
              >
                Selected to Add
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-2xl sm:text-3xl font-black text-[#38bdf8]"
                  style={{ color: '#38bdf8' }}
                >
                  {selectedQuestionIds.length}
                </span>
                <span className="text-xs font-semibold text-slate-400" style={{ color: '#94a3b8' }}>
                  ready to attach
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0 shadow-inner">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Save / Error Alert Banners */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMessage || 'Test questions saved successfully!'}</span>
        </div>
      )}
      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Live Test Active Lock Banner */}
      {isTestLocked && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-black text-sm">🔒 Locked: Active Live Test Event</div>
              <div className="text-xs text-rose-700 dark:text-rose-300">
                This test is currently scheduled as an active or upcoming Live Test event. Adding,
                deleting, or reordering questions is locked to preserve exam integrity for live
                participants.
              </div>
            </div>
          </div>
          <Link
            to="/admin/live-tests"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors w-fit"
          >
            View in Live Tests
          </Link>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. TAB CONTROLS: QUESTION SELECTOR vs TEST QUESTIONS                  */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#0a1226] p-1.5 rounded-2xl border border-slate-200 dark:border-[#152347] w-fit">
          <button
            onClick={() => setActiveTab('select')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'select'
                ? 'bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white shadow-md shadow-[#0075FF]/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>+ Add Questions from Topic / Bank</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'select'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-[#152347] text-slate-700 dark:text-slate-300'
              }`}
            >
              {eligibleBankQuestions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white shadow-md shadow-[#0075FF]/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Questions in Test</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'assigned'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-[#152347] text-slate-700 dark:text-slate-300'
              }`}
            >
              {assignedQuestions.length}
            </span>
          </button>
        </div>

        {activeTab === 'assigned' && assignedQuestions.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className={`text-xs font-bold transition-all ${
                isSectionalOpen
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
              }`}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />}
              onClick={() => setIsSectionalOpen((v) => !v)}
              title="Bulk assign marks by subject/section"
            >
              Sectional Marking
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[#0075FF]"
              leftIcon={<Wand2 className="w-3.5 h-3.5 text-amber-500" />}
              onClick={handleApplyDefaultsToAll}
              title="Auto-fill uniform standard scoring across all questions in this test"
            >
              Auto Standard Marks
            </Button>
          </div>
        )}
      </div>

      {/* Sectional Marking Toolbar Panel */}
      {isSectionalOpen && activeTab === 'assigned' && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 shadow-sm animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Bulk Sectional Marking
              </h4>
            </div>
            <button
              onClick={() => setIsSectionalOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Select a subject/section to assign customized marks to all its questions at once.
            Negative marking (if any) always follows the test-level scheme.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Target Section
              </label>
              <select
                value={sectionalSubjectId}
                onChange={(e) => setSectionalSubjectId(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="all">All Sections ({assignedQuestions.length} Qs)</option>
                {assignedSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.count} Qs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Marks per Q
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={sectionalMarks}
                onChange={(e) => setSectionalMarks(parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>

            <div className="self-end">
              <Button
                size="sm"
                onClick={handleApplySectionalMarks}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs"
              >
                Apply to Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. TAB CONTENT A: QUESTION SELECTOR (PRIMARY ENHANCED WORKFLOW)       */}
      {/* ===================================================================== */}
      {activeTab === 'select' && (
        <div className="space-y-4">
          {/* Question Selector Controls Toolbar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] shadow-xl space-y-4">
            {/* Search + Range Selection Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search within topic questions */}
              <div className="relative w-full lg:max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search questions in ${testSubject?.name || 'this topic'}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0075FF] focus:ring-2 focus:ring-[#0075FF]/20 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Range Selection Controls (From - To) */}
              <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 dark:bg-[#070d1d] p-1.5 rounded-2xl border border-slate-200 dark:border-[#172852]">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-[#0075FF] dark:text-[#38bdf8] flex items-center gap-1.5 px-2 py-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Select Range:
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-1">
                    From:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={eligibleBankQuestions.length || 100}
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-2 py-1 rounded-xl bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-black text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    To:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={eligibleBankQuestions.length || 100}
                    value={rangeTo}
                    onChange={(e) => setRangeTo(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-2 py-1 rounded-xl bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-black text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    placeholder="10"
                  />
                </div>

                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md shadow-[#0075FF]/25 border border-[#0075FF]/40"
                  onClick={() => handleSelectRange(rangeFrom, rangeTo)}
                  disabled={eligibleBankQuestions.length === 0}
                  title={`Select questions from #${rangeFrom} to #${rangeTo}`}
                >
                  Select Range ({rangeFrom} - {rangeTo})
                </Button>
              </div>
            </div>

            {/* Quick Range Batches Chips (e.g. 1-10, 11-20, 21-30, 31-40...) */}
            {quickRangeBatches.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-[#152347]">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Layers className="w-3 h-3 text-[#0075FF]" />
                  Quick Batches:
                </span>
                {quickRangeBatches.map((batch) => {
                  const isCurrentRange = rangeFrom === batch.from && rangeTo === batch.to;
                  return (
                    <button
                      key={batch.label}
                      type="button"
                      onClick={() => {
                        setRangeFrom(batch.from);
                        setRangeTo(batch.to);
                        handleSelectRange(batch.from, batch.to);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isCurrentRange
                          ? 'bg-[#0075FF] text-white shadow-md shadow-[#0075FF]/30 scale-105'
                          : 'bg-slate-100 dark:bg-[#070d1d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132042] border border-slate-200/80 dark:border-[#192b57]'
                      }`}
                      title={`Click to select questions #${batch.from} to #${batch.to}`}
                    >
                      {batch.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Actions Row: Random Picker, Select All, Clear */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#152347]">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Random Selection Control */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#070d1d] p-1 rounded-xl border border-slate-200 dark:border-[#192b57]">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1.5 flex items-center gap-1">
                    <Shuffle className="w-3 h-3 text-indigo-400" />
                    Random:
                  </span>
                  <select
                    value={countPreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCountPreset(val === 'custom' ? 'custom' : parseInt(val));
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  >
                    <option value={5}>5 Qs</option>
                    <option value={10}>10 Qs</option>
                    <option value={15}>15 Qs</option>
                    <option value={20}>20 Qs</option>
                    <option value={25}>25 Qs</option>
                    <option value={30}>30 Qs</option>
                    <option value="custom">Custom</option>
                  </select>

                  {countPreset === 'custom' && (
                    <input
                      type="number"
                      min={1}
                      max={unassignedEligibleQuestions.length || 100}
                      value={customCount}
                      onChange={(e) => setCustomCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-[#0a1226] border border-slate-300 dark:border-[#192b57] text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    />
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-white hover:bg-[#0075FF] px-2.5 py-1"
                    leftIcon={<Shuffle className="w-3.5 h-3.5" />}
                    onClick={handleSelectRandom}
                    disabled={unassignedEligibleQuestions.length === 0}
                    title={`Randomly pick ${currentRandomTarget} unassigned questions`}
                  >
                    Pick
                  </Button>
                </div>

                <button
                  onClick={handleSelectAll}
                  disabled={unassignedEligibleQuestions.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#070d1d] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#132042] text-xs font-bold transition-colors disabled:opacity-50 border border-slate-200 dark:border-[#192b57]"
                >
                  Select All Unassigned ({unassignedEligibleQuestions.length})
                </button>

                {selectedQuestionIds.length > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition-colors border border-rose-200 dark:border-rose-900/50"
                  >
                    Clear ({selectedQuestionIds.length})
                  </button>
                )}
              </div>

              {/* Status summary */}
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Showing{' '}
                <strong className="text-slate-900 dark:text-white">
                  {eligibleBankQuestions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                  {Math.min(eligibleBankQuestions.length, currentPage * pageSize)}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-900 dark:text-white">
                  {eligibleBankQuestions.length}
                </strong>{' '}
                questions
              </div>
            </div>
          </div>

          {/* Questions List (Paginated with Individual Checkboxes & Already-Added Badges) */}
          <div className="space-y-3">
            {eligibleBankQuestions.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] space-y-3 shadow-md">
                <FileQuestion className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No Questions Found for this Topic / Context
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  There are no questions in Question Bank tagged under &quot;
                  {testSubject?.name || 'this test'}&quot; matching your filter.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white text-xs font-bold"
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => setIsBulkModalOpen(true)}
                  >
                    Bulk Add via TXT
                  </Button>
                </div>
              </div>
            ) : (
              paginatedQuestions.map((q, idx) => {
                const isAlreadyInTest = assignedQuestionIds.has(q.id);
                const isSelected = selectedQuestionIds.includes(q.id);
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      if (!isAlreadyInTest) handleToggleSelectQuestion(q.id);
                    }}
                    className={`p-5 rounded-2xl border transition-all duration-150 select-none ${
                      isAlreadyInTest
                        ? 'bg-slate-50/70 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] opacity-75 cursor-default'
                        : isSelected
                          ? 'bg-blue-50/90 dark:bg-[#0c1f44] border-2 border-[#0075FF] shadow-lg shadow-[#0075FF]/10 ring-2 ring-[#0075FF]/20 cursor-pointer'
                          : 'bg-white dark:bg-[#0a1226] border-slate-200 dark:border-[#152347] hover:border-[#0075FF]/50 cursor-pointer shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox Indicator */}
                      <div className="pt-0.5 shrink-0">
                        {isAlreadyInTest ? (
                          <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : isSelected ? (
                          <div className="w-5 h-5 rounded-lg bg-[#0075FF] text-white flex items-center justify-center shadow-xs shadow-[#0075FF]/40">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-[#0075FF] transition-colors" />
                        )}
                      </div>

                      {/* Question Text & Badges */}
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#070d1d] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#152347]">
                            #{globalIndex}
                          </span>

                          {isAlreadyInTest ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Already in Test
                            </span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#0075FF]/15 text-[#0075FF] dark:text-[#38bdf8] border border-[#0075FF]/30">
                              <CheckSquare className="w-3 h-3" />
                              Selected
                            </span>
                          ) : null}

                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Marks: {q.defaultMarks || 1.0}
                          </span>
                        </div>

                        {/* English Question */}
                        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                          <MathText>{q.questionText}</MathText>
                        </p>

                        {/* Bengali Question (if provided) */}
                        {q.questionBengaliText && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                            <MathText>{q.questionBengaliText}</MathText>
                          </p>
                        )}

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'A'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              A
                            </span>
                            <span>
                              <MathText>{q.optionA}</MathText>
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'B'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              B
                            </span>
                            <span>
                              <MathText>{q.optionB}</MathText>
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'C'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              C
                            </span>
                            <span>
                              <MathText>{q.optionC}</MathText>
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              q.correctOption === 'D'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                              D
                            </span>
                            <span>
                              <MathText>{q.optionD}</MathText>
                            </span>
                          </div>
                        </div>

                        {/* Short Notes (non-Math) / Explanation (Math) */}
                        {(q.explanationBengali || q.explanation) && (
                          <div className="pt-2">
                            <ShortNotesBox
                              explanation={q.explanationBengali || q.explanation}
                              isMathematics={isMathematicsQuestion(q)}
                              defaultExpanded={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {eligibleBankQuestions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] text-xs font-semibold shadow-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-1">
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
                          ? 'bg-[#0075FF] text-white shadow-2xs'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Action Dock when questions are selected */}
          {selectedQuestionIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#070d1d]/95 backdrop-blur-md border border-[#0075FF]/60 shadow-2xl shadow-[#0075FF]/30 flex items-center gap-4 text-white admin-dark-card animate-slide-up">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0075FF] to-[#0052E0] flex items-center justify-center font-black text-xs shadow-md shadow-[#0075FF]/40">
                  {selectedQuestionIds.length}
                </div>
                <div>
                  <h4
                    className="text-xs font-black text-white leading-tight"
                    style={{ color: '#ffffff' }}
                  >
                    {selectedQuestionIds.length} Questions Selected
                  </h4>
                  <p className="text-[10px] text-slate-400" style={{ color: '#94a3b8' }}>
                    Ready to attach to {test.title}
                  </p>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-700" />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 hover:text-white transition-colors"
                  style={{ color: '#cbd5e1' }}
                >
                  Clear
                </button>

                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-black shadow-lg shadow-[#0075FF]/40 border border-[#0075FF]/60 px-4 py-1.5 rounded-full hover:scale-105 transition-transform"
                  onClick={handleAddSelectedQuestions}
                  disabled={isSaving}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  {isSaving ? 'Attaching...' : `Add Selected (${selectedQuestionIds.length})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. TAB CONTENT B: ASSIGNED QUESTIONS IN TEST (ORDERING & REMOVAL)     */}
      {/* ===================================================================== */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {assignedQuestions.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] space-y-4 shadow-md">
              <FileQuestion className="w-14 h-14 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Questions Added to this Test Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  This test currently has 0 questions. Open the Question Selector or use Bulk TXT to
                  attach questions before students can take it.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] text-white text-xs font-bold shadow-md shadow-[#0075FF]/30"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setActiveTab('select')}
                >
                  Select from Topic Questions ({eligibleBankQuestions.length} Available)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-300 dark:border-slate-700 text-xs font-bold"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  Bulk Add via TXT
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedQuestions.map((q, idx) => (
                <div
                  key={q.questionId}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:border-[#0075FF]/50 shadow-xs hover:shadow-md"
                >
                  {/* Order Index & Position Steppers */}
                  <div className="flex items-center md:flex-col gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={1}
                      max={assignedQuestions.length}
                      value={idx + 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= assignedQuestions.length) {
                          moveQuestion(idx, val - 1);
                        }
                      }}
                      className="w-10 h-8 rounded-xl bg-[#0075FF]/10 border border-[#0075FF]/30 text-[#0075FF] dark:text-[#38bdf8] font-mono font-black text-xs text-center focus:outline-none focus:border-[#0075FF] shadow-xs"
                      title="Type position number to reorder"
                    />
                    <div className="flex md:flex-col gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveQuestion(idx, idx - 1)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#070d1d] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors border border-slate-200 dark:border-[#192b57]"
                        title="Move Question Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === assignedQuestions.length - 1}
                        onClick={() => moveQuestion(idx, idx + 1)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#070d1d] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors border border-slate-200 dark:border-[#192b57]"
                        title="Move Question Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Details */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-black text-slate-400 font-mono">Q#{idx + 1}</span>
                      {q.correctOption && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Correct: Option ({q.correctOption.toUpperCase()})
                        </span>
                      )}
                      {q.subjectName && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {q.subjectName}
                        </span>
                      )}
                    </div>

                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      <MathText>{q.questionText}</MathText>
                    </p>

                    {q.questionBengaliText && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        <MathText>{q.questionBengaliText}</MathText>
                      </p>
                    )}

                    {/* Options List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'A'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          A
                        </span>
                        <span>
                          <MathText>{q.optionA}</MathText>
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'B'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          B
                        </span>
                        <span>
                          <MathText>{q.optionB}</MathText>
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'C'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          C
                        </span>
                        <span>
                          <MathText>{q.optionC}</MathText>
                        </span>
                      </div>
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          q.correctOption === 'D'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-[#070d1d]/60 border-slate-200 dark:border-[#152347] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-[#152347] text-[10px] font-black flex items-center justify-center shrink-0">
                          D
                        </span>
                        <span>
                          <MathText>{q.optionD}</MathText>
                        </span>
                      </div>
                    </div>

                    {/* Short Notes (non-Math) / Explanation (Math) */}
                    {(q.explanationBengali || q.explanation) && (
                      <div className="pt-2">
                        <ShortNotesBox
                          explanation={q.explanationBengali || q.explanation}
                          isMathematics={isMathematicsQuestion(q)}
                          defaultExpanded={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Question Marks Scoring & Safe Remove Button */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-[#152347] pt-2 md:pt-0 md:pl-4">
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] uppercase font-black text-slate-400 block">
                        Marks
                      </label>
                      <div className="flex items-center gap-1.5 justify-end">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={q.marks}
                          onChange={(e) =>
                            updateQuestionMarks(idx, parseFloat(e.target.value) || 0)
                          }
                          className="w-14 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-xs font-black text-center text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                        />
                      </div>
                    </div>

                    {/* Safe Remove Question Button */}
                    <button
                      onClick={() => handleRemoveQuestion(idx)}
                      className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
                      title="Remove question from this mock test (it will remain safe in Question Bank)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Bottom Test Summary Card */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#0a1226] border border-slate-200 dark:border-[#152347] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Total Test Summary
                  </h4>
                  <p className="text-xs text-slate-500">
                    {assignedQuestions.length} Questions Assigned • Total Sum:{' '}
                    <strong className="text-emerald-500 font-mono">
                      {totalAssignedMarks} Marks
                    </strong>{' '}
                    (Target: {test.totalMarks} Marks)
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-bold shadow-md shadow-[#0075FF]/30"
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveAssigned}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MODAL: BULK ADD QUESTIONS VIA TXT                                  */}
      {/* ===================================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#172852] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#152347]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0075FF] to-[#0052E0] text-white flex items-center justify-center shadow-md shadow-[#0075FF]/30 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Bulk Add Questions via TXT
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target Test:{' '}
                    <strong className="text-slate-800 dark:text-white">{test.title}</strong>
                    {testChapter && ` • Topic: ${testChapter.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-500 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}
            {bulkSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            {/* TXT Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Paste TXT Question Data
                </label>
                <button
                  type="button"
                  onClick={() => setBulkRawText(SAMPLE_TXT_CONTENT)}
                  className="text-[11px] font-bold text-[#0075FF] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Sample Format
                </button>
              </div>

              <textarea
                rows={10}
                value={bulkRawText}
                onChange={(e) => setBulkRawText(e.target.value)}
                placeholder="1. ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?&#10;(a) ড. রাজেন্দ্র প্রসাদ&#10;(b) জওহরলাল নেহরু&#10;(c) সর্বপল্লী রাধাকৃষ্ণন&#10;(d) ড. বি. আর. আম্বেদকর&#10;&#10;সঠিক উত্তর: (a) ড. রাজেন্দ্র প্রসাদ"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF] leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Math/equations: wrap LaTeX in <code>$...$</code>, for example{' '}
                <code>{'($^{14}\\text{C}$)'}</code>. Use <code>$$...$$</code> for a centered
                equation.
              </p>
            </div>

            {/* Parse Validation Summary */}
            {parsedBulkResult && (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#070d1d] border border-slate-200 dark:border-[#172852] flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">
                  Detected:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {parsedBulkResult.totalDetected}
                  </strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Valid: {parsedBulkResult.valid.length}
                </span>
                <span className="text-rose-500">Errors: {parsedBulkResult.errors.length}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-[#152347]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkModalOpen(false)}
                className="border-slate-300 dark:border-slate-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleImportBulk}
                disabled={
                  isImportingBulk || !parsedBulkResult || parsedBulkResult.valid.length === 0
                }
                className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-bold shadow-md shadow-[#0075FF]/30 disabled:opacity-50"
              >
                {isImportingBulk
                  ? 'Importing...'
                  : `Import & Attach ${parsedBulkResult?.valid.length || 0} Questions`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. MODAL: CREATE SINGLE QUESTION DIRECTLY                             */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/35 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#172852] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#152347]">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Create Question for {test.title}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-bold">
                {createError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              {!isBilingualEnabled ? (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Question Text (বাংলা প্রশ্ন) *
                  </label>
                  <textarea
                    rows={3}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                    placeholder="সম্পূর্ণ প্রশ্নটি বাংলা ভাষায় লিখুন..."
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Question Text (English) *
                    </label>
                    <textarea
                      rows={2}
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                      placeholder="Enter question text in English"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Question Text (Bengali)
                    </label>
                    <textarea
                      rows={2}
                      value={newQuestionBengali}
                      onChange={(e) => setNewQuestionBengali(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                      placeholder="বাংলায় প্রশ্ন লিখুন (ঐচ্ছিক)"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option A *
                  </label>
                  <input
                    type="text"
                    value={newOptionA}
                    onChange={(e) => setNewOptionA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option B *
                  </label>
                  <input
                    type="text"
                    value={newOptionB}
                    onChange={(e) => setNewOptionB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option C *
                  </label>
                  <input
                    type="text"
                    value={newOptionC}
                    onChange={(e) => setNewOptionC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Option D *
                  </label>
                  <input
                    type="text"
                    value={newOptionD}
                    onChange={(e) => setNewOptionD(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Correct Answer *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNewCorrectOption(opt)}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        newCorrectOption === opt
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#070d1d] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ({opt.toLowerCase()})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                    {isMathematicsSubject(test?.subjectId, {
                      chapterName: test?.title,
                      title: test?.title,
                    })
                      ? 'Explanation / গাণিতিক সমাধান'
                      : 'Short Notes (শর্ট নোটস) - Bengali Bullet Points'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isMathematicsSubject(test?.subjectId, {
                      chapterName: test?.title,
                      title: test?.title,
                    })
                      ? 'Steps & Formula'
                      : '4–5 bullets starting with •'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF] font-normal text-xs leading-relaxed"
                  placeholder={
                    isMathematicsSubject(test?.subjectId, {
                      chapterName: test?.title,
                      title: test?.title,
                    })
                      ? 'Step-by-step mathematical explanation, formulas, and working...'
                      : '• পয়েন্ট ১...\n• পয়েন্ট ২...\n• পয়েন্ট ৩...\n• পয়েন্ট ৪...\n• পয়েন্ট ৫...'
                  }
                />
                {!isMathematicsSubject(test?.subjectId, {
                  chapterName: test?.title,
                  title: test?.title,
                }) && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    প্রতিটি বুলেট নতুন লাইনে '• ' দিয়ে শুরু করুন (৪–৫টি তথ্যবহুল পয়েন্ট)। কোনো
                    "সঠিক উত্তর" বা অপশন ঘোষণা লিখবেন না।
                  </p>
                )}
              </div>

              <div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newMarks}
                    onChange={(e) => setNewMarks(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1d] border border-slate-200 dark:border-[#192b57] text-slate-900 dark:text-white focus:outline-none focus:border-[#0075FF]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#152347]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-slate-300 dark:border-slate-700 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreateQuestion}
                disabled={isCreating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create & Attach to Test'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
