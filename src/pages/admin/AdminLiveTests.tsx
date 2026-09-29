import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  Play,
  Square,
  XCircle,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Users,
} from 'lucide-react';
import type { LiveTest, Exam, TestSeries, MockTest } from '@/types';
import { getErrorMessage } from '@/lib/errors';

export const AdminLiveTests: React.FC = () => {
  const [liveTests, setLiveTests] = useState<LiveTest[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLiveTest, setEditingLiveTest] = useState<LiveTest | null>(null);
  const [liveTestToDelete, setLiveTestToDelete] = useState<LiveTest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [examId, setExamId] = useState('');
  const [testSeriesId, setTestSeriesId] = useState('');
  const [testId, setTestId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [totalMarks, setTotalMarks] = useState(100);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState<LiveTest['status']>('scheduled');
  const [isPublished, setIsPublished] = useState(true);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allExams, allTests, allSeries, allLive] = await Promise.all([
        api.getAllAdminExams(),
        api.getTests(),
        api.getTestSeries(),
        api.getLiveTests(selectedExamId || undefined),
      ]);
      setExams(allExams);
      setAvailableTests(allTests);
      setTestSeries(allSeries);
      setLiveTests(allLive);
    } catch (err) {
      console.error('Failed to load live test data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingLiveTest(null);
    setTitle('');
    const defaultExamId = selectedExamId || exams[0]?.id || 'wbp-constable';
    setExamId(defaultExamId);
    setTestSeriesId('');
    const matchedTest = availableTests.find((t) => t.examId === defaultExamId) || availableTests[0];
    setTestId(matchedTest?.id || 'test-wbp-001');

    // Default: 2 days ahead at 10:00 AM
    const future = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    const dateStr = future.toISOString().split('T')[0];
    setStartDate(dateStr);
    setStartTime('10:00');
    setDurationMinutes(90);
    setTotalQuestions(matchedTest?.totalQuestions || 100);
    setTotalMarks(matchedTest?.totalMarks || 100);
    setNegativeMarking(matchedTest?.negativeMarking ?? 0.25);
    setInstructions(
      'Official examination pattern with statewide rank & percentile analysis. Questions will appear one-by-one with dynamic timer.'
    );
    setStatus('scheduled');
    setIsPublished(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (lt: LiveTest) => {
    setEditingLiveTest(lt);
    setTitle(lt.title);
    setExamId(lt.examId);
    setTestSeriesId(lt.testSeriesId || '');
    setTestId(lt.testId);

    const startObj = new Date(lt.scheduledStartTime);
    setStartDate(startObj.toISOString().split('T')[0]);
    const hh = String(startObj.getHours()).padStart(2, '0');
    const mm = String(startObj.getMinutes()).padStart(2, '0');
    setStartTime(`${hh}:${mm}`);

    setDurationMinutes(lt.durationMinutes);
    setTotalQuestions(lt.totalQuestions);
    setTotalMarks(lt.totalMarks);
    setNegativeMarking(lt.negativeMarking);
    setInstructions(lt.instructions || '');
    setStatus(lt.status);
    setIsPublished(lt.isPublished);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Live test title is required.');
      return;
    }
    if (!examId) {
      setFormError('Target Exam must be selected.');
      return;
    }
    if (!testId) {
      setFormError('A mock test must be attached.');
      return;
    }

    try {
      const scheduledStart = new Date(`${startDate}T${startTime}:00`);
      const scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60 * 1000);

      const payload = {
        title: title.trim(),
        examId,
        testSeriesId: testSeriesId || undefined,
        testId,
        scheduledStartTime: scheduledStart.toISOString(),
        scheduledEndTime: scheduledEnd.toISOString(),
        durationMinutes: Number(durationMinutes),
        totalQuestions: Number(totalQuestions),
        totalMarks: Number(totalMarks),
        negativeMarking: Number(negativeMarking),
        instructions: instructions.trim() || undefined,
        status,
        isPublished,
        enrolledCount: editingLiveTest?.enrolledCount || 0,
      };

      if (editingLiveTest) {
        await api.updateLiveTest(editingLiveTest.id, payload);
      } else {
        await api.createLiveTest(payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save Live Test.'));
    }
  };

  const handleTogglePublish = async (lt: LiveTest) => {
    try {
      await api.updateLiveTest(lt.id, { isPublished: !lt.isPublished });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleUpdateStatus = async (lt: LiveTest, newStatus: LiveTest['status']) => {
    try {
      await api.updateLiveTest(lt.id, { status: newStatus });
      await loadData();
    } catch (err) {
      console.error('Failed to update live test status:', err);
    }
  };

  const handleDelete = async () => {
    if (!liveTestToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteLiveTest(liveTestToDelete.id);
      setLiveTestToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete live test:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered live tests
  const filteredTests = liveTests.filter((lt) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      lt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lt.examTitle && lt.examTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || lt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (s: LiveTest['status']) => {
    switch (s) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
            <Radio className="w-3.5 h-3.5" /> LIVE NOW
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-600" />
            Live Tests Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create, schedule, publish, and monitor statewide live mock tests. Changes automatically sync to Student Web and Mobile APK.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Schedule Live Test
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search live test or exam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="live">🔴 Live Now</option>
            <option value="scheduled">⏱ Scheduled</option>
            <option value="completed">✅ Completed</option>
            <option value="draft">📝 Draft</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>

        <div className="text-sm font-semibold text-slate-500">
          Showing {filteredTests.length} Live Tests
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading live tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="p-12 text-center">
            <Radio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Live Tests Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Schedule your first statewide live test to engage thousands of students.
            </p>
            <Button onClick={openCreateModal} className="mt-4 bg-blue-600 text-white font-bold">
              Schedule Live Test
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Live Test</th>
                  <th className="py-3.5 px-4">Exam & Test Attached</th>
                  <th className="py-3.5 px-4">Scheduled Timing</th>
                  <th className="py-3.5 px-4">Enrolled</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Published</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTests.map((lt) => {
                  const startDateObj = new Date(lt.scheduledStartTime);
                  const isCurrent = lt.status === 'live';

                  return (
                    <tr key={lt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {isCurrent && <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />}
                          {lt.title}
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                          {lt.totalQuestions} Qs • {lt.durationMinutes} Mins • Marks: {lt.totalMarks} • -{lt.negativeMarking} neg
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{lt.examTitle || lt.examId}</div>
                        <div className="text-xs text-slate-500">{lt.testTitle || lt.testId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {startDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {startDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-full">
                          <Users className="w-3 h-3 text-slate-500" />
                          {lt.enrolledCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(lt.status)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublish(lt)}
                          title={lt.isPublished ? 'Published on Student Home' : 'Unpublished (Hidden)'}
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                            lt.isPublished
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {lt.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {lt.isPublished ? 'Published' : 'Hidden'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {lt.status === 'scheduled' && (
                            <button
                              onClick={() => handleUpdateStatus(lt, 'live')}
                              title="Start Test Now (Make Live)"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          )}
                          {lt.status === 'live' && (
                            <button
                              onClick={() => handleUpdateStatus(lt, 'completed')}
                              title="End Test (Complete)"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Square className="w-4 h-4 fill-current" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(lt)}
                            title="Edit"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setLiveTestToDelete(lt)}
                            title="Delete"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Live Test */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-600" />
                {editingLiveTest ? 'Edit Live Test' : 'Schedule New Live Test'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Live Test Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WBP Constable Weekly Test"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Exam *
                  </label>
                  <select
                    required
                    value={examId}
                    onChange={(e) => {
                      setExamId(e.target.value);
                      const matched = availableTests.find((t) => t.examId === e.target.value);
                      if (matched) setTestId(matched.id);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Related Test Series (Optional)
                  </label>
                  <select
                    value={testSeriesId}
                    onChange={(e) => setTestSeriesId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="">-- None (Standalone Live Test) --</option>
                    {testSeries
                      .filter((ts) => !examId || ts.examId === examId)
                      .map((ts) => (
                        <option key={ts.id} value={ts.id}>
                          {ts.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Attach Mock Test Questions *
                  </label>
                  <select
                    required
                    value={testId}
                    onChange={(e) => {
                      setTestId(e.target.value);
                      const matched = availableTests.find((t) => t.id === e.target.value);
                      if (matched) {
                        setTotalQuestions(matched.totalQuestions);
                        setTotalMarks(matched.totalMarks);
                        setNegativeMarking(matched.negativeMarking);
                        setDurationMinutes(matched.durationMinutes);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {availableTests
                      .filter((t) => !examId || t.examId === examId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.totalQuestions} Qs)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Negative Marks
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status & Publish
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LiveTest['status'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live Now</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer p-2 border border-slate-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    Publish on Student Home
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions for students..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white font-bold">
                  {editingLiveTest ? 'Update Live Test' : 'Schedule Live Test'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {liveTestToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Delete Live Test?</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <span className="font-bold text-slate-900">{liveTestToDelete.title}</span>? This will remove all scheduled sessions and participation counts.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setLiveTestToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
