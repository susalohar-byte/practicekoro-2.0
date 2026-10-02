import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { api } from '@/services/api';
import { cn, isStudentNavActive } from '@/lib/utils';
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
  Zap,
  ArrowRight,
  Home,
  FileText,
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
  { id: 'english', title: 'English', subtitle: 'Grammar, Vocabulary, Comprehension • 20 Chapters', category: 'Subject', path: '/practice?subject=english' },
  { id: 'bengali', title: 'Bengali', subtitle: 'Grammar, Literature, Comprehension • 25 Chapters', category: 'Subject', path: '/practice?subject=bengali' },
  { id: 'science', title: 'General Science', subtitle: 'Physics, Chemistry, Biology • 20 Chapters', category: 'Subject', path: '/practice?subject=science' },
  { id: 'computer', title: 'Computer Awareness', subtitle: 'Fundamentals, Internet, Office • 15 Chapters', category: 'Subject', path: '/practice?subject=computer' },
  { id: 'current-affairs', title: 'Current Affairs', subtitle: 'Daily & Monthly Updates • 25 Chapters', category: 'Subject', path: '/practice?subject=current-affairs' },

  // Practice & Tests
  { id: 'mock-tests', title: 'Full Length Mock Tests', subtitle: 'Timed exam-pattern simulated mock tests', category: 'Practice', path: '/test-series' },
  { id: 'topic-practice', title: 'Topic Practice', subtitle: 'Chapter-wise focused concept practice', category: 'Practice', path: '/practice' },
  { id: 'pyqs', title: 'Previous Year Questions (PYQ)', subtitle: 'Real past exam papers with full solutions', category: 'Practice', path: '/practice?tab=pyqs' },
  { id: 'live-tests', title: 'Live Tests & Contests', subtitle: 'Compete live with All India rankings', category: 'Practice', path: '/live-test' },
  { id: 'saved-questions', title: 'Saved Questions', subtitle: 'Review your bookmarked difficult questions', category: 'Practice', path: '/saved-questions' },
];

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  embedded = false,
  showSearch = true,
}) => {
  const { user, isPro, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Profile and Notifications Dropdowns
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
    : 3; // Default 3 unread updates matching mobile app

  const navTabs = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Test Series', path: '/test-series', icon: FileText },
    { label: 'Practice', path: '/practice', icon: Zap },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E2EAF8] dark:border-slate-800 transition-all select-none',
          embedded ? 'border-b-0' : 'shadow-[0_2px_12px_rgba(10,46,101,0.04)]'
        )}
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] gap-3">
            {/* 1. LEFT: PRACTICEKORO BRAND (Matching App 1:1) */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 sm:gap-3 group shrink-0 active:scale-[0.98] transition-transform"
            >
              {/* App Blue Rounded Box with White 'P' */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[13px] bg-[#0877FF] flex items-center justify-center text-white font-black text-2xl sm:text-[26px] shadow-[0_3px_10px_rgba(8,119,255,0.28)] ring-1 ring-white/20 shrink-0">
                P
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl sm:text-[22px] font-black tracking-tight leading-none text-[#0B1F5B] dark:text-white">
                  Practice<span className="text-[#0877FF]">Koro</span>
                </span>
                <span className="text-[11px] sm:text-[11.5px] font-medium text-[#52648A] dark:text-slate-400 leading-tight mt-0.5 truncate hidden xs:inline">
                  Practice Today, Progress Tomorrow
                </span>
              </div>
            </Link>

            {/* 2. CENTER: APP 5 TABS NAVIGATION (Desktop / Tablet view) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-[#F1F5FC] dark:bg-slate-800/80 p-1.5 rounded-full border border-[#E2ECF8] dark:border-slate-700/80 shadow-2xs">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = isStudentNavActive(location.pathname, tab.label);
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all select-none',
                      isActive
                        ? 'bg-gradient-to-b from-[#EFF5FF] to-[#DBEAFE] dark:from-blue-900/80 dark:to-blue-800/80 text-[#0866F5] dark:text-blue-300 shadow-[0_2px_6px_rgba(8,102,245,0.12)] border border-white dark:border-blue-700/60'
                        : 'text-[#172B55] dark:text-slate-300 hover:text-[#0866F5] hover:bg-white/60 dark:hover:bg-slate-700/60 font-semibold'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'stroke-[2.5]' : 'stroke-[2]')} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* 3. RIGHT ACTIONS: SEARCH, NOTIFICATIONS BELL '3', AVATAR, THEME */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Search Trigger Button */}
              {showSearch && (
                <div ref={searchContainerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen((prev) => !prev);
                      setTimeout(() => searchInputRef.current?.focus(), 50);
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 flex items-center justify-center text-[#0B1F5B] dark:text-slate-200 shadow-[0_2px_6px_rgba(11,31,91,0.05)] hover:border-[#0877FF]/50 transition-all cursor-pointer"
                    title="Search (⌘K)"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4 text-[#0B1F5B] dark:text-slate-200" />
                  </button>

                  {/* Search Modal Dropdown */}
                  {isSearchOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-[#E2ECF8] dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <form onSubmit={handleSearchSubmit} className="relative mb-2">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#0877FF]" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search mock tests, exams, subjects..."
                          className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2ECF8] dark:border-slate-700 text-xs font-semibold text-[#0B1F5B] dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0877FF]"
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
                              <p className="text-xs font-bold text-[#0B1F5B] dark:text-white">
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

              {/* Notification Bell with red badge '3' */}
              <div ref={notifContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border border-[#E2ECF8] dark:border-slate-700 flex items-center justify-center text-[#0B1F5B] dark:text-slate-200 shadow-[0_2px_6px_rgba(11,31,91,0.05)] hover:border-[#0877FF]/50 transition-all cursor-pointer relative"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 text-[#0B1F5B] dark:text-slate-200" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-[#E2ECF8] dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0877FF]" />
                        <span className="text-xs font-bold text-[#0B1F5B] dark:text-white">
                          Exam Updates & Alerts
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-[#0877FF] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 px-2 py-1">
                      {notifications.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 space-y-2">
                          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/80">
                            <h4 className="font-bold text-slate-900 dark:text-white">WBP Constable Mock Test 12 is Live</h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Attempt the newly added full syllabus mock test now.</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/80">
                            <h4 className="font-bold text-slate-900 dark:text-white">KP Constable Exam Date Announced</h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Check your preparation and practice daily topic sets.</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-slate-800/80">
                            <h4 className="font-bold text-slate-900 dark:text-white">New PYQ Sets Added for SSC GD</h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Solve past 5 years question papers with detailed solutions.</p>
                          </div>
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
              <ThemeToggle />

              {/* Candidate Profile Avatar Chip */}
              <div ref={profileContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-0.5 sm:px-2 sm:py-1 rounded-full border border-[#E2ECF8] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0877FF]/50 transition-all cursor-pointer shadow-[0_2px_6px_rgba(11,31,91,0.05)] group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user?.avatarUrl || '/images/student_avatar_hd.png'}
                      alt={user?.fullName || 'Candidate'}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-white dark:border-slate-700"
                      onError={(e) => {
                        e.currentTarget.src = '/logo-icon-circle.png';
                      }}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>

                  <div className="hidden lg:block text-left pr-1">
                    <p className="text-xs font-bold text-[#0B1F5B] dark:text-white truncate max-w-[100px] leading-tight">
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
                            e.currentTarget.src = '/logo-icon-circle.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#0B1F5B] dark:text-white truncate">
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
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
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

      {/* Support Ticket Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
};
