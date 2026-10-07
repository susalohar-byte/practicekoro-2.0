import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Crown,
  CreditCard,
  Edit2,
  Send,
  Trash2,
  Filter,
  Check,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { AdminSubscriptionRow, PaymentStatus } from '@/types';
import {
  formatRecordedAmount,
  getRecordedSubscriptionRevenue,
} from '@/utils/adminFinancialDisplay';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface SubscriptionRecord {
  id: number | string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  plan: string;
  planFullTitle: string;
  planBadgeClass: string;
  amount?: number;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
  paymentCurrency?: string;
  paymentMethod: 'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card' | '—';
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired';
  statusBadgeClass: string;
  daysLeft?: number;
  autoRenew?: boolean;
  transactionId?: string;
  createdAt?: string;
  lastUpdated?: string;
}

export function mapAdminSubscriptionRow(d: AdminSubscriptionRow): SubscriptionRecord {
  const isAct = d.status === 'active' && new Date(d.expiresAt).getTime() > Date.now();
  const formatDate = (value?: string) => {
    if (!value || !Number.isFinite(new Date(value).getTime())) return 'Unavailable';
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const method: SubscriptionRecord['paymentMethod'] =
    d.paymentGateway === 'razorpay'
      ? 'Razorpay'
      : d.paymentGateway === 'phonepe'
        ? 'PhonePe'
        : d.paymentGateway === 'upi'
          ? 'UPI'
          : '—';
  return {
    id: d.id,
    studentName: d.studentName || 'Student Aspirant',
    studentEmail: d.studentEmail || '',
    studentPhone: d.studentPhone,
    avatarType: 'initials',
    avatarInitials: (d.studentName || 'ST').slice(0, 2).toUpperCase(),
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    plan: d.planTitle || 'Pro Pass',
    planFullTitle: d.planTitle || 'Pro Pass',
    planBadgeClass: isAct ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]',
    amount: d.paymentAmount,
    paymentId: d.paymentId,
    paymentStatus: d.paymentStatus,
    paymentCurrency: d.paymentCurrency,
    paymentMethod: method,
    startDate: formatDate(d.startsAt),
    endDate: formatDate(d.expiresAt),
    status: isAct ? 'Active' : 'Expired',
    statusBadgeClass: isAct ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]',
    daysLeft: Number.isFinite(new Date(d.expiresAt).getTime())
      ? Math.max(0, Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / 86400000))
      : undefined,
    autoRenew: false,
    transactionId: d.paymentTransactionId,
    createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : undefined,
    lastUpdated: d.createdAt ? new Date(d.createdAt).toLocaleString('en-GB') : undefined,
  };
}

// Initial dataset strictly matching screenshot media_1791202130865.jpg
export const INITIAL_SUBSCRIPTIONS: SubscriptionRecord[] = [
  {
    id: 1,
    studentName: 'Rohit Kumar',
    studentEmail: 'rohitkumar@gmail.com',
    studentPhone: '+91 98765 43210',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    plan: '6 Months',
    planFullTitle: '6 Months Plan',
    planBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    amount: 99,
    paymentMethod: 'Razorpay',
    startDate: '12 Aug 2026',
    endDate: '12 Feb 2027',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 124,
    autoRenew: false,
    transactionId: 'pay_2F9kLmX8vP6QeH',
    createdAt: '12 Aug 2026, 11:20 AM',
    lastUpdated: '12 Aug 2026, 11:20 AM',
  },
  {
    id: 2,
    studentName: 'Puja Roy',
    studentEmail: 'pujaroy@gmail.com',
    studentPhone: '+91 98765 43211',
    avatarType: 'initials',
    avatarInitials: 'PR',
    avatarBgColor: 'bg-rose-100',
    avatarTextColor: 'text-rose-600',
    plan: '3 Months',
    planFullTitle: '3 Months Plan',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 59,
    paymentMethod: 'UPI',
    startDate: '10 Sep 2026',
    endDate: '10 Dec 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 92,
    autoRenew: true,
    transactionId: 'upi_9k2mJ7pQd',
    createdAt: '10 Sep 2026, 09:14 AM',
    lastUpdated: '10 Sep 2026, 09:14 AM',
  },
  {
    id: 3,
    studentName: 'Suman Das',
    studentEmail: 'suman.das@gmail.com',
    studentPhone: '+91 98765 43212',
    avatarType: 'initials',
    avatarInitials: 'SK',
    avatarBgColor: 'bg-purple-100',
    avatarTextColor: 'text-purple-600',
    plan: '1 Month',
    planFullTitle: '1 Month Plan',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 29,
    paymentMethod: 'Razorpay',
    startDate: '05 Sep 2026',
    endDate: '05 Oct 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 14,
    autoRenew: false,
    transactionId: 'pay_3K9pLmX8vP',
    createdAt: '05 Sep 2026, 02:30 PM',
    lastUpdated: '05 Sep 2026, 02:30 PM',
  },
  {
    id: 4,
    studentName: 'Sneha Khatun',
    studentEmail: 'sneha.kt@gmail.com',
    studentPhone: '+91 98765 43213',
    avatarType: 'initials',
    avatarInitials: 'SK',
    avatarBgColor: 'bg-purple-100',
    avatarTextColor: 'text-purple-600',
    plan: '1 Year',
    planFullTitle: '1 Year Annual Plan',
    planBadgeClass: 'bg-[#FEF3C7] text-[#B45309]',
    amount: 149,
    paymentMethod: 'PhonePe',
    startDate: '01 Aug 2026',
    endDate: '01 Aug 2027',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 298,
    autoRenew: true,
    transactionId: 'pp_8F7kLmX8vP',
    createdAt: '01 Aug 2026, 10:12 AM',
    lastUpdated: '01 Aug 2026, 10:12 AM',
  },
  {
    id: 5,
    studentName: 'Arijit Mondal',
    studentEmail: 'arijitmondal@gmail.com',
    studentPhone: '+91 98765 43214',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    plan: '6 Months',
    planFullTitle: '6 Months Plan',
    planBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    amount: 99,
    paymentMethod: 'Razorpay',
    startDate: '02 Sep 2026',
    endDate: '02 Mar 2027',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 148,
    autoRenew: false,
    transactionId: 'pay_9M2kLmX8vP',
    createdAt: '02 Sep 2026, 05:44 PM',
    lastUpdated: '02 Sep 2026, 05:44 PM',
  },
  {
    id: 6,
    studentName: 'Subhankar Pal',
    studentEmail: 'subhankar.pal@gmail.com',
    studentPhone: '+91 98765 43215',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    plan: '3 Months',
    planFullTitle: '3 Months Plan',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 59,
    paymentMethod: 'UPI',
    startDate: '15 Aug 2026',
    endDate: '15 Nov 2026',
    status: 'Expired',
    statusBadgeClass: 'bg-[#FEE2E2] text-[#DC2626]',
    daysLeft: 0,
    autoRenew: false,
    transactionId: 'upi_1K9pLmX8vP',
    createdAt: '15 Aug 2026, 09:18 AM',
    lastUpdated: '15 Nov 2026, 11:59 PM',
  },
  {
    id: 7,
    studentName: 'Moumita Sarkar',
    studentEmail: 'moumita.s@gmail.com',
    studentPhone: '+91 98765 43216',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    plan: '1 Month',
    planFullTitle: '1 Month Plan',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 29,
    paymentMethod: 'Razorpay',
    startDate: '20 Sep 2026',
    endDate: '20 Oct 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 18,
    autoRenew: true,
    transactionId: 'pay_7N2kLmX8vP',
    createdAt: '20 Sep 2026, 01:26 PM',
    lastUpdated: '20 Sep 2026, 01:26 PM',
  },
  {
    id: 8,
    studentName: 'Abhijit Dey',
    studentEmail: 'abhijit.dey@gmail.com',
    studentPhone: '+91 98765 43217',
    avatarType: 'initials',
    avatarInitials: 'AD',
    avatarBgColor: 'bg-emerald-100',
    avatarTextColor: 'text-emerald-600',
    plan: 'Free Plan',
    planFullTitle: 'Free Lifetime Trial',
    planBadgeClass: 'bg-[#EDE9FE] text-[#6D28D9]',
    amount: 0,
    paymentMethod: '—',
    startDate: '12 Aug 2026',
    endDate: '—',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 999,
    autoRenew: false,
    transactionId: '—',
    createdAt: '12 Aug 2026, 03:12 PM',
    lastUpdated: '12 Aug 2026, 03:12 PM',
  },
  {
    id: 9,
    studentName: 'Rakesh Shaw',
    studentEmail: 'rakeshshaw@gmail.com',
    studentPhone: '+91 98765 43218',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    plan: '6 Months',
    planFullTitle: '6 Months Plan',
    planBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    amount: 99,
    paymentMethod: 'PhonePe',
    startDate: '01 Jul 2026',
    endDate: '01 Jan 2027',
    status: 'Expired',
    statusBadgeClass: 'bg-[#FEE2E2] text-[#DC2626]',
    daysLeft: 0,
    autoRenew: false,
    transactionId: 'pp_5K9pLmX8vP',
    createdAt: '01 Jul 2026, 11:05 AM',
    lastUpdated: '01 Jan 2027, 11:59 PM',
  },
  {
    id: 10,
    studentName: 'Taniya Ghosh',
    studentEmail: 'taniya.ghosh@gmail.com',
    studentPhone: '+91 98765 43219',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    plan: '3 Months',
    planFullTitle: '3 Months Plan',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 59,
    paymentMethod: 'UPI',
    startDate: '08 Sep 2026',
    endDate: '08 Dec 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    daysLeft: 76,
    autoRenew: true,
    transactionId: 'upi_3K9pLmX8vP',
    createdAt: '08 Sep 2026, 06:48 PM',
    lastUpdated: '08 Sep 2026, 06:48 PM',
  },
];

// Payment Method Logo helper
const MethodIcon: React.FC<{ method: string }> = ({ method }) => {
  if (method === 'Razorpay') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#0C2340] text-blue-400 rounded flex items-center justify-center font-black text-[9px]">
          P
        </div>
        <span className="text-xs text-slate-700 font-medium">Razorpay</span>
      </div>
    );
  }
  if (method === 'UPI') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#0F766E] text-white rounded flex items-center justify-center font-bold text-[8px]">
          ▲
        </div>
        <span className="text-xs text-slate-700 font-medium">UPI</span>
      </div>
    );
  }
  if (method === 'PhonePe') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#6739B7] text-white rounded-full flex items-center justify-center font-bold text-[9px]">
          पे
        </div>
        <span className="text-xs text-slate-700 font-medium">PhonePe</span>
      </div>
    );
  }
  if (method === 'Credit Card') {
    return (
      <div className="flex items-center gap-1.5">
        <CreditCard className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-700 font-medium">Credit Card</span>
      </div>
    );
  }
  return <span className="text-xs text-slate-400 font-medium">—</span>;
};

// ============================================================================
// MAIN COMPONENT: ADMIN SUBSCRIPTIONS
// ============================================================================

export const AdminSubscriptions: React.FC = () => {
  // Financial records always start from the backend, not stale demo/cache prices.
  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(
        'practicekoro_admin_subscriptions_v2',
        JSON.stringify(subscriptionsList)
      );
    } catch {
      // ignore
    }
  }, [subscriptionsList]);

  // Load live subscriptions from database on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getAllAdminSubscriptions()
      .then((remote) => {
        if (!isMounted) return;
        setRecordsLoading(false);
        if (!remote || remote.length === 0) {
          setSubscriptionsList([]);
          return;
        }
        const mapped = remote.map(mapAdminSubscriptionRow);
        setSubscriptionsList(mapped);
        setSelectedRowId((prev) => {
          if (!prev) return null;
          return mapped.some((m) => m.id === prev) ? prev : null;
        });
      })
      .catch((err) => {
        console.warn('Failed to load admin subscriptions from database:', err);
        if (isMounted) {
          setRecordsLoading(false);
          setRecordsError(
            'Subscriptions could not be fully loaded. Totals and exports are unavailable; please refresh.'
          );
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected row (Neutral initial state - nothing selected by default)
  const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(false);

  // Dynamic KPI computations
  const totalSubscriptionsCount = subscriptionsList.length;
  const activeSubscriptionsCount = useMemo(() => {
    return subscriptionsList.filter((s) => s.status === 'Active').length;
  }, [subscriptionsList]);
  const expiringSoonCount = useMemo(() => {
    return subscriptionsList.filter(
      (s) => s.status === 'Active' && (s.daysLeft ?? 0) <= 7 && (s.daysLeft ?? 0) > 0
    ).length;
  }, [subscriptionsList]);
  const expiredSubscriptionsCount = useMemo(() => {
    return subscriptionsList.filter((s) => s.status === 'Expired').length;
  }, [subscriptionsList]);
  const totalRevenueAmount = useMemo(() => {
    return getRecordedSubscriptionRevenue(subscriptionsList);
  }, [subscriptionsList]);
  const revenueUnavailable = subscriptionsList.some(
    (s) =>
      s.paymentId &&
      (s.amount == null ||
        !s.paymentStatus ||
        (s.paymentCurrency != null && s.paymentCurrency !== 'INR'))
  );

  // Checkbox selections
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<(number | string)[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterMethod, setFilterMethod] = useState('All Payment Methods');

  // Detail panel tabs ('Overview' | 'Payments' | 'Test Access' | 'Activity')
  const [activeDetailTab, setActiveDetailTab] = useState<
    'Overview' | 'Payments' | 'Test Access' | 'Activity'
  >('Overview');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Create Form states
  const [formStudentName, setFormStudentName] = useState('');
  const [formStudentEmail, setFormStudentEmail] = useState('');
  const [formPlan, setFormPlan] = useState('6 Months');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState<'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card'>(
    'Razorpay'
  );

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  // Selected subscription
  const selectedSubscription = useMemo(() => {
    if (!selectedRowId) return null;
    return subscriptionsList.find((s) => s.id === selectedRowId) || null;
  }, [subscriptionsList, selectedRowId]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return subscriptionsList.filter((item) => {
      if (filterPlan !== 'All Plans' && !item.plan.includes(filterPlan.replace(' Plan', '')))
        return false;
      if (filterStatus !== 'All Status' && item.status !== filterStatus) return false;
      if (filterMethod !== 'All Payment Methods' && item.paymentMethod !== filterMethod)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.studentName.toLowerCase().includes(q) ||
          item.studentEmail.toLowerCase().includes(q) ||
          (item.transactionId && item.transactionId.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [subscriptionsList, filterPlan, filterStatus, filterMethod, searchQuery]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCheckboxes(filteredRows.map((r) => r.id));
    } else {
      setSelectedCheckboxes([]);
    }
  };

  const handleToggleRow = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export CSV
  const handleExport = () => {
    if (recordsLoading || recordsError) return;
    const headers = [
      'Student Name',
      'Email',
      'Plan',
      'Amount',
      'Payment Method',
      'Start Date',
      'End Date',
      'Status',
      'Days Left',
    ];
    const rows = filteredRows.map((s) => [
      s.studentName,
      s.studentEmail,
      s.plan,
      s.amount,
      s.paymentMethod,
      s.startDate,
      s.endDate,
      s.status,
      s.daysLeft ?? 0,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_subscriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported active subscriptions successfully.');
  };

  // Create Subscription Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName.trim() || !formStudentEmail.trim()) {
      showToast('Please fill student name and email.');
      return;
    }

    try {
      const res = await api.createAdminSubscription({
        studentName: formStudentName.trim(),
        studentEmail: formStudentEmail.trim(),
        planTitle: formPlan,
        amount: formAmount.trim() ? Number(formAmount) : undefined,
        paymentMethod: formMethod,
        durationDays: 180,
      });
      if (!res.success) {
        showToast(res.error || 'Subscription creation failed.');
        return;
      }
      const records = await api.getAllAdminSubscriptions();
      setSubscriptionsList(records.map(mapAdminSubscriptionRow));
      if (res.subscriptionId) setSelectedRowId(res.subscriptionId);
      setIsCreateModalOpen(false);
      showToast(`Subscription activated for ${formStudentName.trim()}!`);
    } catch (err) {
      console.warn('Subscription creation error:', err);
      showToast('Could not save or reload the subscription. Please refresh and verify.');
    }
  };

  // Cancel Subscription
  const handleCancelSubscription = async (target: SubscriptionRecord | null) => {
    if (!target || isCancellingSubscription || target.status !== 'Active') return;
    if (!window.confirm(`Cancel subscription access for ${target.studentName}?`)) return;
    const targetId = target.id;
    setIsCancellingSubscription(true);
    try {
      const result = await api.cancelSubscription(String(targetId));
      if (!result.success) {
        showToast(result.error || 'Could not cancel the subscription.', 'error');
        return;
      }
      setSubscriptionsList((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                status: 'Expired',
                statusBadgeClass: 'bg-[#FEE2E2] text-[#DC2626]',
                daysLeft: 0,
                endDate: result.expiresAt
                  ? new Date(result.expiresAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : s.endDate,
              }
            : s
        )
      );
      showToast(`Subscription cancelled for ${target.studentName}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not cancel the subscription.', 'error');
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  // Extend Subscription Action
  const handleExtendConfirm = async (days: number) => {
    if (!selectedSubscription) return;
    const targetId = selectedSubscription.id;
    setSubscriptionsList((prev) =>
      prev.map((s) =>
        s.id === targetId
          ? {
              ...s,
              status: 'Active',
              statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
              daysLeft: (s.daysLeft || 0) + days,
              endDate: '12 Aug 2027',
            }
          : s
      )
    );
    setIsExtendModalOpen(false);
    showToast(`Extended subscription by ${days} days for ${selectedSubscription.studentName}.`);

    // Persist to database
    try {
      await api.extendSubscription(targetId, days);
    } catch (err) {
      console.warn('Failed to extend subscription in database:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {recordsError && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {recordsError}
        </div>
      )}
      {recordsLoading && (
        <div role="status" className="text-sm text-slate-500">
          Loading all records…
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastType === 'error' ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200"
        >
          {toastType === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Manage student subscriptions, view plans, payments and access details.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <button
            disabled={recordsLoading || !!recordsError}
            onClick={handleExport}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setFormStudentName('');
              setFormStudentEmail('');
              setFormPlan('6 Months');
              setFormAmount('99');
              setIsCreateModalOpen(true);
            }}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FIVE SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Total Subscriptions
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {totalSubscriptionsCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 28%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">vs last month</span>
          </div>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Active Subscriptions
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {activeSubscriptionsCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 24%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              currently active
            </span>
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Expiring Soon</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {expiringSoonCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 12%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">in next 7 days</span>
          </div>
        </div>

        {/* Card 4: Expired Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Expired Subscriptions
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {expiredSubscriptionsCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                ↓ 16%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">this month</span>
          </div>
        </div>

        {/* Card 5: Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg shrink-0">
            ₹
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Recorded Revenue</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {revenueUnavailable ? 'Unavailable' : formatRecordedAmount(totalRevenueAmount)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Completed linked payments in loaded records
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, transaction ID..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* All Plans */}
        <div className="relative min-w-[130px]">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
          >
            <option value="All Plans">All Plans</option>
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Year">1 Year</option>
            <option value="Free Plan">Free Plan</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Status */}
        <div className="relative min-w-[120px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Payment Methods */}
        <div className="relative min-w-[160px]">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
          >
            <option value="All Payment Methods">All Payment Methods</option>
            <option value="Razorpay">Razorpay</option>
            <option value="UPI">UPI</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Credit Card">Credit Card</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Subscription filters applied.')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterPlan('All Plans');
              setFilterStatus('All Status');
              setFilterMethod('All Payment Methods');
              showToast('Filters reset.');
            }}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2.5 py-2 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. SPLIT GRID (TABLE 8 COLS, DETAILS PANEL 4 COLS)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SUBSCRIPTIONS TABLE */}
        <div
          className={cn(
            'transition-all duration-300 space-y-4',
            isDetailsPanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          )}
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedCheckboxes.length > 0 &&
                          selectedCheckboxes.length === filteredRows.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3">Start Date</th>
                    <th className="py-3 px-3">End Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                        No subscription records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.slice(0, 10).map((row, idx) => {
                      const isSelected = Boolean(isDetailsPanelOpen && selectedRowId === row.id);
                      const isChecked = selectedCheckboxes.includes(row.id);
                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedRowId(row.id);
                            setIsDetailsPanelOpen(true);
                          }}
                          className={cn(
                            'transition-colors cursor-pointer group',
                            isSelected
                              ? 'bg-blue-50/50 hover:bg-blue-50/70'
                              : 'hover:bg-slate-50/60'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => handleToggleRow(row.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* # */}
                          <td className="py-3 px-2 text-center text-slate-500 font-normal">
                            {idx + 1}
                          </td>

                          {/* Student */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {row.avatarType === 'photo' && row.avatarSrc ? (
                                <img
                                  src={row.avatarSrc}
                                  alt={row.studentName}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                                    row.avatarBgColor || 'bg-blue-100',
                                    row.avatarTextColor || 'text-blue-600'
                                  )}
                                >
                                  {row.avatarInitials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 block truncate">
                                  {row.studentName}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {row.studentEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap',
                                row.planBadgeClass
                              )}
                            >
                              {row.plan}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {formatRecordedAmount(row.amount, row.paymentCurrency)}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-3">
                            <MethodIcon method={row.paymentMethod} />
                          </td>

                          {/* Start Date */}
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {row.startDate}
                          </td>

                          {/* End Date */}
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {row.endDate}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium',
                                row.statusBadgeClass
                              )}
                            >
                              {row.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3 px-3 text-center relative"
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
                                      setSelectedRowId(row.id);
                                      setIsDetailsPanelOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>View Details</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedRowId(row.id);
                                      setIsExtendModalOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Extend Validity</span>
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    disabled={isCancellingSubscription || row.status !== 'Active'}
                                    onClick={() => {
                                      handleCancelSubscription(row);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Cancel Plan</span>
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

            {/* Table Footer / Pagination */}
            <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                Showing {filteredRows.length === 0 ? 0 : 1}–{Math.min(filteredRows.length, 10)} of{' '}
                {filteredRows.length.toLocaleString('en-IN')} subscriptions
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
        </div>

        {/* RIGHT COLUMN: SUBSCRIPTION DETAILS DOCKED PANEL */}
        {isDetailsPanelOpen && selectedSubscription && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Subscription Details</h2>
              <button
                onClick={() => {
                  setIsDetailsPanelOpen(false);
                  setSelectedRowId(null);
                }}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

                {/* Student Profile Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedSubscription.avatarType === 'photo' &&
                    selectedSubscription.avatarSrc ? (
                      <img
                        src={selectedSubscription.avatarSrc}
                        alt={selectedSubscription.studentName}
                        className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-blue-100"
                      />
                    ) : (
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-blue-100',
                          selectedSubscription.avatarBgColor || 'bg-blue-100',
                          selectedSubscription.avatarTextColor || 'text-blue-600'
                        )}
                      >
                        {selectedSubscription.avatarInitials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {selectedSubscription.studentName}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.2 rounded text-[10px] font-semibold',
                            selectedSubscription.statusBadgeClass
                          )}
                        >
                          {selectedSubscription.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        {selectedSubscription.studentEmail}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {selectedSubscription.studentPhone || '+91 98765 43210'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsExtendModalOpen(true)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* 4 Detail Tabs */}
                <div className="flex items-center border-b border-slate-100 text-xs">
                  {(['Overview', 'Payments', 'Test Access', 'Activity'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveDetailTab(tab)}
                      className={cn(
                        'py-2 px-3 font-semibold transition-all relative cursor-pointer',
                        activeDetailTab === tab
                          ? 'text-[#2563EB]'
                          : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      {tab}
                      {activeDetailTab === tab && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab: Overview Content */}
                {activeDetailTab === 'Overview' && (
                  <div className="space-y-4 pt-1">
                    {/* Active Plan Green Banner */}
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {selectedSubscription.planFullTitle}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Valid till {selectedSubscription.endDate} (
                            {Math.ceil((selectedSubscription.daysLeft || 124) / 30)} months left)
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsChangePlanModalOpen(true)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 cursor-pointer shadow-2xs"
                      >
                        Change Plan
                      </button>
                    </div>

                    {/* Subscription Info Breakdown */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900 text-xs mb-2">Subscription Info</h4>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Plan Name</span>
                        <span className="font-medium text-slate-800">
                          {selectedSubscription.planFullTitle}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Amount</span>
                        <span className="font-bold text-slate-900">
                          {formatRecordedAmount(
                            selectedSubscription.amount,
                            selectedSubscription.paymentCurrency
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Status</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[11px] font-medium',
                            selectedSubscription.statusBadgeClass
                          )}
                        >
                          {selectedSubscription.status}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Start Date</span>
                        <span className="font-medium text-slate-800">
                          {selectedSubscription.startDate}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">End Date</span>
                        <span className="font-medium text-slate-800">
                          {selectedSubscription.endDate}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Days Left</span>
                        <span className="font-semibold text-slate-800">
                          {selectedSubscription.daysLeft || 124} days
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Auto Renew</span>
                        <span className="font-medium text-slate-700">
                          {selectedSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Payment Method</span>
                        <span className="font-medium text-slate-800">
                          {selectedSubscription.paymentMethod}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Transaction ID</span>
                        <span className="font-mono text-slate-700">
                          {selectedSubscription.transactionId || 'pay_2F9kLmX8vP6QeH'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-400 font-normal">Created At</span>
                        <span className="font-medium text-slate-800">
                          {selectedSubscription.createdAt || '12 Aug 2026, 11:20 AM'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-400 font-normal">Last Updated</span>
                        <span className="font-medium text-slate-800">
                          {selectedSubscription.lastUpdated || '12 Aug 2026, 11:20 AM'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions (4 Buttons) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h4 className="font-bold text-slate-900 text-xs mb-2">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            showToast(
                              `Navigating to student profile of ${selectedSubscription.studentName}`
                            )
                          }
                          className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>View Student</span>
                        </button>

                        <button
                          onClick={() => setIsExtendModalOpen(true)}
                          className="border border-blue-200 text-[#2563EB] hover:bg-blue-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Extend Subscription</span>
                        </button>

                        <button
                          onClick={() => setIsNotificationModalOpen(true)}
                          className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-slate-400" />
                          <span>Send Notification</span>
                        </button>

                        <button
                          onClick={() => handleCancelSubscription(selectedSubscription)}
                          disabled={
                            isCancellingSubscription || selectedSubscription.status !== 'Active'
                          }
                          className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>
                            {isCancellingSubscription ? 'Cancelling…' : 'Cancel Subscription'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Payments Content */}
                {activeDetailTab === 'Payments' && (
                  <div className="space-y-3 text-xs pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>Initial Activation</span>
                        <span>
                          {formatRecordedAmount(
                            selectedSubscription.amount,
                            selectedSubscription.paymentCurrency
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                        <span>{selectedSubscription.startDate}</span>
                        <span className="text-emerald-600 font-semibold">
                          {selectedSubscription.paymentStatus || 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 text-center py-4">
                      Only linked payment data is shown.
                    </div>
                  </div>
                )}

                {/* Tab: Test Access Content */}
                {activeDetailTab === 'Test Access' && (
                  <div className="space-y-2.5 text-xs pt-1">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span>WBP Constable Full Mocks</span>
                      <span className="text-emerald-600 font-bold">Unlocked</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span>WBPSC Clerkship Mocks</span>
                      <span className="text-emerald-600 font-bold">Unlocked</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span>Topic-wise Unlimited Drills</span>
                      <span className="text-emerald-600 font-bold">Unlocked</span>
                    </div>
                  </div>
                )}

                {/* Tab: Activity Content */}
                {activeDetailTab === 'Activity' && (
                  <div className="space-y-2 text-xs pt-1 text-slate-600">
                    <div className="border-l-2 border-blue-400 pl-3 py-1">
                      <span className="font-semibold block text-slate-800">
                        Subscription Created
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {selectedSubscription.createdAt}
                      </span>
                    </div>
                    <div className="border-l-2 border-emerald-400 pl-3 py-1">
                      <span className="font-semibold block text-slate-800">Payment Verified</span>
                      <span className="text-[10px] text-slate-400">
                        Via {selectedSubscription.paymentMethod}
                      </span>
                    </div>
                  </div>
                )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. CREATE SUBSCRIPTION MODAL                                         */}
      {/* ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Subscription</h3>
                  <p className="text-[11px] text-slate-500">
                    Assign pass access manually to a registered learner
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                  placeholder="e.g. Aniket Banerjee"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Student Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formStudentEmail}
                  onChange={(e) => setFormStudentEmail(e.target.value)}
                  placeholder="e.g. aniket.b@gmail.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Subscription Plan
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Reference Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    A manual grant is not a collected payment. Revenue requires a linked completed
                    payment record.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Payment Method
                </label>
                <select
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none"
                >
                  <option value="Razorpay">Razorpay</option>
                  <option value="UPI">UPI</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs"
                >
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. EXTEND SUBSCRIPTION MODAL                                         */}
      {/* ==================================================================== */}
      {isExtendModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Extend Subscription</h3>
            <p className="text-xs text-slate-500 mb-4">
              Grant additional validity to <strong>{selectedSubscription.studentName}</strong>
            </p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <button
                onClick={() => handleExtendConfirm(30)}
                className="py-2.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 transition-colors"
              >
                +30 Days
              </button>
              <button
                onClick={() => handleExtendConfirm(90)}
                className="py-2.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 transition-colors"
              >
                +90 Days
              </button>
              <button
                onClick={() => handleExtendConfirm(180)}
                className="py-2.5 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold text-slate-800 transition-colors"
              >
                +180 Days
              </button>
            </div>

            <button
              onClick={() => setIsExtendModalOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. CHANGE PLAN MODAL                                                 */}
      {/* ==================================================================== */}
      {isChangePlanModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Change Tier Plan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select upgraded subscription tier for {selectedSubscription.studentName}
            </p>

            <div className="space-y-2 mb-5 text-left text-xs">
              {['Pro Plan (₹199 / 6 months)', 'Ultimate Plan (₹399 / 12 months)'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSubscriptionsList((prev) =>
                      prev.map((s) =>
                        s.id === selectedSubscription.id
                          ? { ...s, plan: p.split(' ')[0], planFullTitle: p }
                          : s
                      )
                    );
                    setIsChangePlanModalOpen(false);
                    showToast(`Plan updated for ${selectedSubscription.studentName}!`);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between font-medium text-slate-800"
                >
                  <span>{p}</span>
                  <Check className="w-4 h-4 text-blue-500" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsChangePlanModalOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. SEND NOTIFICATION MODAL                                           */}
      {/* ==================================================================== */}
      {isNotificationModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Send Subscription Reminder</h3>
            <p className="text-xs text-slate-500 mb-4">
              Email & In-App push notification to {selectedSubscription.studentEmail}
            </p>

            <textarea
              rows={3}
              defaultValue={`Hello ${selectedSubscription.studentName}, your PracticeKoro ${selectedSubscription.planFullTitle} has ${selectedSubscription.daysLeft} days remaining. Renew today to maintain uninterrupted mock test access!`}
              className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsNotificationModalOpen(false);
                  showToast(`Notification sent to ${selectedSubscription.studentEmail}`);
                }}
                className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
