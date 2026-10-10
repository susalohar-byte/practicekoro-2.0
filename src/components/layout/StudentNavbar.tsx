import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/types';
import {
  Search,
  Bell,
  Check,
  Clock,
  X,
  ChevronDown,
  Crown,
  User,
  BarChart3,
  Settings as SettingsIcon,
  LifeBuoy,
  HelpCircle,
  ShieldAlert,
  LogOut,
  ArrowRight,
  Menu,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';

interface StudentNavbarProps {
  onToggleMobileSidebar?: () => void;
  onToggleCollapse?: () => void;
  isSidebarCollapsed?: boolean;
  embedded?: boolean;
  showSearch?: boolean;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Exam' | 'Subject' | 'Practice';
  path: string;
  badge?: string;
}

const SEARCHABLE_ITEMS: SearchItem[] = [
  // Exams
  { id: 'wbp-constable', title: 'WBP Constable', subtitle: 'West Bengal Police Recruitment • 120+ Tests', category: 'Exam', path: '/exams/wbp-constable', badge: 'Hot' },
  { id: 'kp-constable', title: 'KP Constable', subtitle: 'Kolkata Police Recruitment • 100+ Tests', category: 'Exam', path: '/exams/kp-constable', badge: 'Popular' },
  { id: 'ssc-gd', title: 'SSC GD Constable', subtitle: 'Staff Selection Commission • 150+ Tests', category: 'Exam', path: '/exams/ssc-gd', badge: 'Bestseller' },
  { id: 'railway-ntpc', title: 'Railway NTPC', subtitle: 'RRB Non-Technical Popular Categories • 60+ Tests', category: 'Exam', path: '/exams/railway-ntpc' },
  { id: 'wb-tet', title: 'WB Primary TET', subtitle: 'West Bengal Board of Primary Education • 45+ Tests', category: 'Exam', path: '/exams/primary-tet' },
  { id: 'wbssc', title: 'WBSSC Group C & D', subtitle: 'School Service Commission • 50+ Tests', category: 'Exam', path: '/exams/wbssc' },
  { id: 'wbpsc-clerkship', title: 'WBPSC Clerkship', subtitle: 'Public Service Commission • 20+ Tests', category: 'Exam', path: '/exams/wbpsc-clerkship' },

  // Subjects
  { id: 'math', title: 'Mathematics', subtitle: 'Arithmetic, Algebra, Geometry • 30 Chapters', category: 'Subject', path: '/practice?subject=math' },
  { id: 'reasoning', title: 'Reasoning', subtitle: 'Logical, Verbal, Non-Verbal • 30 Chapters', category: 'Subject', path: '/practice?subject=reasoning' },
  { id: 'gk', title: 'General Knowledge', subtitle: 'History, Geography, Polity • 25 Chapters', category: 'Subject', path: '/practice?subject=gk' },
  { id: 'english', title: 'English Language', subtitle: 'Grammar, Vocab, Comprehension • 20 Chapters', category: 'Subject', path: '/practice?subject=english' },
  { id: 'bengali', title: 'Bengali Language', subtitle: 'Sahitya, Byakaran, Comprehension • 15 Chapters', category: 'Subject', path: '/practice?subject=bengali' },
  { id: 'science', title: 'General Science', subtitle: 'Physics, Chemistry, Biology • 25 Chapters', category: 'Subject', path: '/practice?subject=science' },

  // Practice Modes
  { id: 'mock-tests', title: 'Full Length Mocks', subtitle: 'Real Exam Simulation with All-Bengal Rank', category: 'Practice', path: '/test-series' },
  { id: 'mistakes-revision', title: 'Mistakes Notebook', subtitle: 'Revise & re-attempt incorrect questions', category: 'Practice', path: '/practice?tab=mistakes' },
  { id: 'saved-questions', title: 'Saved Questions', subtitle: 'Important questions saved for quick review', category: 'Practice', path: '/saved-questions' },
];

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  onToggleMobileSidebar,
  onToggleCollapse,
  isSidebarCollapsed = false,
  embedded = false,
  showSearch = true,
}) => {
  const navigate = useNavigate();
  const { user, isPro, isAdmin, logout } = useAuth();

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Dropdowns State
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Support Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Notifications Data
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pk_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filtered Search Results
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return SEARCHABLE_ITEMS.slice(0, 5);
    }
    return SEARCHABLE_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Load Notifications
  const loadNotifications = useCallback(async () => {
    try {
      const allNotifs = await api.getNotifications();
      const now = new Date();
      const filtered = allNotifs.filter((n) => {
        const isSent = n.status === 'sent';
        const isScheduledDue =
          n.status === 'scheduled' && n.scheduledAt && new Date(n.scheduledAt) <= now;

        if (!isSent && !isScheduledDue) return false;

        const target = (n.targetAudience || 'all').toLowerCase().trim();
        if (target === 'all') return true;

        const isProAudience = target === 'pro' || target === 'pro_users' || target === 'premium';
        if (isPro && isProAudience) return true;

        const isFreeAudience = target === 'free' || target === 'free_users';
        if (!isPro && isFreeAudience) return true;

        return false;
      });
      setNotifications(filtered);
    } catch (err) {
      console.error('Failed to load student notifications:', err);
    }
  }, [isPro]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const merged = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(merged);
    localStorage.setItem('pk_read_notifications', JSON.stringify(merged));
  };

  // Keyboard shortcut: Cmd + K or Ctrl + K focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setProfileDropdownOpen(false);
        setNotifDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item: SearchItem) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(item.path);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredResults.length > 0) {
      handleSelectItem(filteredResults[0]);
    } else if (searchQuery.trim()) {
      navigate(`/test-series?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const unreadCount = notifications.length > 0
    ? notifications.filter((n) => !readNotifIds.includes(n.id)).length
    : 0;

  return (
    <>
      <header
        className={cn(
          'student-navbar sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2EAF8] dark:border-slate-800 transition-all select-none',
          embedded ? 'border-b-0' : 'shadow-[0_2px_12px_rgba(10,46,101,0.03)]'
        )}
      >
        <div className="w-full px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-1 sm:gap-3">
            {/* 1. LEFT: Mobile brand / Desktop Search Bar */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile View: Hamburger Button + Brand */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 lg:hidden">
                <button
                  type="button"
                  onClick={onToggleMobileSidebar}
                  className="w-11 h-11 flex items-center justify-center rounded-xl text-[#051A43] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <Link to="/dashboard" aria-label="PracticeKoro home" className="flex min-h-[44px] items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-[#026BFC] flex items-center justify-center text-white font-black text-lg shadow-xs">
                    P
                  </div>
                  <span className="hidden min-[480px]:inline text-lg font-black tracking-tight text-[#051A43] dark:text-white">
                    Practice<span className="text-[#026BFC]">Koro</span>
                  </span>
                </Link>
              </div>

              {/* Desktop View: Sidebar Collapse/Expand Toggle Button */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-2 rounded-xl text-[#64748B] hover:text-[#026BFC] hover:bg-[#F1F5FC] dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="w-5 h-5" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5" />
                  )}
                </button>
              )}

              {/* Desktop View: Clean Integrated Search Bar */}
              {showSearch && (
                <div ref={searchContainerRef} className="hidden lg:block relative w-64 xl:w-80 transition-all duration-200">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!isSearchOpen) setIsSearchOpen(true);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      aria-label="Search tests, exams and topics"
                      placeholder="Search tests, exams, topics... (⌘K)"
                      className="w-full pl-9 pr-8 py-2 rounded-full bg-[#F1F5FC] dark:bg-slate-800/80 border border-[#E2ECF8] dark:border-slate-700/80 text-xs font-semibold text-[#051A43] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#026BFC] focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        ⌘K
                      </span>
                    )}
                  </form>

                  {/* Desktop Search Dropdown Results */}
                  {isSearchOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-[#E2ECF8] dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 no-scrollbar">
                        {filteredResults.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 font-medium">
                            No matching exams, subjects or tests found.
                          </div>
                        ) : (
                          filteredResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectItem(item)}
                              className="p-2.5 hover:bg-[#F1F5FC] dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-[#051A43] dark:text-white group-hover:text-[#026BFC] transition-colors">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-[#EFF5FF] text-[#026BFC] text-[9px] font-extrabold">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#026BFC] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 px-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px]">↵</kbd> to view</span>
                        <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[9px]">ESC</kbd> to close</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. CENTER: Clean empty space (NO primary navigation in header) */}
            <div className="flex-1" />

            {/* 3. RIGHT ACTIONS: NOTIFICATIONS BELL '3', PRO PASS, THEME, AVATAR */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* Mobile Search Button */}
              {showSearch && (
                <div className="lg:hidden relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen((prev) => !prev);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }}
                    className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 flex items-center justify-center text-[#051A43] dark:text-slate-200 shadow-2xs hover:border-[#026BFC]/50 transition-all cursor-pointer"
                    title="Search"
                    aria-label="Search"
                    aria-expanded={isSearchOpen}
                  >
                    <Search className="w-4 h-4 text-[#051A43] dark:text-slate-200" />
                  </button>

                  {/* Mobile Search Modal Dropdown */}
                  {isSearchOpen && (
                    <div className="student-navbar-popover absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-[#E2ECF8] dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <form onSubmit={handleSearchSubmit} className="relative mb-2">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#026BFC]" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search mock tests, exams, subjects..."
                          className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-700 text-xs font-semibold text-[#051A43] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#026BFC]"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </form>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredResults.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className="p-2 hover:bg-[#F1F5FC] dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-[#051A43] dark:text-white">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                                {item.subtitle}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pro Pass Pill */}
              <Link
                to="/subscription"
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs select-none',
                  isPro
                    ? 'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#D97706] border border-[#FDE68A] dark:border-amber-800'
                    : 'bg-gradient-to-r from-[#026BFC] to-[#0158FC] text-white hover:brightness-105 shadow-blue-500/20'
                )}
              >
                <Crown className={cn('w-3.5 h-3.5', isPro ? 'fill-[#D97706] text-[#D97706]' : 'text-amber-300 fill-amber-300')} />
                <span>{isPro ? 'Pro Active' : 'Upgrade to Pro'}</span>
              </Link>

              {/* Notification Bell with red badge '3' */}
              <div ref={notifContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 flex items-center justify-center text-[#051A43] dark:text-slate-200 shadow-2xs hover:border-[#026BFC]/50 transition-all cursor-pointer relative"
                  title="Notifications"
                  aria-label="Notifications"
                  aria-expanded={notifDropdownOpen}
                >
                  <Bell className="w-4 h-4 text-[#051A43] dark:text-slate-200" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notifDropdownOpen && (
                  <div className="student-navbar-popover absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-[#E2ECF8] dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#026BFC]" />
                        <h3 className="text-sm font-black text-[#051A43] dark:text-white">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-[#026BFC] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-slate-400">
                          <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-1.5 opacity-60" />
                          <p className="text-xs font-semibold text-slate-500">
                            You're all caught up!
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Exam notifications and test alerts will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isRead = readNotifIds.includes(n.id);
                          return (
                            <div
                              key={n.id}
                              className={cn(
                                'p-2.5 rounded-xl transition-colors',
                                isRead
                                  ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                                  : 'bg-blue-50/60 dark:bg-slate-800 font-medium'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {n.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(
                                    n.sentAt || n.scheduledAt || n.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <ThemeToggle className="h-11 w-11" />

              {/* Candidate Profile Avatar Chip */}
              <div ref={profileContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  aria-label="Open profile menu"
                  aria-expanded={profileDropdownOpen}
                  className="flex min-h-[44px] min-w-[44px] justify-center items-center gap-2 p-0.5 sm:px-2 sm:py-1 rounded-full border border-[#E2ECF8] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#026BFC]/50 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user?.avatarUrl || '/images/student_avatar_hd.png'}
                      alt={user?.fullName || 'Candidate'}
                      className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full object-cover border border-white dark:border-slate-700"
                      onError={(e) => {
                        e.currentTarget.src = '/images/student_avatar_hd.png';
                      }}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>

                  <div className="hidden lg:block text-left pr-1">
                    <p className="text-xs font-bold text-[#051A43] dark:text-white truncate max-w-[100px] leading-tight">
                      {user?.fullName?.split(' ')[0] || 'Candidate'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                      {isPro ? (
                        <span className="text-amber-500 font-bold">Pro Pass</span>
                      ) : (
                        <span>Student</span>
                      )}
                    </p>
                  </div>

                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 hidden sm:block',
                      profileDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Profile Popover Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-[#E2ECF8] dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user?.avatarUrl || '/images/student_avatar_hd.png'}
                          alt={user?.fullName || 'Candidate'}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          onError={(e) => {
                            e.currentTarget.src = '/images/student_avatar_hd.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#051A43] dark:text-white truncate">
                            {user?.fullName || 'Candidate'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {user?.email || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/subscription"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50/70 font-semibold transition-colors"
                      >
                        <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                        <span>PracticeKoro Pro Pass</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Candidate Profile</span>
                      </Link>

                      <Link
                        to="/results"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Your Results & Analytics</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Preferences</span>
                      </Link>

                      <Link
                        to="/support"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium transition-colors"
                      >
                        <LifeBuoy className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Help Desk & FAQs</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setIsSupportModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium transition-colors text-left cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Raise Support Ticket</span>
                      </button>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-indigo-700 font-bold hover:bg-indigo-50/70 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Admin Control Panel</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#EF4444] hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-[#EF4444] shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Help Desk & Support Ticket Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
};
