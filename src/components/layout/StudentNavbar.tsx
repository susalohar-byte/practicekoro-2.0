import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import type { NotificationItem } from '@/types';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
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
  Compass,
  Zap,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StudentNavbarProps {
  onToggleMobileSidebar?: () => void;
  onToggleCollapse?: () => void;
  isSidebarCollapsed?: boolean;
  embedded?: boolean;
  /**
   * Global search is Home-only. AppLayout renders the navbar with
   * showSearch={false}; the Home page uses the default (true) and keeps
   * the exact existing search UI/behavior.
   */
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
  { id: 'wbssc-group-d', title: 'WBSSC Group D', subtitle: 'West Bengal School Service Commission • 25+ Tests', category: 'Exam', path: '/exams/wbssc-group-d', badge: 'Popular' },
  { id: 'wbp-constable', title: 'WBP Constable', subtitle: 'West Bengal Police Recruitment • 18+ Tests', category: 'Exam', path: '/exams/wbp-constable', badge: 'Hot' },
  { id: 'wbpsc-clerkship', title: 'WBPSC Clerkship', subtitle: 'Public Service Commission • 20+ Tests', category: 'Exam', path: '/exams/wbpsc-clerkship', badge: 'Popular' },
  { id: 'primary-tet', title: 'Primary TET', subtitle: 'West Bengal Board of Primary Education • 12+ Tests', category: 'Exam', path: '/exams/primary-tet' },
  { id: 'ssc-gd', title: 'SSC GD', subtitle: 'Staff Selection Commission • 25+ Tests', category: 'Exam', path: '/exams/ssc-gd' },
  { id: 'railway-ntpc', title: 'Railway (NTPC)', subtitle: 'RRB Non-Technical Popular Categories • 18+ Tests', category: 'Exam', path: '/exams/railway-ntpc' },
  { id: 'wbcs-prelims', title: 'WBCS Executive Prelims', subtitle: 'West Bengal Civil Service • 30+ Tests', category: 'Exam', path: '/exams/wbcs' },
  { id: 'kp-constable', title: 'Kolkata Police Constable', subtitle: 'KP Recruitment Board • 15+ Tests', category: 'Exam', path: '/exams/kp-constable' },

  // Subjects
  { id: 'math', title: 'Mathematics', subtitle: 'Arithmetic, Algebra, Geometry • 1,240 Questions', category: 'Subject', path: '/practice?subject=math' },
  { id: 'reasoning', title: 'Reasoning & Mental Ability', subtitle: 'Logical, Verbal, Non-Verbal • 960 Questions', category: 'Subject', path: '/practice?subject=reasoning' },
  { id: 'gk', title: 'General Knowledge', subtitle: 'History, Geography, Science • 1,520 Questions', category: 'Subject', path: '/practice?subject=gk' },
  { id: 'english', title: 'English Language', subtitle: 'Grammar, Vocabulary, Comprehension • 1,010 Questions', category: 'Subject', path: '/practice?subject=english' },
  { id: 'bengali', title: 'Bengali Language & Literature', subtitle: 'Grammar, Comprehension • 820 Questions', category: 'Subject', path: '/practice?subject=bengali' },
  { id: 'current-affairs', title: 'Current Affairs (National & WB)', subtitle: 'Monthly & Daily Updates • 420 Questions', category: 'Subject', path: '/practice?subject=current-affairs' },
  { id: 'computer', title: 'Computer Awareness', subtitle: 'Fundamentals, Internet, Office • 640 Questions', category: 'Subject', path: '/practice?subject=computer' },
  { id: 'environment', title: 'Environmental Studies (EVS)', subtitle: 'Ecology, Biodiversity • 310 Questions', category: 'Subject', path: '/practice?subject=environment' },

  // Practice & Tests
  { id: 'mock-tests', title: 'Full Length Mock Tests', subtitle: 'Timed exam-pattern simulated mock tests', category: 'Practice', path: '/exams' },
  { id: 'topic-practice', title: 'Topic-wise Practice', subtitle: 'Master individual topics and subtopics', category: 'Practice', path: '/practice' },
  { id: 'pyqs', title: 'Previous Year Question Papers (PYQ)', subtitle: 'Solve real past papers with step-by-step solutions', category: 'Practice', path: '/practice?tab=pyqs' },
  { id: 'saved-questions', title: 'Saved Questions & Bookmarks', subtitle: 'Review your bookmarked difficult questions', category: 'Practice', path: '/saved-questions' },
  { id: 'rank', title: 'Statewide Leaderboard & Rank', subtitle: 'Check your rank among Bengal aspirants', category: 'Practice', path: '/rank' },
];

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  onToggleMobileSidebar,
  onToggleCollapse,
  isSidebarCollapsed = false,
  embedded = false,
  showSearch = true,
}) => {
  const { user, isPro, isAdmin, logout } = useAuth();
  const { selectedExam } = useExam();
  const navigate = useNavigate();

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
      // Return 4 popular recommendations
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

        if (target.startsWith('exam:')) {
          const targetExamId = target.replace('exam:', '').trim();
          if (
            (user?.targetExamId && user.targetExamId.toLowerCase() === targetExamId) ||
            (selectedExam?.id && selectedExam.id.toLowerCase() === targetExamId)
          ) {
            return true;
          }
        }
        return false;
      });
      setNotifications(filtered);
    } catch (err) {
      console.error('Failed to load student notifications:', err);
    }
  }, [isPro, user?.targetExamId, selectedExam?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const merged = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(merged);
    localStorage.setItem('pk_read_notifications', JSON.stringify(merged));
  };

  // Keyboard shortcut: Cmd + K or Ctrl + K focuses search (Home only —
  // the search bar is not rendered on other pages)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (!showSearch) return;
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setProfileDropdownOpen(false);
        setNotifDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

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
      navigate(`/exams?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const unreadCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length;

  const WrapperTag = embedded ? 'div' : 'header';
  const wrapperClass = embedded
    ? 'w-full transition-all'
    : 'sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] transition-all';
  const innerClass = embedded ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  return (
    <>
      <WrapperTag className={wrapperClass}>
        <div className={innerClass}>
          <div className={`flex items-center justify-between gap-2.5 sm:gap-4 ${embedded ? 'py-1' : 'h-16'}`}>
            {/* Left: Mobile Brand Logo & Sidebar Toggles */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
              {/* Mobile Sidebar Trigger Button */}
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                aria-label="Open side navigation"
                title="Open Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Sidebar Collapse / Expand Toggle Button - Hidden on Home Page Header */}
              {!embedded && onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer"
                  title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label="Toggle sidebar width"
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Mobile Brand Logo */}
              <Link to="/dashboard" className="flex lg:hidden items-center gap-2 group">
                <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shadow-blue-500/20 ring-1 ring-blue-500/15 bg-gradient-to-br from-[#0198FD] to-[#0158FC] shrink-0">
                  <img
                    src="/logo-icon.png"
                    alt="PracticeKoro"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '/logo-icon-circle.png';
                    }}
                  />
                </div>
                <span className="font-black text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                  <span>
                    Practice<span className="text-[#0158FC]">Koro</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-gradient-to-r from-[#0158FC] to-[#0198FD] text-white rounded-md uppercase tracking-wider">
                    2.0
                  </span>
                </span>
              </Link>
            </div>

            {/* Center: Live Interactive Search Bar (Home page only) */}
            {showSearch && (
            <div ref={searchContainerRef} className="flex-1 max-w-2xl mx-1 sm:mx-2 relative">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="relative flex items-center w-full group">
                  <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center justify-center">
                    <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#0158FC] transition-colors" />
                  </div>

                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search exams, tests, subjects or topics..."
                    className="w-full pl-10 pr-16 sm:pr-20 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-700 focus:border-[#0158FC] focus:ring-4 focus:ring-[#0158FC]/10 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-semibold transition-all shadow-2xs outline-hidden"
                  />

                  <div className="absolute right-3 flex items-center gap-1.5">
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-flex text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs select-none">
                        ⌘ K
                      </kbd>
                    )}
                  </div>
                </div>
              </form>

              {/* Search Live Results Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/70 dark:bg-slate-900/50">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0158FC]" />
                      {searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'Popular & Suggested Searches'}
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">Press Enter to choose</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100/80 dark:divide-slate-800/60 p-1.5">
                    {filteredResults.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          No exams or topics found matching "{searchQuery}"
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Try searching for WBP, WBPSC, TET, Mathematics or Mock Tests.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/exams?q=${encodeURIComponent(searchQuery.trim())}`);
                            setIsSearchOpen(false);
                          }}
                          className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#0158FC] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          Browse All Exams <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      filteredResults.map((item) => {
                        const CategoryIcon =
                          item.category === 'Exam'
                            ? Compass
                            : item.category === 'Subject'
                            ? BookOpen
                            : Zap;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-xs font-bold',
                                  item.category === 'Exam' && 'bg-rose-50 text-rose-600 border border-rose-100',
                                  item.category === 'Subject' && 'bg-amber-50 text-amber-600 border border-amber-100',
                                  item.category === 'Practice' && 'bg-blue-50 text-[#0158FC] border border-blue-100'
                                )}
                              >
                                <CategoryIcon className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0158FC] transition-colors truncate">
                                    {item.title}
                                  </h4>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 uppercase">
                                      {item.badge}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-medium text-slate-400">
                                    • {item.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0158FC] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                          </div>
                        );
                      })
                    )}
                  </div>

                  {filteredResults.length > 0 && (
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/exams?q=${encodeURIComponent(searchQuery.trim())}`);
                          setIsSearchOpen(false);
                        }}
                        className="text-xs font-bold text-[#0158FC] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        View all search results in Exams Catalog <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Right: Actions (Target Exam, Theme, Bell) + Candidate Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Target Exam Switcher Chip */}
              <Link
                to="/exams"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 border border-blue-200/70 dark:border-blue-800/60 text-xs font-bold text-[#0158FC] dark:text-blue-300 transition-colors shadow-2xs"
                title="Active Target Exam"
              >
                <span className="w-2 h-2 rounded-full bg-[#0158FC] animate-pulse" />
                <span className="truncate max-w-[160px]">
                  {selectedExam?.title || 'WBPSC & WBP'}
                </span>
              </Link>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications Dropdown */}
              <div ref={notifContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0158FC]" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Announcements & Alerts
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-[#0158FC] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 px-2 py-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No new notifications right now.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isRead = readNotifIds.includes(n.id);
                          return (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-xl transition-colors ${
                                isRead
                                  ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                                  : 'bg-blue-50/60 dark:bg-slate-800 font-medium'
                              }`}
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

              {/* Candidate Profile Dropdown Chip ("ei khaneo profile ta jeno thake") */}
              <div ref={profileContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full border border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={user?.avatarUrl || '/images/student_avatar.png'}
                      alt={user?.fullName || 'Candidate'}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                      onError={(e) => {
                        e.currentTarget.src = '/logo-icon-circle.png';
                      }}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>

                  <div className="hidden md:block text-left pr-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                      {user?.fullName || 'Candidate'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                      Student • <span className="text-amber-500 font-bold">{isPro ? 'Pro Pass' : 'Free'}</span>
                    </p>
                  </div>

                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0',
                      profileDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Profile Popover Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                PRO
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {user?.email || ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items matching reference */}
                    <div className="py-1">
                      <Link
                        to="/subscription"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-700 hover:bg-amber-50/70 font-semibold transition-colors"
                      >
                        <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                        <span>Pro Pass &amp; Billing</span>
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
                        <span>Test Performance</span>
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
                        <span>Help Desk &amp; FAQs</span>
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

                    {/* Sign Out */}
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
      </WrapperTag>

      {/* Support Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
};
