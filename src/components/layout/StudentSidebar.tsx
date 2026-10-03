import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { cn, isStudentNavActive } from '@/lib/utils';
import {
  Home,
  FileText,
  Zap,
  Radio,
  BarChart3,
  User,
  Bookmark,
  Trophy,
  HelpCircle,
  Settings as SettingsIcon,
  PanelLeftClose,
  X,
  LogOut,
  Crown,
  ChevronRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isPro, isAdmin, logout } = useAuth();

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // 1. PRIMARY APP NAVIGATION
  const primaryNavItems: NavItem[] = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Test Series', path: '/test-series', icon: FileText, badge: '120+' },
    { label: 'Practice', path: '/practice', icon: Zap, badge: 'Topic' },
    {
      label: 'Live Tests',
      path: '/live-test',
      icon: Radio,
      badge: 'LIVE',
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  // 2. QUICK ACCESS & REVISION
  const secondaryNavItems: NavItem[] = [
    { label: 'Saved Questions', path: '/saved-questions', icon: Bookmark },
    { label: 'Rank', path: '/rank', icon: Trophy, badge: 'Top 100' },
    { label: 'Help & Support', path: '/support', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  const avatarSrc = user?.avatarUrl || '/images/student_avatar_hd.png';

  return (
    <>
      {/* Mobile Backdrop Overlay (only on smaller screens) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-[#E2EAF8] dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-[2px_0_12px_rgba(11,31,91,0.03)]',
          'lg:sticky lg:top-0 lg:h-screen lg:transform-none shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'w-72 sm:w-80',
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'
        )}
      >
        {/* TOP: Brand Header */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-[#F1F5FC] dark:border-slate-800 shrink-0 transition-all',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            {/* Official PracticeKoro App Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0877FF] to-[#0B1F5B] p-1 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 overflow-hidden">
              <img
                src="/images/logo.png"
                alt="PracticeKoro"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.fallback-letter')) {
                    const span = document.createElement('span');
                    span.className = 'fallback-letter text-white font-black text-lg';
                    span.innerText = 'P';
                    parent.appendChild(span);
                  }
                }}
              />
            </div>

            <div className={cn('flex flex-col min-w-0', isCollapsed && 'lg:hidden')}>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[17px] text-[#0B1F5B] dark:text-white tracking-tight leading-none">
                  Practice<span className="text-[#0877FF]">Koro</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#EFF5FF] dark:bg-blue-950/80 text-[#0877FF] dark:text-blue-300 text-[8.5px] font-black uppercase tracking-wider border border-[#DBEAFE] dark:border-blue-800">
                  2.0
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold leading-none truncate">
                  Smart Exam Prep
                </span>
              </div>
            </div>
          </Link>

          {/* Controls: Collapse on desktop (when expanded), Close on mobile */}
          <div className={cn('flex items-center', isCollapsed && 'lg:hidden')}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-[#64748B] hover:text-[#0877FF] hover:bg-[#F1F5FC] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-[#64748B] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CENTER SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-3 px-2.5 space-y-4 no-scrollbar">
          {/* 1. Main Navigation Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[#94A3B8] dark:text-slate-500">
                Menu
              </div>
            )}

            <div className="space-y-1">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isStudentNavActive(location.pathname, item.label);

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-150',
                      isCollapsed ? 'justify-center px-0' : '',
                      active
                        ? 'bg-[#EFF5FF] dark:bg-blue-950/40 text-[#0877FF] dark:text-blue-400 font-bold border border-[#DBEAFE] dark:border-blue-900/60 shadow-2xs'
                        : 'text-[#475569] dark:text-slate-300 hover:text-[#0877FF] hover:bg-[#F1F5FC] dark:hover:bg-slate-800/60 font-semibold'
                    )}
                  >
                    {/* Refined Left Accent Pill (Active indicator) */}
                    {active && !isCollapsed && (
                      <span className="absolute left-0 top-2 bottom-2 w-1.2 rounded-r-full bg-[#0877FF] dark:bg-blue-400 shadow-xs" />
                    )}

                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-transform duration-150',
                        active
                          ? 'text-[#0877FF] dark:text-blue-400 stroke-[2.4] scale-105'
                          : 'text-[#64748B] dark:text-slate-400 group-hover:text-[#0877FF] stroke-[2]'
                      )}
                    />

                    {!isCollapsed && (
                      <span className="truncate tracking-[-0.1px]">
                        {item.label}
                      </span>
                    )}

                    {/* Badge (e.g. 120+, LIVE) */}
                    {item.badge && !isCollapsed && (
                      <span
                        className={cn(
                          'ml-auto text-[9.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                          item.badgeColor ||
                            'bg-[#EFF5FF] dark:bg-blue-950 text-[#0877FF] dark:text-blue-300 border border-[#DBEAFE] dark:border-blue-800'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Active highlight dot when collapsed */}
                    {isCollapsed && active && (
                      <span className="absolute -left-1 w-1 h-5 rounded-r-full bg-[#0877FF] dark:bg-blue-400" />
                    )}

                    {/* Desktop Floating Tooltip when collapsed */}
                    {isCollapsed && (
                      <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center gap-1.5 border border-slate-700 animate-in fade-in zoom-in-95 duration-100">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-[#0877FF] text-white">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 2. Quick Access & Practice Section */}
          <div className="space-y-1 pt-1">
            {!isCollapsed ? (
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[#94A3B8] dark:text-slate-500 border-t border-[#F1F5FC] dark:border-slate-800 pt-3">
                Quick Access
              </div>
            ) : (
              <div className="w-8 h-px bg-[#E2EAF8] dark:bg-slate-800 mx-auto my-2" />
            )}

            <div className="space-y-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isStudentNavActive(location.pathname, item.label);

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150',
                      isCollapsed ? 'justify-center px-0' : '',
                      active
                        ? 'bg-[#EFF5FF] dark:bg-blue-950/80 text-[#0877FF] dark:text-blue-300 font-bold border border-[#DBEAFE] dark:border-blue-800'
                        : 'text-[#64748B] dark:text-slate-400 hover:text-[#0877FF] hover:bg-[#F1F5FC] dark:hover:bg-slate-800/60 font-medium'
                    )}
                  >
                    {active && !isCollapsed && (
                      <span className="absolute left-0 top-2 bottom-2 w-1.2 rounded-r-full bg-[#0877FF] dark:bg-blue-400" />
                    )}

                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        active
                          ? 'text-[#0877FF] stroke-[2.2]'
                          : 'text-[#64748B] dark:text-slate-400 group-hover:text-[#0877FF] stroke-[1.8]'
                      )}
                    />

                    {!isCollapsed && (
                      <span className="truncate">
                        {item.label}
                      </span>
                    )}

                    {/* Badge */}
                    {item.badge && !isCollapsed && (
                      <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.badge}
                      </span>
                    )}

                    {/* Desktop Floating Tooltip when collapsed */}
                    {isCollapsed && (
                      <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center border border-slate-700 animate-in fade-in zoom-in-95 duration-100">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Admin Portal Shortcut if user is staff/admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150',
                    isCollapsed ? 'justify-center px-0' : '',
                    'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-bold'
                  )}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">Admin Control</span>}
                  {!isCollapsed && (
                    <span className="ml-auto text-[9px] font-black px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200">
                      Staff
                    </span>
                  )}
                  {isCollapsed && (
                    <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center border border-slate-700">
                      Admin Control Panel
                    </span>
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* 3. MIDDLE SECTION: Pro Membership Card (Dual Mode: Free vs Pro) */}
          {isPro ? (
            /* PRO MEMBER ACTIVE CARD (Prevents empty space for Pro users!) */
            isCollapsed ? (
              <div className="pt-2 flex justify-center">
                <Link
                  to="/subscription"
                  onClick={onClose}
                  className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1F5B] to-[#0877FF] flex items-center justify-center text-amber-300 shadow-sm hover:scale-105 transition-transform"
                  aria-label="Pro Pass Active"
                >
                  <Crown className="w-5 h-5 fill-amber-300" />
                  <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center gap-1 border border-slate-700">
                    Pro Pass Active (Full Access)
                  </span>
                </Link>
              </div>
            ) : (
              <div className="pt-2">
                <div className="rounded-2xl p-3.5 bg-gradient-to-br from-[#0B1F5B] via-[#0E2874] to-[#0877FF] text-white shadow-md shadow-blue-900/10 space-y-2.5 relative overflow-hidden group">
                  <Crown className="absolute -right-3 -bottom-3 w-20 h-20 text-white/5 pointer-events-none group-hover:scale-110 transition-transform" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black tracking-wide">
                      <Crown className="w-4 h-4 fill-amber-300" />
                      <span>PRO PASS ACTIVE</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-[9px] font-black uppercase tracking-wider text-white">
                      VIP
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-100 font-medium leading-tight relative z-10">
                    All 120+ mock tests, PYQs & full rank analytics unlocked.
                  </p>

                  <Link
                    to="/subscription"
                    onClick={onClose}
                    className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] font-bold transition-all relative z-10 cursor-pointer"
                  >
                    <span>Pass Benefits</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          ) : (
            /* FREE USER UPGRADE BANNER */
            isCollapsed ? (
              <div className="pt-2 flex justify-center">
                <Link
                  to="/subscription"
                  onClick={onClose}
                  className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1F5B] to-[#0877FF] flex items-center justify-center text-amber-300 shadow-sm hover:scale-105 transition-transform"
                  aria-label="Upgrade to Pro Pass"
                >
                  <Crown className="w-5 h-5 fill-amber-300 animate-pulse" />
                  <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center gap-1 border border-slate-700">
                    Upgrade to Pro Pass
                  </span>
                </Link>
              </div>
            ) : (
              <div className="pt-2">
                <div className="rounded-2xl p-3.5 bg-gradient-to-br from-[#0B1F5B] via-[#0E2874] to-[#0877FF] text-white shadow-md shadow-blue-900/15 space-y-2.5 relative overflow-hidden group">
                  <Crown className="absolute -right-3 -bottom-3 w-20 h-20 text-white/5 pointer-events-none group-hover:scale-110 transition-transform" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black tracking-wide">
                      <Crown className="w-4 h-4 fill-amber-300 animate-pulse" />
                      <span>PRO PASS</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-[#0B1F5B] text-[9px] font-black uppercase tracking-wider shadow-xs">
                      OFFER
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-100 font-medium leading-tight relative z-10">
                    Unlock all 120+ mock tests, chapter practice & All-Bengal rank.
                  </p>

                  <Link
                    to="/subscription"
                    onClick={onClose}
                    className="inline-flex items-center justify-between w-full px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#0877FF] text-[11px] font-black shadow-xs transition-all relative z-10 cursor-pointer hover:shadow-md"
                  >
                    <span>Upgrade Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          )}

          {/* 4. DAILY STUDY MOMENTUM CARD */}
          {!isCollapsed ? (
            <div className="rounded-2xl p-3 bg-white dark:bg-slate-800/80 border border-[#E2EAF8] dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
                  <span className="text-xs font-black text-[#0B1F5B] dark:text-white">Daily Streak</span>
                </div>
                <span className="px-1.5 py-0.2 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-[9.5px] font-black border border-orange-200/60 dark:border-orange-800">
                  Target: 20 Qs
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium leading-snug">
                Consistent practice boosts your All-Bengal ranking.
              </p>
              <Link
                to="/practice"
                onClick={onClose}
                className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl bg-[#EFF5FF] hover:bg-[#DBEAFE] dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#0877FF] dark:text-blue-400 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <span>Continue Practice</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex justify-center pt-1">
              <Link
                to="/practice"
                onClick={onClose}
                className="group relative w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center text-orange-500 hover:scale-105 transition-transform"
                aria-label="Daily Practice Streak"
              >
                <Flame className="w-5 h-5 fill-orange-500" />
                <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center border border-slate-700">
                  Daily Goal: 20 Questions
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* BOTTOM: Student Profile & Settings Bar */}
        <div className="p-3 border-t border-[#F1F5FC] dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
          <div
            className={cn(
              'flex items-center gap-2 p-1.5 rounded-2xl hover:bg-[#F1F5FC] dark:hover:bg-slate-800/60 transition-colors',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <Link
              to="/profile"
              onClick={onClose}
              className="group relative flex items-center gap-2.5 min-w-0 flex-1"
            >
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full overflow-hidden bg-[#0877FF] flex items-center justify-center border',
                    isPro
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-[#E2EAF8] dark:border-slate-700'
                  )}
                >
                  <img
                    src={avatarSrc}
                    alt={user?.fullName || 'Student'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/student_avatar_hd.png';
                    }}
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[#0B1F5B] dark:text-white truncate">
                    {user?.fullName || 'Student'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isPro ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                        <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Pro Member</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#64748B] dark:text-slate-400 truncate">
                        Candidate
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Desktop Floating Tooltip when collapsed */}
              {isCollapsed && (
                <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center border border-slate-700 animate-in fade-in zoom-in-95 duration-100">
                  {user?.fullName || 'Candidate Profile'}
                </span>
              )}
            </Link>

            {!isCollapsed && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Link
                  to="/settings"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0877FF] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                  title="Settings & Preferences"
                  aria-label="Settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Support Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
};
