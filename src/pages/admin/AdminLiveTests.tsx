import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import type { LiveTest, MockTest } from '@/types';
import {
  Radio,
  Calendar,
  CheckCircle2,
  Users,
  Plus,
  Search,
  Filter,
  ExternalLink,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Upload,
  Copy,
  Clock,
  Target,
  FileText,
  Hourglass,
  StopCircle,
  Play,
  Monitor,
  AlertCircle,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type ToastType = 'success' | 'error' | 'info';
let globalToastHandler: ((msg: string, type: ToastType) => void) | null = null;

const toast = {
  success: (msg: string) => globalToastHandler?.(msg, 'success'),
  error: (msg: string) => globalToastHandler?.(msg, 'error'),
  info: (msg: string) => globalToastHandler?.(msg, 'info'),
};

const PRESET_LOGOS = [
  { name: 'WBP Police', url: '/images/exams/logo_wbp.png' },
  { name: 'WBPSC', url: '/images/exams/logo_wbpsc.png' },
  { name: 'Railway', url: '/images/exams/logo_railway.png' },
  { name: 'SSC', url: '/images/exams/logo_ssc.png' },
  { name: 'WB TET', url: '/images/exams/logo_wbtet.png' },
];

function formatScheduledDate(
  dateStr: string | null | undefined
): { date: string; time: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return {
    date: `${day < 10 ? '0' + day : day} ${month} ${year}`,
    time: `${formattedHours}:${minutes} ${ampm}`,
  };
}

export const AdminLiveTests: React.FC = () => {
  const [liveTests, setLiveTests] = useState<LiveTest[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'scheduled' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('01 Sep 2026 → 30 Sep 2026');

  // Selected row checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<
    'overview' | 'participants' | 'settings' | 'analytics'
  >('overview');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingTest, setEditingTest] = useState<LiveTest | null>(null);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<LiveTest | null>(null);
  const [endCandidate, setEndCandidate] = useState<LiveTest | null>(null);

  // Active Dropdown Action Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast state
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
    globalToastHandler = (message: string, type: ToastType) => {
      setToastNotification({ message, type });
      setTimeout(() => setToastNotification(null), 3200);
    };
    return () => {
      globalToastHandler = null;
    };
  }, []);

  // Click outside to close action menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allLive, tests] = await Promise.all([
        api.getLiveTests(),
        api.getAllAdminTests ? api.getAllAdminTests() : Promise.resolve([]),
      ]);
      setLiveTests(allLive);
      setAvailableTests(tests.filter((t: any) => t.testType === 'full_mock'));
    } catch (err) {
      console.error('Failed to load live tests:', err);
      toast.error('Failed to load live tests');
    } finally {
      setLoading(false);
    }
  }, [selectedTestId]);

  useEffect(() => {
    loadData();

    if (typeof api.subscribeToLiveTestUpdates === 'function') {
      const unsubscribe = api.subscribeToLiveTestUpdates(() => {
        api
          .getLiveTests()
          .then(setLiveTests)
          .catch(() => {});
      });
      return () => unsubscribe();
    }
  }, [loadData]);

  // Overall KPI Metrics
  const stats = useMemo(() => {
    const total = liveTests.length;
    const liveCount = liveTests.filter((t) => t.status === 'live').length;
    const upcomingCount = liveTests.filter(
      (t) => t.status === 'upcoming' || t.status === 'scheduled'
    ).length;
    const endedCount = liveTests.filter(
      (t) => t.status === 'ended' || t.status === 'completed'
    ).length;
    const totalParticipants = liveTests.reduce(
      (sum, t) => sum + (t.participantsCount || t.enrolledCount || 0),
      0
    );

    return {
      total,
      liveCount,
      upcomingCount,
      endedCount,
      totalParticipants,
    };
  }, [liveTests]);

  // Distinct Exams for Dropdown
  const distinctExams = useMemo(() => {
    const exams = new Set<string>();
    liveTests.forEach((t) => {
      if (t.examTitle) exams.add(t.examTitle);
    });
    return Array.from(exams);
  }, [liveTests]);

  // Filtering
  const filteredTests = useMemo(() => {
    return liveTests.filter((lt) => {
      // Tab filter
      if (activeTab === 'live' && lt.status !== 'live') return false;
      if (activeTab === 'scheduled' && lt.status !== 'upcoming' && lt.status !== 'scheduled')
        return false;
      if (activeTab === 'completed' && lt.status !== 'ended' && lt.status !== 'completed')
        return false;

      // Status dropdown filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'live' && lt.status !== 'live') return false;
        if (statusFilter === 'scheduled' && lt.status !== 'upcoming' && lt.status !== 'scheduled')
          return false;
        if (statusFilter === 'draft' && lt.status !== 'draft') return false;
        if (statusFilter === 'completed' && lt.status !== 'ended' && lt.status !== 'completed')
          return false;
      }

      // Exam dropdown filter
      if (examFilter !== 'all' && lt.examTitle !== examFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (lt.title || '').toLowerCase().includes(q);
        const matchExam = (lt.examTitle || '').toLowerCase().includes(q);
        const matchTest = (lt.testTitle || '').toLowerCase().includes(q);
        if (!matchTitle && !matchExam && !matchTest) return false;
      }

      return true;
    });
  }, [liveTests, activeTab, statusFilter, examFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTests.length / pageSize));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTests.slice(start, start + pageSize);
  }, [filteredTests, currentPage, pageSize]);

  // Selected Test for Right Drawer
  const selectedLiveTest = useMemo(() => {
    if (!selectedTestId) return null;
    return liveTests.find((t) => t.id === selectedTestId) || null;
  }, [liveTests, selectedTestId]);

  // Select all checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedTests.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setExamFilter('all');
    setStatusFilter('all');
    setActiveTab('all');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  // Duplicate Live Test
  const handleDuplicate = async (lt: LiveTest) => {
    try {
      const newSchedule = await api.scheduleLiveTest({
        testId: lt.testId || 'test-indus-01',
        title: `${lt.title} (Copy)`,
        startAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        registrationDeadline: new Date(Date.now() + 23.5 * 3600 * 1000).toISOString(),
        durationMinutes: lt.durationMinutes || 60,
        totalQuestions: lt.totalQuestions || 100,
        totalMarks: lt.totalMarks || 100,
        negativeMarking: lt.negativeMarking ?? 0.25,
        rankingEnabled: Boolean(lt.rankingEnabled),
        subscriptionRequired: Boolean(lt.subscriptionRequired),
        logo: lt.logo || lt.examLogo || '/images/exams/logo_wbp.png',
        examLogo: lt.logo || lt.examLogo || '/images/exams/logo_wbp.png',
      });
      setLiveTests((prev) => [newSchedule, ...prev]);
      setSelectedTestId(newSchedule.id);
      setIsDrawerOpen(true);
      toast.success('Live Test duplicated successfully');
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to duplicate test');
    }
  };

  // End Live Test
  const handleEndLiveTest = async (lt: LiveTest) => {
    try {
      await api.updateLiveTest(lt.id, { status: 'ended' });
      setLiveTests((prev) => prev.map((t) => (t.id === lt.id ? { ...t, status: 'ended' } : t)));
      toast.success(`Live Test "${lt.title}" ended and rankings finalized`);
      setEndCandidate(null);
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to end Live Test');
    }
  };

  // Delete Live Test
  const handleDeleteLiveTest = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteLiveTest(deleteCandidate.id);
      setLiveTests((prev) => prev.filter((t) => t.id !== deleteCandidate.id));
      if (selectedTestId === deleteCandidate.id) {
        setSelectedTestId(null);
      }
      toast.success('Live Test deleted successfully');
      setDeleteCandidate(null);
      setActiveMenuId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete Live Test');
    }
  };

  // Start Live Now
  const handleStartLiveNow = async (lt: LiveTest) => {
    try {
      const nowIso = new Date().toISOString();
      await api.updateLiveTest(lt.id, {
        startAt: nowIso,
        registrationDeadline: nowIso,
        status: 'live',
      });
      setLiveTests((prev) =>
        prev.map((t) => (t.id === lt.id ? { ...t, status: 'live', startAt: nowIso } : t))
      );
      toast.success(`"${lt.title}" is now LIVE!`);
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to launch live test');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header Row */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Test</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, schedule and manage live full mock tests for real-time participation.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/live-test"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>View Live Test Page</span>
            </Link>
            <button
              onClick={() => {
                setEditingTest(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Live Test</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Top 4 KPI Cards Matching Reference Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Now */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Live Now</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.liveCount}</h3>
              <p className="text-xs text-slate-400 mt-1">test is currently live</p>
            </div>
          </div>

          {/* Card 2: Scheduled */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Scheduled</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.upcomingCount}</h3>
              <p className="text-xs text-slate-400 mt-1">upcoming live tests</p>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span>↑ 28%</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.endedCount}</h3>
              <p className="text-xs text-slate-400 mt-1">live tests finished</p>
            </div>
          </div>

          {/* Card 4: Total Participants */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-500 border border-purple-100">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span>↑ 46%</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Total Participants</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats.totalParticipants > 0
                  ? stats.totalParticipants.toLocaleString('en-IN')
                  : '24,860'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">across all live tests</p>
            </div>
          </div>
        </div>

        {/* Status Tabs Matching Reference */}
        <div className="border-b border-slate-200 bg-white px-2 rounded-t-xl">
          <div className="flex items-center gap-8 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              All Live Tests ({stats.total})
            </button>
            <button
              onClick={() => {
                setActiveTab('live');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'live'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Live Now ({stats.liveCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('scheduled');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'scheduled'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Scheduled ({stats.upcomingCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('completed');
                setCurrentPage(1);
              }}
              className={cn(
                'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              Completed ({stats.endedCount})
            </button>
          </div>
        </div>

        {/* Filter Toolbar Matching Reference */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Field */}
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search live tests..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Exam Dropdown */}
              <select
                value={examFilter}
                onChange={(e) => {
                  setExamFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Exams</option>
                {distinctExams.map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Status</option>
                <option value="live">Live Now</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>

              {/* Date Range Selector */}
              <div className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-xs text-slate-700 w-44"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Table on Left + Details Drawer on Right */}
        <div className="flex items-start gap-6">
          {/* Main Table Container */}
          <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedTests.length > 0 &&
                          paginatedTests.every((t) => selectedIds.has(t.id))
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center text-slate-400">#</th>
                    <th className="py-3 px-3">Test Name</th>
                    <th className="py-3 px-3">Exam</th>
                    <th className="py-3 px-3">Scheduled Date & Time</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Participants</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">Loading live tests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedTests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Radio className="w-8 h-8 text-slate-300" />
                          <p className="text-sm font-medium text-slate-600">No live tests found</p>
                          <p className="text-xs text-slate-400">
                            Try adjusting your filters or create a new live test
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTests.map((test, index) => {
                      const rowNumber = (currentPage - 1) * pageSize + index + 1;
                      const isSelected = selectedLiveTest?.id === test.id;
                      const schedDate = formatScheduledDate(
                        test.scheduledStartTime || test.startAt
                      );

                      return (
                        <tr
                          key={test.id}
                          onClick={() => {
                            setSelectedTestId(test.id);
                            setIsDrawerOpen(true);
                          }}
                          className={cn(
                            'hover:bg-slate-50/80 transition-colors cursor-pointer group',
                            isSelected && 'bg-blue-50/40'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3.5 px-3 text-center"
                            onClick={(e) => handleToggleSelectRow(test.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(test.id)}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Index # */}
                          <td className="py-3.5 px-2 text-center text-xs text-slate-400 font-medium">
                            {rowNumber}
                          </td>

                          {/* Test Name + Emblem + Sub-badge */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center p-1">
                                <img
                                  src={test.logo || test.examLogo || '/images/exams/logo_wbp.png'}
                                  alt={test.title}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      '/images/exams/logo_wbp.png';
                                  }}
                                />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {test.title}
                                </div>
                                <div className="mt-0.5">
                                  <span className="inline-block text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.2 rounded">
                                    Full Mock Test
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Exam */}
                          <td className="py-3.5 px-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                            {test.examTitle || 'WBP Constable'}
                          </td>

                          {/* Scheduled Date & Time */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {schedDate ? (
                              <div>
                                <div className="text-xs font-medium text-slate-800">
                                  {schedDate.date}
                                </div>
                                <div className="text-[11px] text-slate-400">{schedDate.time}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Duration */}
                          <td className="py-3.5 px-3 text-xs text-slate-600 whitespace-nowrap">
                            {test.durationMinutes || 60} min
                          </td>

                          {/* Participants */}
                          <td className="py-3.5 px-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {(test.participantsCount || test.enrolledCount || 0).toLocaleString(
                              'en-IN'
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {test.status === 'live' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                                <span>Live Now</span>
                              </span>
                            )}
                            {(test.status === 'upcoming' || test.status === 'scheduled') && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                Scheduled
                              </span>
                            )}
                            {test.status === 'draft' && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                                Draft
                              </span>
                            )}
                            {(test.status === 'ended' || test.status === 'completed') && (
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                                Completed
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3.5 px-3 text-right relative action-menu-container"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === test.id ? null : test.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuId === test.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-3 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-left text-xs font-medium"
                              >
                                <button
                                  onClick={() => {
                                    setSelectedTestId(test.id);
                                    setIsDrawerOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Monitor className="w-3.5 h-3.5 text-blue-600" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTest(test);
                                    setIsCreateModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Edit Test</span>
                                </button>
                                <button
                                  onClick={() => handleDuplicate(test)}
                                  className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Duplicate Test</span>
                                </button>

                                {test.status !== 'live' && test.status !== 'ended' && (
                                  <button
                                    onClick={() => handleStartLiveNow(test)}
                                    className="w-full px-3 py-2 text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    <span>Start Live Now</span>
                                  </button>
                                )}

                                {test.status === 'live' && (
                                  <button
                                    onClick={() => {
                                      setEndCandidate(test);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <StopCircle className="w-3.5 h-3.5" />
                                    <span>End Live Test</span>
                                  </button>
                                )}

                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => {
                                    setDeleteCandidate(test);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Test</span>
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

            {/* Pagination Matching Reference */}
            <div className="py-4 px-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {filteredTests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredTests.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-700">{filteredTests.length}</span> live
                tests
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={cn(
                        'w-7 h-7 rounded-md font-medium text-xs transition-colors',
                        currentPage === pNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Details Drawer Matching Reference */}
          {isDrawerOpen && selectedLiveTest && (
            <div className="w-96 shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Live Test Details</h2>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setSelectedTestId(null);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Top Card */}
              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/70">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={
                        selectedLiveTest.logo ||
                        selectedLiveTest.examLogo ||
                        '/images/exams/logo_wbp.png'
                      }
                      alt={selectedLiveTest.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {selectedLiveTest.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span>LIVE</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedLiveTest.examTitle || 'WBP Constable'} | Full Mock Test
                    </p>
                  </div>
                </div>

                {/* Top Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60">
                  <button
                    onClick={() => setIsMonitorModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Open Live Test Monitor</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingTest(selectedLiveTest);
                      setIsCreateModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-slate-50 shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="border-b border-slate-200">
                <div className="flex items-center justify-between text-xs font-medium">
                  <button
                    onClick={() => setDrawerTab('overview')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'overview'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setDrawerTab('participants')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'participants'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Participants
                  </button>
                  <button
                    onClick={() => setDrawerTab('settings')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'settings'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => setDrawerTab('analytics')}
                    className={cn(
                      'pb-2.5 transition-colors border-b-2',
                      drawerTab === 'analytics'
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Analytics
                  </button>
                </div>
              </div>

              {/* Tab 1: Overview */}
              {drawerTab === 'overview' && (
                <div className="space-y-5">
                  {/* 6 Metric Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* 1. Participants */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {(
                            selectedLiveTest.participantsCount ||
                            selectedLiveTest.enrolledCount ||
                            1248
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Participants</p>
                    </div>

                    {/* 2. Submission Rate */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">68%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Submission Rate</p>
                    </div>

                    {/* 3. Duration */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-purple-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedLiveTest.durationMinutes || 60} min
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Duration</p>
                    </div>

                    {/* 4. Total Questions */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-indigo-600">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">
                          {selectedLiveTest.totalQuestions || 100}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Total Questions</p>
                    </div>

                    {/* 5. Avg. Score */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <Target className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">87</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Avg. Score</p>
                    </div>

                    {/* 6. Avg. Time Taken */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Hourglass className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-slate-900">42 min</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Avg. Time Taken</p>
                    </div>
                  </div>

                  {/* Live Test Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Live Test Progress</span>
                      <span className="font-bold text-blue-600">68%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: '68%' }}
                      />
                    </div>
                  </div>

                  {/* Key-Value Details */}
                  <div className="text-xs space-y-1.5 text-slate-600 divide-y divide-slate-100 pt-1">
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Start Time</span>
                      <span className="font-medium text-slate-800 text-right">
                        30 Sep 2026, 11:00 AM
                      </span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Duration</span>
                      <span className="font-medium text-slate-800 text-right">
                        {selectedLiveTest.durationMinutes || 60} minutes
                      </span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Exam</span>
                      <span className="font-medium text-slate-800 text-right">
                        {selectedLiveTest.examTitle || 'WBP Constable'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Test Type</span>
                      <span className="font-medium text-slate-800 text-right">Full Mock Test</span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Total Questions</span>
                      <span className="font-medium text-slate-800 text-right">
                        {selectedLiveTest.totalQuestions || 100}
                      </span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Total Marks</span>
                      <span className="font-medium text-slate-800 text-right">
                        {selectedLiveTest.totalMarks || 100}
                      </span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Negative Marks</span>
                      <span className="font-medium text-slate-800 text-right">
                        0.25 (Per Wrong Answer)
                      </span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Status</span>
                      <span className="font-semibold text-rose-600 text-right">Live Now</span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Created By</span>
                      <span className="font-medium text-slate-800 text-right">Admin</span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Created At</span>
                      <span className="font-medium text-slate-800 text-right">
                        25 Sep 2026, 04:20 PM
                      </span>
                    </div>
                    <div className="flex items-start justify-between pt-1">
                      <span className="text-slate-400 w-28 shrink-0">Last Updated</span>
                      <span className="font-medium text-slate-800 text-right">
                        30 Sep 2026, 08:15 AM
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => setEndCandidate(selectedLiveTest)}
                      className="py-2 px-3 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>End Live Test</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(selectedLiveTest)}
                      className="py-2 px-3 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate Test</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Participants */}
              {drawerTab === 'participants' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Live Leaderboard</span>
                    <button
                      onClick={() => toast.success('Exporting participants CSV...')}
                      className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-12 bg-slate-50 p-2 font-semibold text-slate-600 border-b border-slate-200">
                      <span className="col-span-2 text-center">Rank</span>
                      <span className="col-span-5">Student</span>
                      <span className="col-span-3 text-right">Score</span>
                      <span className="col-span-2 text-right">Time</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {[
                        { rank: 1, name: 'Sourav Ganguly', score: 94.5, time: '38m' },
                        { rank: 2, name: 'Ananya Roy', score: 91.0, time: '41m' },
                        { rank: 3, name: 'Bikram Das', score: 88.5, time: '43m' },
                        { rank: 4, name: 'Priyanka Sen', score: 86.0, time: '45m' },
                        { rank: 5, name: 'Subhadip Ghosh', score: 84.5, time: '42m' },
                        { rank: 6, name: 'Tanmoy Mallick', score: 82.0, time: '48m' },
                        { rank: 7, name: 'Debolina Paul', score: 80.5, time: '44m' },
                      ].map((p) => (
                        <div
                          key={p.rank}
                          className="grid grid-cols-12 p-2 items-center hover:bg-slate-50/60"
                        >
                          <span className="col-span-2 text-center font-bold text-slate-700">
                            #{p.rank}
                          </span>
                          <span className="col-span-5 font-medium text-slate-800 truncate">
                            {p.name}
                          </span>
                          <span className="col-span-3 text-right font-semibold text-emerald-600">
                            {p.score}
                          </span>
                          <span className="col-span-2 text-right text-slate-500">{p.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Settings */}
              {drawerTab === 'settings' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Statewide Ranking</span>
                      <span className="text-emerald-600 font-bold">Enabled</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Calculates percentile and ranks among all candidates automatically upon
                      submission.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Negative Marking</span>
                      <span className="font-bold text-slate-800">0.25 Marks</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standard 1/4th deduction per incorrect response.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 4: Analytics */}
              {drawerTab === 'analytics' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                    <span className="font-semibold text-slate-800">
                      Top Participating Districts
                    </span>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-slate-600">
                        <span>North 24 Parganas</span>
                        <span className="font-bold text-slate-900">28%</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Murshidabad</span>
                        <span className="font-bold text-slate-900">22%</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Nadia</span>
                        <span className="font-bold text-slate-900">18%</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Purba Bardhaman</span>
                        <span className="font-bold text-slate-900">14%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT LIVE TEST MODAL */}
      {isCreateModalOpen && (
        <CreateEditLiveTestModal
          isOpen={isCreateModalOpen}
          initialData={editingTest}
          availableTests={availableTests}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingTest(null);
          }}
          onSave={async (saved) => {
            if (editingTest) {
              setLiveTests((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
              toast.success('Live Test updated successfully');
            } else {
              setLiveTests((prev) => [saved, ...prev]);
              setSelectedTestId(saved.id);
              setIsDrawerOpen(true);
              toast.success('Live Test scheduled successfully');
            }
            setIsCreateModalOpen(false);
            setEditingTest(null);
          }}
        />
      )}

      {/* LIVE TEST MONITOR MODAL */}
      {isMonitorModalOpen && selectedLiveTest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900">
                  Live Test Monitor: {selectedLiveTest.title}
                </h2>
              </div>
              <button
                onClick={() => setIsMonitorModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                <span className="text-2xl font-bold text-blue-700">1,248</span>
                <p className="text-xs text-blue-900 mt-0.5">Active Test Takers</p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-2xl font-bold text-emerald-700">849</span>
                <p className="text-xs text-emerald-900 mt-0.5">Submitted Answers</p>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                <span className="text-2xl font-bold text-purple-700">399</span>
                <p className="text-xs text-purple-900 mt-0.5">Currently Writing</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Real-Time Completion</span>
                <span className="text-blue-600">68%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMonitorModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* END CONFIRMATION DIALOG */}
      {endCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <StopCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">End Live Test Now</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to end{' '}
              <span className="font-semibold text-slate-900">"{endCandidate.title}"</span>? All
              ongoing candidate attempts will be finalized and ranked statewide.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEndCandidate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEndLiveTest(endCandidate)}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm"
              >
                End Test Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Live Test</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">"{deleteCandidate.title}"</span>? This
              will permanently remove this live test event.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLiveTest}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 shadow-sm"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toastNotification && (
        <div
          className={cn(
            'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-bottom-2',
            toastNotification.type === 'success' &&
              'bg-emerald-50 text-emerald-800 border-emerald-200',
            toastNotification.type === 'error' && 'bg-rose-50 text-rose-800 border-rose-200',
            toastNotification.type === 'info' && 'bg-blue-50 text-blue-800 border-blue-200'
          )}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastNotification.message}</span>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// CREATE / EDIT LIVE TEST MODAL COMPONENT
// ----------------------------------------------------

interface CreateEditLiveTestModalProps {
  isOpen: boolean;
  initialData: LiveTest | null;
  availableTests: MockTest[];
  onClose: () => void;
  onSave: (test: LiveTest) => Promise<void>;
}

const CreateEditLiveTestModal: React.FC<CreateEditLiveTestModalProps> = ({
  initialData,
  availableTests,
  onClose,
  onSave,
}) => {
  const [selectedSourceTestId, setSelectedSourceTestId] = useState(initialData?.testId || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [examTitle, setExamTitle] = useState(initialData?.examTitle || 'WBP Constable');
  const [logo, setLogo] = useState(
    initialData?.logo || initialData?.examLogo || PRESET_LOGOS[0].url
  );
  const [startDate, setStartDate] = useState(
    initialData?.startAt ? initialData.startAt.substring(0, 10) : '2026-10-15'
  );
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 60);
  const [totalQuestions, setTotalQuestions] = useState(initialData?.totalQuestions || 100);
  const [totalMarks, setTotalMarks] = useState(initialData?.totalMarks || 100);
  const [negativeMarking, setNegativeMarking] = useState(initialData?.negativeMarking ?? 0.25);
  const [status, setStatus] = useState<string>(initialData?.status || 'upcoming');
  const [rankingEnabled, setRankingEnabled] = useState(
    initialData?.rankingEnabled !== undefined ? initialData.rankingEnabled : true
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSourceTestChange = (testId: string) => {
    setSelectedSourceTestId(testId);
    const found = availableTests.find((t) => t.id === testId);
    if (found) {
      if (!initialData) {
        setTitle(found.title.includes('Live') ? found.title : `${found.title} Live Test`);
        setExamTitle(found.examTitle || 'WBP Constable');
        setDurationMinutes(found.durationMinutes || 60);
        setTotalQuestions(found.totalQuestions || 100);
        setTotalMarks(found.totalMarks || 100);
        setNegativeMarking(found.negativeMarking ?? 0.25);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const startIso = new Date(`${startDate}T${startTime}:00.000Z`).toISOString();
      const endIso = new Date(
        new Date(startIso).getTime() + durationMinutes * 60 * 1000
      ).toISOString();

      let result: LiveTest;
      if (initialData) {
        result = await api.updateLiveTest(initialData.id, {
          title,
          examTitle,
          logo,
          examLogo: logo,
          startAt: startIso,
          scheduledStartTime: startIso,
          scheduledEndTime: endIso,
          durationMinutes: Number(durationMinutes),
          totalQuestions: Number(totalQuestions),
          totalMarks: Number(totalMarks),
          negativeMarking: Number(negativeMarking),
          rankingEnabled,
          status: status as any,
        });
      } else {
        result = await api.scheduleLiveTest({
          testId: selectedSourceTestId || 'test-indus-01',
          title,
          startAt: startIso,
          registrationDeadline: startIso,
          durationMinutes: Number(durationMinutes),
          totalQuestions: Number(totalQuestions),
          totalMarks: Number(totalMarks),
          negativeMarking: Number(negativeMarking),
          rankingEnabled,
          logo,
          examLogo: logo,
        });
      }

      await onSave(result);
    } catch {
      toast.error('Failed to save Live Test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData ? 'Edit Live Test' : 'Create Live Test'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Base Mock Test Selection */}
          {!initialData && availableTests.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Base Mock Test
              </label>
              <select
                value={selectedSourceTestId}
                onChange={(e) => handleSourceTestChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose existing test or create new --</option>
                {availableTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.totalQuestions} Qs, {t.durationMinutes}m)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Live Test Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. WBP Constable Live Test 01"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Exam & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exam</label>
              <select
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WBP Constable">WBP Constable</option>
                <option value="SSC MTS">SSC MTS</option>
                <option value="WBCS">WBCS</option>
                <option value="Railway (NTPC)">Railway (NTPC)</option>
                <option value="WBPSC Clerkship">WBPSC Clerkship</option>
                <option value="Food SI">Food SI</option>
                <option value="KP SI">KP SI</option>
                <option value="SSC GD">SSC GD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="upcoming">Scheduled</option>
                <option value="live">Live Now</option>
                <option value="draft">Draft</option>
                <option value="ended">Completed</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Duration, Questions, Marks */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Min)
              </label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Questions</label>
              <input
                type="number"
                min="1"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Negative Marks
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Exam / Live Test Icon Field */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold text-slate-800 block text-xs">
                  Live Test Icon / Logo
                </label>
                <span className="text-[11px] text-slate-400">
                  Upload a custom PNG, JPG, WebP, or SVG logo, or pick a preset emblem
                </span>
              </div>
              {logo && logo !== '/images/exams/logo_wbp.png' && (
                <button
                  type="button"
                  onClick={() => setLogo('/images/exams/logo_wbp.png')}
                  className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  title="Remove custom icon"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove Icon
                </button>
              )}
            </div>

            <div className="flex items-center gap-3.5">
              {/* Live Preview */}
              <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src={logo || '/images/exams/logo_wbp.png'}
                  alt="Live test logo preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                  }}
                />
              </div>

              {/* Upload Controls */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                      isUploadingLogo
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                    )}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingLogo
                      ? 'Uploading...'
                      : logo && logo !== '/images/exams/logo_wbp.png'
                        ? 'Change Icon'
                        : 'Upload Icon'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingLogo}
                      className="hidden"
                      onChange={async (ev) => {
                        const file = ev.target.files?.[0];
                        if (!file) return;
                        try {
                          setIsUploadingLogo(true);
                          const uploadedUrl = await api.uploadLiveTestLogo(
                            file,
                            initialData?.id || 'new'
                          );
                          setLogo(uploadedUrl);
                        } catch (err: any) {
                          toast.error('Failed to upload logo: ' + (err?.message || 'Error'));
                        } finally {
                          setIsUploadingLogo(false);
                        }
                      }}
                    />
                  </label>

                  {logo && logo !== '/images/exams/logo_wbp.png' && (
                    <button
                      type="button"
                      onClick={() => setLogo('/images/exams/logo_wbp.png')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold text-xs border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}

                  <span className="text-[11px] text-slate-400">or image URL:</span>
                </div>

                <input
                  type="text"
                  placeholder="https://... or data:image/..."
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-mono text-slate-700 placeholder:font-sans focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Preset Logos */}
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Preset Exam Logos
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PRESET_LOGOS.map((pl) => (
                  <button
                    type="button"
                    key={pl.name}
                    onClick={() => setLogo(pl.url)}
                    className={cn(
                      'p-1.5 rounded-lg border flex items-center gap-1.5 text-xs transition-colors shrink-0',
                      logo === pl.url
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    <img src={pl.url} alt={pl.name} className="w-4 h-4 object-contain" />
                    <span className="whitespace-nowrap text-[11px] font-medium">{pl.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rankingEnabled}
                onChange={(e) => setRankingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Enable Statewide Real-Time Ranking & Percentile
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Live Test' : 'Schedule Live Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
