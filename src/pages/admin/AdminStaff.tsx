import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Crown,
  FileText,
  Headphones,
  CreditCard,
  BarChart2,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  History,
  Trash2,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export type SystemAdminRole =
  'Super Admin' | 'Content Manager' | 'Support Manager' | 'Finance Manager' | 'Analyst';

export type AdminUserStatus = 'Active' | 'Inactive';

export interface AdminUserRecord {
  id: string;
  num: number;
  name: string;
  isCurrentUser?: boolean;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  email: string;
  phone?: string;
  role: SystemAdminRole;
  status: AdminUserStatus;
  lastActive: string;
}

export interface SystemRoleCardData {
  title: SystemAdminRole;
  description: string;
  adminsCount: number;
  permissionsPercentage: number;
  iconBg: string;
  iconColor: string;
  rolePillClass: string;
}

// Initial 8 admins strictly matching screenshot media_1791202475463.jpg
const INITIAL_ADMIN_USERS: AdminUserRecord[] = [
  {
    id: 'adm-1',
    num: 1,
    name: 'Susanta Lohar',
    isCurrentUser: true,
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    email: 'susanta@example.com',
    phone: '+91 98765 43210',
    role: 'Super Admin',
    status: 'Active',
    lastActive: '2 minutes ago',
  },
  {
    id: 'adm-2',
    num: 2,
    name: 'Puja Namata',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    email: 'puja@example.com',
    phone: '+91 98765 43211',
    role: 'Content Manager',
    status: 'Active',
    lastActive: '1 hour ago',
  },
  {
    id: 'adm-3',
    num: 3,
    name: 'Rohit Kumar',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    email: 'rohit@example.com',
    phone: '+91 98765 43212',
    role: 'Support Manager',
    status: 'Active',
    lastActive: '3 hours ago',
  },
  {
    id: 'adm-4',
    num: 4,
    name: 'Sneha Khatun',
    avatarType: 'initials',
    avatarInitials: 'SK',
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    email: 'sneha@example.com',
    phone: '+91 98765 43213',
    role: 'Finance Manager',
    status: 'Active',
    lastActive: '1 day ago',
  },
  {
    id: 'adm-5',
    num: 5,
    name: 'Arijit Pal',
    avatarType: 'initials',
    avatarInitials: 'AP',
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    email: 'arijit@example.com',
    phone: '+91 98765 43214',
    role: 'Analyst',
    status: 'Active',
    lastActive: '2 hours ago',
  },
  {
    id: 'adm-6',
    num: 6,
    name: 'Moumita Das',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    email: 'moumita@example.com',
    phone: '+91 98765 43215',
    role: 'Content Manager',
    status: 'Active',
    lastActive: '6 hours ago',
  },
  {
    id: 'adm-7',
    num: 7,
    name: 'Subhankar Bera',
    avatarType: 'initials',
    avatarInitials: 'SB',
    avatarBgColor: 'bg-amber-100',
    avatarTextColor: 'text-amber-700',
    email: 'subhankar@example.com',
    phone: '+91 98765 43216',
    role: 'Analyst',
    status: 'Inactive',
    lastActive: '5 days ago',
  },
  {
    id: 'adm-8',
    num: 8,
    name: 'Admin Test',
    avatarType: 'photo',
    avatarSrc:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    email: 'admintest@example.com',
    phone: '+91 98765 43217',
    role: 'Support Manager',
    status: 'Active',
    lastActive: '1 day ago',
  },
];

// System Roles Data matching reference
const SYSTEM_ROLES: SystemRoleCardData[] = [
  {
    title: 'Super Admin',
    description: 'Full access to all features',
    adminsCount: 2,
    permissionsPercentage: 100,
    iconBg: 'bg-[#EDE9FE]',
    iconColor: 'text-[#7C3AED]',
    rolePillClass: 'bg-[#EDE9FE] text-[#7C3AED]',
  },
  {
    title: 'Content Manager',
    description: 'Manage questions, tests, exams',
    adminsCount: 2,
    permissionsPercentage: 65,
    iconBg: 'bg-[#DBEAFE]',
    iconColor: 'text-[#2563EB]',
    rolePillClass: 'bg-[#DBEAFE] text-[#1D4ED8]',
  },
  {
    title: 'Support Manager',
    description: 'Handle support and communication',
    adminsCount: 1,
    permissionsPercentage: 40,
    iconBg: 'bg-[#DCFCE7]',
    iconColor: 'text-[#16A34A]',
    rolePillClass: 'bg-[#DCFCE7] text-[#15803D]',
  },
  {
    title: 'Finance Manager',
    description: 'Manage payments and subscriptions',
    adminsCount: 1,
    permissionsPercentage: 45,
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    rolePillClass: 'bg-[#FEF3C7] text-[#B45309]',
  },
  {
    title: 'Analyst',
    description: 'View analytics and performance',
    adminsCount: 2,
    permissionsPercentage: 30,
    iconBg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#DC2626]',
    rolePillClass: 'bg-[#FEE2E2] text-[#DC2626]',
  },
];

// Helper to get role badge pill style
const getRoleBadgeClass = (role: SystemAdminRole) => {
  switch (role) {
    case 'Super Admin':
      return 'bg-[#EDE9FE] text-[#7C3AED]';
    case 'Content Manager':
      return 'bg-[#DBEAFE] text-[#1D4ED8]';
    case 'Support Manager':
      return 'bg-[#DCFCE7] text-[#15803D]';
    case 'Finance Manager':
      return 'bg-[#FEF3C7] text-[#B45309]';
    case 'Analyst':
      return 'bg-[#FEE2E2] text-[#DC2626]';
  }
};

// Helper to convert backend role to UI role
const backendRoleToUiRole = (role?: string): SystemAdminRole => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'support_agent') return 'Support Manager';
  if (role === 'finance_manager') return 'Finance Manager';
  if (role === 'analyst') return 'Analyst';
  return 'Content Manager';
};

// ============================================================================
// MAIN COMPONENT: ADMIN STAFF & ROLES
// ============================================================================

export const AdminStaff: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  // Master admins list with localStorage persistence
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_staff_users_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_ADMIN_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_staff_users_v2', JSON.stringify(adminUsers));
    } catch {
      // ignore
    }
  }, [adminUsers]);

  // Load real staff members from database/backend
  useEffect(() => {
    let isMounted = true;
    api
      .getStaffMembers()
      .then((members) => {
        if (!isMounted) return;
        if (!members || members.length === 0) {
          if (isSupabaseConfigured) setAdminUsers([]);
          return;
        }
        const mapped: AdminUserRecord[] = members.map((m, idx) => {
          const initials = (m.fullName || m.email || 'Admin')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return {
            id: m.id,
            num: idx + 1,
            name: m.fullName || 'Admin User',
            isCurrentUser: currentAdmin?.id === m.id || currentAdmin?.email === m.email,
            avatarType: m.avatarUrl ? 'photo' : 'initials',
            avatarSrc: m.avatarUrl,
            avatarInitials: initials || 'AD',
            avatarBgColor: 'bg-blue-100',
            avatarTextColor: 'text-blue-600',
            email: m.email,
            phone: m.phone,
            role: backendRoleToUiRole(m.adminRole),
            status: m.accountStatus === 'inactive' ? 'Inactive' : 'Active',
            lastActive: 'Unavailable',
          };
        });

        if (isSupabaseConfigured) {
          setAdminUsers(mapped);
        } else {
          setAdminUsers((prev) => {
            const serverEmails = new Set(mapped.map((x) => x.email.toLowerCase()));
            const remainingLocal = prev.filter((x) => !serverEmails.has(x.email.toLowerCase()));
            return [...mapped, ...remainingLocal];
          });
        }
      })
      .catch((err) => {
        console.warn('[AdminStaff] Failed to fetch staff members:', err);
        if (isMounted) {
          setToastError(true);
          setToastMessage('Staff records could not be loaded. Please refresh and try again.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentAdmin?.id, currentAdmin?.email]);

  // Top Navigation Tabs: 'Roles & Permissions' | 'Admin Users' | 'Activity Log'
  const [activeMainTab, setActiveMainTab] = useState<
    'Roles & Permissions' | 'Admin Users' | 'Activity Log'
  >('Roles & Permissions');

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterStatus, setFilterStatus] = useState('All Status');

  // Checkbox selections in table
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Side Panel state: Create New Admin (Neutral initial state - closed by default)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'Basic Info' | 'Role & Permissions' | 'Access Control'>('Basic Info');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<SystemAdminRole>('Content Manager');
  const [formStatus, setFormStatus] = useState<AdminUserStatus>('Active');
  const formWelcomeEmail = false;

  // Create Role Modal
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const showToast = (msg: string, error = false) => {
    setToastError(error);
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

  // Filtered admin users
  const filteredAdmins = useMemo(() => {
    return adminUsers.filter((adm) => {
      if (filterRole !== 'All Roles' && adm.role !== filterRole) return false;
      if (filterStatus !== 'All Status' && adm.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          adm.name.toLowerCase().includes(q) ||
          adm.email.toLowerCase().includes(q) ||
          adm.role.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [adminUsers, filterRole, filterStatus, searchQuery]);

  // Table selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAdmins.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterRole('All Roles');
    setFilterStatus('All Status');
    showToast('Filters reset.');
  };

  // Create New Admin submit
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast('Please enter admin name and email.');
      return;
    }

    if (isWorking) return;
    if (!['Super Admin', 'Content Manager', 'Support Manager'].includes(formRole)) {
      showToast('This role has no supported backend permission mapping.', true);
      return;
    }
    if (formStatus === 'Inactive') {
      showToast('Assign the staff role first, then deactivate the account.', true);
      return;
    }
    setIsWorking(true);
    try {
      const backendRole =
        formRole === 'Super Admin'
          ? 'super_admin'
          : formRole === 'Support Manager'
            ? 'support_agent'
            : 'content_writer';
      const result = await api.assignStaffByEmail(formEmail.trim(), backendRole, currentAdmin);
      if (!result.success || !result.member) {
        showToast(result.error || 'Staff assignment was not confirmed.', true);
        return;
      }
      const m = result.member;
      setAdminUsers((prev) => [
        ...prev.filter((a) => a.id !== m.id),
        {
          id: m.id,
          num: prev.length + 1,
          name: m.fullName,
          email: m.email,
          phone: m.phone,
          role: backendRoleToUiRole(m.adminRole),
          status: m.accountStatus === 'inactive' ? 'Inactive' : 'Active',
          avatarType: 'initials',
          avatarInitials: m.fullName.slice(0, 2).toUpperCase(),
          avatarBgColor: 'bg-blue-100',
          avatarTextColor: 'text-blue-600',
          lastActive: 'Unavailable',
        },
      ]);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');
      showToast(`Assigned staff role to ${m.fullName}. No new login account was created.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Staff assignment failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (isWorking) return;
    const target = adminUsers.find((a) => a.id === id);
    if (!target) return;
    const status = target.status === 'Active' ? 'inactive' : 'active';
    setIsWorking(true);
    try {
      const result = await api.setStaffAccountStatus(id, status);
      if (!result.success) {
        showToast(result.error || 'Status update was not confirmed.', true);
        return;
      }
      setAdminUsers((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: status === 'active' ? 'Active' : 'Inactive' } : a
        )
      );
      showToast('Account status updated in the backend.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (
      isWorking ||
      !window.confirm(
        'Remove this staff role? The registered account will remain a student account.'
      )
    )
      return;
    setIsWorking(true);
    try {
      const result = await api.removeStaffMember(id, currentAdmin);
      if (!result.success) {
        showToast(result.error || 'Staff removal was not confirmed.', true);
        return;
      }
      setAdminUsers((prev) => prev.filter((a) => a.id !== id));
      showToast('Staff role removed.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Staff removal failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastError ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200"
        >
          {toastError ? (
            <X className="w-4 h-4 text-rose-400 shrink-0" />
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admins & Roles</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Manage admin users, assign roles and control permissions across the platform.
          </p>
        </div>

        <div className="shrink-0 self-start flex items-center gap-2">
          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
          <button
            onClick={() => setIsCreateRoleModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {adminUsers.length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">platform users</span>
          </div>
        </div>

        {/* Card 2: Total Roles */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Roles</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {SYSTEM_ROLES.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">system roles</span>
          </div>
        </div>

        {/* Card 3: Active Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Active Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {adminUsers.filter((a) => a.status === 'Active').length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Online
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              currently active
            </span>
          </div>
        </div>

        {/* Card 4: Inactive Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Inactive Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {adminUsers.filter((a) => a.status === 'Inactive').length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">deactivated</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. THREE MAIN NAVIGATION TABS                                        */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveMainTab('Roles & Permissions')}
            className={cn(
              'pb-3 font-semibold text-xs flex items-center gap-2 relative transition-colors cursor-pointer',
              activeMainTab === 'Roles & Permissions'
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Roles & Permissions</span>
            {activeMainTab === 'Roles & Permissions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('Admin Users')}
            className={cn(
              'pb-3 font-semibold text-xs flex items-center gap-2 relative transition-colors cursor-pointer',
              activeMainTab === 'Admin Users'
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Admin Users</span>
            {activeMainTab === 'Admin Users' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('Activity Log')}
            className={cn(
              'pb-3 font-semibold text-xs flex items-center gap-2 relative transition-colors cursor-pointer',
              activeMainTab === 'Activity Log'
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Clock className="w-4 h-4" />
            <span>Activity Log</span>
            {activeMainTab === 'Activity Log' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. FIVE SYSTEM ROLE CARDS (Shown on Roles & Permissions)             */}
      {/* ==================================================================== */}
      {activeMainTab === 'Roles & Permissions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SYSTEM_ROLES.map((role) => {
            const getIcon = () => {
              switch (role.title) {
                case 'Super Admin':
                  return <Crown className="w-4 h-4" />;
                case 'Content Manager':
                  return <FileText className="w-4 h-4" />;
                case 'Support Manager':
                  return <Headphones className="w-4 h-4" />;
                case 'Finance Manager':
                  return <CreditCard className="w-4 h-4" />;
                case 'Analyst':
                  return <BarChart2 className="w-4 h-4" />;
              }
            };

            return (
              <div
                key={role.title}
                onClick={() => {
                  setFilterRole(role.title);
                  showToast(`Filtered by ${role.title}`);
                }}
                className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                      role.iconBg,
                      role.iconColor
                    )}
                  >
                    {getIcon()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-xs truncate">{role.title}</h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{role.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                  <span className="font-bold text-slate-800 text-[11px]">
                    {role.adminsCount}{' '}
                    <span className="font-normal text-slate-400">
                      {role.adminsCount === 1 ? 'admin' : 'admins'}
                    </span>
                  </span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {role.permissionsPercentage}%{' '}
                    <span className="font-normal text-slate-400">permissions</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MAIN CONTENT SPLIT (TABLE 8 COLS, CREATE SIDE PANEL 4 COLS)       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ADMIN USERS TABLE */}
        <div
          className={cn(
            'transition-all duration-300 space-y-4',
            isSidePanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          )}
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            {/* Header & Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">
                Admin Users ({filteredAdmins.length})
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[210px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email or role..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* All Roles */}
                <div className="relative min-w-[120px]">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Content Manager">Content Manager</option>
                    <option value="Support Manager">Support Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* All Status */}
                <div className="relative min-w-[110px]">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
                  >
                    <option value="All Status">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Reset button */}
                <button
                  onClick={handleResetFilters}
                  className="text-[#2563EB] hover:underline font-semibold text-xs px-1 py-1 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length > 0 && selectedIds.length === filteredAdmins.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No admin staff members found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins
                      .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                      .map((row) => {
                        const isChecked = selectedIds.includes(row.id);

                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              'transition-colors cursor-pointer group',
                              isChecked
                                ? 'bg-blue-50/40 hover:bg-blue-50/60'
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

                            {/* Name + Avatar + You Badge */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                {row.avatarType === 'photo' && row.avatarSrc ? (
                                  <img
                                    src={row.avatarSrc}
                                    alt={row.name}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                                  />
                                ) : (
                                  <div
                                    className={cn(
                                      'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0',
                                      row.avatarBgColor || 'bg-blue-100',
                                      row.avatarTextColor || 'text-blue-600'
                                    )}
                                  >
                                    {row.avatarInitials}
                                  </div>
                                )}

                                <span className="font-semibold text-slate-900 truncate">
                                  {row.name}
                                </span>

                                {row.isCurrentUser && (
                                  <span className="bg-blue-50 text-blue-600 font-semibold text-[10px] px-1.5 py-0.5 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-3 px-3 text-slate-500 font-normal">{row.email}</td>

                            {/* Role Pill */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={cn(
                                  'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold',
                                  getRoleBadgeClass(row.role)
                                )}
                              >
                                {row.role}
                              </span>
                            </td>

                            {/* Status Pill */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={cn(
                                  'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold',
                                  row.status === 'Active'
                                    ? 'bg-[#DCFCE7] text-[#15803D]'
                                    : 'bg-[#FEE2E2] text-[#DC2626]'
                                )}
                              >
                                {row.status}
                              </span>
                            </td>

                            {/* Last Active */}
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                              {row.lastActive}
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
                                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={() => {
                                        handleToggleStatus(row.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                                      <span>
                                        {row.status === 'Active'
                                          ? 'Deactivate Admin'
                                          : 'Activate Admin'}
                                      </span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        showToast(`Sent password reset link to ${row.email}`);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Key className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Reset Password</span>
                                    </button>

                                    {!row.isCurrentUser && (
                                      <>
                                        <div className="border-t border-slate-100 my-1" />
                                        <button
                                          onClick={() => {
                                            handleDeleteAdmin(row.id);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                          <span>Remove Admin</span>
                                        </button>
                                      </>
                                    )}
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
                Showing 1–{filteredAdmins.length} of {filteredAdmins.length} admins
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
                  disabled
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 opacity-50 cursor-not-allowed"
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
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CREATE NEW ADMIN DOCKED SIDE PANEL */}
        {isSidePanelOpen && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Assign Staff to a Registered Account
              </h2>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Tabs */}
            <div className="flex items-center border-b border-slate-100 text-xs">
              {(['Basic Info', 'Role & Permissions', 'Access Control'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPanelTab(tab)}
                  className={cn(
                    'py-2 px-3 font-semibold transition-all relative cursor-pointer',
                    panelTab === tab ? 'text-[#2563EB]' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {tab}
                  {panelTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Form Fields: Basic Info */}
            <form onSubmit={handleCreateAdminSubmit} className="space-y-3.5 text-xs">
              {/* Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Password (unchanged for existing accounts)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Existing account credentials are not changed"
                    className="w-full border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as SystemAdminRole)}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Content Manager">Content Manager</option>
                    <option value="Support Manager">Support Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Status Radio Buttons */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Status
                </label>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="adminStatus"
                      checked={formStatus === 'Active'}
                      onChange={() => setFormStatus('Active')}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span>Active</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="adminStatus"
                      checked={formStatus === 'Inactive'}
                      onChange={() => setFormStatus('Inactive')}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Send Welcome Email Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Send Welcome Email
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Existing account credentials remain unchanged
                  </span>
                </div>

                <button
                  type="button"
                  disabled
                  title="Welcome email is not available for existing-account role assignment"
                  className={cn(
                    'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer',
                    formWelcomeEmail ? 'bg-[#2563EB]' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white shadow-xs block transition-transform absolute top-0.5',
                      formWelcomeEmail ? 'left-5' : 'left-1'
                    )}
                  />
                </button>
              </div>

              {/* Bottom Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormName('');
                    setFormEmail('');
                    setFormPhone('');
                    setFormPassword('');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWorking}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs cursor-pointer"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. MODAL: CREATE ROLE                                                */}
      {/* ==================================================================== */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Create New System Role</h3>
              <button
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Role Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Operations Executive"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Describe duties and system access scope..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-slate-700 block">Default Permissions</span>
                <div className="space-y-1 text-slate-600">
                  {['Manage Tests', 'Manage Students', 'View Analytics', 'Customer Support'].map(
                    (p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-slate-300 text-blue-600 focus:ring-0"
                        />
                        <span>{p}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newRoleName.trim()) {
                      showToast('Please enter role name.');
                      return;
                    }
                    setIsCreateRoleModalOpen(false);
                    showToast(`Role "${newRoleName}" created successfully!`);
                    setNewRoleName('');
                    setNewRoleDesc('');
                  }}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-2xs cursor-pointer"
                >
                  Save Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. ACTIVITY LOG TAB (When active)                                    */}
      {/* ==================================================================== */}
      {activeMainTab === 'Activity Log' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Recent Admin Audit Activity</h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              {
                admin: 'Susanta Lohar',
                action: 'Updated system permissions for Content Manager',
                time: '25 minutes ago',
              },
              {
                admin: 'Puja Namata',
                action: 'Published new WBP Constable Mock 4',
                time: '1 hour ago',
              },
              {
                admin: 'Rohit Kumar',
                action: 'Resolved support ticket #PKT-1048',
                time: '3 hours ago',
              },
              {
                admin: 'Sneha Khatun',
                action: 'Issued refund for txn #pay_2F9kLmX8vP',
                time: '1 day ago',
              },
            ].map((log, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{log.admin}</span>
                  <span className="text-slate-500 ml-2">{log.action}</span>
                </div>
                <span className="text-[11px] text-slate-400">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
