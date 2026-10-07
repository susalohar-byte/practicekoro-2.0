import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import type { Exam } from '@/types';
import { requireSuccess } from '@/services/domains/admin.mutations';
import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface CutoffItem {
  id: number | string;
  exam: string;
  year: number;
  stage: string;
  category: string;
  categoryBadgeClass: string;
  cutoffMarks: number;
  totalPosts: string;
  addedOn?: string;
  addedBy?: string;
  source?: string;
  notes?: string;
}

export interface RecentUpdateItem {
  id: number;
  exam: string;
  year: number;
  stage: string;
  addedOn: string;
  addedBy: string;
  type: string;
}

// Initial Cutoff Table dataset strictly matching screenshot media_1791200550498.jpg
const INITIAL_CUTOFFS: CutoffItem[] = [
  {
    id: 1,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'General',
    categoryBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    cutoffMarks: 85.25,
    totalPosts: '',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'Combined written exam + interview score after normalized evaluation.',
  },
  {
    id: 2,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'OBC-A',
    categoryBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    cutoffMarks: 81.5,
    totalPosts: '11,746',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'OBC-A category cutoff for male & female combined quota.',
  },
  {
    id: 3,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'OBC-B',
    categoryBadgeClass: 'bg-[#FEF3C7] text-[#B45309]',
    cutoffMarks: 78.75,
    totalPosts: '11,746',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'OBC-B final merit cutoff threshold.',
  },
  {
    id: 4,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'SC',
    categoryBadgeClass: 'bg-[#EDE9FE] text-[#6D28D9]',
    cutoffMarks: 73.25,
    totalPosts: '11,746',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'Scheduled Caste quota cutoff benchmark.',
  },
  {
    id: 5,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'ST',
    categoryBadgeClass: 'bg-[#FFE4E6] text-[#BE123C]',
    cutoffMarks: 68.5,
    totalPosts: '11,746',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'Scheduled Tribe quota cutoff benchmark.',
  },
  {
    id: 6,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'EWS',
    categoryBadgeClass: 'bg-[#FEF9C3] text-[#A16207]',
    cutoffMarks: 80.0,
    totalPosts: '11,746',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'Economically Weaker Section reservation standard.',
  },
  {
    id: 7,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'Female (General)',
    categoryBadgeClass: 'bg-[#E0E7FF] text-[#4338CA]',
    cutoffMarks: 82.0,
    totalPosts: '11,746',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'Female specific unreserved merit category benchmark.',
  },
  {
    id: 8,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    category: 'Female (SC)',
    categoryBadgeClass: 'bg-[#F3E8FF] text-[#7E22CE]',
    cutoffMarks: 70.25,
    totalPosts: '11,746',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    source: 'WBPRB Official Notification Memo No. PRB/RECT/2024-89',
    notes: 'Female specific Scheduled Caste merit category benchmark.',
  },
];

// Recent Updates dataset strictly matching screenshot media_1791200550498.jpg
const RECENT_UPDATES: RecentUpdateItem[] = [
  {
    id: 1,
    exam: 'WBP Constable',
    year: 2024,
    stage: 'Final Merit',
    addedOn: '12 Aug 2026',
    addedBy: 'Admin',
    type: 'Official',
  },
  {
    id: 2,
    exam: 'WBSSC Group C',
    year: 2024,
    stage: 'Final Merit',
    addedOn: '10 Aug 2026',
    addedBy: 'Admin',
    type: 'Official',
  },
  {
    id: 3,
    exam: 'WBSSC Group D',
    year: 2024,
    stage: 'Final Merit',
    addedOn: '08 Aug 2026',
    addedBy: 'Admin',
    type: 'Official',
  },
  {
    id: 4,
    exam: 'ICDS',
    year: 2024,
    stage: 'Final Merit',
    addedOn: '05 Aug 2026',
    addedBy: 'Admin',
    type: 'Official',
  },
  {
    id: 5,
    exam: 'Railway (NTPC)',
    year: 2024,
    stage: 'CBT-1',
    addedOn: '02 Aug 2026',
    addedBy: 'Admin',
    type: 'Official',
  },
];

// Cutoff Trend Data (WBP Constable – General) matching screenshot
const GENERAL_TREND_DATA = [
  { year: '2019', value: 67.5 },
  { year: '2020', value: 72.25 },
  { year: '2021', value: 76.0 },
  { year: '2022', value: 80.5 },
  { year: '2023', value: 83.75 },
  { year: '2024', value: 85.25 },
];

// Category-wise Cutoff horizontal bars (WBP Constable 2024) matching screenshot
const CATEGORY_BARS_DATA = [
  { category: 'General', value: 85.25, color: '#2563EB' },
  { category: 'OBC-A', value: 81.5, color: '#10B981' },
  { category: 'OBC-B', value: 78.75, color: '#F59E0B' },
  { category: 'SC', value: 73.25, color: '#8B5CF6' },
  { category: 'ST', value: 68.5, color: '#FB7185' },
  { category: 'EWS', value: 80.0, color: '#06B6D4' },
  { category: 'Female (General)', value: 82.0, color: '#F43F5E' },
  { category: 'Female (SC)', value: 70.25, color: '#A855F7' },
];

// Multi-category year-wise data for Comparison Widget
const YEAR_WISE_COMPARISON: Record<string, { year: string; value: number; color: string }[]> = {
  General: [
    { year: '2019', value: 67.5, color: '#60A5FA' },
    { year: '2020', value: 72.25, color: '#34D399' },
    { year: '2021', value: 76.0, color: '#FBBF24' },
    { year: '2022', value: 80.5, color: '#C084FC' },
    { year: '2023', value: 83.75, color: '#FB7185' },
    { year: '2024', value: 85.25, color: '#2DD4BF' },
  ],
  'OBC-A': [
    { year: '2019', value: 63.25, color: '#60A5FA' },
    { year: '2020', value: 68.0, color: '#34D399' },
    { year: '2021', value: 71.5, color: '#FBBF24' },
    { year: '2022', value: 75.75, color: '#C084FC' },
    { year: '2023', value: 79.25, color: '#FB7185' },
    { year: '2024', value: 81.5, color: '#2DD4BF' },
  ],
  'OBC-B': [
    { year: '2019', value: 60.5, color: '#60A5FA' },
    { year: '2020', value: 65.25, color: '#34D399' },
    { year: '2021', value: 69.0, color: '#FBBF24' },
    { year: '2022', value: 73.0, color: '#C084FC' },
    { year: '2023', value: 76.5, color: '#FB7185' },
    { year: '2024', value: 78.75, color: '#2DD4BF' },
  ],
  SC: [
    { year: '2019', value: 54.0, color: '#60A5FA' },
    { year: '2020', value: 59.5, color: '#34D399' },
    { year: '2021', value: 63.75, color: '#FBBF24' },
    { year: '2022', value: 67.25, color: '#C084FC' },
    { year: '2023', value: 70.8, color: '#FB7185' },
    { year: '2024', value: 73.25, color: '#2DD4BF' },
  ],
  ST: [
    { year: '2019', value: 49.25, color: '#60A5FA' },
    { year: '2020', value: 53.5, color: '#34D399' },
    { year: '2021', value: 58.0, color: '#FBBF24' },
    { year: '2022', value: 62.1, color: '#C084FC' },
    { year: '2023', value: 65.75, color: '#FB7185' },
    { year: '2024', value: 68.5, color: '#2DD4BF' },
  ],
  EWS: [
    { year: '2019', value: 61.0, color: '#60A5FA' },
    { year: '2020', value: 66.5, color: '#34D399' },
    { year: '2021', value: 70.25, color: '#FBBF24' },
    { year: '2022', value: 74.0, color: '#C084FC' },
    { year: '2023', value: 77.5, color: '#FB7185' },
    { year: '2024', value: 80.0, color: '#2DD4BF' },
  ],
};

// ============================================================================
// EXAM ICON EMBLEM COMPONENT
// ============================================================================

const ExamLogoEmblem: React.FC<{ examName: string }> = ({ examName }) => {
  if (examName.includes('WBP') || examName.includes('Police')) {
    return (
      <div className="w-6 h-6 rounded-md bg-[#EF4444] flex items-center justify-center text-white shadow-2xs shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" stroke="none">
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 4.5c1.38 0 2.5 1.12 2.5 2.5S13.38 11.5 12 11.5 9.5 10.38 9.5 9s1.12-2.5 2.5-2.5zm0 12c-2.43 0-4.57-1.34-5.65-3.32.03-1.87 3.77-2.9 5.65-2.9 1.87 0 5.62 1.03 5.65 2.9-1.08 1.98-3.22 3.32-5.65 3.32z" />
        </svg>
      </div>
    );
  }
  if (examName.includes('Group C')) {
    return (
      <div className="w-6 h-6 rounded-md bg-[#EA580C] flex items-center justify-center text-white shadow-2xs shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    );
  }
  if (examName.includes('Group D')) {
    return (
      <div className="w-6 h-6 rounded-md bg-[#4F46E5] flex items-center justify-center text-white shadow-2xs shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" stroke="none">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.96.76 1.58V19z" />
        </svg>
      </div>
    );
  }
  if (examName.includes('ICDS')) {
    return (
      <div className="w-6 h-6 rounded-md bg-[#E11D48] flex items-center justify-center text-white shadow-2xs shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" stroke="none">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" stroke="#fff" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }
  if (examName.includes('Railway') || examName.includes('NTPC')) {
    return (
      <div className="w-6 h-6 rounded-md bg-[#16A34A] flex items-center justify-center text-white shadow-2xs shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" stroke="none">
          <path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zm8 1.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7H6V5h12v5z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center text-white shadow-2xs shrink-0">
      <BookOpen className="w-3.5 h-3.5" />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: ADMIN CUTOFF
// ============================================================================

export const AdminCutoff: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    api
      .getAllAdminExams()
      .then(setAvailableExams)
      .catch((err) => showToast(err instanceof Error ? err.message : 'Exams could not be loaded'));
  }, []);
  // Local storage persisted cutoffs list
  const [cutoffsList, setCutoffsList] = useState<CutoffItem[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_cutoffs_v2');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_CUTOFFS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_cutoffs_v2', JSON.stringify(cutoffsList));
    } catch {
      // ignore
    }
  }, [cutoffsList]);

  // Load live cutoff records from database on mount
  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    api
      .getCutoffRecords()
      .then((records) => {
        if (!isMounted) return;
        if (!records || records.length === 0) {
          if (isSupabaseConfigured) {
            setCutoffsList([]);
            setSelectedRowId('');
          }
          return;
        }
        const mapped: CutoffItem[] = records.map((r) => {
          let badgeClass = 'bg-[#DBEAFE] text-[#1E40AF]';
          const cat = String(r.category);
          if (cat === 'OBC-A' || cat === 'OBC_A') badgeClass = 'bg-[#DCFCE7] text-[#15803D]';
          else if (cat === 'OBC-B' || cat === 'OBC_B') badgeClass = 'bg-[#FEF3C7] text-[#B45309]';
          else if (cat === 'SC') badgeClass = 'bg-[#EDE9FE] text-[#6D28D9]';
          else if (cat === 'ST') badgeClass = 'bg-[#FFE4E6] text-[#BE123C]';

          return {
            id: r.id,
            exam: r.examTitle || 'WBP Constable',
            year: r.year,
            stage: r.stage,
            category: r.category,
            categoryBadgeClass: badgeClass,
            cutoffMarks: r.cutoffMarks,
            totalPosts: '11,746',
            addedOn: r.verifiedDate
              ? new Date(r.verifiedDate).toLocaleDateString('en-GB')
              : r.createdAt
                ? new Date(r.createdAt).toLocaleDateString('en-GB')
                : '',
            addedBy: r.verifiedBy || 'Admin',
            source: r.source,
            notes: r.notes,
          };
        });
        setCutoffsList(mapped);
        setSelectedRowId((prev) => {
          if (!prev) return '';
          return mapped.some((m) => m.id === prev) ? prev : '';
        });
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Cutoffs could not be loaded.');
        if (isSupabaseConfigured) {
          setCutoffsList([]);
          setSelectedRowId('');
        }
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter states
  const [filterExam, setFilterExam] = useState<string>('WBP Constable');
  const [filterYear, setFilterYear] = useState<string>('2024');
  const [filterCategory, setFilterCategory] = useState<string>('All Categories');
  const [filterStage, setFilterStage] = useState<string>('Final Merit');
  const [appliedFilters, setAppliedFilters] = useState({
    exam: 'WBP Constable',
    year: '2024',
    category: 'All Categories',
    stage: 'Final Merit',
  });

  // Selected Row state (Neutral initial state - nothing selected by default)
  const [selectedRowId, setSelectedRowId] = useState<number | string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Row Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);

  // Widget 3 category filter tab
  const [comparisonCategory, setComparisonCategory] = useState<string>('General');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CutoffItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<CutoffItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<CutoffItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // "View All" Modal states
  const [viewAllTrendOpen, setViewAllTrendOpen] = useState(false);
  const [viewAllRecentOpen, setViewAllRecentOpen] = useState(false);
  const [viewAllComparisonOpen, setViewAllComparisonOpen] = useState(false);

  // Add / Edit Form State
  const [formExam, setFormExam] = useState('WBP Constable');
  const [formYear, setFormYear] = useState('2024');
  const [formStage, setFormStage] = useState('Final Merit');
  const [formCategory, setFormCategory] = useState('General');
  const [formCutoffMarks, setFormCutoffMarks] = useState('85.25');
  const [formTotalPosts, setFormTotalPosts] = useState('11,746');
  const [formSource, setFormSource] = useState(
    'WBPRB Official Notification Memo No. PRB/RECT/2024-89'
  );
  const [formNotes, setFormNotes] = useState(
    'Official normalized threshold score for merit placement.'
  );

  // Helper Toast trigger
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Close actions menu on external click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  // Filter application
  const handleApplyFilter = () => {
    setAppliedFilters({
      exam: filterExam,
      year: filterYear,
      category: filterCategory,
      stage: filterStage,
    });
    setCurrentPage(1);
    showToast(`Filters applied: ${filterExam} • ${filterYear} • ${filterStage}`);
  };

  const handleResetFilter = () => {
    setFilterExam('WBP Constable');
    setFilterYear('2024');
    setFilterCategory('All Categories');
    setFilterStage('Final Merit');
    setAppliedFilters({
      exam: 'WBP Constable',
      year: '2024',
      category: 'All Categories',
      stage: 'Final Merit',
    });
    setCurrentPage(1);
    showToast('Filters reset to default view.');
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return cutoffsList.filter((row) => {
      if (appliedFilters.exam !== 'All Exams' && row.exam !== appliedFilters.exam) return false;
      if (appliedFilters.year !== 'All Years' && String(row.year) !== appliedFilters.year)
        return false;
      if (appliedFilters.stage !== 'All Stages' && row.stage !== appliedFilters.stage) return false;
      if (appliedFilters.category !== 'All Categories' && row.category !== appliedFilters.category)
        return false;
      return true;
    });
  }, [cutoffsList, appliedFilters]);

  // Category badge class helper
  const getCategoryBadgeClass = (cat: string): string => {
    switch (cat) {
      case 'General':
        return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'OBC-A':
        return 'bg-[#DCFCE7] text-[#15803D]';
      case 'OBC-B':
        return 'bg-[#FEF3C7] text-[#B45309]';
      case 'SC':
        return 'bg-[#EDE9FE] text-[#6D28D9]';
      case 'ST':
        return 'bg-[#FFE4E6] text-[#BE123C]';
      case 'EWS':
        return 'bg-[#FEF9C3] text-[#A16207]';
      case 'Female (General)':
        return 'bg-[#E0E7FF] text-[#4338CA]';
      case 'Female (SC)':
        return 'bg-[#F3E8FF] text-[#7E22CE]';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormExam(appliedFilters.exam !== 'All Exams' ? appliedFilters.exam : 'WBP Constable');
    setFormYear('2024');
    setFormStage('Final Merit');
    setFormCategory('General');
    setFormCutoffMarks('85.25');
    setFormTotalPosts('11,746');
    setFormSource('WBPRB Official Notification Memo No. PRB/RECT/2024-89');
    setFormNotes('Official cutoff benchmark for recruitment selection.');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: CutoffItem) => {
    setEditingItem(item);
    setFormExam(item.exam);
    setFormYear(String(item.year));
    setFormStage(item.stage);
    setFormCategory(item.category);
    setFormCutoffMarks(item.cutoffMarks.toFixed(2));
    setFormTotalPosts(item.totalPosts);
    setFormSource(item.source || 'WBPRB Official Notification Memo No. PRB/RECT/2024-89');
    setFormNotes(item.notes || '');
    setIsAddModalOpen(true);
  };

  // Save Modal (Create or Edit)
  const handleSaveCutoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const exam = availableExams.find((x) => x.title === formExam);
      if (!exam) throw new Error('Select an existing backend exam.');
      const existing = editingItem
        ? (await api.getCutoffRecords()).find((x) => x.id === String(editingItem.id))
        : undefined;
      if (editingItem && !existing) throw new Error('The cutoff no longer exists.');
      const saved = await api.saveCutoffRecord({
        ...existing,
        id: existing?.id,
        examId: exam.id,
        examTitle: exam.title,
        year: Number(formYear),
        stage: formStage as any,
        cutoffType: existing?.cutoffType || 'OFFICIAL',
        category: (formCategory === 'General' ? 'GEN' : formCategory.replace('-', '_')) as any,
        gender: existing?.gender || 'ALL',
        district: existing?.district || 'ALL',
        scoreType: existing?.scoreType || 'raw_marks',
        maxMarks: existing?.maxMarks || 100,
        cutoffMarks: Number(formCutoffMarks),
        percentage: undefined,
        sourceType: existing?.sourceType || 'Official Notification',
        source: formSource,
        verificationStatus: existing?.verificationStatus || 'Pending Verification',
        notes: formNotes,
        status: existing?.status || 'draft',
        totalPosts: formTotalPosts,
      });
      if (!saved.id) throw new Error('Saved ID missing');
      const item: CutoffItem = {
        id: saved.id,
        exam: saved.examTitle,
        year: saved.year,
        stage: saved.stage,
        category: saved.category,
        categoryBadgeClass: getCategoryBadgeClass(saved.category),
        cutoffMarks: saved.cutoffMarks,
        totalPosts: saved.totalPosts || '',
        addedOn: new Date(saved.createdAt || Date.now()).toLocaleDateString('en-GB'),
        addedBy: saved.verifiedBy || 'Admin',
        source: saved.source,
        notes: saved.notes,
      };
      setCutoffsList((prev) =>
        editingItem ? prev.map((x) => (String(x.id) === saved.id ? item : x)) : [item, ...prev]
      );
      setIsAddModalOpen(false);
      showToast('Cutoff saved in the database.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Cutoff
  const handleDeleteCutoff = async () => {
    if (!deleteConfirmItem) return;
    try {
      const id = deleteConfirmItem.id;
      requireSuccess(await api.deleteCutoffRecord(String(id)));
      setCutoffsList((prev) => prev.filter((x) => x.id !== id));
      if (selectedRowId === id) setSelectedRowId('');
      setDeleteConfirmItem(null);
      showToast('Cutoff deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Duplicate Cutoff
  const handleDuplicate = (item: CutoffItem) => {
    setEditingItem(null);
    setFormExam(item.exam);
    setFormYear(String(item.year));
    setFormStage(item.stage);
    setFormCategory(item.category);
    setFormCutoffMarks(String(item.cutoffMarks));
    setFormTotalPosts(item.totalPosts);
    setFormSource(item.source || '');
    setFormNotes(item.notes || '');
    setIsAddModalOpen(true);
    showToast('Review the copy and Save to persist a new record.');
  };

  // Comparison comparison data for Widget 3
  const activeComparisonData =
    YEAR_WISE_COMPARISON[comparisonCategory] || YEAR_WISE_COMPARISON['General'];

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP HEADER & ACTION BUTTON                                       */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cutoff</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            View and manage exam cutoffs from previous years. Helps students understand the expected
            cutoff and plan better.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors self-start shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cutoff</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRIC CARDS                                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Exams */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">Total Exams</span>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {new Set(cutoffsList.map((c) => c.exam)).size}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              with cutoff data
            </span>
          </div>
        </div>

        {/* Card 2: Total Years */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">Total Years</span>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {new Set(cutoffsList.map((c) => c.year)).size}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {cutoffsList.length > 0
                ? `${Math.min(...cutoffsList.map((c) => c.year))} – ${Math.max(...cutoffsList.map((c) => c.year))}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Categories */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">Total Categories</span>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {new Set(cutoffsList.map((c) => c.category)).size}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              General, OBC, SC, ST, EWS, Others
            </span>
          </div>
        </div>

        {/* Card 4: Latest Cutoff Added */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">
              Latest Cutoff Added
            </span>
            <div className="text-base font-bold text-slate-900 leading-tight truncate">
              {cutoffsList.length > 0 ? `${cutoffsList[0].exam} ${cutoffsList[0].year}` : '—'}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {cutoffsList.length > 0 ? `Added ${cutoffsList[0].addedOn}` : 'No cutoff recorded'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTERS TOOLBAR                                                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-end gap-3 lg:gap-4">
        {/* Select Exam */}
        <div className="flex-1 min-w-[170px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Select Exam</label>
          <div className="relative">
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="WBP Constable">WBP Constable</option>
              <option value="WBSSC Group C">WBSSC Group C</option>
              <option value="WBSSC Group D">WBSSC Group D</option>
              <option value="ICDS">ICDS</option>
              <option value="Railway (NTPC)">Railway (NTPC)</option>
              <option value="WBPSC Clerkship">WBPSC Clerkship</option>
              <option value="All Exams">All Exams</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Year */}
        <div className="w-[110px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Year</label>
          <div className="relative">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="All Years">All Years</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category */}
        <div className="flex-1 min-w-[140px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Category</label>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              <option value="General">General</option>
              <option value="OBC-A">OBC-A</option>
              <option value="OBC-B">OBC-B</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
              <option value="Female (General)">Female (General)</option>
              <option value="Female (SC)">Female (SC)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Stage */}
        <div className="flex-1 min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Stage</label>
          <div className="relative">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="Final Merit">Final Merit</option>
              <option value="Preliminary">Preliminary</option>
              <option value="Mains / Written">Mains / Written</option>
              <option value="CBT-1">CBT-1</option>
              <option value="All Stages">All Stages</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleApplyFilter}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Apply
          </button>
          <button
            onClick={handleResetFilter}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-3 py-2 cursor-pointer transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. SPLIT GRID LAYOUT (MAIN LEFT 8 COLS, RIGHT 4 COLS)                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Main Table + Recent Cutoff Updates Sub-table */}
        <div className="lg:col-span-8 space-y-6">
          {/* 4A. MAIN CUTOFF TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">Exam</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Cutoff Marks</th>
                    <th className="py-3 px-4">Total Posts</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No cutoff records found
                      </td>
                    </tr>
                  ) : (
                    filteredRows
                      .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                      .map((row, idx) => {
                        const isSelected = selectedRowId === row.id;
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRowId(row.id)}
                            className={cn(
                              'transition-colors cursor-pointer group',
                              isSelected
                                ? 'bg-blue-50/50 hover:bg-blue-50/70'
                                : 'hover:bg-slate-50/60'
                            )}
                          >
                            {/* # */}
                            <td className="py-3 px-4 text-center font-normal text-slate-500">
                              {idx + 1}
                            </td>

                            {/* Exam */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <ExamLogoEmblem examName={row.exam} />
                                <span className="font-semibold text-slate-800">{row.exam}</span>
                              </div>
                            </td>

                            {/* Year */}
                            <td className="py-3 px-4 text-slate-600 font-normal">{row.year}</td>

                            {/* Stage */}
                            <td className="py-3 px-4 text-slate-600 font-normal">{row.stage}</td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide',
                                  row.categoryBadgeClass
                                )}
                              >
                                {row.category}
                              </span>
                            </td>

                            {/* Cutoff Marks */}
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {row.cutoffMarks.toFixed(2)}
                            </td>

                            {/* Total Posts */}
                            <td className="py-3 px-4 text-slate-600 font-normal">
                              {row.totalPosts}
                            </td>

                            {/* Actions */}
                            <td
                              className="py-3 px-4 text-center relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === row.id ? null : row.id);
                                  }}
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenuId === row.id && (
                                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={() => {
                                        setDetailsItem(row);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                                      <span>View Details</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleOpenEditModal(row);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Edit Cutoff</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDuplicate(row);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Duplicate Record</span>
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmItem(row);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Delete Cutoff</span>
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

            {/* Table Footer & Pagination */}
            <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
                {Math.min(filteredRows.length, currentPage * rowsPerPage)} of {filteredRows.length}{' '}
                records
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2563EB] text-white font-medium shadow-2xs"
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  3
                </button>
                <button
                  onClick={() => setCurrentPage(4)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  4
                </button>
                <button
                  onClick={() => setCurrentPage(5)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  5
                </button>
                <span className="px-1 text-slate-400">...</span>

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="relative ml-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="appearance-none border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 bg-white pr-6 cursor-pointer focus:outline-none"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* 4B. RECENT CUTOFF UPDATES SUB-TABLE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Recent Cutoff Updates</h2>
              <button
                onClick={() => setViewAllRecentOpen(true)}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Exam</th>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Added On</th>
                    <th className="py-2.5 px-3">Added By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {cutoffsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        No recent cutoff updates recorded
                      </td>
                    </tr>
                  ) : (
                    cutoffsList.slice(0, 5).map((item, idx) => (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setFilterExam(item.exam);
                          setFilterYear(String(item.year));
                          setAppliedFilters((prev) => ({
                            ...prev,
                            exam: item.exam,
                            year: String(item.year),
                          }));
                        }}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3 text-center text-slate-500 font-normal">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <ExamLogoEmblem examName={item.exam} />
                            <span className="font-semibold text-slate-800">{item.exam}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-normal">{item.year}</td>
                        <td className="py-3 px-3 text-slate-600 font-normal">{item.stage}</td>
                        <td className="py-3 px-3 text-slate-600 font-normal">{item.addedOn}</td>
                        <td className="py-3 px-3 text-slate-600 font-normal">{item.addedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3 ANALYTICS & VISUALIZATION WIDGETS */}
        <div className="lg:col-span-4 space-y-6">
          {/* WIDGET 1: CUTOFF TREND (WBP Constable – General) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Cutoff Trend (WBP Constable - General)
              </h2>
              <button
                onClick={() => setViewAllTrendOpen(true)}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* SVG Area Chart */}
            <div className="relative pt-2 pb-1">
              <svg viewBox="0 0 360 170" className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="cutoffAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis grid lines and labels: 100, 80, 60, 40, 20, 0 */}
                {[
                  { val: 100, y: 15 },
                  { val: 80, y: 45 },
                  { val: 60, y: 75 },
                  { val: 40, y: 105 },
                  { val: 20, y: 135 },
                  { val: 0, y: 155 },
                ].map((tick) => (
                  <g key={tick.val}>
                    <line
                      x1="30"
                      y1={tick.y}
                      x2="350"
                      y2={tick.y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x="18"
                      y={tick.y + 3.5}
                      fontSize="9"
                      fill="#94A3B8"
                      textAnchor="end"
                      fontWeight="400"
                    >
                      {tick.val}
                    </text>
                  </g>
                ))}

                {/* Trend line and Area fill */}
                {/* 
                  Points mapping:
                  2019: 67.50 -> x=55, y = 155 - (67.5/100)*140 = 60.5
                  2020: 72.25 -> x=112, y = 155 - (72.25/100)*140 = 53.85
                  2021: 76.00 -> x=169, y = 155 - (76/100)*140 = 48.6
                  2022: 80.50 -> x=226, y = 155 - (80.5/100)*140 = 42.3
                  2023: 83.75 -> x=283, y = 155 - (83.75/100)*140 = 37.75
                  2024: 85.25 -> x=340, y = 155 - (85.25/100)*140 = 35.65
                */}
                <path
                  d="M 55 60.5 L 112 53.85 L 169 48.6 L 226 42.3 L 283 37.75 L 340 35.65 L 340 155 L 55 155 Z"
                  fill="url(#cutoffAreaGrad)"
                />
                <path
                  d="M 55 60.5 L 112 53.85 L 169 48.6 L 226 42.3 L 283 37.75 L 340 35.65"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points with floating score labels */}
                {[
                  { year: '2019', val: '67.50', x: 55, y: 60.5 },
                  { year: '2020', val: '72.25', x: 112, y: 53.85 },
                  { year: '2021', val: '76.00', x: 169, y: 48.6 },
                  { year: '2022', val: '80.50', x: 226, y: 42.3 },
                  { year: '2023', val: '83.75', x: 283, y: 37.75 },
                  { year: '2024', val: '85.25', x: 340, y: 35.65 },
                ].map((pt) => (
                  <g key={pt.year}>
                    {/* Floating score text */}
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      fontSize="9"
                      fontWeight="600"
                      fill="#1E293B"
                      textAnchor="middle"
                    >
                      {pt.val}
                    </text>
                    {/* Circle marker */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#2563EB"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    {/* X-axis year label */}
                    <text
                      x={pt.x}
                      y={166}
                      fontSize="9"
                      fill="#64748B"
                      textAnchor="middle"
                      fontWeight="400"
                    >
                      {pt.year}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* WIDGET 2: CATEGORY-WISE CUTOFF (WBP Constable 2024) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Category-wise Cutoff (WBP Constable 2024)
            </h2>

            <div className="space-y-3">
              {CATEGORY_BARS_DATA.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-xs">
                  {/* Category Name */}
                  <span className="w-28 text-slate-600 font-normal truncate">{item.category}</span>

                  {/* Horizontal Bar */}
                  <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  {/* Score */}
                  <span className="w-12 text-right font-semibold text-slate-800">
                    {item.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* WIDGET 3: CUTOFF COMPARISON (Year-wise) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Cutoff Comparison (Year-wise)</h2>
              <button
                onClick={() => setViewAllComparisonOpen(true)}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              {['General', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setComparisonCategory(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
                    comparisonCategory === cat
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Vertical Bar Chart with Y-axis */}
            <div className="relative pt-2">
              <div className="flex items-end gap-2 h-44 border-b border-slate-100 pb-1 pl-7 pr-2">
                {/* Y-axis numbers positioned on left */}
                <div className="absolute left-0 top-2 bottom-5 flex flex-col justify-between text-[9px] text-slate-400 font-normal">
                  <span>100</span>
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>

                {/* Bars */}
                {activeComparisonData.map((bar) => {
                  const heightPercent = (bar.value / 100) * 100;
                  return (
                    <div
                      key={bar.year}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      {/* Floating value on top */}
                      <span className="text-[10px] font-semibold text-slate-700 mb-1">
                        {bar.value.toFixed(2)}
                      </span>

                      {/* Bar Pillar */}
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: bar.color,
                        }}
                      />

                      {/* Year label below */}
                      <span className="text-[10px] text-slate-500 font-normal mt-2">
                        {bar.year}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. ADD / EDIT CUTOFF MODAL                                           */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#2563EB]">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingItem ? 'Edit Cutoff Record' : 'Add New Cutoff Record'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingItem
                      ? 'Update historical benchmark cutoff parameters'
                      : 'Configure new recruitment cutoff for public publication'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCutoff} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Exam Name
                  </label>
                  <select
                    value={formExam}
                    onChange={(e) => setFormExam(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select an exam</option>
                    {availableExams.map((exam) => (
                      <option key={exam.id} value={exam.title}>
                        {exam.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Exam Year
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Recruitment Stage
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Final Merit">Final Merit</option>
                    <option value="Preliminary">Preliminary</option>
                    <option value="Mains / Written">Mains / Written</option>
                    <option value="CBT-1">CBT-1</option>
                    <option value="Interview">Interview</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Reservation Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="OBC-A">OBC-A</option>
                    <option value="OBC-B">OBC-B</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="Female (General)">Female (General)</option>
                    <option value="Female (SC)">Female (SC)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Cutoff Marks (Threshold)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formCutoffMarks}
                    onChange={(e) => setFormCutoffMarks(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. 85.25"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Total Posts / Vacancies
                  </label>
                  <input
                    type="text"
                    required
                    value={formTotalPosts}
                    onChange={(e) => setFormTotalPosts(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. 11,746"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Official Source / Notification
                </label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. WBPRB Notice No. PRB/RECT/2024-89"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Notes & Analysis Context
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Additional remarks or notes for students..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  {editingItem ? 'Save Changes' : 'Create Cutoff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. DETAILS MODAL                                                     */}
      {/* ==================================================================== */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <ExamLogoEmblem examName={detailsItem.exam} />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {detailsItem.exam} ({detailsItem.year})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {detailsItem.stage} • {detailsItem.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailsItem(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Cutoff Marks</span>
                  <span className="text-xl font-bold text-slate-900">
                    {detailsItem.cutoffMarks.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Vacancies</span>
                  <span className="text-xl font-bold text-slate-900">{detailsItem.totalPosts}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Category</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium',
                      detailsItem.categoryBadgeClass
                    )}
                  >
                    {detailsItem.category}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Recruitment Stage</span>
                  <span className="font-medium text-slate-800">{detailsItem.stage}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Official Source</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">
                    {detailsItem.source || 'WBPRB Notice'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Added By</span>
                  <span className="font-medium text-slate-800">
                    {detailsItem.addedBy || 'Admin'}
                  </span>
                </div>
              </div>

              {detailsItem.notes && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-900 text-[11px] leading-relaxed">
                  <strong>Notes:</strong> {detailsItem.notes}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setDetailsItem(null)}
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. DELETE CONFIRMATION MODAL                                         */}
      {/* ==================================================================== */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Cutoff Benchmark?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to remove cutoff data for{' '}
              <strong className="text-slate-800">
                {deleteConfirmItem.exam} ({deleteConfirmItem.category})
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCutoff}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. VIEW ALL MODALS (Trend, Recent, Comparison)                       */}
      {/* ==================================================================== */}
      {viewAllTrendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Historical Cutoff Trend — WBP Constable
              </h3>
              <button
                onClick={() => setViewAllTrendOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-2.5 text-xs">
                {GENERAL_TREND_DATA.map((t, i) => (
                  <div
                    key={t.year}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="font-semibold text-slate-800">{t.year}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">Threshold:</span>
                      <span className="font-bold text-blue-600">{t.value.toFixed(2)}</span>
                      {i > 0 && (
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{(t.value - GENERAL_TREND_DATA[i - 1].value).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewAllRecentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">All Recent Cutoff Updates</h3>
              <button
                onClick={() => setViewAllRecentOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="divide-y divide-slate-100 text-xs">
                {RECENT_UPDATES.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <ExamLogoEmblem examName={item.exam} />
                      <div>
                        <div className="font-semibold text-slate-800">{item.exam}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.year} • {item.stage}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-600 font-medium">{item.addedOn}</div>
                      <div className="text-[10px] text-slate-400">By {item.addedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewAllComparisonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Comprehensive Year-wise Cutoff Comparison
              </h3>
              <button
                onClick={() => setViewAllComparisonOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2">Year</th>
                    {['General', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS'].map((c) => (
                      <th key={c} className="py-2 text-right">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {['2019', '2020', '2021', '2022', '2023', '2024'].map((yr) => (
                    <tr key={yr} className="hover:bg-slate-50">
                      <td className="py-2.5 font-bold text-slate-900">{yr}</td>
                      {['General', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS'].map((cat) => {
                        const val =
                          YEAR_WISE_COMPARISON[cat]?.find((d) => d.year === yr)?.value || 0;
                        return (
                          <td key={cat} className="py-2.5 text-right font-semibold">
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>,
    { label: 'Loading cutoff…', variant: 'table' }
  );
};
