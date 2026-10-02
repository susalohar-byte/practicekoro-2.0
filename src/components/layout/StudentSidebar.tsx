import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { cn, isStudentNavActive } from '@/lib/utils';
import {
  Home,
  FileText,
  Zap,
  BarChart3,
  User,
  Bookmark,
  Trophy,
  HelpCircle,
  PanelLeftClose,
  X,
  LogOut,
  Crown,
  ChevronRight,
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
  const { user, isPro, logout } = useAuth();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // 1. PRIMARY APP NAVIGATION (The 5 core App tabs requested)
  const primaryNavItems: NavItem[] = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Test Series', path: '/test-series', icon: FileText },
    { label: 'Practice', path: '/practice', icon: Zap },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  // 2. QUICK ACCESS & REVISION
  const secondaryNavItems: NavItem[] = [
    { label: 'Saved Questions', path: '/saved-questions', icon: Bookmark },
    { label: 'Leaderboard', path: '/rank', icon: Trophy },
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
          isCollapsed ? 'lg:w-[76px]' : 'lg:w-[240px]'
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
            {/* 'P' Blue Logo Box */}
            <div className="w-9 h-9 rounded-[11px] bg-[#0877FF] flex items-center justify-center text-white text-[20px] font-black leading-none shadow-[0_2px_8px_rgba(8,119,255,0.25)] shrink-0">
              P
            </div>

            <div className={cn('flex flex-col min-w-0', isCollapsed && 'lg:hidden')}>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[17px] text-[#0B1F5B] dark:text-white tracking-tight leading-none">
                  Practice<span className="text-[#0877FF]">Koro</span>
                </span>
                <span className="px-1 py-0.2 rounded-md bg-[#EFF5FF] dark:bg-blue-950/80 text-[#0877FF] dark:text-blue-300 text-[8.5px] font-black uppercase tracking-wider border border-[#DBEAFE] dark:border-blue-800">
                  2.0
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium leading-none mt-1 truncate">
                Smart Exam Prep
              </span>
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

        {/* CENTER: Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-3 px-2.5 space-y-4 no-scrollbar">
          {/* 1. Main Menu Section */}
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
                        ? 'bg-[#0877FF] text-white font-bold shadow-md shadow-[#0877FF]/20'
                        : 'text-[#475569] dark:text-slate-300 hover:text-[#0877FF] hover:bg-[#F1F5FC] dark:hover:bg-slate-800/60 font-semibold'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-transform duration-150',
                        active ? 'text-white stroke-[2.4]' : 'text-[#64748B] dark:text-slate-400 group-hover:text-[#0877FF] stroke-[2]'
                      )}
                    />

                    {!isCollapsed && (
                      <span className="truncate tracking-[-0.1px]">
                        {item.label}
                      </span>
                    )}

                    {/* Active highlight dot when collapsed */}
                    {isCollapsed && active && (
                      <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
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
            </div>
          </div>

          {/* 2. Quick Access Section */}
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
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        active ? 'text-[#0877FF] stroke-[2.2]' : 'text-[#64748B] dark:text-slate-400 group-hover:text-[#0877FF] stroke-[1.8]'
                      )}
                    />

                    {!isCollapsed && (
                      <span className="truncate">
                        {item.label}
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
            </div>
          </div>

          {/* Pro Pass Card / Collapsed Button */}
          {!isPro && (
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
                <div className="rounded-2xl p-3 bg-gradient-to-br from-[#0B1F5B] to-[#0877FF] text-white shadow-sm space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black">
                    <Crown className="w-3.5 h-3.5 fill-amber-300" />
                    <span>Pro Pass</span>
                  </div>
                  <p className="text-[11px] text-blue-100 font-medium leading-snug">
                    Unlock all 120+ mock tests & detailed solutions.
                  </p>
                  <Link
                    to="/subscription"
                    onClick={onClose}
                    className="inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-white text-[#0877FF] hover:bg-blue-50 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <span>Upgrade Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          )}
        </div>

        {/* BOTTOM: Student Profile Snippet */}
        <div className="p-3 border-t border-[#F1F5FC] dark:border-slate-800 shrink-0">
          <div
            className={cn(
              'flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#F1F5FC] dark:hover:bg-slate-800/60 transition-colors',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <Link
              to="/profile"
              onClick={onClose}
              className="group relative flex items-center gap-2.5 min-w-0 flex-1"
            >
              <div className="w-8 h-8 rounded-full border border-[#E2EAF8] dark:border-slate-700 overflow-hidden bg-[#0877FF] shrink-0">
                <img
                  src={avatarSrc}
                  alt={user?.fullName || 'Student'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/student_avatar_hd.png';
                  }}
                />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-[#0B1F5B] dark:text-white truncate">
                    {user?.fullName || 'Student'}
                  </p>
                  <p className="text-[10px] font-medium text-[#64748B] dark:text-slate-400 truncate">
                    {isPro ? 'Pro Member' : 'Student'}
                  </p>
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
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
