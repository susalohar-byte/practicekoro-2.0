import { csvCell } from '@/utils/csvExport';
import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  UserPlus,
  Database,
  ShieldAlert,
  Download,
  Calendar,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export type AuditSeverity = 'Info' | 'Warning' | 'High';

export interface AuditLogItem {
  id: string;
  num: number;
  date: string;
  time: string;
  adminName: string;
  adminEmail: string;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Login' | 'Viewed' | 'Refunded' | 'Changed';
  resource:
    | 'Question'
    | 'Test Series'
    | 'Mock Test'
    | 'Coupon'
    | 'Subscription'
    | 'System'
    | 'Student'
    | 'Payment'
    | 'Settings'
    | 'Subject'
    | 'Banner';
  details: string;
  fullDetails?: string;
  resourceId?: string;
  ipAddress: string;
  browser?: string;
  device?: string;
  location?: string;
  severity: AuditSeverity;
  jsonData?: Record<string, any>;
}

// Initial 12 audit log records strictly matching screenshot media_1791202483715.jpg
const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    num: 1,
    date: '30 Sep 2026',
    time: '10:42:15 AM',
    adminName: 'Susanta Lohar',
    adminEmail: 'susanta@example.com',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    action: 'Created',
    resource: 'Question',
    details: 'Added new question in In...',
    fullDetails:
      'Added new question in Indus Valley Civilization with options, explanation and short notes.',
    resourceId: 'QST-10485',
    ipAddress: '117.247.32.91',
    browser: 'Chrome 128.0.6613.120',
    device: 'Mac (macOS 14.6)',
    location: 'Kolkata, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'create',
      resource: 'question',
      resource_id: 'QST-10485',
      exam_id: 12,
      subject_id: 34,
      topic_id: 78,
    },
  },
  {
    id: 'log-2',
    num: 2,
    date: '30 Sep 2026',
    time: '09:18:33 AM',
    adminName: 'Puja Namata',
    adminEmail: 'puja@example.com',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    action: 'Updated',
    resource: 'Test Series',
    details: 'Updated test series "WBP ...',
    fullDetails: 'Updated test series "WBP Constable 2026 Mega Pack" questions list and duration.',
    resourceId: 'TS-902',
    ipAddress: '117.247.32.91',
    browser: 'Chrome 128.0.6613.120',
    device: 'Windows 11',
    location: 'Kolkata, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'update',
      resource: 'test_series',
      series_id: 'TS-902',
      updated_fields: ['total_tests', 'is_published'],
    },
  },
  {
    id: 'log-3',
    num: 3,
    date: '29 Sep 2026',
    time: '06:45:12 PM',
    adminName: 'Rohit Kumar',
    adminEmail: 'rohit@example.com',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    action: 'Deleted',
    resource: 'Mock Test',
    details: 'Deleted mock test "WBP ...',
    fullDetails: 'Deleted mock test "WBP SI Preliminary Mock 5 (Deprecated)".',
    resourceId: 'MT-404',
    ipAddress: '49.36.112.84',
    browser: 'Safari 17.5',
    device: 'MacBook Air (M2)',
    location: 'Howrah, West Bengal, India',
    severity: 'Warning',
    jsonData: {
      action: 'delete',
      resource: 'mock_test',
      test_id: 'MT-404',
      status: 'archived',
    },
  },
  {
    id: 'log-4',
    num: 4,
    date: '29 Sep 2026',
    time: '04:12:08 PM',
    adminName: 'Sneha Khatun',
    adminEmail: 'sneha@example.com',
    avatarType: 'initials',
    avatarInitials: 'SK',
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    action: 'Created',
    resource: 'Coupon',
    details: 'Created coupon "DIWALI50"',
    fullDetails:
      'Created promotional discount coupon "DIWALI50" with 50% discount and 500 max usage.',
    resourceId: 'CPN-DIWALI50',
    ipAddress: '117.247.32.91',
    browser: 'Chrome 128.0.6613.120',
    device: 'Windows 10',
    location: 'Kolkata, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'create',
      resource: 'coupon',
      coupon_code: 'DIWALI50',
      discount_percent: 50,
      max_uses: 500,
    },
  },
  {
    id: 'log-5',
    num: 5,
    date: '29 Sep 2026',
    time: '12:33:45 PM',
    adminName: 'Arijit Pal',
    adminEmail: 'arijit@example.com',
    avatarType: 'initials',
    avatarInitials: 'AP',
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    action: 'Updated',
    resource: 'Subscription',
    details: 'Updated plan "Pro Plan" ...',
    fullDetails: 'Updated plan "Pro Plan" price from ₹149 to ₹99 with 6 months validity.',
    resourceId: 'PLN-PRO-6M',
    ipAddress: '103.78.212.6',
    browser: 'Firefox 130.0',
    device: 'Ubuntu Linux 24.04',
    location: 'Durgapur, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'update',
      resource: 'subscription_plan',
      plan_id: 'PLN-PRO-6M',
      old_price: 149,
      new_price: 99,
    },
  },
  {
    id: 'log-6',
    num: 6,
    date: '29 Sep 2026',
    time: '11:20:01 AM',
    adminName: 'Moumita Das',
    adminEmail: 'moumita@example.com',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    action: 'Login',
    resource: 'System',
    details: 'Admin logged in',
    fullDetails: 'Admin user authenticated successfully via OTP MFA.',
    resourceId: 'AUTH-SESSION-889',
    ipAddress: '117.247.32.91',
    browser: 'Chrome 128.0.6613.120',
    device: 'Mac (macOS 14.6)',
    location: 'Kolkata, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'login',
      resource: 'system',
      auth_method: 'email_password_otp',
      session_id: 'sess_9918a7',
    },
  },
  {
    id: 'log-7',
    num: 7,
    date: '28 Sep 2026',
    time: '08:56:30 PM',
    adminName: 'Subhankar Bera',
    adminEmail: 'subhankar@example.com',
    avatarType: 'initials',
    avatarInitials: 'SB',
    avatarBgColor: 'bg-amber-100',
    avatarTextColor: 'text-amber-700',
    action: 'Updated',
    resource: 'Student',
    details: 'Updated student profile (I...',
    fullDetails:
      'Updated student profile (ID: STU-8492) email verification flag and district preference.',
    resourceId: 'STU-8492',
    ipAddress: '49.36.112.84',
    browser: 'Chrome 128.0.6613.120',
    device: 'Windows 11',
    location: 'Burdwan, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'update',
      resource: 'student',
      student_id: 'STU-8492',
      updated_fields: ['email_verified', 'district'],
    },
  },
  {
    id: 'log-8',
    num: 8,
    date: '28 Sep 2026',
    time: '05:14:22 PM',
    adminName: 'Rohit Kumar',
    adminEmail: 'rohit@example.com',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    action: 'Viewed',
    resource: 'Payment',
    details: 'Viewed payment details',
    fullDetails: 'Viewed payment details and transaction ledger for receipt #pay_2F9kLmX8vP6QeH.',
    resourceId: 'PAY-88219',
    ipAddress: '103.78.212.6',
    browser: 'Safari 17.5',
    device: 'MacBook Air',
    location: 'Kolkata, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'view',
      resource: 'payment',
      payment_id: 'pay_2F9kLmX8vP6QeH',
    },
  },
  {
    id: 'log-9',
    num: 9,
    date: '28 Sep 2026',
    time: '03:08:11 PM',
    adminName: 'Puja Namata',
    adminEmail: 'puja@example.com',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    action: 'Refunded',
    resource: 'Payment',
    details: 'Processed refund for TXN...',
    fullDetails: 'Processed refund for TXN_987165 (₹99.00) to customer bank account via Razorpay.',
    resourceId: 'RFND-10492',
    ipAddress: '117.247.32.91',
    browser: 'Chrome 128.0.6613.120',
    device: 'Mac (macOS 14.6)',
    location: 'Kolkata, West Bengal, India',
    severity: 'Warning',
    jsonData: {
      action: 'refund',
      resource: 'payment',
      transaction_id: 'TXN_987165',
      amount_refunded: 99.0,
      gateway: 'razorpay',
    },
  },
  {
    id: 'log-10',
    num: 10,
    date: '28 Sep 2026',
    time: '12:45:09 PM',
    adminName: 'Rohha Khatun',
    adminEmail: 'rohha@example.com',
    avatarType: 'initials',
    avatarInitials: 'SK',
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    action: 'Changed',
    resource: 'Settings',
    details: 'Updated platform settings',
    fullDetails:
      'Updated platform settings: Maintenance mode configuration, payment gateway toggle.',
    resourceId: 'SYS-CONF-GLOBAL',
    ipAddress: '49.36.112.84',
    browser: 'Chrome 128.0.6613.120',
    device: 'Windows 11',
    location: 'Howrah, West Bengal, India',
    severity: 'High',
    jsonData: {
      action: 'change',
      resource: 'settings',
      section: 'payment_gateway',
      maintenance_mode: false,
    },
  },
  {
    id: 'log-11',
    num: 11,
    date: '27 Sep 2026',
    time: '10:32:50 AM',
    adminName: 'Susanta Lohar',
    adminEmail: 'susanta@example.com',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    action: 'Created',
    resource: 'Subject',
    details: 'Added new subject "Indus ...',
    fullDetails:
      'Added new subject "Ancient History & Indus Civilization" under West Bengal Police Exams.',
    resourceId: 'SUB-HIST-01',
    ipAddress: '117.247.32.91',
    browser: 'Chrome 128.0.6613.120',
    device: 'Mac (macOS 14.6)',
    location: 'Kolkata, West Bengal, India',
    severity: 'Info',
    jsonData: {
      action: 'create',
      resource: 'subject',
      subject_id: 'SUB-HIST-01',
      title: 'Ancient History & Indus Civilization',
    },
  },
  {
    id: 'log-12',
    num: 12,
    date: '27 Sep 2026',
    time: '09:10:05 AM',
    adminName: 'Admin Test',
    adminEmail: 'admintest@example.com',
    avatarType: 'initials',
    avatarInitials: 'AT',
    avatarBgColor: 'bg-emerald-100',
    avatarTextColor: 'text-emerald-700',
    action: 'Deleted',
    resource: 'Banner',
    details: 'Deleted banner "WBP Ba...',
    fullDetails: 'Deleted promotional homepage banner "WBP Banner Autumn 2026".',
    resourceId: 'BNR-AUTUMN-26',
    ipAddress: '103.78.212.6',
    browser: 'Firefox 130.0',
    device: 'Ubuntu Linux 24.04',
    location: 'Siliguri, West Bengal, India',
    severity: 'High',
    jsonData: {
      action: 'delete',
      resource: 'banner',
      banner_id: 'BNR-AUTUMN-26',
    },
  },
];

// Resource Badge Helper
const getResourceBadge = (res: AuditLogItem['resource']) => {
  switch (res) {
    case 'Question':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/70';
    case 'Test Series':
    case 'Subscription':
    case 'Subject':
      return 'bg-[#EDE9FE] text-[#7C3AED] border border-purple-200/70';
    case 'Mock Test':
    case 'Banner':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/70';
    case 'Coupon':
    case 'Student':
      return 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200/70';
    case 'Payment':
      return 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/70';
    case 'System':
    case 'Settings':
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200/70';
  }
};

// Severity Badge Helper
const getSeverityBadge = (sev: AuditSeverity) => {
  switch (sev) {
    case 'Info':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/70';
    case 'Warning':
      return 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/70';
    case 'High':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/70';
  }
};

// ============================================================================
// MAIN COMPONENT: ADMIN AUDIT LOGS
// ============================================================================

export const AdminAuditLogs: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [logsList, setLogsList] = useState<AuditLogItem[]>(
    isSupabaseConfigured ? [] : INITIAL_AUDIT_LOGS
  );

  // Selected Log (Defaults to neutral unselected state)
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(false);

  // Fetch real audit logs on mount
  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    api
      .getAdminAuditLogs({ limit: 100 })
      .then(({ logs }) => {
        if (!isMounted) return;
        if (!logs || logs.length === 0) {
          if (isSupabaseConfigured) {
            setLogsList([]);
            setSelectedLogId('');
            setIsDetailsPanelOpen(false);
          }
          return;
        }
        const mapped: AuditLogItem[] = logs.map((log, idx) => {
          const dt = new Date(log.createdAt);
          const dateStr = dt.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const timeStr = dt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });

          const actionFormatted: AuditLogItem['action'] =
            log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('add')
              ? 'Created'
              : log.action.toLowerCase().includes('delete') ||
                  log.action.toLowerCase().includes('revoke')
              ? 'Deleted'
              : log.action.toLowerCase().includes('refund')
              ? 'Refunded'
              : log.action.toLowerCase().includes('view')
              ? 'Viewed'
              : log.action.toLowerCase().includes('login')
              ? 'Login'
              : log.action.toLowerCase().includes('change')
              ? 'Changed'
              : 'Updated';

          const resourceFormatted: AuditLogItem['resource'] =
            log.entityType === 'question'
              ? 'Question'
              : log.entityType === 'test_series'
              ? 'Test Series'
              : log.entityType === 'test'
              ? 'Mock Test'
              : log.entityType === 'coupon'
              ? 'Coupon'
              : log.entityType === 'subscription'
              ? 'Subscription'
              : log.entityType === 'user' || log.entityType === 'student'
              ? 'Student'
              : log.entityType === 'payment'
              ? 'Payment'
              : log.entityType === 'settings'
              ? 'Settings'
              : log.entityType === 'subject'
              ? 'Subject'
              : log.entityType === 'banner'
              ? 'Banner'
              : 'System';

          const initials = (log.adminName || log.adminEmail || 'AD')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return {
            id: log.id,
            num: idx + 1,
            date: dateStr,
            time: timeStr,
            adminName: log.adminName || 'Admin',
            adminEmail: log.adminEmail || '',
            avatarType: 'initials',
            avatarInitials: initials,
            avatarBgColor: 'bg-blue-100',
            avatarTextColor: 'text-blue-600',
            action: actionFormatted,
            resource: resourceFormatted,
            details: log.details?.source !== 'database_trigger' ? 'Legacy client log (unverified)' : log.entityName
              ? `${log.action} ${log.entityName}`.slice(0, 30) + '...'
              : log.action,
            fullDetails: log.entityName
              ? `${log.action}: ${log.entityName}`
              : JSON.stringify(log.details || {}),
            resourceId: log.entityId,
            ipAddress: log.ipAddress || 'Not recorded',
            severity: log.action.toLowerCase().includes('delete') ? 'Warning' : 'Info',
            jsonData: {
              id: log.id,
              action: log.action,
              entityType: log.entityType,
              entityId: log.entityId,
              details: log.details,
              adminRole: log.adminRole,
            },
          };
        });

        setLogsList(mapped);
        setSelectedLogId((prev) => {
          if (!prev) return '';
          return mapped.some((m) => m.id === prev) ? prev : '';
        });
      })
      .catch((err) => {
        if (isMounted) {
          setLogsList([]);
          setLoadError(err instanceof Error ? err.message : 'Audit logs could not be loaded');
        }
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Checkbox selections in table
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAdmin, setFilterAdmin] = useState('All Admins');
  const [filterAction, setFilterAction] = useState('All Actions');
  const [filterResource, setFilterResource] = useState('All Resources');
  const [filterSeverity, setFilterSeverity] = useState('All Levels');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Dropdown menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopiedJson, setIsCopiedJson] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
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

  // Selected audit log record
  const selectedLog = useMemo(() => {
    if (!selectedLogId) return null;
    return logsList.find((l) => l.id === selectedLogId) || null;
  }, [logsList, selectedLogId]);

  const mostActiveArea = useMemo(() => {
    if (logsList.length === 0) return { area: 'None', count: 0 };
    const counts: Record<string, number> = {};
    for (const l of logsList) {
      counts[l.resource] = (counts[l.resource] || 0) + 1;
    }
    let top = 'None';
    let max = 0;
    for (const [res, cnt] of Object.entries(counts)) {
      if (cnt > max) {
        max = cnt;
        top = res;
      }
    }
    return { area: top, count: max };
  }, [logsList]);

  // Filtered rows
  const filteredLogs = useMemo(() => {
    return logsList.filter((log) => {
      if (filterAdmin !== 'All Admins' && log.adminName !== filterAdmin) return false;
      if (filterAction !== 'All Actions' && log.action !== filterAction) return false;
      if (filterResource !== 'All Resources' && log.resource !== filterResource) return false;
      if (filterSeverity !== 'All Levels' && log.severity !== filterSeverity) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.adminName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.resource.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.ipAddress.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [logsList, filterAdmin, filterAction, filterResource, filterSeverity, searchQuery]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredLogs.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Export CSV
  const handleExportLogs = () => {
    const headers = [
      'Date',
      'Time',
      'Admin',
      'Email',
      'Action',
      'Resource',
      'Details',
      'IP Address',
      'Severity',
    ];
    const rows = filteredLogs.map((l) => [
      l.date,
      l.time,
      l.adminName,
      l.adminEmail,
      l.action,
      l.resource,
      l.fullDetails || l.details,
      l.ipAddress,
      l.severity,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');
    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported audit logs successfully.');
  };

  // Copy JSON details
  const handleCopyJson = () => {
    if (selectedLog?.jsonData) {
      navigator.clipboard.writeText(JSON.stringify(selectedLog.jsonData, null, 2));
      setIsCopiedJson(true);
      showToast('Copied JSON data to clipboard.');
      setTimeout(() => setIsCopiedJson(false), 2000);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterAdmin('All Admins');
    setFilterAction('All Actions');
    setFilterResource('All Resources');
    setFilterSeverity('All Levels');
    showToast('Audit log filters reset.');
  };

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
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      {loadError && <p role="alert" className="text-red-700">Audit logs unavailable: {loadError}</p>}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Database-trigger logs verify mutations. Legacy client logs are unverified; backend service actors are labeled separately.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <button
            onClick={handleExportLogs}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Logs</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">01 Sep 2026 → 30 Sep 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Logs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Logs</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {logsList.length.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              recorded actions
            </span>
          </div>
        </div>

        {/* Card 2: Active Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Active Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {new Set(logsList.map((l) => l.adminEmail || l.adminName).filter(Boolean)).size}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              performed actions
            </span>
          </div>
        </div>

        {/* Card 3: Most Active Area */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Most Active Area</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {mostActiveArea.area}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {mostActiveArea.count > 0 ? `${mostActiveArea.count} actions` : 'No logs recorded'}
            </span>
          </div>
        </div>

        {/* Card 4: Critical Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Critical Actions</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {
                  logsList.filter(
                    (l) =>
                      l.severity === 'High' || l.action === 'Deleted' || l.action === 'Refunded'
                  ).length
                }
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              require attention
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by admin name, action, resource..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Admin */}
        <div className="relative min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Admin</label>
          <div className="relative">
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Admins">All Admins</option>
              <option value="Susanta Lohar">Susanta Lohar</option>
              <option value="Puja Namata">Puja Namata</option>
              <option value="Rohit Kumar">Rohit Kumar</option>
              <option value="Sneha Khatun">Sneha Khatun</option>
              <option value="Arijit Pal">Arijit Pal</option>
              <option value="Moumita Das">Moumita Das</option>
              <option value="Subhankar Bera">Subhankar Bera</option>
              <option value="Admin Test">Admin Test</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action */}
        <div className="relative min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Action</label>
          <div className="relative">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Actions">All Actions</option>
              <option value="Created">Created</option>
              <option value="Updated">Updated</option>
              <option value="Deleted">Deleted</option>
              <option value="Login">Login</option>
              <option value="Viewed">Viewed</option>
              <option value="Refunded">Refunded</option>
              <option value="Changed">Changed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Resource */}
        <div className="relative min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Resource</label>
          <div className="relative">
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Resources">All Resources</option>
              <option value="Question">Question</option>
              <option value="Test Series">Test Series</option>
              <option value="Mock Test">Mock Test</option>
              <option value="Coupon">Coupon</option>
              <option value="Subscription">Subscription</option>
              <option value="System">System</option>
              <option value="Student">Student</option>
              <option value="Payment">Payment</option>
              <option value="Settings">Settings</option>
              <option value="Subject">Subject</option>
              <option value="Banner">Banner</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Severity */}
        <div className="relative min-w-[120px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Severity</label>
          <div className="relative">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Levels">All Levels</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="High">High</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Filter and Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Applied audit log filters.')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2.5 py-2.5 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. SPLIT LAYOUT (TABLE 8 COLS, DETAILS DOCKED PANEL 4 COLS)          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: AUDIT LOGS TABLE */}
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
                          selectedIds.length > 0 && selectedIds.length === filteredLogs.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Admin</th>
                    <th className="py-3 px-3">Action</th>
                    <th className="py-3 px-3">Resource</th>
                    <th className="py-3 px-3">Details</th>
                    <th className="py-3 px-3">IP Address</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs
                      .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                      .map((row) => {
                    const isSelected = Boolean(isDetailsPanelOpen && selectedLogId === row.id);
                    const isChecked = selectedIds.includes(row.id);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelectedLogId(row.id);
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
                          {row.num}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-normal text-slate-800 block">{row.date}</span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {row.time}
                              </span>
                        </td>

                        {/* Admin */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {row.avatarType === 'photo' && row.avatarSrc ? (
                              <img
                                src={row.avatarSrc}
                                alt={row.adminName}
                                className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                              />
                            ) : (
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0',
                                  row.avatarBgColor || 'bg-blue-100',
                                  row.avatarTextColor || 'text-blue-600'
                                )}
                              >
                                {row.avatarInitials}
                              </div>
                            )}
                            <span className="font-medium text-slate-900">{row.adminName}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                          {row.action}
                        </td>

                        {/* Resource */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded text-[11px] font-medium',
                              getResourceBadge(row.resource)
                            )}
                          >
                            {row.resource}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                          {row.details}
                        </td>

                        {/* IP Address */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {row.ipAddress}
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded text-[11px] font-medium',
                              getSeverityBadge(row.severity)
                            )}
                          >
                            {row.severity}
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
                                    setSelectedLogId(row.id);
                                    setIsDetailsPanelOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Details</span>
                                </button>

                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(row.id);
                                    showToast('Copied Log ID.');
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copy Log ID</span>
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
                Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
                {Math.min(filteredLogs.length, currentPage * rowsPerPage)} of {filteredLogs.length}{' '}
                logs
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
                  onClick={() => setCurrentPage(213)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  213
                </button>

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
                    <option value={12}>12 / page</option>
                    <option value={24}>24 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOG DETAILS DOCKED PANEL */}
        {isDetailsPanelOpen && selectedLog && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Log Details</h2>
              <button
                onClick={() => {
                  setIsDetailsPanelOpen(false);
                  setSelectedLogId('');
                }}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Banner Card */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {selectedLog.resource} {selectedLog.action}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.2 rounded text-[10px] font-semibold',
                      getSeverityBadge(selectedLog.severity)
                    )}
                  >
                    {selectedLog.severity}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {selectedLog.date}, {selectedLog.time}
                </span>
              </div>
            </div>

            {/* Key-Value Breakdown */}
            <div className="space-y-2 text-xs">
              {/* Admin */}
              <div className="flex items-start justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-normal">Admin</span>
                <div className="flex items-center gap-2 text-right">
                  {selectedLog.avatarType === 'photo' && selectedLog.avatarSrc ? (
                    <img
                      src={selectedLog.avatarSrc}
                      alt={selectedLog.adminName}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0',
                        selectedLog.avatarBgColor || 'bg-blue-100',
                        selectedLog.avatarTextColor || 'text-blue-600'
                      )}
                    >
                      {selectedLog.avatarInitials}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-900 block leading-tight">
                      {selectedLog.adminName}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {selectedLog.adminEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-normal">Action</span>
                <span className="font-medium text-slate-800">{selectedLog.action}</span>
              </div>

              {/* Resource */}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-normal">Resource</span>
                <span className="font-medium text-slate-800">{selectedLog.resource}</span>
              </div>

              {/* Resource ID */}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-normal">Resource ID</span>
                <span className="font-mono text-slate-700">
                  {selectedLog.resourceId || 'QST-10485'}
                </span>
              </div>

              {/* Details */}
              <div className="py-1 border-b border-slate-50 space-y-1">
                <span className="text-slate-400 font-normal block">Details</span>
                <p className="font-normal text-slate-700 text-xs leading-relaxed">
                  {selectedLog.fullDetails || selectedLog.details}
                </p>
              </div>

              {/* IP Address */}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-normal">IP Address</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress}</span>
              </div>

              {/* Browser */}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-normal">Browser</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.browser || 'Chrome 128.0.6613.120'}
                </span>
              </div>

              {/* Device */}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-normal">Device</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.device || 'Mac (macOS 14.6)'}
                </span>
              </div>

              {/* Location */}
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-normal">Location</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.location || 'Kolkata, West Bengal, India'}
                </span>
              </div>

              {/* Severity */}
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-normal">Severity</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-semibold',
                    getSeverityBadge(selectedLog.severity)
                  )}
                >
                  {selectedLog.severity}
                </span>
              </div>
            </div>

            {/* Additional Data (JSON) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Additional Data (JSON)</span>
                <button
                  onClick={handleCopyJson}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                  title="Copy JSON"
                >
                  {isCopiedJson ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/80 text-[11px] font-mono text-slate-700 overflow-x-auto">
                <pre className="text-slate-800 leading-relaxed">
                  {JSON.stringify(selectedLog.jsonData || { action: 'view' }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    { label: 'Loading audit logs…', variant: 'table' }
  );
};
