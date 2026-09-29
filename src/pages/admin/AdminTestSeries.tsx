import { getErrorMessage } from '@/lib/errors';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  ListOrdered,
  Plus,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  Filter,
  X,
  FileText,
  AlertTriangle,
  Award,
  BookOpen,
  History,
  Clock,
  Layers,
  AlertCircle,
  FolderPlus,
  HelpCircle,
  Upload,
} from 'lucide-react';
import type { TestSeries, Exam, MockTest } from '@/types';
import { PRESET_SERIES_ICONS } from '@/components/testSeries/UploadSeriesIconModal';

export type SeriesCategoryType = 'all' | 'full_mock' | 'topic' | 'pyq';

export function getTestCategory(test: MockTest): 'full_mock' | 'topic' | 'pyq' {
  if (test.testType === 'full_mock') return 'full_mock';
  if (test.testType === 'pyq') return 'pyq';
  return 'topic';
}

export const AdminTestSeries: React.FC = () => {
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<TestSeries | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [examId, setExamId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [orderIndex, setOrderIndex] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [formError, setFormError] = useState('');

  // Manage Tests State
  const [manageSeriesTests, setManageSeriesTests] = useState<TestSeries | null>(null);
  const [seriesTests, setSeriesTests] = useState<MockTest[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [isManagingTests, setIsManagingTests] = useState(false);
  const [isLoadingSeriesTests, setIsLoadingSeriesTests] = useState(false);
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<SeriesCategoryType>('all');
  const [availableCategoryFilter, setAvailableCategoryFilter] = useState<SeriesCategoryType>('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allExams, allSeries] = await Promise.all([
        api.getAllAdminExams(),
        api.getTestSeries(selectedExamId || undefined),
      ]);
      setExams(allExams);
      setSeriesList(allSeries);
    } catch (err) {
      console.error('Error loading test series:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingSeries(null);
    setExamId(selectedExamId || exams[0]?.id || '');
    setTitle('');
    setSlug('');
    setDescription('');
    setIconUrl('');
    setIsPremium(false);
    setOrderIndex(seriesList.length + 1);
    setIsActive(true);
    setIsFeatured(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (series: TestSeries) => {
    setEditingSeries(series);
    setExamId(series.examId);
    setTitle(series.title);
    setSlug(series.slug);
    setDescription(series.description || '');
    setIconUrl(series.iconUrl || '');
    setIsPremium(series.isPremium);
    setOrderIndex(series.orderIndex);
    setIsActive(series.isActive);
    setIsFeatured(Boolean(series.isFeatured));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingSeries) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Test Series title is required.');
      return;
    }
    if (!examId) {
      setFormError('Target Exam must be selected.');
      return;
    }

    try {
      if (editingSeries) {
        await api.updateTestSeries(editingSeries.id, {
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined,
          isPremium,
          orderIndex: Number(orderIndex),
          isActive,
          isFeatured,
        });
      } else {
        await api.createTestSeries({
          examId,
          title: title.trim(),
          slug:
            slug.trim() ||
            title
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
          description: description.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined,
          isPremium,
          orderIndex: Number(orderIndex),
          isActive,
          isFeatured,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save test series'));
    }
  };

  const handleToggleActive = async (series: TestSeries) => {
    try {
      await api.updateTestSeries(series.id, { isActive: !series.isActive });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!seriesToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      await api.deleteTestSeries(seriesToDelete.id);
      setSeriesToDelete(null);
      await loadData();
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete test series'));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const openManageTests = async (series: TestSeries) => {
    setManageSeriesTests(series);
    setIsManagingTests(true);
    setIsLoadingSeriesTests(true);
    setTestSearchTerm('');
    setActiveCategoryTab('all');
    setAvailableCategoryFilter('all');
    setNotice(null);
    try {
      const [sTests, allTests] = await Promise.all([
        api.getSeriesTests(series.id),
        api.getAllAdminTests({ examId: series.examId }),
      ]);
      setSeriesTests(sTests);
      setAvailableTests(allTests.filter((t) => !t.testSeriesId || t.testSeriesId !== series.id));
    } catch (err) {
      console.error('Failed to load series tests', err);
      setNotice({ message: 'Failed to load series tests', type: 'error' });
    } finally {
      setIsLoadingSeriesTests(false);
    }
  };

  const handleAssignTest = async (testId: string) => {
    if (!manageSeriesTests) return;
    try {
      setAssigningId(testId);
      await api.assignTestToSeries(testId, manageSeriesTests.id);
      const t = availableTests.find((x) => x.id === testId);
      if (t) {
        const assignedTest: MockTest = {
          ...t,
          testSeriesId: manageSeriesTests.id,
          testSeriesTitle: manageSeriesTests.title,
        };
        setAvailableTests((prev) => prev.filter((x) => x.id !== testId));
        setSeriesTests((prev) => [...prev, assignedTest]);

        const cat = getTestCategory(t);
        setSeriesList((prev) =>
          prev.map((s) => {
            if (s.id !== manageSeriesTests.id) return s;
            const full = (s.fullMockCount || 0) + (cat === 'full_mock' ? 1 : 0);
            const topic = (s.topicTestCount || 0) + (cat === 'topic' ? 1 : 0);
            const pyq = (s.pyqTestCount || 0) + (cat === 'pyq' ? 1 : 0);
            const total = (s.testCount || 0) + 1;
            return {
              ...s,
              testCount: total,
              testsCount: total,
              fullMockCount: full,
              topicTestCount: topic,
              pyqTestCount: pyq,
            };
          })
        );
        setNotice({
          message: `Added "${t.title}" to ${manageSeriesTests.title}`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to assign test', err);
      setNotice({ message: getErrorMessage(err, 'Failed to assign test'), type: 'error' });
    } finally {
      setAssigningId(null);
    }
  };

  const handleUnassignTest = async (testId: string) => {
    if (!manageSeriesTests) return;
    try {
      setUnassigningId(testId);
      await api.assignTestToSeries(testId, null);
      const t = seriesTests.find((x) => x.id === testId);
      if (t) {
        setSeriesTests((prev) => prev.filter((x) => x.id !== testId));
        setAvailableTests((prev) => [...prev, { ...t, testSeriesId: undefined, testSeriesTitle: undefined }]);

        const cat = getTestCategory(t);
        setSeriesList((prev) =>
          prev.map((s) => {
            if (s.id !== manageSeriesTests.id) return s;
            const full = Math.max(0, (s.fullMockCount || 0) - (cat === 'full_mock' ? 1 : 0));
            const topic = Math.max(0, (s.topicTestCount || 0) - (cat === 'topic' ? 1 : 0));
            const pyq = Math.max(0, (s.pyqTestCount || 0) - (cat === 'pyq' ? 1 : 0));
            const total = Math.max(0, (s.testCount || 0) - 1);
            return {
              ...s,
              testCount: total,
              testsCount: total,
              fullMockCount: full,
              topicTestCount: topic,
              pyqTestCount: pyq,
            };
          })
        );
        setNotice({
          message: `Removed "${t.title}" from series`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to unassign test', err);
      setNotice({ message: getErrorMessage(err, 'Failed to remove test'), type: 'error' });
    } finally {
      setUnassigningId(null);
    }
  };

  const handleAssignAllFiltered = async () => {
    if (!manageSeriesTests || filteredAvailableTests.length === 0) return;
    try {
      setIsLoadingSeriesTests(true);
      for (const t of filteredAvailableTests) {
        await api.assignTestToSeries(t.id, manageSeriesTests.id);
      }
      const assignedIds = new Set(filteredAvailableTests.map((t) => t.id));
      const newlyAssigned = filteredAvailableTests.map((t) => ({
        ...t,
        testSeriesId: manageSeriesTests.id,
        testSeriesTitle: manageSeriesTests.title,
      }));
      setAvailableTests((prev) => prev.filter((x) => !assignedIds.has(x.id)));
      setSeriesTests((prev) => [...prev, ...newlyAssigned]);
      await loadData();
      setNotice({
        message: `Successfully added ${filteredAvailableTests.length} tests to ${manageSeriesTests.title}`,
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to batch assign tests', err);
      setNotice({ message: 'Failed to assign tests', type: 'error' });
    } finally {
      setIsLoadingSeriesTests(false);
    }
  };

  // Categories in Assigned Tests
  const assignedFullMocks = useMemo(
    () => seriesTests.filter((t) => t.testType === 'full_mock'),
    [seriesTests]
  );
  const assignedTopicTests = useMemo(
    () =>
      seriesTests.filter(
        (t) =>
          t.testType === 'topic' ||
          t.testType === 'chapter_mock' ||
          t.testType === 'subject_mock'
      ),
    [seriesTests]
  );
  const assignedPyqTests = useMemo(
    () => seriesTests.filter((t) => t.testType === 'pyq'),
    [seriesTests]
  );

  // Categories in Available Tests
  const availableFullMocks = useMemo(
    () => availableTests.filter((t) => t.testType === 'full_mock'),
    [availableTests]
  );
  const availableTopicTests = useMemo(
    () =>
      availableTests.filter(
        (t) =>
          t.testType === 'topic' ||
          t.testType === 'chapter_mock' ||
          t.testType === 'subject_mock'
      ),
    [availableTests]
  );
  const availablePyqTests = useMemo(
    () => availableTests.filter((t) => t.testType === 'pyq'),
    [availableTests]
  );

  const filteredAvailableTests = useMemo(() => {
    return availableTests.filter((t) => {
      const term = testSearchTerm.toLowerCase().trim();
      if (term) {
        const match =
          t.title.toLowerCase().includes(term) ||
          t.subjectName?.toLowerCase().includes(term) ||
          t.chapterName?.toLowerCase().includes(term) ||
          t.paperName?.toLowerCase().includes(term) ||
          String(t.year || '').includes(term);
        if (!match) return false;
      }
      const cat = getTestCategory(t);
      if (availableCategoryFilter !== 'all' && cat !== availableCategoryFilter) return false;
      return true;
    });
  }, [availableTests, testSearchTerm, availableCategoryFilter]);

  const filteredSeries = seriesList.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.examId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ListOrdered className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              Test Series Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
              {seriesList.length} Series
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thematic mock test packages under target examinations (e.g. Prelims 2025 Series, Mains
            Pro Pack).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/tests"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Mock Test Management</span>
          </Link>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            leftIcon={<Plus className="w-4 h-4 text-white" />}
            onClick={openCreateModal}
          >
            <span className="text-white">Add Test Series</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search test series..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value="">All Target Exams</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Series Title</th>
                <th className="p-4">Target Exam</th>
                <th className="p-4">Access Tier</th>
                <th className="p-4">Assigned Tests</th>
                <th className="p-4">Order</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Loading test series...
                  </td>
                </tr>
              ) : filteredSeries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No test series found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredSeries.map((series) => {
                  const parentExam = exams.find((e) => e.id === series.examId);
                  const count = series.testCount ?? series.testsCount ?? 0;
                  return (
                    <tr key={series.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold">
                            <ListOrdered className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{series.title}</p>
                            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{series.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                          {parentExam?.title || series.examTitle || series.examId}
                        </span>
                      </td>
                      <td className="p-4">
                        {series.isPremium ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            <Lock className="w-3 h-3" /> PRO PASS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            FREE
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openManageTests(series)}
                          className="inline-flex flex-col items-start gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-cyan-400/40 transition-all group text-left"
                          title="Click to manage tests organized by category"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-300">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{count} Total Tests</span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              🎯 {series.fullMockCount || 0} Mock
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                              📚 {series.topicTestCount || 0} Topic
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              📜 {series.pyqTestCount || 0} PYQ
                            </span>
                          </div>
                        </button>
                      </td>
                      <td className="p-4 font-bold text-indigo-400">#{series.orderIndex}</td>
                      <td className="p-4">
                        {series.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openManageTests(series)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                            title="Manage Tests"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(series)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Edit Series"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(series)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              series.isActive
                                ? 'text-emerald-400 hover:text-amber-400 hover:bg-amber-500/10'
                                : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={series.isActive ? 'Deactivate Series' : 'Activate Series'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteError('');
                              setSeriesToDelete(series);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Series"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANAGE TESTS MODAL */}
      {isManagingTests && manageSeriesTests && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5 bg-black/35 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden admin-dark-box">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 shrink-0 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Layers className="w-3.5 h-3.5" />
                    Manage Series Tests
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {exams.find((e) => e.id === manageSeriesTests.examId)?.title || manageSeriesTests.examId}
                  </span>
                  {manageSeriesTests.isPremium ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Lock className="w-3 h-3" /> PRO PASS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      FREE
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {manageSeriesTests.title}
                </h3>
              </div>

              {/* Category Metrics Summary Counter Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{seriesTests.length} Total</div>
                    <div className="text-[10px] text-slate-400">Assigned</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-300">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{assignedFullMocks.length} Full Mock</div>
                    <div className="text-[10px] text-emerald-400/80">Simulations</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-sky-950/40 border border-sky-500/30 px-3 py-1.5 rounded-xl text-sky-300">
                  <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{assignedTopicTests.length} Topic</div>
                    <div className="text-[10px] text-sky-400/80">Drills</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300">
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{assignedPyqTests.length} PYQ</div>
                    <div className="text-[10px] text-amber-400/80">Papers</div>
                  </div>
                </div>

                <button
                  onClick={() => setIsManagingTests(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Notification / Toast Banner */}
            {notice && (
              <div
                className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between transition-all ${
                  notice.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-b border-rose-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{notice.message}</span>
                </div>
                <button
                  onClick={() => setNotice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Category Navigation Bar for Assigned View */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                  View Category:
                </span>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveCategoryTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCategoryTab === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    All Sections ({seriesTests.length})
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab('full_mock')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCategoryTab === 'full_mock'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Full Mocks ({assignedFullMocks.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab('topic')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCategoryTab === 'topic'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-sky-400 hover:bg-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Topic Tests ({assignedTopicTests.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab('pyq')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeCategoryTab === 'pyq'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>PYQ Tests ({assignedPyqTests.length})</span>
                  </button>
                </div>
              </div>

              {/* Quick links to Create New Test of each type */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">
                  Create new:
                </span>
                <Link
                  to={`/admin/tests?tab=full_mock&examId=${manageSeriesTests.examId}&seriesId=${manageSeriesTests.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Full Mock
                </Link>
                <Link
                  to={`/admin/tests?tab=topic&examId=${manageSeriesTests.examId}&seriesId=${manageSeriesTests.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Topic Test
                </Link>
                <Link
                  to={`/admin/tests?tab=pyq&examId=${manageSeriesTests.examId}&seriesId=${manageSeriesTests.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> PYQ Paper
                </Link>
              </div>
            </div>

            {/* Main Two-Column Layout */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* LEFT COLUMN: Available Tests in Exam */}
              <div className="p-5 sm:p-6 flex flex-col h-full bg-slate-950/40 overflow-hidden">
                <div className="flex items-center justify-between pb-3 shrink-0">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-indigo-400" />
                      <span>Available Tests in Exam</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                        {filteredAvailableTests.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Unassigned tests created under this exam ready to attach
                    </p>
                  </div>
                  {filteredAvailableTests.length > 1 && (
                    <button
                      onClick={handleAssignAllFiltered}
                      disabled={isLoadingSeriesTests}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      + Add All Filtered ({filteredAvailableTests.length})
                    </button>
                  )}
                </div>

                {/* Search & Filter pills */}
                <div className="space-y-2 mb-4 shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search available by title, subject, year..."
                      value={testSearchTerm}
                      onChange={(e) => setTestSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {testSearchTerm && (
                      <button
                        onClick={() => setTestSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills for Available Tests */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setAvailableCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        availableCategoryFilter === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({availableTests.length})
                    </button>
                    <button
                      onClick={() => setAvailableCategoryFilter('full_mock')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        availableCategoryFilter === 'full_mock'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      🎯 Full Mock ({availableFullMocks.length})
                    </button>
                    <button
                      onClick={() => setAvailableCategoryFilter('topic')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        availableCategoryFilter === 'topic'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:text-sky-400'
                      }`}
                    >
                      📚 Topic ({availableTopicTests.length})
                    </button>
                    <button
                      onClick={() => setAvailableCategoryFilter('pyq')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        availableCategoryFilter === 'pyq'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-900/60 text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      📜 PYQ ({availablePyqTests.length})
                    </button>
                  </div>
                </div>

                {/* Available Tests List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {filteredAvailableTests.map((t) => {
                    const cat = getTestCategory(t);
                    const isAssigning = assigningId === t.id;

                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {cat === 'full_mock' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                🎯 Full Mock
                              </span>
                            )}
                            {cat === 'topic' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                📚 Topic Test
                              </span>
                            )}
                            {cat === 'pyq' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                📜 PYQ Paper
                              </span>
                            )}
                            {t.isPremium && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                PRO
                              </span>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm font-bold text-white truncate" title={t.title}>
                            {t.title}
                          </p>

                          {/* Extra Context based on test type */}
                          {cat === 'topic' && (t.subjectName || t.chapterName) && (
                            <p className="text-[11px] text-slate-400 truncate">
                              {t.subjectName} {t.chapterName ? `• ${t.chapterName}` : ''}
                            </p>
                          )}
                          {cat === 'pyq' && (t.year || t.paperName) && (
                            <p className="text-[11px] text-slate-400 truncate">
                              {t.year ? `Year ${t.year}` : ''} {t.paperName ? `• ${t.paperName}` : ''}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {t.durationMinutes}m
                            </span>
                            <span>•</span>
                            <span>{t.totalMarks} marks</span>
                            <span>•</span>
                            <span>{t.totalQuestions || 0} questions</span>
                            {t.negativeMarking > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-400">-{t.negativeMarking} neg</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAssignTest(t.id)}
                          disabled={isAssigning}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm hover:shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50"
                          title="Add to Series"
                        >
                          {isAssigning ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {filteredAvailableTests.length === 0 && (
                    <div className="py-12 px-4 text-center text-slate-500 space-y-3">
                      <FolderPlus className="w-8 h-8 opacity-40 mx-auto" />
                      <p className="text-xs">
                        {testSearchTerm || availableCategoryFilter !== 'all'
                          ? 'No available tests match the current filter/search.'
                          : 'All tests for this exam are already assigned to this series.'}
                      </p>
                      {(testSearchTerm || availableCategoryFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setTestSearchTerm('');
                            setAvailableCategoryFilter('all');
                          }}
                          className="text-xs text-indigo-400 hover:underline"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Assigned to Series (Clearly Organized by Category Sections) */}
              <div className="p-5 sm:p-6 flex flex-col h-full bg-slate-900/40 overflow-hidden">
                <div className="flex items-center justify-between pb-3 shrink-0">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-cyan-400" />
                      <span>Assigned Tests in Series</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                        {seriesTests.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Organized sections for Full Mocks, Topic Drills, and PYQ Papers
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {assignedFullMocks.length} Mock
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                      {assignedTopicTests.length} Topic
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      {assignedPyqTests.length} PYQ
                    </span>
                  </div>
                </div>

                {/* Organized Sections Container */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                  {/* SECTION 1: FULL MOCK TESTS */}
                  {(activeCategoryTab === 'all' || activeCategoryTab === 'full_mock') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-emerald-300">
                              Full Mock Tests ({assignedFullMocks.length})
                            </h5>
                            <p className="text-[10px] text-emerald-400/70">
                              Full exam simulations matching official marks pattern
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {assignedFullMocks.length} Tests
                        </span>
                      </div>

                      {assignedFullMocks.length > 0 ? (
                        <div className="space-y-2 pl-1">
                          {assignedFullMocks.map((t) => (
                            <div
                              key={t.id}
                              className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between gap-3 group hover:border-emerald-500/40 transition-all"
                            >
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400">
                                    🎯 FULL MOCK
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                                    {t.title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  <span>{t.durationMinutes} mins</span>
                                  <span>•</span>
                                  <span>{t.totalMarks} marks</span>
                                  <span>•</span>
                                  <span>{t.totalQuestions || 0} questions</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Link
                                  to={`/admin/tests/${t.id}/questions`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] inline-flex items-center gap-1"
                                  title="View Questions"
                                >
                                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                                </Link>
                                <button
                                  onClick={() => handleUnassignTest(t.id)}
                                  disabled={unassigningId === t.id}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                                  title="Remove from Series"
                                >
                                  {unassigningId === t.id ? (
                                    <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/5 text-center space-y-2">
                          <p className="text-xs text-slate-400">No Full Mock tests assigned to this series yet.</p>
                          <button
                            onClick={() => setAvailableCategoryFilter('full_mock')}
                            className="text-xs font-bold text-emerald-400 hover:underline"
                          >
                            + Browse Available Full Mocks
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 2: TOPIC TESTS */}
                  {(activeCategoryTab === 'all' || activeCategoryTab === 'topic') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-sky-950/20 border border-sky-500/20 p-2.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-sky-300">
                              Topic Tests ({assignedTopicTests.length})
                            </h5>
                            <p className="text-[10px] text-sky-400/70">
                              Chapter drills and subject mastery practice sets
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                          {assignedTopicTests.length} Tests
                        </span>
                      </div>

                      {assignedTopicTests.length > 0 ? (
                        <div className="space-y-2 pl-1">
                          {assignedTopicTests.map((t) => (
                            <div
                              key={t.id}
                              className="p-3 rounded-xl bg-slate-950 border border-sky-500/20 flex items-center justify-between gap-3 group hover:border-sky-500/40 transition-all"
                            >
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-sky-500/10 text-sky-400">
                                    📚 TOPIC
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                                    {t.title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  {t.subjectName && (
                                    <span className="text-sky-300">{t.subjectName}</span>
                                  )}
                                  {t.chapterName && <span>↳ {t.chapterName}</span>}
                                  <span>•</span>
                                  <span>{t.durationMinutes}m</span>
                                  <span>•</span>
                                  <span>{t.totalMarks} marks</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Link
                                  to={`/admin/tests/${t.id}/questions`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] inline-flex items-center gap-1"
                                  title="View Questions"
                                >
                                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                                </Link>
                                <button
                                  onClick={() => handleUnassignTest(t.id)}
                                  disabled={unassigningId === t.id}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                                  title="Remove from Series"
                                >
                                  {unassigningId === t.id ? (
                                    <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-sky-500/20 bg-sky-500/5 text-center space-y-2">
                          <p className="text-xs text-slate-400">No Topic tests assigned to this series yet.</p>
                          <button
                            onClick={() => setAvailableCategoryFilter('topic')}
                            className="text-xs font-bold text-sky-400 hover:underline"
                          >
                            + Browse Available Topic Tests
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 3: PYQ TESTS */}
                  {(activeCategoryTab === 'all' || activeCategoryTab === 'pyq') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
                            <History className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-amber-300">
                              Previous Year Papers (PYQ) ({assignedPyqTests.length})
                            </h5>
                            <p className="text-[10px] text-amber-400/70">
                              Official historical examination question papers
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {assignedPyqTests.length} Tests
                        </span>
                      </div>

                      {assignedPyqTests.length > 0 ? (
                        <div className="space-y-2 pl-1">
                          {assignedPyqTests.map((t) => (
                            <div
                              key={t.id}
                              className="p-3 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-between gap-3 group hover:border-amber-500/40 transition-all"
                            >
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-400">
                                    📜 PYQ
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                                    {t.title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  {t.year && (
                                    <span className="text-amber-300 font-bold">Year {t.year}</span>
                                  )}
                                  {t.paperName && <span>• {t.paperName}</span>}
                                  <span>•</span>
                                  <span>{t.durationMinutes}m</span>
                                  <span>•</span>
                                  <span>{t.totalMarks} marks</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Link
                                  to={`/admin/tests/${t.id}/questions`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px] inline-flex items-center gap-1"
                                  title="View Questions"
                                >
                                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                                </Link>
                                <button
                                  onClick={() => handleUnassignTest(t.id)}
                                  disabled={unassigningId === t.id}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                                  title="Remove from Series"
                                >
                                  {unassigningId === t.id ? (
                                    <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-amber-500/20 bg-amber-500/5 text-center space-y-2">
                          <p className="text-xs text-slate-400">No PYQ papers assigned to this series yet.</p>
                          <button
                            onClick={() => setAvailableCategoryFilter('pyq')}
                            className="text-xs font-bold text-amber-400 hover:underline"
                          >
                            + Browse Available PYQs
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {seriesTests.length === 0 && (
                    <div className="py-12 text-center text-slate-500 space-y-3">
                      <ListOrdered className="w-10 h-10 opacity-30 mx-auto" />
                      <p className="text-sm font-semibold">No tests assigned to this series yet.</p>
                      <p className="text-xs max-w-sm mx-auto text-slate-400">
                        Pick tests from the Available Tests list on the left to organize Full Mocks,
                        Topic Drills, and PYQ Papers inside this Test Series.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">{seriesTests.length} Total Tests in Series:</span>
                <span className="text-emerald-400 font-semibold">{assignedFullMocks.length} Full Mock</span>
                <span>•</span>
                <span className="text-sky-400 font-semibold">{assignedTopicTests.length} Topic</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{assignedPyqTests.length} PYQ</span>
              </div>
              <Button onClick={() => setIsManagingTests(false)} size="sm" className="font-bold">
                Done Managing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {editingSeries ? 'Edit Test Series' : 'Add Test Series'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Target Exam *
                </label>
                <select
                  disabled={Boolean(editingSeries)}
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Test Series Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WBP Constable 2025 Prelims Test Series"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. wbp-prelims-2025"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Series overview, e.g. 15 Full Mocks + 30 Chapter Drills"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Series Icon / Emblem
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF4F0] dark:bg-slate-800 border border-[#FDE2D7] dark:border-slate-700 p-2 flex items-center justify-center shrink-0">
                    <img
                      src={iconUrl || '/images/exams/emblem_wbp.png'}
                      alt="Icon Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo-icon.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Icon URL or pick preset below"
                        value={iconUrl}
                        onChange={(e) => setIconUrl(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                      />
                      <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setIconUrl(ev.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {iconUrl && (
                        <button
                          type="button"
                          onClick={() => setIconUrl('')}
                          className="text-xs text-rose-500 hover:text-rose-600 font-bold px-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {/* Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                      {PRESET_SERIES_ICONS.slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          title={p.name}
                          onClick={() => setIconUrl(p.url)}
                          className={`w-7 h-7 rounded-lg border p-1 shrink-0 bg-white dark:bg-slate-900 transition-all ${
                            iconUrl === p.url
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pro Pass Only</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-[#0158FC]">Show on Home → Popular Test Series</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  <span className="text-white">{editingSeries ? 'Save Changes' : 'Create Series'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {seriesToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Test Series</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanently remove this test series package.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 mb-4">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-slate-700 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-white">"{seriesToDelete.title}"</strong>?
              {(seriesToDelete.testCount || seriesToDelete.testsCount || 0) > 0 ? (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  ⚠️ This series has {seriesToDelete.testCount || seriesToDelete.testsCount} linked
                  test(s). The tests will remain but their series association will be removed.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => {
                  setSeriesToDelete(null);
                  setDeleteError('');
                }}
                className="border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                <span className="text-white">{isDeleting ? 'Deleting...' : 'Delete Series'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
