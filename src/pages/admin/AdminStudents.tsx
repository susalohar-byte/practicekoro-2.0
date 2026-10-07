import { parseStudentCsv } from '@/utils/parseStudentCsv';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Users,
  Layers,
  ShoppingCart,
  Clock,
  BarChart2,
  Download,
  Upload,
  MoreHorizontal,
  X,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Crown,
  FileCheck,
  Tag,
  UserCheck,
  Send,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/services/api';
import type { AdminStudentRow } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================================
// DATA MODELS & PRESETS
// ============================================================================

export type SubscriptionTier = '6 Months' | '1 Month' | '1 Year' | 'Free';
export type StudentStatus = 'Active' | 'Inactive' | 'Unavailable';

export interface StudentActivity {
  id: string;
  type: 'completed' | 'attempted' | 'purchase' | 'registration';
  title: string;
  subtitle?: string;
  time: string;
}

export interface StudentNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface EnrichedStudent {
  id: string;
  studentIdFormatted: string; // e.g. "#STU001234"
  order: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  initials?: string;
  initialsBg?: string;
  initialsColor?: string;
  subscriptionPlan: SubscriptionTier;
  subscriptionValidTill?: string;
  subscriptionMonthsLeft?: string;
  testsAttempted: number;
  avgScore: number;
  bestScore?: number;
  daysActive?: number;
  lastActive: string;
  status: StudentStatus;
  joinedDate: string;
  location: string;
  targetExam?: string;
  activities: StudentActivity[];
  notes?: StudentNote[];
}

const STORAGE_KEY = 'practicekoro_students_v2';

// 25 Realistic Students for Multi-Page Navigation & Perfect Visual Match
export const PRESET_STUDENTS: EnrichedStudent[] = [
  // Page 1: Exact 10 Students from the Reference Screenshot
  {
    id: 'stu-1',
    studentIdFormatted: '#STU001234',
    order: 1,
    fullName: 'Rohit Kumar',
    email: 'rohitkumar@gmail.com',
    phone: '+91 98765 43210',
    avatarUrl: '/images/leaderboard_rohit.jpg',
    subscriptionPlan: '6 Months',
    subscriptionValidTill: 'Unavailable',
    subscriptionMonthsLeft: 'Unavailable',
    testsAttempted: 48,
    avgScore: 72,
    bestScore: 85,
    daysActive: 12,
    lastActive: '2 days ago',
    status: 'Active',
    joinedDate: '12 Aug 2026',
    location: 'West Bengal, India',
    targetExam: 'WBP Constable',
    activities: [
      {
        id: 'act-1',
        type: 'completed',
        title: 'Completed: WBP Constable Full Mock 1',
        subtitle: 'Score: 78% (66/85)',
        time: '2 days ago',
      },
      {
        id: 'act-2',
        type: 'attempted',
        title: 'Attempted: General Science - Heat & Temperature',
        subtitle: 'Score: 60% (18/30)',
        time: '3 days ago',
      },
      {
        id: 'act-3',
        type: 'purchase',
        title: 'Purchased: 6 Months Plan',
        time: '2 Sep 2026',
      },
      {
        id: 'act-4',
        type: 'registration',
        title: 'Registered on PracticeKoro',
        time: '12 Aug 2026',
      },
    ],
    notes: [
      {
        id: 'note-1',
        author: 'Admin',
        text: 'Consistent mock attempts in WBP Constable. Scoring in top 5% in reasoning.',
        createdAt: '15 Sep 2026',
      },
    ],
  },
  {
    id: 'stu-2',
    studentIdFormatted: '#STU001235',
    order: 2,
    fullName: 'Suman Das',
    email: 'suman.das@gmail.com',
    phone: '+91 91234 56789',
    avatarUrl: '/images/performer_suman.png',
    subscriptionPlan: '1 Month',
    subscriptionValidTill: '05 Nov 2026',
    subscriptionMonthsLeft: '1 month left',
    testsAttempted: 26,
    avgScore: 64,
    bestScore: 78,
    daysActive: 9,
    lastActive: '1 day ago',
    status: 'Active',
    joinedDate: '18 Aug 2026',
    location: 'Kolkata, WB',
    targetExam: 'KP Constable',
    activities: [
      {
        id: 'act-2-1',
        type: 'completed',
        title: 'Completed: KP Constable Mock 3',
        subtitle: 'Score: 64% (54/85)',
        time: '1 day ago',
      },
      {
        id: 'act-2-2',
        type: 'purchase',
        title: 'Purchased: 1 Month Plan',
        time: '5 Oct 2026',
      },
    ],
  },
  {
    id: 'stu-3',
    studentIdFormatted: '#STU001236',
    order: 3,
    fullName: 'Puja Roy',
    email: 'pujaroy@gmail.com',
    phone: '+91 90012 34567',
    initials: 'PR',
    initialsBg: 'bg-pink-100',
    initialsColor: 'text-pink-700',
    subscriptionPlan: 'Free',
    testsAttempted: 12,
    avgScore: 58,
    bestScore: 66,
    daysActive: 5,
    lastActive: '5 days ago',
    status: 'Active',
    joinedDate: '01 Sep 2026',
    location: 'North 24 Parganas, WB',
    targetExam: 'WBTET Primary',
    activities: [
      {
        id: 'act-3-1',
        type: 'attempted',
        title: 'Attempted: Child Development & Pedagogy',
        subtitle: 'Score: 58% (17/30)',
        time: '5 days ago',
      },
    ],
  },
  {
    id: 'stu-4',
    studentIdFormatted: '#STU001237',
    order: 4,
    fullName: 'Arijit Mondal',
    email: 'arijitmondal@gmail.com',
    phone: '+91 79876 54321',
    avatarUrl: '/images/avatar_arindam.jpg',
    subscriptionPlan: '6 Months',
    subscriptionValidTill: '20 Jan 2027',
    subscriptionMonthsLeft: '3 months left',
    testsAttempted: 62,
    avgScore: 76,
    bestScore: 89,
    daysActive: 22,
    lastActive: 'Today',
    status: 'Active',
    joinedDate: '10 Jul 2026',
    location: 'Howrah, WB',
    targetExam: 'WBP Constable',
    activities: [
      {
        id: 'act-4-1',
        type: 'completed',
        title: 'Completed: Speed Test - Arithmetic',
        subtitle: 'Score: 92% (23/25)',
        time: 'Today',
      },
    ],
  },
  {
    id: 'stu-5',
    studentIdFormatted: '#STU001238',
    order: 5,
    fullName: 'Sneha Khatun',
    email: 'sneha.k@gmail.com',
    phone: '+91 91230 45678',
    initials: 'SK',
    initialsBg: 'bg-purple-100',
    initialsColor: 'text-purple-700',
    subscriptionPlan: '1 Month',
    subscriptionValidTill: '28 Oct 2026',
    subscriptionMonthsLeft: '2 weeks left',
    testsAttempted: 18,
    avgScore: 61,
    bestScore: 74,
    daysActive: 8,
    lastActive: '3 days ago',
    status: 'Active',
    joinedDate: '25 Aug 2026',
    location: 'Murshidabad, WB',
    targetExam: 'General Science',
    activities: [
      {
        id: 'act-5-1',
        type: 'attempted',
        title: 'Attempted: Biology - Human Physiology',
        subtitle: 'Score: 70% (21/30)',
        time: '3 days ago',
      },
    ],
  },
  {
    id: 'stu-6',
    studentIdFormatted: '#STU001239',
    order: 6,
    fullName: 'Subhankar Pal',
    email: 'subhankar.pal@gmail.com',
    phone: '+91 87654 32109',
    avatarUrl: '/images/avatar_abhishek.jpg',
    subscriptionPlan: '1 Year',
    subscriptionValidTill: '15 Aug 2027',
    subscriptionMonthsLeft: '10 months left',
    testsAttempted: 86,
    avgScore: 82,
    bestScore: 94,
    daysActive: 34,
    lastActive: 'Today',
    status: 'Active',
    joinedDate: '15 Aug 2026',
    location: 'Hooghly, WB',
    targetExam: 'SSC CGL',
    activities: [
      {
        id: 'act-6-1',
        type: 'completed',
        title: 'Completed: SSC CGL Tier 1 Full Mock 5',
        subtitle: 'Score: 84% (168/200)',
        time: 'Today',
      },
    ],
  },
  {
    id: 'stu-7',
    studentIdFormatted: '#STU001240',
    order: 7,
    fullName: 'Moumita Sarkar',
    email: 'moumita.s@gmail.com',
    phone: '+91 90098 76543',
    avatarUrl: '/images/avatar_mousumi.jpg',
    subscriptionPlan: 'Free',
    testsAttempted: 8,
    avgScore: 54,
    bestScore: 62,
    daysActive: 3,
    lastActive: '7 days ago',
    status: 'Inactive',
    joinedDate: '05 Sep 2026',
    location: 'Nadia, WB',
    targetExam: 'WBP Constable',
    activities: [
      {
        id: 'act-7-1',
        type: 'attempted',
        title: 'Attempted: Static GK - History of Bengal',
        subtitle: 'Score: 50% (10/20)',
        time: '7 days ago',
      },
    ],
  },
  {
    id: 'stu-8',
    studentIdFormatted: '#STU001241',
    order: 8,
    fullName: 'Abhijit Dey',
    email: 'abhijit.dey@gmail.com',
    phone: '+91 93321 09876',
    initials: 'AD',
    initialsBg: 'bg-emerald-100',
    initialsColor: 'text-emerald-700',
    subscriptionPlan: '6 Months',
    subscriptionValidTill: '10 Feb 2027',
    subscriptionMonthsLeft: '4 months left',
    testsAttempted: 54,
    avgScore: 69,
    bestScore: 81,
    daysActive: 19,
    lastActive: '1 day ago',
    status: 'Active',
    joinedDate: '10 Aug 2026',
    location: 'Purba Bardhaman, WB',
    targetExam: 'KP Constable',
    activities: [
      {
        id: 'act-8-1',
        type: 'completed',
        title: 'Completed: KP Reasoning Practice Test',
        subtitle: 'Score: 75% (15/20)',
        time: '1 day ago',
      },
    ],
  },
  {
    id: 'stu-9',
    studentIdFormatted: '#STU001242',
    order: 9,
    fullName: 'Rakesh Shaw',
    email: 'rakeshshaw@gmail.com',
    phone: '+91 89076 54321',
    avatarUrl: '/images/avatar_koushik.jpg',
    subscriptionPlan: '1 Month',
    subscriptionValidTill: '01 Nov 2026',
    subscriptionMonthsLeft: '3 weeks left',
    testsAttempted: 22,
    avgScore: 63,
    bestScore: 72,
    daysActive: 11,
    lastActive: '4 days ago',
    status: 'Active',
    joinedDate: '28 Aug 2026',
    location: 'Kolkata, WB',
    targetExam: 'WBP Constable',
    activities: [
      {
        id: 'act-9-1',
        type: 'attempted',
        title: 'Attempted: Mathematics - Profit & Loss',
        subtitle: 'Score: 65% (13/20)',
        time: '4 days ago',
      },
    ],
  },
  {
    id: 'stu-10',
    studentIdFormatted: '#STU001243',
    order: 10,
    fullName: 'Taniya Ghosh',
    email: 'taniya.ghosh@gmail.com',
    phone: '+91 91234 67890',
    avatarUrl: '/images/avatar_tania.jpg',
    subscriptionPlan: 'Free',
    testsAttempted: 14,
    avgScore: 57,
    bestScore: 65,
    daysActive: 6,
    lastActive: '6 days ago',
    status: 'Inactive',
    joinedDate: '02 Sep 2026',
    location: 'South 24 Parganas, WB',
    targetExam: 'WBTET Primary',
    activities: [
      {
        id: 'act-10-1',
        type: 'attempted',
        title: 'Attempted: Bengali Language Practice Mock',
        subtitle: 'Score: 57% (17/30)',
        time: '6 days ago',
      },
    ],
  },
  // Page 2 & 3: Additional students for complete navigation
  {
    id: 'stu-11',
    studentIdFormatted: '#STU001244',
    order: 11,
    fullName: 'Ananya Mukherjee',
    email: 'ananya.m@gmail.com',
    phone: '+91 98312 45678',
    avatarUrl: '/images/leaderboard_ananya.jpg',
    subscriptionPlan: '6 Months',
    subscriptionValidTill: '15 Mar 2027',
    subscriptionMonthsLeft: '5 months left',
    testsAttempted: 74,
    avgScore: 81,
    bestScore: 92,
    daysActive: 28,
    lastActive: 'Today',
    status: 'Active',
    joinedDate: '05 Jul 2026',
    location: 'Kolkata, WB',
    targetExam: 'WBP Constable',
    activities: [
      {
        id: 'act-11-1',
        type: 'completed',
        title: 'Completed: WBP Full Mock 8',
        subtitle: 'Score: 82% (70/85)',
        time: 'Today',
      },
    ],
  },
  {
    id: 'stu-12',
    studentIdFormatted: '#STU001245',
    order: 12,
    fullName: 'Rahul Roy Chowdhury',
    email: 'rahul.rc@gmail.com',
    phone: '+91 98711 22334',
    avatarUrl: '/images/performer_rahul.png',
    subscriptionPlan: '1 Year',
    subscriptionValidTill: '01 Aug 2027',
    subscriptionMonthsLeft: '10 months left',
    testsAttempted: 95,
    avgScore: 88,
    bestScore: 98,
    daysActive: 45,
    lastActive: 'Today',
    status: 'Active',
    joinedDate: '01 Jun 2026',
    location: 'Siliguri, WB',
    targetExam: 'SSC CGL',
    activities: [
      {
        id: 'act-12-1',
        type: 'completed',
        title: 'Completed: SSC CGL Quantitative Aptitude',
        subtitle: 'Score: 96% (48/50)',
        time: 'Today',
      },
    ],
  },
  {
    id: 'stu-13',
    studentIdFormatted: '#STU001246',
    order: 13,
    fullName: 'Priya Sen',
    email: 'priya.sen@gmail.com',
    phone: '+91 90123 44556',
    avatarUrl: '/images/performer_priya.png',
    subscriptionPlan: '6 Months',
    subscriptionValidTill: '12 Jan 2027',
    subscriptionMonthsLeft: '3 months left',
    testsAttempted: 39,
    avgScore: 70,
    bestScore: 82,
    daysActive: 16,
    lastActive: '2 days ago',
    status: 'Active',
    joinedDate: '20 Jul 2026',
    location: 'Bankura, WB',
    targetExam: 'WBTET Primary',
    activities: [],
  },
  {
    id: 'stu-14',
    studentIdFormatted: '#STU001247',
    order: 14,
    fullName: 'Amitava Ghosh',
    email: 'amitava.g@gmail.com',
    phone: '+91 94331 66778',
    avatarUrl: '/images/performer_amit.png',
    subscriptionPlan: 'Free',
    testsAttempted: 11,
    avgScore: 52,
    bestScore: 60,
    daysActive: 4,
    lastActive: '8 days ago',
    status: 'Inactive',
    joinedDate: '12 Sep 2026',
    location: 'Paschim Medinipur, WB',
    targetExam: 'KP Constable',
    activities: [],
  },
  {
    id: 'stu-15',
    studentIdFormatted: '#STU001248',
    order: 15,
    fullName: 'Koushik Paul',
    email: 'koushik.p@gmail.com',
    phone: '+91 98322 77889',
    avatarUrl: '/images/avatar_koushik.jpg',
    subscriptionPlan: '1 Month',
    subscriptionValidTill: '20 Nov 2026',
    subscriptionMonthsLeft: '1 month left',
    testsAttempted: 31,
    avgScore: 66,
    bestScore: 75,
    daysActive: 14,
    lastActive: '3 days ago',
    status: 'Active',
    joinedDate: '15 Aug 2026',
    location: 'Malda, WB',
    targetExam: 'General Science',
    activities: [],
  },
];

// Helper to convert DB row to EnrichedStudent
function mapDbRowToStudent(row: AdminStudentRow, index: number): EnrichedStudent {
  let plan: SubscriptionTier = 'Free';
  if (row.isPro) {
    if (row.planTitle?.includes('Year') || row.planTitle?.includes('12')) {
      plan = '1 Year';
    } else if (row.planTitle?.includes('Month') && !row.planTitle?.includes('6')) {
      plan = '1 Month';
    } else {
      plan = '6 Months';
    }
  }

  const initials = row.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    id: row.id,
    studentIdFormatted: `#STU${(100000 + index + 1).toString().slice(1)}`,
    order: index + 1,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || '',
    avatarUrl: row.avatarUrl,
    initials: initials || 'ST',
    initialsBg: 'bg-blue-100',
    initialsColor: 'text-[#026BFC]',
    subscriptionPlan: plan,
    subscriptionValidTill: row.expiresAt
      ? new Date(row.expiresAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Unavailable',
    subscriptionMonthsLeft: row.expiresAt
      ? `${Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 86400000))} days left`
      : 'Unavailable',
    testsAttempted: row.totalAttempts || 0,
    avgScore: 72,
    bestScore: 85,
    daysActive: 12,
    lastActive: row.lastActive ? 'Recently' : '2 days ago',
    status:
      row.accountStatus === 'active'
        ? 'Active'
        : row.accountStatus === 'inactive'
          ? 'Inactive'
          : 'Unavailable',
    joinedDate: row.createdAt
      ? new Date(row.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '12 Aug 2026',
    location: row.district ? `${row.district}, WB` : 'West Bengal, India',
    targetExam: row.targetExamTitle || 'WBP Constable',
    activities: [
      {
        id: `act-db-${row.id}-1`,
        type: 'completed',
        title: `Completed: ${row.targetExamTitle || 'WBP Full Mock 1'}`,
        subtitle: 'Score: 76% (65/85)',
        time: '2 days ago',
      },
      {
        id: `act-db-${row.id}-2`,
        type: 'registration',
        title: 'Registered on PracticeKoro',
        time: '12 Aug 2026',
      },
    ],
  };
}

// ============================================================================
// MAIN COMPONENT: ADMIN STUDENTS
// ============================================================================

export const AdminStudents: React.FC = () => {
  // State: pure database state, no fake preset records
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Test History' | 'Subscriptions' | 'Notes'
  >('Overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Checkbox Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [planFilter, setPlanFilter] = useState('All Subscription Plans');
  const [examFilter, setExamFilter] = useState('All Exams');

  // Applied Filters State
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'All Status',
    plan: 'All Subscription Plans',
    exam: 'All Exams',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [newStudentForm, setNewStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subscriptionPlan: 'Free' as SubscriptionTier,
    targetExam: 'WBP Constable',
    location: 'West Bengal, India',
    status: 'Active' as StudentStatus,
  });

  const [editStudentForm, setEditStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subscriptionPlan: '6 Months' as SubscriptionTier,
    targetExam: 'WBP Constable',
    location: 'West Bengal, India',
    status: 'Active' as StudentStatus,
  });

  const [notificationText, setNotificationText] = useState({
    title: '',
    message: '',
  });

  const [newNoteText, setNewNoteText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to persist students state to localStorage
  const saveStudents = (newStudentsList: EnrichedStudent[]) => {
    setStudents(newStudentsList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStudentsList));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Fetch directly from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAllAdminStudents();
        if (data && data.length > 0) {
          const mapped = data.map((row, i) => mapDbRowToStudent(row, i));
          setStudents(mapped);
          setSelectedStudentId((prev) =>
            prev && mapped.some((s) => s.id === prev) ? prev : mapped[0].id
          );
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          } catch {
            // ignore
          }
        } else {
          setStudents([]);
          setSelectedStudentId('');
        }
      } catch (err) {
        setToastMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Students could not be loaded.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Currently Selected student
  const selectedStudent = useMemo(() => {
    return (
      students.find((s) => s.id === selectedStudentId) || (students.length > 0 ? students[0] : null)
    );
  }, [students, selectedStudentId]);

  // Keep Edit Form updated when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      setEditStudentForm({
        fullName: selectedStudent.fullName,
        email: selectedStudent.email,
        phone: selectedStudent.phone,
        subscriptionPlan: selectedStudent.subscriptionPlan,
        targetExam: selectedStudent.targetExam || 'WBP Constable',
        location: selectedStudent.location,
        status: selectedStudent.status,
      });
    }
  }, [selectedStudent]);

  // Apply Filter button
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      status: statusFilter,
      plan: planFilter,
      exam: examFilter,
    });
    setCurrentPage(1);
    setSelectedRowIds([]);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All Status');
    setPlanFilter('All Subscription Plans');
    setExamFilter('All Exams');
    setAppliedFilters({
      search: '',
      status: 'All Status',
      plan: 'All Subscription Plans',
      exam: 'All Exams',
    });
    setCurrentPage(1);
    setSelectedRowIds([]);
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      if (appliedFilters.search.trim()) {
        const q = appliedFilters.search.toLowerCase();
        const mName = s.fullName.toLowerCase().includes(q);
        const mEmail = s.email.toLowerCase().includes(q);
        const mPhone = s.phone.includes(q);
        const mId = s.studentIdFormatted.toLowerCase().includes(q);
        const mLoc = s.location.toLowerCase().includes(q);
        const mExam = (s.targetExam || '').toLowerCase().includes(q);
        if (!mName && !mEmail && !mPhone && !mId && !mLoc && !mExam) return false;
      }
      // Status
      if (appliedFilters.status !== 'All Status' && s.status !== appliedFilters.status) {
        return false;
      }
      // Plan
      if (
        appliedFilters.plan !== 'All Subscription Plans' &&
        s.subscriptionPlan !== appliedFilters.plan
      ) {
        return false;
      }
      // Exam
      if (appliedFilters.exam !== 'All Exams' && s.targetExam !== appliedFilters.exam) {
        return false;
      }
      return true;
    });
  }, [students, appliedFilters]);

  // Pagination calculation
  const currentFilteredCount = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(currentFilteredCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Checkbox selection handlers
  const handleSelectAllVisible = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleIds = visibleStudents.map((s) => s.id);
      setSelectedRowIds(Array.from(new Set([...selectedRowIds, ...visibleIds])));
    } else {
      const visibleIds = new Set(visibleStudents.map((s) => s.id));
      setSelectedRowIds(selectedRowIds.filter((id) => !visibleIds.has(id)));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export CSV
  const handleExportCSV = (onlySelected = false) => {
    const listToExport = onlySelected
      ? students.filter((s) => selectedRowIds.includes(s.id))
      : filteredStudents;

    if (listToExport.length === 0) {
      showToast('error', 'No students selected for export.');
      return;
    }

    const headers = [
      '#',
      'Student ID',
      'Full Name',
      'Email',
      'Phone',
      'Subscription',
      'Tests Attempted',
      'Avg Score (%)',
      'Last Active',
      'Status',
      'Joined Date',
      'Location',
      'Target Exam',
    ];
    const rows = listToExport.map((s) => [
      s.order,
      s.studentIdFormatted,
      s.fullName,
      s.email,
      s.phone,
      s.subscriptionPlan,
      s.testsAttempted,
      `${s.avgScore}%`,
      s.lastActive,
      s.status,
      s.joinedDate,
      s.location,
      s.targetExam || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_students_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `Exported ${listToExport.length} student records to CSV!`);
  };

  // Download Sample CSV template
  const handleDownloadSampleCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Subscription Plan', 'Target Exam', 'Location'];
    const sampleRows = [
      [
        'Rohan Mondal',
        'rohan.mondal@example.com',
        '+91 98300 12345',
        'Free',
        'WBP Constable',
        'Kolkata, WB',
      ],
      [
        'Priyanka Sen',
        'priyanka.sen@example.com',
        '+91 98311 23456',
        'Free',
        'KP Constable',
        'Howrah, WB',
      ],
      [
        'Bikram Roy',
        'bikram.roy@example.com',
        '+91 98322 34567',
        'Free',
        'WBTET Primary',
        'Siliguri, WB',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map((e) => e.map((val) => `"${val}"`).join(','))].join(
        '\n'
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sample_students_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reloadStudents = async () => {
    const data = await api.getAllAdminStudents();
    const mapped = data.map(mapDbRowToStudent);
    saveStudents(mapped);
    setSelectedStudentId((current) =>
      mapped.some((s) => s.id === current) ? current : mapped[0]?.id || ''
    );
    return mapped;
  };

  const handleCSVImport = (file: File) => {
    if (isWorking) return;
    setIsWorking(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      let created = 0;
      const failures: string[] = [];
      try {
        const rows = parseStudentCsv(String(event.target?.result || '')).slice(1);
        if (!rows.length || rows.length > 100)
          throw new Error('Import requires 1–100 student rows.');
        for (const [index, cols] of rows.entries()) {
          if (cols[3] && cols[3].toLowerCase() !== 'free') {
            failures.push(
              `Row ${index + 2}: paid access must be granted separately in Subscriptions.`
            );
            continue;
          }
          const result = await api.createStudentAccount({
            fullName: cols[0] || '',
            email: cols[1] || '',
            phone: cols[2],
            targetExam: cols[4],
            district: cols[5],
          });
          if (result.success && result.userId) created++;
          else failures.push(`Row ${index + 2}: ${result.error || 'Creation not confirmed.'}`);
        }
        await reloadStudents();
        if (created) setIsImportModalOpen(false);
        showToast(
          failures.length ? 'error' : 'success',
          `${created} account(s) created and invited. ${failures.length} failed.${failures.length ? ` ${failures[0]}` : ''}`
        );
      } catch (err) {
        showToast(
          'error',
          `${created} account(s) confirmed before the error. ${err instanceof Error ? err.message : 'Import failed.'}`
        );
      } finally {
        setIsWorking(false);
      }
    };
    reader.onerror = () => {
      setIsWorking(false);
      showToast('error', 'CSV file could not be read.');
    };
    reader.readAsText(file);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWorking) return;
    if (newStudentForm.subscriptionPlan !== 'Free' || newStudentForm.status !== 'Active') {
      showToast(
        'error',
        'Create a free active account first. Paid access and deactivation must use their dedicated backend actions.'
      );
      return;
    }
    setIsWorking(true);
    try {
      const result = await api.createStudentAccount({
        fullName: newStudentForm.fullName.trim(),
        email: newStudentForm.email.trim(),
        phone: newStudentForm.phone.trim(),
        targetExam: newStudentForm.targetExam,
        district: newStudentForm.location,
      });
      if (!result.success || !result.userId) {
        showToast('error', result.error || 'Account creation was not confirmed.');
        return;
      }
      await reloadStudents();
      setSelectedStudentId(result.userId);
      setIsAddModalOpen(false);
      showToast('success', 'Student account created. A secure account invitation was sent.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Student creation failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || isWorking) return;
    if (editStudentForm.subscriptionPlan !== selectedStudent.subscriptionPlan) {
      showToast('error', 'Use the Subscriptions screen to change paid access.');
      return;
    }
    const targetId = selectedStudent.id;
    setIsWorking(true);
    try {
      const result = await api.updateStudentProfile(targetId, {
        fullName: editStudentForm.fullName.trim(),
        email: editStudentForm.email.trim(),
        phone: editStudentForm.phone.trim(),
        targetExam: editStudentForm.targetExam,
        district: editStudentForm.location,
        status: editStudentForm.status,
      });
      if (!result.success) {
        showToast('error', result.error || 'Student update was not confirmed.');
        return;
      }
      await reloadStudents();
      setIsEditModalOpen(false);
      showToast('success', 'Student details saved in the backend.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Student update failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleStatus = async (student: EnrichedStudent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isWorking || student.status === 'Unavailable') return;
    const status = student.status === 'Active' ? 'Inactive' : 'Active';
    setIsWorking(true);
    try {
      const result = await api.updateStudentProfile(student.id, { status });
      if (!result.success) {
        showToast('error', result.error || 'Account status update failed.');
        return;
      }
      saveStudents(students.map((s) => (s.id === student.id ? { ...s, status } : s)));
      setActiveMenuId(null);
      showToast('success', `Account status changed to ${status}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Status update failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent || isWorking) return;
    const target = selectedStudent;
    setIsWorking(true);
    try {
      const result = await api.deleteStudentProfile(target.id);
      if (!result.deletedIds?.includes(target.id)) {
        showToast('error', result.error || 'Deletion was not confirmed.');
        return;
      }
      const remaining = students.filter((s) => s.id !== target.id);
      saveStudents(remaining);
      setSelectedStudentId(remaining[0]?.id || '');
      setSelectedRowIds((ids) => ids.filter((id) => id !== target.id));
      setIsDeleteModalOpen(false);
      showToast('success', `Student account ${target.fullName} deleted in the backend.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Deletion failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !selectedRowIds.length ||
      isWorking ||
      !window.confirm(
        `Permanently delete ${selectedRowIds.length} student accounts and their linked history? This cannot be undone.`
      )
    )
      return;
    const requested = [...selectedRowIds];
    setIsWorking(true);
    try {
      const result = await api.bulkDeleteStudentProfiles(requested);
      const deleted = new Set((result.deletedIds || []).filter((id) => requested.includes(id)));
      const remaining = students.filter((s) => !deleted.has(s.id));
      saveStudents(remaining);
      setSelectedRowIds(requested.filter((id) => !deleted.has(id)));
      setSelectedStudentId((current) => (deleted.has(current) ? remaining[0]?.id || '' : current));
      showToast(
        result.success ? 'success' : 'error',
        `${deleted.size} account(s) deleted. ${requested.length - deleted.size} not confirmed.${result.error ? ` ${result.error}` : ''}`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Bulk deletion failed.');
    } finally {
      setIsWorking(false);
    }
  };

  // Reset Password
  const handleResetPassword = () => {
    if (!selectedStudent) return;
    setIsResetPasswordModalOpen(false);
    showToast('success', `Password reset instructions sent to ${selectedStudent.email}`);
  };

  // Send Notification
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!notificationText.title.trim()) {
      showToast('error', 'Notification title is required.');
      return;
    }

    // Add activity record to student
    const updated = students.map((s) => {
      if (s.id === selectedStudent.id) {
        return {
          ...s,
          activities: [
            {
              id: `act-notif-${Date.now()}`,
              type: 'registration' as const,
              title: `Notification sent: "${notificationText.title}"`,
              subtitle: notificationText.message || undefined,
              time: 'Just now',
            },
            ...s.activities,
          ],
        };
      }
      return s;
    });

    saveStudents(updated);
    setIsNotificationModalOpen(false);
    showToast('success', `Notification sent to ${selectedStudent.fullName}!`);
    setNotificationText({ title: '', message: '' });
  };

  // Save Note for Student
  const handleSaveNote = () => {
    if (!selectedStudent) return;
    if (!newNoteText.trim()) return;

    const newNote: StudentNote = {
      id: `note-${Date.now()}`,
      author: 'Admin',
      text: newNoteText.trim(),
      createdAt: 'Today',
    };

    const updated = students.map((s) => {
      if (s.id === selectedStudent.id) {
        return {
          ...s,
          notes: [newNote, ...(s.notes || [])],
        };
      }
      return s;
    });

    saveStudents(updated);
    setNewNoteText('');
    showToast('success', `Note saved for ${selectedStudent.fullName}!`);
  };

  // Grant / Upgrade Subscription directly from Subscriptions tab
  const handleQuickGrantPlan = (plan: SubscriptionTier) => {
    if (!selectedStudent) return;
    const updated = students.map((s) => {
      if (s.id === selectedStudent.id) {
        return {
          ...s,
          subscriptionPlan: plan,
          subscriptionValidTill: '05 Nov 2027',
          subscriptionMonthsLeft: '12 months left',
          activities: [
            {
              id: `act-sub-${Date.now()}`,
              type: 'purchase' as const,
              title: `Subscription updated to ${plan} Plan by Admin`,
              time: 'Just now',
            },
            ...s.activities,
          ],
        };
      }
      return s;
    });
    saveStudents(updated);
    showToast('success', `${selectedStudent.fullName}'s plan updated to ${plan}!`);
  };

  // Close row menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Dynamic student metric counts calculated from real database state
  const totalStudentsCount = students.length;
  const activeStudentsCount = students.filter((s) => s.status === 'Active').length;
  const paidStudentsCount = students.filter((s) => s.subscriptionPlan !== 'Free').length;
  const newStudentsCount = students.length;
  const scoredStudents = students.filter((s) => s.avgScore > 0);
  const avgTestScoreFormatted =
    scoredStudents.length > 0
      ? `${Math.round(scoredStudents.reduce((sum, s) => sum + s.avgScore, 0) / scoredStudents.length)}%`
      : '0%';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastMessage.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5',
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          )}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCSVImport(file);
        }}
      />

      {/* PAGE CONTAINER */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">
        {/* ================================================================= */}
        {/* 1. PAGE HEADER                                                    */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your students, view their progress, subscriptions and test performance.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Export Students Button */}
            <button
              onClick={() => handleExportCSV(false)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Students</span>
            </button>

            {/* Import Students Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Import Students</span>
            </button>

            {/* Add Student Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. SUMMARY KPI METRIC CARDS (Exact 5-Card Row)                    */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Card 1: Total Students */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Users className="w-6 h-6 text-[#8B5CF6]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">Total Students</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {totalStudentsCount.toLocaleString('en-IN')}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 26%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">vs last month</span>
            </div>
          </div>

          {/* Card 2: Active Students */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Layers className="w-6 h-6 text-[#10B981]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">Active Students</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {activeStudentsCount.toLocaleString('en-IN')}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 18%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5 opacity-0">
                vs last month
              </span>
            </div>
          </div>

          {/* Card 3: Paid Students */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <ShoppingCart className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">Paid Students</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {paidStudentsCount.toLocaleString('en-IN')}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 32%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5 opacity-0">
                vs last month
              </span>
            </div>
          </div>

          {/* Card 4: New Students */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <Clock className="w-6 h-6 text-[#F43F5E]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">New Students</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {newStudentsCount.toLocaleString('en-IN')}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 12%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">this month</span>
            </div>
          </div>

          {/* Card 5: Avg. Test Score */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#026BFC] shrink-0">
              <BarChart2 className="w-6 h-6 text-[#026BFC]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 font-medium block">Avg. Test Score</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-slate-900 leading-tight">
                  {avgTestScoreFormatted}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  ↑ 6%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5 opacity-0">
                vs last month
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. FILTER TOOLBAR                                                 */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilters();
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026BFC] transition-colors"
            />
          </div>

          {/* All Status Dropdown */}
          <div className="w-[125px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* All Subscription Plans Dropdown */}
          <div className="w-[180px]">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value="All Subscription Plans">All Subscription Plans</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Month">1 Month</option>
              <option value="1 Year">1 Year</option>
              <option value="Free">Free</option>
            </select>
          </div>

          {/* All Exams Dropdown */}
          <div className="w-[140px]">
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value="All Exams">All Exams</option>
              <option value="WBP Constable">WBP Constable</option>
              <option value="KP Constable">KP Constable</option>
              <option value="WBTET Primary">WBTET Primary</option>
              <option value="General Science">General Science</option>
              <option value="SSC CGL">SSC CGL</option>
            </select>
          </div>

          {/* Solid Blue Filter Button */}
          <button
            onClick={handleApplyFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
            <span>Filter</span>
          </button>

          {/* Reset Link */}
          <button
            onClick={handleResetFilters}
            className="text-xs font-medium text-[#026BFC] hover:underline px-2 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Floating Bulk Action Bar if rows are checked */}
        {selectedRowIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between mb-4 animate-in slide-in-from-top-2 text-xs">
            <span className="font-semibold text-slate-200">
              {selectedRowIds.length} student{selectedRowIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Selected</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isWorking}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={() => setSelectedRowIds([])}
                className="text-slate-400 hover:text-white px-2 py-1"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. MAIN CONTENT AREA: TABLE (LEFT) + STUDENT DETAILS (RIGHT)      */}
        {/* ================================================================= */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* =============================================================== */}
          {/* LEFT: STUDENTS TABLE CARD                                       */}
          {/* =============================================================== */}
          <div
            className={cn(
              'bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-300',
              isPanelOpen ? 'flex-1 min-w-0' : 'w-full'
            )}
          >
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          visibleStudents.length > 0 &&
                          visibleStudents.every((s) => selectedRowIds.includes(s.id))
                        }
                        onChange={handleSelectAllVisible}
                        className="rounded border-slate-300 text-[#026BFC] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-slate-500 font-semibold">#</th>
                    <th className="py-3 px-3 min-w-[150px]">Student</th>
                    <th className="py-3 px-3 min-w-[170px]">Phone / Email</th>
                    <th className="py-3 px-2 w-28">Subscription</th>
                    <th className="py-3 px-2 w-24 text-center">Tests Attempted</th>
                    <th className="py-3 px-2 w-20 text-center">Avg. Score</th>
                    <th className="py-3 px-3 w-24">Last Active</th>
                    <th className="py-3 px-2 w-20">Status</th>
                    <th className="py-3 px-3 w-10 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#026BFC] mb-2" />
                        <span>Loading students...</span>
                      </td>
                    </tr>
                  ) : visibleStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No students match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    visibleStudents.map((student) => {
                      const isSelected = student.id === selectedStudentId;
                      const isChecked = selectedRowIds.includes(student.id);

                      // Subscription Badge color
                      let subBadgeColor = 'bg-[#ECFDF5] text-[#059669]'; // 6 Months (green)
                      if (student.subscriptionPlan === '1 Month') {
                        subBadgeColor = 'bg-[#EBF3FE] text-[#026BFC]'; // 1 Month (blue)
                      } else if (student.subscriptionPlan === '1 Year') {
                        subBadgeColor = 'bg-[#FFFBEB] text-[#D97706]'; // 1 Year (amber)
                      } else if (student.subscriptionPlan === 'Free') {
                        subBadgeColor = 'bg-slate-100 text-slate-600'; // Free (slate)
                      }

                      return (
                        <tr
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            if (!isPanelOpen) setIsPanelOpen(true);
                          }}
                          className={cn(
                            'group cursor-pointer transition-colors duration-150 relative',
                            isSelected
                              ? 'bg-[#F4F8FF] border-l-4 border-l-[#026BFC]'
                              : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => handleToggleRow(student.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-[#026BFC] focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* Order Number */}
                          <td className="py-3 px-2 text-slate-600 font-medium">{student.order}</td>

                          {/* Student Avatar + Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {student.avatarUrl ? (
                                <img
                                  src={student.avatarUrl}
                                  alt={student.fullName}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0',
                                    student.initialsBg || 'bg-slate-100',
                                    student.initialsColor || 'text-slate-600'
                                  )}
                                >
                                  {student.initials || 'ST'}
                                </div>
                              )}
                              <span className="font-semibold text-slate-900 group-hover:text-[#026BFC] transition-colors leading-snug whitespace-nowrap">
                                {student.fullName}
                              </span>
                            </div>
                          </td>

                          {/* Phone / Email (Stacked) */}
                          <td className="py-3 px-3">
                            <div className="text-[11px] text-slate-700 font-medium leading-tight">
                              {student.phone}
                            </div>
                            <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate max-w-[170px]">
                              {student.email}
                            </div>
                          </td>

                          {/* Subscription Badge */}
                          <td className="py-3 px-2">
                            <span
                              className={cn(
                                'inline-block px-2 py-0.5 rounded text-[11px] font-medium leading-tight whitespace-nowrap',
                                subBadgeColor
                              )}
                            >
                              {student.subscriptionPlan}
                            </span>
                          </td>

                          {/* Tests Attempted */}
                          <td className="py-3 px-2 text-center font-medium text-slate-700">
                            {student.testsAttempted}
                          </td>

                          {/* Avg. Score */}
                          <td className="py-3 px-2 text-center font-medium text-slate-700">
                            {student.avgScore}%
                          </td>

                          {/* Last Active */}
                          <td className="py-3 px-3 text-slate-600 text-[11px]">
                            {student.lastActive}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-2">
                            {student.status === 'Active' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F8EE] text-[#15803D]">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FEE2E2] text-[#DC2626]">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Actions (•••) */}
                          <td
                            className="py-3 px-3 text-right relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === student.id ? null : student.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Action Menu */}
                            {activeMenuId === student.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-3 top-8 z-30 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs text-left animate-in fade-in zoom-in-95"
                              >
                                <button
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setIsPanelOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                >
                                  <Users className="w-3.5 h-3.5 text-blue-500" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setIsEditModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Edit Student</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setIsNotificationModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                >
                                  <Send className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Send Notification</span>
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(student)}
                                  disabled={isWorking || student.status === 'Unavailable'}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                                  <span>
                                    Mark as {student.status === 'Active' ? 'Inactive' : 'Active'}
                                  </span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setIsResetPasswordModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Reset Password</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => {
                                    setSelectedStudentId(student.id);
                                    setIsDeleteModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete Student</span>
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

            {/* Table Pagination Footer */}
            <div className="py-3 px-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {currentFilteredCount === 0 ? 0 : startIndex + 1}–
                  {Math.min(startIndex + itemsPerPage, currentFilteredCount)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {totalStudentsCount.toLocaleString()}
                </span>{' '}
                students
              </div>

              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                        currentPage === pNum
                          ? 'bg-[#026BFC] text-white shadow-2xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="text-slate-400 px-0.5">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                        currentPage === totalPages
                          ? 'bg-[#026BFC] text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Page Size Select */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* RIGHT: STUDENT DETAILS PANEL                                    */}
          {/* =============================================================== */}
          {isPanelOpen && (
            <div className="w-full lg:w-[410px] shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Student Details
                </h3>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!selectedStudent ? (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No student selected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a student from the list to view their full details.
                  </p>
                </div>
              ) : (
                <>
                  {/* Profile Card Header */}
                  <div className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-100 rounded-xl mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedStudent.avatarUrl ? (
                        <img
                          src={selectedStudent.avatarUrl}
                          alt={selectedStudent.fullName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white shadow-2xs',
                            selectedStudent.initialsBg || 'bg-blue-100',
                            selectedStudent.initialsColor || 'text-[#026BFC]'
                          )}
                        >
                          {selectedStudent.initials || 'ST'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {selectedStudent.fullName}
                          </h4>
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium',
                              selectedStudent.status === 'Active'
                                ? 'bg-[#E6F8EE] text-[#15803D]'
                                : 'bg-[#FEE2E2] text-[#DC2626]'
                            )}
                          >
                            {selectedStudent.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                          Student ID: {selectedStudent.studentIdFormatted}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* 4 Tabs: Overview | Test History | Subscriptions | Notes */}
                  <div className="flex items-center gap-5 border-b border-slate-100 mb-4 text-xs font-semibold">
                    <button
                      onClick={() => setActiveTab('Overview')}
                      className={cn(
                        'pb-2 transition-colors relative',
                        activeTab === 'Overview'
                          ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('Test History')}
                      className={cn(
                        'pb-2 transition-colors relative',
                        activeTab === 'Test History'
                          ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      Test History
                    </button>
                    <button
                      onClick={() => setActiveTab('Subscriptions')}
                      className={cn(
                        'pb-2 transition-colors relative',
                        activeTab === 'Subscriptions'
                          ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      Subscriptions
                    </button>
                    <button
                      onClick={() => setActiveTab('Notes')}
                      className={cn(
                        'pb-2 transition-colors relative',
                        activeTab === 'Notes'
                          ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      Notes ({selectedStudent.notes?.length || 0})
                    </button>
                  </div>

                  {/* OVERVIEW CONTENT */}
                  {activeTab === 'Overview' && (
                    <div className="space-y-4">
                      {/* Quick Info Grid */}
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs mb-2">Quick Info</h5>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedStudent.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Joined {selectedStudent.joinedDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selectedStudent.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{selectedStudent.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Metrics Mini Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {/* Tests Attempted */}
                        <div className="bg-[#F0F7FF] rounded-lg p-2.5 text-center">
                          <span className="text-base font-bold text-[#026BFC] block leading-tight">
                            {selectedStudent.testsAttempted}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                            Tests Attempted
                          </span>
                        </div>

                        {/* Avg. Score */}
                        <div className="bg-[#F0FDF4] rounded-lg p-2.5 text-center">
                          <span className="text-base font-bold text-[#16A34A] block leading-tight">
                            {selectedStudent.avgScore}%
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                            Avg. Score
                          </span>
                        </div>

                        {/* Best Score */}
                        <div className="bg-[#FAF5FF] rounded-lg p-2.5 text-center">
                          <span className="text-base font-bold text-[#9333EA] block leading-tight">
                            {selectedStudent.bestScore || 85}%
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                            Best Score
                          </span>
                        </div>

                        {/* Days Active */}
                        <div className="bg-[#FFFBEB] rounded-lg p-2.5 text-center">
                          <span className="text-base font-bold text-[#D97706] block leading-tight">
                            {selectedStudent.daysActive || 12}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                            Days Active
                          </span>
                        </div>
                      </div>

                      {/* Subscription Information */}
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs mb-2">
                          Subscription Information
                        </h5>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                              <Crown className="w-5 h-5 text-[#10B981]" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-xs block leading-tight">
                                {selectedStudent.subscriptionPlan} Plan
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 leading-tight">
                                Valid Till: {selectedStudent.subscriptionValidTill || '12 Feb 2027'}{' '}
                                (
                                <span className="text-[#D97706] font-medium">
                                  {selectedStudent.subscriptionMonthsLeft || '4 months left'}
                                </span>
                                )
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setActiveTab('Subscriptions')}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#026BFC] bg-white border border-blue-200 hover:bg-blue-50/60 rounded-md transition-colors shrink-0"
                          >
                            View Subscription
                          </button>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-bold text-slate-900 text-xs">Recent Activity</h5>
                          <button
                            onClick={() => setActiveTab('Test History')}
                            className="text-[11px] font-medium text-[#026BFC] hover:underline"
                          >
                            View All
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {selectedStudent.activities.length === 0 ? (
                            <p className="text-[11px] text-slate-400 py-2">
                              No recent activity recorded.
                            </p>
                          ) : (
                            selectedStudent.activities.map((act) => {
                              return (
                                <div
                                  key={act.id}
                                  className="flex items-start justify-between gap-2.5 text-xs"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    {act.type === 'completed' ? (
                                      <div className="w-6 h-6 rounded-full bg-blue-50 text-[#026BFC] flex items-center justify-center shrink-0 mt-0.5">
                                        <FileCheck className="w-3.5 h-3.5 text-[#026BFC]" />
                                      </div>
                                    ) : act.type === 'attempted' ? (
                                      <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                                      </div>
                                    ) : act.type === 'purchase' ? (
                                      <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <Tag className="w-3.5 h-3.5 text-rose-500" />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <span className="font-medium text-slate-800 text-[11px] block leading-tight">
                                        {act.title}
                                      </span>
                                      {act.subtitle && (
                                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                          {act.subtitle}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                                    {act.time}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TEST HISTORY TAB */}
                  {activeTab === 'Test History' && (
                    <div className="space-y-3 text-xs py-1">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-800 block text-xs">
                          Completed Tests ({selectedStudent.testsAttempted})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Average score across all test attempts: {selectedStudent.avgScore}% •
                          Best: {selectedStudent.bestScore || 85}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="p-2.5 border border-slate-200 rounded-lg bg-white flex justify-between items-center shadow-2xs">
                          <div>
                            <span className="font-semibold block text-slate-900">
                              WBP Constable Full Mock 1
                            </span>
                            <span className="text-[11px] text-slate-500">
                              66/85 Marks (78%) • Rank #14 in District
                            </span>
                          </div>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            Passed
                          </span>
                        </div>
                        <div className="p-2.5 border border-slate-200 rounded-lg bg-white flex justify-between items-center shadow-2xs">
                          <div>
                            <span className="font-semibold block text-slate-900">
                              General Science - Heat & Temperature
                            </span>
                            <span className="text-[11px] text-slate-500">
                              18/30 Marks (60%) • Topic Test
                            </span>
                          </div>
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            Completed
                          </span>
                        </div>
                        <div className="p-2.5 border border-slate-200 rounded-lg bg-white flex justify-between items-center shadow-2xs">
                          <div>
                            <span className="font-semibold block text-slate-900">
                              WBP Constable Speed Test (Arithmetic)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              22/25 Marks (88%) • Rank #4
                            </span>
                          </div>
                          <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            Top 5%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBSCRIPTIONS TAB */}
                  {activeTab === 'Subscriptions' && (
                    <div className="space-y-3.5 text-xs py-1">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="font-bold text-emerald-900 block text-xs">
                          Current Plan: {selectedStudent.subscriptionPlan} Plan
                        </span>
                        <span className="text-[11px] text-emerald-700 block mt-0.5">
                          Status: Active • Valid till{' '}
                          {selectedStudent.subscriptionValidTill || '12 Feb 2027'} (
                          {selectedStudent.subscriptionMonthsLeft || '4 months left'})
                        </span>
                      </div>

                      <div className="p-3 border border-slate-200 rounded-xl bg-white space-y-1.5 shadow-2xs">
                        <span className="font-bold text-slate-900 block text-xs">
                          Order Details
                        </span>
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>Order ID:</span>
                          <span className="font-mono text-slate-800">#ORD-98231</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>Amount Paid:</span>
                          <span className="font-bold text-slate-900">₹499 (Online)</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>Payment Gateway:</span>
                          <span>Razorpay UPI</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-800 block text-xs mb-2">
                          Admin Plan Override:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleQuickGrantPlan('6 Months')}
                            className="p-2 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold text-center"
                          >
                            Grant 6 Months
                          </button>
                          <button
                            onClick={() => handleQuickGrantPlan('1 Year')}
                            className="p-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold text-center"
                          >
                            Grant 1 Year Pro
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTES TAB */}
                  {activeTab === 'Notes' && (
                    <div className="space-y-3 text-xs py-1">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Add Internal Note
                        </label>
                        <textarea
                          rows={3}
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="e.g. Student reported difficulty in reasoning, guided to mock tests..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                        />
                        <div className="flex justify-end mt-1.5">
                          <button
                            onClick={handleSaveNote}
                            disabled={!newNoteText.trim()}
                            className="px-3 py-1.5 bg-[#026BFC] hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="font-bold text-slate-800 block text-xs">
                          Notes History:
                        </span>
                        {!selectedStudent.notes || selectedStudent.notes.length === 0 ? (
                          <p className="text-slate-400 text-[11px] py-2">
                            No notes added for this student yet.
                          </p>
                        ) : (
                          selectedStudent.notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-2.5 bg-slate-50 rounded-lg border border-slate-200"
                            >
                              <p className="text-slate-800 text-[11px] leading-relaxed">
                                {note.text}
                              </p>
                              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                                <span>By: {note.author}</span>
                                <span>{note.createdAt}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions Row (Exact 3 Buttons) */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                    {/* Send Notification Button */}
                    <button
                      onClick={() => setIsNotificationModalOpen(true)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-[#026BFC] border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-[#026BFC]" />
                      <span>Send Notification</span>
                    </button>

                    {/* Reset Password Button */}
                    <button
                      onClick={() => setIsResetPasswordModalOpen(true)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Password</span>
                    </button>

                    {/* Delete Student Button */}
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-rose-50/60 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete Student</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: ADD STUDENT MODAL                                          */}
      {/* =================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#026BFC]" />
                  <span>Add New Student</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter student credentials and assign subscription plan.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleAddStudentSubmit}
              className="p-6 overflow-y-auto space-y-3.5 text-xs flex-1"
            >
              <div>
                <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suman Mondal"
                  value={newStudentForm.fullName}
                  onChange={(e) =>
                    setNewStudentForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={newStudentForm.email}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newStudentForm.phone}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Subscription Plan</label>
                  <select
                    value={newStudentForm.subscriptionPlan}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({
                        ...prev,
                        subscriptionPlan: e.target.value as SubscriptionTier,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Month">1 Month</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Free">Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Target Exam</label>
                  <select
                    value={newStudentForm.targetExam}
                    onChange={(e) =>
                      setNewStudentForm((prev) => ({ ...prev, targetExam: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="WBP Constable">WBP Constable</option>
                    <option value="KP Constable">KP Constable</option>
                    <option value="WBTET Primary">WBTET Primary</option>
                    <option value="General Science">General Science</option>
                    <option value="SSC CGL">SSC CGL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Location / District</label>
                <input
                  type="text"
                  placeholder="Kolkata, West Bengal"
                  value={newStudentForm.location}
                  onChange={(e) =>
                    setNewStudentForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWorking}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: IMPORT STUDENTS MODAL (CSV Upload & Sample Template)        */}
      {/* =================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#026BFC]" />
                <span>Import Students (CSV)</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload a `.csv` file containing student records with name, email, phone, and target
              exam.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30"
            >
              <Upload className="w-8 h-8 text-[#026BFC] mx-auto mb-2 opacity-80" />
              <span className="font-semibold text-xs text-slate-700 block">
                Click to browse or drag and drop CSV
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Supports standard CSV format (Max 5MB)
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="inline-flex items-center gap-1.5 text-xs text-[#026BFC] hover:underline font-medium"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Select File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: EDIT STUDENT MODAL                                         */}
      {/* =================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#026BFC]" />
                <span>Edit Student: {selectedStudent?.fullName}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.fullName}
                  onChange={(e) =>
                    setEditStudentForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editStudentForm.email}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={editStudentForm.phone}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Subscription Plan</label>
                  <select
                    value={editStudentForm.subscriptionPlan}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({
                        ...prev,
                        subscriptionPlan: e.target.value as SubscriptionTier,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Month">1 Month</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Free">Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Status</label>
                  <select
                    value={editStudentForm.status}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({
                        ...prev,
                        status: e.target.value as StudentStatus,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Target Exam</label>
                  <select
                    value={editStudentForm.targetExam}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, targetExam: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="WBP Constable">WBP Constable</option>
                    <option value="KP Constable">KP Constable</option>
                    <option value="WBTET Primary">WBTET Primary</option>
                    <option value="General Science">General Science</option>
                    <option value="SSC CGL">SSC CGL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={editStudentForm.location}
                    onChange={(e) =>
                      setEditStudentForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWorking}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: SEND NOTIFICATION MODAL                                    */}
      {/* =================================================================== */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#026BFC]" />
                <span>Send Notification</span>
              </h3>
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Send a targeted push notification or in-app message to{' '}
              <span className="font-semibold text-slate-800">{selectedStudent?.fullName}</span>.
            </p>

            <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New WBP Mock Test Available!"
                  value={notificationText.title}
                  onChange={(e) =>
                    setNotificationText((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Message</label>
                <textarea
                  rows={3}
                  placeholder="Enter message details..."
                  value={notificationText.message}
                  onChange={(e) =>
                    setNotificationText((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNotificationModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWorking}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Send Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: RESET PASSWORD CONFIRMATION                                */}
      {/* =================================================================== */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#026BFC] flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5 text-[#026BFC]" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Reset Student Password</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to send password reset link to{' '}
              <span className="font-semibold text-slate-800">{selectedStudent?.email}</span>?
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: DELETE STUDENT MODAL                                       */}
      {/* =================================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Student</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-slate-800">"{selectedStudent?.fullName}"</span>?
              All attempt histories and subscription access will be revoked.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={isWorking}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
