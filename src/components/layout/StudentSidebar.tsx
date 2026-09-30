import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { cn } from '@/lib/utils';
import {
  Home,
  Layers,
  Zap,
  BarChart3,
  Bookmark,
  Trophy,
  HelpCircle,
  User,
  Crown,
  CheckCircle2,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ChevronUp,
  Settings as SettingsIcon,
  LifeBuoy,
  ShieldAlert,
  LogOut,
  Sparkles,
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

interface NavSection {
  title: string;
  items: NavItem[];
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

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'STUDENT MENU',
      items: [
        { label: 'Home', path: '/dashboard', icon: Home },
        {
          label: 'Test Series',
          path: '/test-series',
          icon: Layers,
          badge: 'Live',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        },
        {
          label: 'Practice',
          path: '/practice',
          icon: Zap,
          badge: 'Smart',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        },
        {
          label: 'Results',
          path: '/results',
          icon: BarChart3,
        },
        {
          label: 'Profile',
          path: '/profile',
          icon: User,
        },
      ],
    },
    {
      title: 'QUICK ACCESS',
      items: [
        { label: 'Saved Questions', path: '/saved-questions', icon: Bookmark },
        {
          label: 'Rank',
          path: '/rank',
          icon: Trophy,
          badge: 'AIR',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        },
        { label: 'Help & Support', path: '/support', icon: HelpCircle },
      ],
    },
  ];

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (path === '/test-series') {
      return (
        location.pathname.startsWith('/test-series') ||
        location.pathname.startsWith('/exams') ||
        location.pathname.startsWith('/tests')
      );
    }
    if (path === '/saved-questions') {
      return (
        location.pathname === '/saved-questions' ||
        (location.pathname.startsWith('/practice') && location.search.includes('tab=bookmarks'))
      );
    }
    if (path === '/practice') {
      return location.pathname.startsWith('/practice') && !location.search.includes('tab=bookmarks');
    }
    if (path === '/profile') {
      return location.pathname.startsWith('/profile') || location.pathname.startsWith('/settings');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-[4px_0_24px_-12px_rgba(1,88,252,0.08)]',
          'lg:sticky lg:top-0 lg:h-screen lg:transform-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-72 sm:w-80 lg:w-auto'
        )}
      >
        {/* Top: Brand Header */}
        <div
          className={cn(
            'h-20 flex items-center px-5 border-b border-slate-100 dark:border-slate-800 transition-all shrink-0',
            isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
          )}
        >
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 ring-1 ring-blue-500/15 overflow-hidden bg-gradient-to-br from-[#0198FD] to-[#0158FC]"
            >
              <img
                src="/logo-icon.png"
                alt="PracticeKoro"
                className="w-full h-full rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/logo-icon-circle.png';
                }}
              />
            </motion.div>
            <div className={cn('flex flex-col min-w-0', isCollapsed && 'lg:hidden')}>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-none">
                  Practice<span className="text-[#0158FC]">Koro</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-gradient-to-r from-[#0158FC] to-[#0198FD] text-white rounded-md uppercase tracking-wider shadow-2xs">
                  2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-none mt-1">
                Smart Exam Prep Portal
              </span>
            </div>
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </motion.button>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Center: Navigation Menu + Adaptive Pro Widget */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-2 space-y-4 flex flex-col justify-between">
          {/* Navigation Menu */}
          <nav className="p-3 space-y-3">
            {navSections.map((section, sIndex) => (
              <div key={section.title} className="space-y-1">
                {!isCollapsed ? (
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {section.title}
                    </span>
                  </div>
                ) : (
                  sIndex > 0 && (
                    <div className="w-8 h-px bg-slate-100 dark:bg-slate-800 mx-auto my-2" />
                  )
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item.path);
                    return (
                      <motion.div
                        key={item.label}
                        whileHover={{ x: isCollapsed ? 0 : 3 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        className="relative"
                      >
                        <Link
                          to={item.path}
                          onClick={onClose}
                          title={isCollapsed ? item.label : undefined}
                          className={cn(
                            'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors select-none group',
                            isCollapsed && 'lg:justify-center lg:px-2',
                            active
                              ? 'text-white font-extrabold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
                          )}
                        >
                          {/* Animated active sliding pill background */}
                          {active && (
                            <motion.div
                              layoutId="studentNavActivePill"
                              className="absolute inset-0 bg-gradient-to-r from-[#0158FC] to-[#0198FD] rounded-xl shadow-md shadow-blue-500/25 z-0"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}

                          {/* Hover highlight for inactive items */}
                          {!active && (
                            <div className="absolute inset-0 rounded-xl bg-slate-100/0 group-hover:bg-slate-100/80 dark:group-hover:bg-slate-800/60 transition-colors z-0" />
                          )}

                          <div className="relative z-10 flex items-center justify-between w-full min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0',
                                  active
                                    ? 'bg-white/20 text-white'
                                    : 'text-slate-400 dark:text-slate-500 group-hover:text-[#0158FC] dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50'
                                )}
                              >
                                <Icon
                                  className={cn(
                                    'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                                    active && 'text-white'
                                  )}
                                />
                              </div>

                              <span
                                className={cn(
                                  'truncate tracking-tight',
                                  isCollapsed && 'lg:hidden'
                                )}
                              >
                                {item.label}
                              </span>
                            </div>

                            {!isCollapsed && item.badge && (
                              <span
                                className={cn(
                                  'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wider transition-colors shrink-0 border',
                                  active
                                    ? 'bg-white/20 text-white border-white/30'
                                    : item.badgeColor ||
                                        'bg-blue-500/10 text-[#0158FC] border-blue-500/20'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Adaptive Middle Space: Pro Status (if subscribed) or Pro Pass Upgrade (if free) */}
          {!isCollapsed && (
            <div className="px-3 pt-2">
              {!isPro ? (
                /* Free Student Upgrade Banner with animations */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="group/card relative rounded-2xl bg-gradient-to-b from-[#f0f7ff] via-[#e6f2fe] to-[#dbebfe] dark:from-slate-800/90 dark:via-slate-850/90 dark:to-indigo-950/40 border border-blue-200/80 dark:border-slate-700/80 p-4 text-center overflow-hidden shadow-xs hover:shadow-md hover:border-blue-400/60 transition-all duration-300"
                >
                  {/* Glow orb */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl pointer-events-none group-hover/card:bg-blue-400/35 transition-all" />

                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm shadow-amber-500/30"
                  >
                    <Crown className="w-4 h-4 fill-white" />
                  </motion.div>

                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      PRO PASS
                    </h4>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black tracking-widest">
                      VIP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">
                    Unlock Your Full Potential
                  </p>

                  <div className="space-y-1.5 text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0158FC] dark:text-blue-400 shrink-0" />
                      <span>All Exams &amp; Mock Tests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0158FC] dark:text-blue-400 shrink-0" />
                      <span>PYQ &amp; Topic Practice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0158FC] dark:text-blue-400 shrink-0" />
                      <span>Detailed Solutions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0158FC] dark:text-blue-400 shrink-0" />
                      <span>Web + Mobile Access</span>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      navigate('/subscription');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0158FC] to-[#0047cc] hover:from-[#0047cc] hover:to-[#0158FC] text-white text-xs font-extrabold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Upgrade Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              ) : (
                /* Pro Active Status Card */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-blue-500/[0.04] to-indigo-500/[0.08] dark:from-slate-800/90 dark:to-slate-850/90 border border-amber-400/30 dark:border-amber-500/20 p-3.5 overflow-hidden shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs shadow-amber-500/25 shrink-0"
                    >
                      <Crown className="w-4 h-4 fill-white" />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          PRO PASS ACTIVE
                        </span>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        Full Access Unlocked
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-amber-200/50 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>All Tests Unlocked</span>
                    </span>
                    <Link
                      to="/subscription"
                      onClick={onClose}
                      className="text-[#0158FC] dark:text-blue-400 hover:underline text-[10px] font-extrabold"
                    >
                      View Plan
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Pinned Bottom Profile Section */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 relative bg-white dark:bg-slate-900">
          {/* Backdrop for closing popover when clicking outside */}
          {profileDropdownOpen && (
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setProfileDropdownOpen(false)}
            />
          )}

          {/* Profile Card / Chip Button */}
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center gap-2.5 p-2 rounded-2xl transition-all cursor-pointer text-left',
              isCollapsed
                ? 'justify-center hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
            )}
            title={isCollapsed ? (user?.fullName || 'Candidate Profile') : undefined}
          >
            <div className="relative shrink-0">
              <img
                src={user?.avatarUrl || '/images/student_avatar.png'}
                alt={user?.fullName || 'Candidate'}
                className={cn(
                  'w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs transition-transform',
                  isPro && 'ring-2 ring-amber-400/80'
                )}
                onError={(e) => {
                  e.currentTarget.src = '/images/student_avatar.png';
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </span>
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user?.fullName || 'Candidate'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-1 flex items-center gap-1">
                  <span>Student •</span>
                  <span
                    className={cn(
                      'font-bold',
                      isPro ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {isPro ? 'Pro Pass' : 'Free'}
                  </span>
                  {isPro && (
                    <Crown className="w-3 h-3 fill-amber-500 text-amber-500 inline-block" />
                  )}
                </p>
              </div>
            )}

            {!isCollapsed && (
              <motion.div
                animate={{ rotate: profileDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronUp className="w-4 h-4 text-[#0158FC] dark:text-blue-400" />
              </motion.div>
            )}
          </motion.button>

          {/* Profile Popover Menu (Upward / Floating) with AnimatePresence */}
          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className={cn(
                  'bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-2 z-50',
                  isCollapsed
                    ? 'fixed left-20 bottom-3 w-64'
                    : 'absolute bottom-full left-2 right-2 mb-2 w-[calc(100%-1rem)]'
                )}
              >
                {/* User Header */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      <img
                        src={user?.avatarUrl || '/images/student_avatar.png'}
                        alt={user?.fullName || 'Candidate'}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                        onError={(e) => {
                          e.currentTarget.src = '/images/student_avatar.png';
                        }}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user?.fullName || 'Candidate'}
                        </p>
                        {isPro ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                            PRO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    to="/subscription"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 font-semibold transition-colors group"
                  >
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Pro Pass &amp; Billing</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium transition-colors group"
                  >
                    <User className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Candidate Profile</span>
                  </Link>

                  <Link
                    to="/results"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium transition-colors group"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Test Performance</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium transition-colors group"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Preferences</span>
                  </Link>

                  <Link
                    to="/support"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium transition-colors group"
                  >
                    <LifeBuoy className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Help Desk &amp; FAQs</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setIsSupportModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 font-medium transition-colors text-left cursor-pointer group"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Raise Support Ticket</span>
                  </button>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onClose();
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-indigo-700 dark:text-indigo-400 font-bold hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-colors group"
                    >
                      <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 transition-transform group-hover:scale-110" />
                      <span>Admin Control Panel</span>
                    </Link>
                  )}
                </div>

                {/* Sign Out */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                      onClose();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors text-left cursor-pointer group"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0 transition-transform group-hover:scale-110" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
