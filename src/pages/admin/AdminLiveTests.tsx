import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  Radio,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  Trophy,
  X,
  XCircle,
  CalendarClock,
  Eye,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import type { LiveTest, MockTest, LiveTestParticipant } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import { Link } from 'react-router-dom';

export const AdminLiveTests: React.FC = () => {
  const [liveTests, setLiveTests] = useState<LiveTest[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLiveTest, setEditingLiveTest] = useState<LiveTest | null>(null);
  const [viewingLeaderboardTest, setViewingLeaderboardTest] = useState<LiveTest | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LiveTestParticipant[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [viewingDetailsTest, setViewingDetailsTest] = useState<LiveTest | null>(null);

  // Create / Edit Form State
  const [selectedTestId, setSelectedTestId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [regDeadlineTime, setRegDeadlineTime] = useState('19:55');
  const [rankingEnabled, setRankingEnabled] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tests, liveList] = await Promise.all([
        api.getAllAdminTests(),
        api.getLiveTests(),
      ]);
      setAvailableTests(tests);
      setLiveTests(liveList);
    } catch (err) {
      console.error('Failed to load live tests data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set of testIds that currently have an active (upcoming or live) live test
  const activeTestIds = useMemo(() => {
    return new Set(
      liveTests
        .filter((lt) => lt.status === 'upcoming' || lt.status === 'live')
        .map((lt) => lt.testId)
    );
  }, [liveTests]);

  const openCreateModal = () => {
    setFormError('');
    setFormSuccess(false);
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setStartTime('20:00');
    setRegDeadlineTime('19:55');
    setRankingEnabled(true);
    setSubscriptionRequired(false);

    // Pick first available test not already active
    const candidate = availableTests.find((t) => !activeTestIds.has(t.id)) || availableTests[0];
    setSelectedTestId(candidate?.id || '');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (lt: LiveTest) => {
    setEditingLiveTest(lt);
    setFormError('');
    setFormSuccess(false);
    const dateObj = new Date(lt.startAt);
    setStartDate(dateObj.toISOString().split('T')[0]);
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    setStartTime(`${hh}:${mm}`);
    if (lt.registrationDeadline) {
      const regObj = new Date(lt.registrationDeadline);
      setRegDeadlineTime(`${String(regObj.getHours()).padStart(2, '0')}:${String(regObj.getMinutes()).padStart(2, '0')}`);
    } else {
      setRegDeadlineTime(`${hh}:${mm}`);
    }
    setRankingEnabled(lt.rankingEnabled);
    setSubscriptionRequired(lt.subscriptionRequired);
    setIsEditModalOpen(true);
  };

  const handleCreateLiveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) {
      setFormError('Please select a test.');
      return;
    }

    if (activeTestIds.has(selectedTestId)) {
      setFormError('This test already has an active or scheduled Live Test event. Choose another test or cancel the existing event.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      const startAt = new Date(`${startDate}T${startTime}:00`).toISOString();
      const regDeadline = regDeadlineTime
        ? new Date(`${startDate}T${regDeadlineTime}:00`).toISOString()
        : startAt;

      await api.scheduleLiveTest({
        testId: selectedTestId,
        startAt,
        registrationDeadline: regDeadline,
        rankingEnabled,
        subscriptionRequired,
      });

      setFormSuccess(true);
      await loadData();
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setFormSuccess(false);
      }, 1000);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Failed to schedule Live Test.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLiveTest) return;

    try {
      setIsSubmitting(true);
      setFormError('');
      const startAt = new Date(`${startDate}T${startTime}:00`).toISOString();
      const regDeadline = regDeadlineTime
        ? new Date(`${startDate}T${regDeadlineTime}:00`).toISOString()
        : startAt;

      await api.updateLiveTest(editingLiveTest.id, {
        startAt,
        registrationDeadline: regDeadline,
        rankingEnabled,
        subscriptionRequired,
      });

      setFormSuccess(true);
      await loadData();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingLiveTest(null);
        setFormSuccess(false);
      }, 1000);
    } catch (err: any) {
      setFormError(getErrorMessage(err, 'Failed to update schedule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLiveTest = async (lt: LiveTest) => {
    if (!window.confirm(`Are you sure you want to cancel the Live Test for "${lt.title}"?`)) return;
    try {
      await api.cancelLiveTest(lt.id);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to cancel Live Test'));
    }
  };

  const handleDeleteLiveTest = async (lt: LiveTest) => {
    if (!window.confirm(`Are you sure you want to permanently delete this event record?`)) return;
    try {
      await api.deleteLiveTest(lt.id);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete Live Test'));
    }
  };

  const handleOpenResults = async (lt: LiveTest) => {
    setViewingLeaderboardTest(lt);
    setIsLoadingLeaderboard(true);
    try {
      const data = await api.getLiveTestLeaderboard(lt.id);
      setLeaderboardData(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setLeaderboardData([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Filtered live tests
  const filteredTests = useMemo(() => {
    return liveTests.filter((lt) => {
      const matchSearch =
        !searchTerm ||
        (lt.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lt.examTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || lt.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [liveTests, searchTerm, statusFilter]);

  const getStatusBadge = (status: LiveTest['status']) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm shadow-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE NOW
          </span>
        );
      case 'upcoming':
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-500" />
            UPCOMING
          </span>
        );
      case 'ended':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-slate-400" />
            ENDED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <XCircle className="w-3 h-3 text-rose-500" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              LIVE TESTS
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Scheduled live examination events. Powered directly by your existing Mock Tests.
            </p>
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Live Test</span>
        </Button>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search live tests by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live Now</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 3. Live Tests Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Loading live test events...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Live Tests Found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Schedule any existing test into a Live Test event using the button below.
            </p>
            <Button
              onClick={openCreateModal}
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              + Create Live Test
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50/90 dark:bg-slate-900/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Test</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Participants</th>
                  <th className="px-5 py-3.5">Ranking</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredTests.map((lt) => {
                  const startDateObj = new Date(lt.startAt);
                  const isFinished = lt.status === 'ended' || lt.status === 'completed';
                  const isLive = lt.status === 'live';
                  const isUpcoming = lt.status === 'upcoming' || lt.status === 'scheduled';
                  const isCancelled = lt.status === 'cancelled';

                  return (
                    <tr
                      key={lt.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* 1. Test */}
                      <td className="px-5 py-4 max-w-[300px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {lt.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          {lt.examTitle && (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {lt.examTitle}
                            </span>
                          )}
                          <span>• {lt.durationMinutes}m</span>
                          <span>• {lt.totalQuestions} Qs</span>
                          <span>• {lt.totalMarks} Marks</span>
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{startDateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* 3. Time */}
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{startDateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* 4. Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(lt.status)}
                      </td>

                      {/* 5. Participants */}
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lt.participantsCount ? lt.participantsCount.toLocaleString() : (lt.enrolledCount || 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* 6. Ranking */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            lt.rankingEnabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800'
                          }`}
                        >
                          <Trophy className="w-3 h-3" />
                          {lt.rankingEnabled ? 'ON' : 'OFF'}
                        </span>
                      </td>

                      {/* 7. Actions: View, Edit Schedule, Cancel, View Results */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => setViewingDetailsTest(lt)}
                            title="View Event Details"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Schedule (available for upcoming tests) */}
                          {isUpcoming && (
                            <button
                              onClick={() => openEditModal(lt)}
                              title="Edit Schedule & Settings"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                            >
                              Edit Schedule
                            </button>
                          )}

                          {/* Cancel (available for upcoming or live tests) */}
                          {(isUpcoming || isLive) && (
                            <button
                              onClick={() => handleCancelLiveTest(lt)}
                              title="Cancel Event"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
                            >
                              Cancel
                            </button>
                          )}

                          {/* View Results (available for finished or live tests) */}
                          {(isFinished || isLive) && lt.rankingEnabled && (
                            <button
                              onClick={() => handleOpenResults(lt)}
                              title="View Live Leaderboard & Results"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200/80 transition-colors flex items-center gap-1"
                            >
                              <Trophy className="w-3 h-3" />
                              <span>View Results</span>
                            </button>
                          )}

                          {/* Delete (available for cancelled or ended tests) */}
                          {(isCancelled || isFinished) && (
                            <button
                              onClick={() => handleDeleteLiveTest(lt)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* CREATE LIVE TEST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Create Live Test</h3>
                  <p className="text-[11px] text-slate-500">Select any test to schedule as a live event</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Live Test scheduled successfully!</span>
              </div>
            )}

            <form onSubmit={handleCreateLiveTest} className="space-y-4">
              {/* Select Existing Test */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Existing Test *
                </label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Choose a Mock Test --</option>
                  {availableTests.map((t) => {
                    const isActive = activeTestIds.has(t.id);
                    return (
                      <option key={t.id} value={t.id} disabled={isActive}>
                        {t.title} ({t.durationMinutes}m, {t.totalQuestions}Q) {isActive ? '— [Active Live Test]' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Questions, duration, and marks will be inherited automatically from this test.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="time"
                  value={regDeadlineTime}
                  onChange={(e) => setRegDeadlineTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Statewide Ranking</div>
                    <div className="text-[10px] text-slate-500">Public leaderboard with deterministic rank</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRankingEnabled(!rankingEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rankingEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rankingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Subscription Required</div>
                    <div className="text-[10px] text-slate-500">Only Pro students can register and join</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubscriptionRequired(!subscriptionRequired)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      subscriptionRequired ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        subscriptionRequired ? 'translate-x-6' : 'translate-x-1'
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
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || formSuccess}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Scheduling...' : 'MAKE LIVE'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SCHEDULE MODAL */}
      {isEditModalOpen && editingLiveTest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Edit Live Test Schedule</h3>
                <p className="text-[11px] text-slate-500">{editingLiveTest.title}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Schedule updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="time"
                  value={regDeadlineTime}
                  onChange={(e) => setRegDeadlineTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Statewide Ranking</div>
                    <div className="text-[10px] text-slate-500">Public leaderboard with deterministic rank</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRankingEnabled(!rankingEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rankingEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rankingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Subscription Required</div>
                    <div className="text-[10px] text-slate-500">Only Pro students can register and join</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubscriptionRequired(!subscriptionRequired)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      subscriptionRequired ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        subscriptionRequired ? 'translate-x-6' : 'translate-x-1'
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
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || formSuccess}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isSubmitting ? 'Updating...' : 'Save Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EVENT DETAILS MODAL */}
      {viewingDetailsTest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Live Test Event Details</h3>
              </div>
              <button
                onClick={() => setViewingDetailsTest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Event Title</div>
                <div className="text-base font-black text-slate-900 dark:text-white">{viewingDetailsTest.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Start Schedule</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(viewingDetailsTest.startAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Cutoff</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingDetailsTest.registrationDeadline ? new Date(viewingDetailsTest.registrationDeadline).toLocaleTimeString() : 'At Start'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingDetailsTest.durationMinutes} Minutes</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Marks & Questions</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingDetailsTest.totalQuestions} Qs • {viewingDetailsTest.totalMarks} Marks (-{viewingDetailsTest.negativeMarking} neg)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Source Test:</span>
                <Link
                  to={`/admin/tests/${viewingDetailsTest.testId}/questions`}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Manage Test Questions</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingDetailsTest(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD / RESULTS MODAL */}
      {viewingLeaderboardTest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Live Ranking & Results</h3>
                  <p className="text-[11px] text-slate-500">{viewingLeaderboardTest.title}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingLeaderboardTest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {isLoadingLeaderboard ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading live ranks...</p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No completed submissions for this live test yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <tr>
                      <th className="py-2 px-3">Rank</th>
                      <th className="py-2 px-3">Student</th>
                      <th className="py-2 px-3">District</th>
                      <th className="py-2 px-3">Score</th>
                      <th className="py-2 px-3">Accuracy</th>
                      <th className="py-2 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {leaderboardData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                          #{row.rank}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {row.fullName || 'Student'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {row.district || 'West Bengal'}
                        </td>
                        <td className="py-2.5 px-3 font-black text-indigo-600 dark:text-indigo-400">
                          {row.score} / {viewingLeaderboardTest.totalMarks}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">
                          {row.accuracy != null ? `${row.accuracy}%` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {row.timeTaken ? `${Math.floor(row.timeTaken / 60)}m ${row.timeTaken % 60}s` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingLeaderboardTest(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
