import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  FileText,
  Shield,
  BookMarked,
  FolderTree,
  Image as ImageIcon,
  Users,
  FileCheck,
  CreditCard,
  Crown,
  MapPin,
  Activity,
  Target,
  Receipt,
  Tag,
  TicketPercent,
  Bell,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { useMaintenance } from '@/context/MaintenanceContext';
import { cn } from '@/lib/utils';
import type { AdminPermissions } from '@/types';

interface NavSubItem {
  label: string;
  path: string;
  altPaths?: string[];
  permission?: keyof AdminPermissions;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  key: string;
  label: string;
  path?: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  altPaths?: string[];
  badge?: string | number;
  badgeColor?: string;
  permission?: keyof AdminPermissions;
  children?: NavSubItem[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout, adminRole, hasPermission } = useAuth();
  const { isMaintenanceMode } = useMaintenance();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('practicekoro_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Toggle collapsed state and persist in local storage
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('practicekoro_admin_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcut (Cmd/Ctrl + B) to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Locked final admin sidebar matching exact reference screenshot
  const rawNavSections: NavSection[] = [
    {
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          path: '/admin',
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      title: 'CONTENT',
      items: [
        {
          key: 'question-bank',
          label: 'Question Bank',
          path: '/admin/question-bank',
          altPaths: ['/admin/questions'],
          icon: BookOpen,
          permission: 'canManageQuestions',
        },
        {
          key: 'test-series',
          label: 'Test Series',
          path: '/admin/test-series',
          icon: Layers,
          permission: 'canManageTests',
        },
        {
          key: 'mock-tests',
          label: 'Mock Test Management',
          path: '/admin/mock-tests',
          altPaths: ['/admin/tests', '/admin/test-questions'],
          icon: FileText,
          permission: 'canManageTests',
        },
        {
          key: 'live-tests',
          label: 'Live Test',
          path: '/admin/live-tests',
          icon: Radio,
          permission: 'canManageTests',
        },
        {
          key: 'exams',
          label: 'Exams',
          path: '/admin/exams',
          icon: Shield,
          permission: 'canManageExams',
        },
        {
          key: 'subjects',
          label: 'Subjects',
          path: '/admin/subjects',
          icon: BookMarked,
          permission: 'canManageExams',
        },
        {
          key: 'topics',
          label: 'Topics',
          path: '/admin/topics',
          altPaths: ['/admin/topic-manage', '/admin/chapters'],
          icon: FolderTree,
          permission: 'canManageExams',
        },
        {
          key: 'banners',
          label: 'Banners',
          path: '/admin/banners',
          icon: ImageIcon,
          permission: 'canManageSettings',
        },
        {
          key: 'blog',
          label: 'Blog',
          path: '/admin/blog',
          icon: FileText,
          permission: 'canManageSettings',
        },
      ],
    },
    {
      title: 'STUDENTS',
      items: [
        {
          key: 'students',
          label: 'Students',
          path: '/admin/students',
          icon: Users,
          permission: 'canManageSubscriptions',
        },
        {
          key: 'test-attempts',
          label: 'Test Attempts',
          path: '/admin/test-attempts',
          icon: FileCheck,
          permission: 'canManageTests',
        },
        {
          key: 'subscriptions',
          label: 'Subscriptions',
          path: '/admin/subscriptions',
          altPaths: ['/admin/pro-users'],
          icon: CreditCard,
          permission: 'canManageSubscriptions',
        },
      ],
    },
    {
      title: 'RANK & PERFORMANCE',
      items: [
        {
          key: 'rankings',
          label: 'Rankings',
          path: '/admin/rankings',
          icon: Crown,
          permission: 'canManageTests',
        },
        {
          key: 'district-rankings',
          label: 'District Rankings',
          path: '/admin/district-rankings',
          icon: MapPin,
          permission: 'canManageTests',
        },
        {
          key: 'performance',
          label: 'Performance',
          path: '/admin/performance',
          icon: Activity,
          permission: 'canManageTests',
        },
        {
          key: 'cutoff',
          label: 'Cutoff',
          path: '/admin/cutoff',
          icon: Target,
          permission: 'canManageTests',
        },
      ],
    },
    {
      title: 'COMMERCE',
      items: [
        {
          key: 'payments',
          label: 'Payments',
          path: '/admin/payments',
          altPaths: ['/admin/revenue', '/admin/financials'],
          icon: Receipt,
          permission: 'canManageSubscriptions',
        },
        {
          key: 'subscription-plans',
          label: 'Subscription Plans',
          path: '/admin/subscription-plans',
          icon: Tag,
          permission: 'canManageSubscriptions',
        },
        {
          key: 'coupons',
          label: 'Coupons',
          path: '/admin/coupons',
          icon: TicketPercent,
          permission: 'canManageCoupons',
        },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        {
          key: 'notifications',
          label: 'Notifications',
          path: '/admin/notifications',
          icon: Bell,
          permission: 'canManageNotifications',
        },
        {
          key: 'support',
          label: 'Support',
          path: '/admin/support',
          icon: HelpCircle,
          permission: 'canManageSupport',
        },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        {
          key: 'analytics',
          label: 'Analytics & Insights',
          path: '/admin/analytics',
          altPaths: ['/admin/analytics-insights', '/admin/insights'],
          icon: BarChart3,
          permission: 'canManageQuestions',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          key: 'admins',
          label: 'Admins & Roles',
          path: '/admin/admins',
          altPaths: ['/admin/staff'],
          icon: ShieldCheck,
          permission: 'canManageSettings',
        },
        {
          key: 'audit-logs',
          label: 'Audit Logs',
          path: '/admin/audit-logs',
          icon: History,
          permission: 'canManageSettings',
        },
        {
          key: 'settings',
          label: 'Settings',
          path: '/admin/settings',
          icon: Settings,
          permission: 'canManageSettings',
        },
      ],
    },
  ];

  // Filter according to current admin's role permissions
  const navSections: NavSection[] = rawNavSections
    .map((sec) => ({
      ...sec,
      items: sec.items
        .filter((item) => !item.permission || hasPermission(item.permission))
        .map((item) => ({
          ...item,
          children: item.children?.filter(
            (sub) => !sub.permission || hasPermission(sub.permission)
          ),
        })),
    }))
    .filter((sec) => sec.items.length > 0);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    if (q.includes('question')) navigate('/admin/question-bank');
    else if (q.includes('exam')) navigate('/admin/exams');
    else if (q.includes('series')) navigate('/admin/test-series');
    else if (q.includes('test') || q.includes('mock')) navigate('/admin/mock-tests');
    else if (q.includes('student')) navigate('/admin/students');
    else if (q.includes('plan')) navigate('/admin/subscription-plans');
    else if (q.includes('coupon')) navigate('/admin/coupons');
    else if (q.includes('rank') || q.includes('cutoff')) navigate('/admin/rankings');
    else if (q.includes('pay') || q.includes('revenue')) navigate('/admin/payments');
    else if (q.includes('setting')) navigate('/admin/settings');
    else navigate(`/admin/question-bank?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="admin-scope min-h-screen flex bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Mobile sidebar overlay with smooth fade */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 lg:hidden',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar - Precision Obsidian Blue UI with Micro-Animations */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-[#0A1024] text-slate-100 border-r border-[#152146] flex flex-col justify-between shadow-2xl transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none dark',
          'lg:sticky lg:top-0 lg:h-screen lg:overflow-visible lg:translate-x-0 relative',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-[72px] w-64' : 'lg:w-[260px] w-64'
        )}
      >
        {/* Desktop Edge-Mounted Collapse / Expand Button */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className={cn(
            'hidden lg:flex absolute -right-3.5 top-5 z-50 w-7 h-7 rounded-full items-center justify-center cursor-pointer',
            'bg-[#0B132B] text-slate-300 hover:text-white',
            'border border-[#20315C] hover:border-blue-500/80',
            'shadow-[0_2px_8px_rgba(0,0,0,0.45)] hover:shadow-[0_2px_12px_rgba(2,107,252,0.4)]',
            'hover:bg-[#15234E] active:scale-90 transition-all duration-200 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500'
          )}
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 text-blue-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5 text-slate-300 group-hover:text-white" />
          )}
        </button>

        {/* Top Header Logo */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#152146]/80 shrink-0 bg-[#070B1A]">
          <Link
            to="/admin"
            className={cn(
              'group flex items-center gap-2.5 min-w-0 transition-opacity hover:opacity-95',
              isCollapsed && 'lg:justify-center lg:w-full'
            )}
            title="PracticeKoro Admin Dashboard"
          >
            <div className="relative w-9 h-9 rounded-xl bg-[#026BFC] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base tracking-tight text-white leading-tight truncate block">
                  PracticeKoro
                </span>
                <span className="text-xs font-normal text-slate-400 block truncate">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List - Fluid scrolling & Micro-Interactions */}
        <div className="flex-1 min-h-0 py-2 px-2.5 space-y-4 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {navSections.map((section, sIdx) => (
            <div key={section.title || `sec-${sIdx}`} className="space-y-1">
              {/* Section Header */}
              {section.title && !isCollapsed && (
                <div className="px-2.5 pt-2 pb-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400/80">
                    {section.title}
                  </p>
                </div>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isGroupOpen = Boolean(openGroups[item.key]);

                // Active detection
                const isChildActive = hasChildren
                  ? item.children!.some(
                      (sub) =>
                        location.pathname === sub.path ||
                        Boolean(sub.altPaths?.some((p) => location.pathname.startsWith(p)))
                    )
                  : false;

                const isDirectActive = item.path
                  ? item.end
                    ? location.pathname === item.path
                    : location.pathname === item.path ||
                      Boolean(item.altPaths?.some((p) => location.pathname.startsWith(p)))
                  : false;

                const isParentActive = isDirectActive || isChildActive;

                // Collapsed Rail View with Animated Floating Tooltips
                if (isCollapsed) {
                  return (
                    <div key={item.key} className="relative group flex justify-center py-0.5">
                      <NavLink
                        to={item.path || (hasChildren ? item.children![0].path : '#')}
                        end={item.end}
                        title={item.label}
                        className={cn(
                          'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95',
                          isParentActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                        )}
                        aria-label={item.label}
                      >
                        <Icon className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" />

                        {/* Subtle active pip indicator */}
                        {isParentActive && (
                          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-white shadow-xs" />
                        )}
                      </NavLink>

                      {/* Animated Floating Tooltip on Hover */}
                      <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold shadow-xl whitespace-nowrap opacity-0 -translate-x-1 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {hasChildren && (
                          <span className="text-[10px] text-blue-400 font-normal">
                            ({item.children?.length})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // Normal Expanded Accordion Group View
                if (hasChildren) {
                  return (
                    <div key={item.key} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.key)}
                        className={cn(
                          'group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none text-left',
                          isParentActive && !isGroupOpen
                            ? 'bg-blue-600/15 text-blue-300 font-bold border border-blue-500/25'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.06] hover:translate-x-1'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
                              isParentActive
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'text-slate-400 group-hover:text-blue-300 group-hover:scale-110'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="truncate tracking-tight font-medium">
                            {item.label}
                          </span>
                        </div>

                        <ChevronDown
                          className={cn(
                            'w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ease-out shrink-0',
                            isGroupOpen && 'rotate-180 text-blue-400'
                          )}
                        />
                      </button>

                      {/* Smooth CSS Grid Accordion Collapse Animation */}
                      <div
                        className={cn(
                          'grid transition-[grid-template-rows,opacity] duration-250 ease-out',
                          isGroupOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-slate-800 ml-4.5 my-0.5">
                            {item.children!.map((sub) => {
                              const isSubActive =
                                location.pathname === sub.path ||
                                Boolean(sub.altPaths?.some((p) => location.pathname.startsWith(p)));
                              const SubIcon = sub.icon;

                              return (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  onClick={() => setSidebarOpen(false)}
                                  className={cn(
                                    'group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150',
                                    isSubActive
                                      ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] hover:translate-x-1'
                                  )}
                                >
                                  {SubIcon ? (
                                    <SubIcon
                                      className={cn(
                                        'w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                                        isSubActive ? 'text-white' : 'opacity-70 group-hover:opacity-100'
                                      )}
                                    />
                                  ) : (
                                    <span
                                      className={cn(
                                        'w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200',
                                        isSubActive
                                          ? 'bg-white shadow-[0_0_6px_#ffffff]'
                                          : 'bg-slate-500 group-hover:bg-blue-400 group-hover:scale-125'
                                      )}
                                    />
                                  )}
                                  <span className="truncate">{sub.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Regular Single Nav Item
                return (
                  <NavLink
                    key={item.key}
                    to={item.path!}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none',
                      isDirectActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-400/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06] hover:translate-x-1'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
                          isDirectActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-blue-300 group-hover:scale-110'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <span className="truncate tracking-tight font-medium">
                        {item.label}
                      </span>
                    </div>

                    {item.badge ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-white/20 text-white shrink-0">
                        {item.badge}
                      </span>
                    ) : !isDirectActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500/60 group-hover:text-slate-300 transition-all duration-150 shrink-0" />
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User Info & Quick Action Area */}
        <div className="p-2.5 border-t border-[#152146] bg-[#070B1A] shrink-0 space-y-2">
          {/* Quick View Student Portal Link (Only when expanded) */}
          {!isCollapsed && (
            <Link
              to="/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] hover:border-blue-500/30 text-slate-400 hover:text-blue-300 text-[11px] font-medium transition-all duration-150 group"
              title="Open Student App Dashboard in new tab"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate">Student App Portal</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}

          {/* User Account Card */}
          <div
            className={cn(
              'flex items-center rounded-xl bg-[#0E1738] border border-[#1A2A56] transition-all duration-150',
              isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black flex items-center justify-center text-xs shadow-sm">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
                {/* Active Presence Dot with Micro-Pulse */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#0A1024]" />
                </span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 animate-in fade-in-50 duration-200">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {user?.fullName || 'Admin'}
                  </p>
                  <p className="text-[10px] font-medium truncate text-blue-300/80">
                    {adminRole === 'content_writer'
                      ? 'Content Writer'
                      : adminRole === 'support_agent'
                        ? 'Support Team'
                        : 'Super Admin'}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all duration-150"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#0A1024] border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 gap-4 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Central Search Bar */}
            <form onSubmit={handleSearchSubmit} className="w-full max-w-lg hidden sm:block">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="admin-header-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics, subjects, exams..."
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </form>
          </div>

          {/* Right Header: Notification Bell & Admin Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell with red dot */}
            <Link
              to="/admin/notifications"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-[#0A1024]" />
            </Link>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-[#026BFC] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user?.fullName || 'Admin'}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {adminRole === 'content_writer'
                      ? 'Content Writer'
                      : adminRole === 'support_agent'
                        ? 'Support Team'
                        : 'Super Admin'}
                  </p>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-[#0E1738] border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-xs font-medium animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.fullName || 'Admin'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user?.email || 'admin@practicekoro.online'}
                    </p>
                  </div>
                  <Link
                    to="/admin/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Platform Settings</span>
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    <span>Audit Logs</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                    <span>Student Portal Preview</span>
                  </Link>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <span>Theme</span>
                    <ThemeToggle className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Active Maintenance Notice Banner */}
        {isMaintenanceMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate sm:whitespace-normal">
                <strong>Maintenance Mode Active:</strong> Student portal is temporarily paused for updates. Only administrators have access.
              </span>
            </div>
            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Manage Settings</span>
            </Link>
          </div>
        )}

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 bg-slate-50 dark:bg-[#030712]">
          <div className="max-w-[1560px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
