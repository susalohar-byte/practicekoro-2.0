import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { useSubscription } from '@/hooks/useSubscription';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';
import type { TestAttempt, Exam } from '@/types';
import { StudentNavbar } from '@/components/layout/StudentNavbar';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';
import { Button } from '@/components/common/Button';
import { WEST_BENGAL_DISTRICTS } from '@/data/districts';
import {
  Pencil,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Target,
  BarChart3,
  Flame,
  Trophy,
  LayoutDashboard,
  Settings2,
  SlidersHorizontal,
  CreditCard,
  Award,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Flag,
  User,
  Lock,
  Bell,
  Download,
  LogOut,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Crown,
  LifeBuoy,
  MessageSquare,
} from 'lucide-react';

interface ProfileExtras {
  headline: string;
  phone: string;
  location: string;
  learningGoal: string;
  subjects: string[];
  selectedTimeframe: string;
  notifications: {
    examAlerts: boolean;
    newTests: boolean;
    weeklyReport: boolean;
    pushNotifications: boolean;
  };
}

const DEFAULT_EXTRAS: ProfileExtras = {
  headline: 'Aspirant | Keep Learning Keep Growing 🌱',
  phone: '',
  location: '',
  learningGoal: 'Clear WBP Constable 2024 with a top rank and secure a government job.',
  subjects: [
    'General Knowledge',
    'Mathematics',
    'Reasoning',
    'English',
    'Bengali',
    'Current Affairs',
  ],
  selectedTimeframe: 'This Month',
  notifications: {
    examAlerts: true,
    newTests: true,
    weeklyReport: true,
    pushNotifications: false,
  },
};

const SUBJECT_STYLES: Record<string, string> = {
  'General Knowledge': 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  Mathematics: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  Reasoning: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  English: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  Bengali: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  'Current Affairs': 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
};

const ALL_SUBJECT_OPTIONS = [
  'General Knowledge',
  'Mathematics',
  'Reasoning',
  'English',
  'Bengali',
  'Current Affairs',
  'History',
  'Geography',
  'Polity',
  'General Science',
];

interface TabItem {
  id: 'overview' | 'exam-settings' | 'preferences' | 'subscription' | 'achievements' | 'activity' | 'security';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'exam-settings', label: 'Exam Settings', icon: Settings2 },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'activity', label: 'Activity', icon: Clock },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

export const Profile: React.FC = () => {
  const { user, isPro, updateProfile, logout } = useAuth();
  const { exams, selectedExam, setSelectedExam } = useExam();
  const { subscriptionDetails } = useSubscription();
  const navigate = useNavigate();
  const { onToggleMobileSidebar } = useOutletContext<{ onToggleMobileSidebar?: () => void }>() || {};

  // Performance data
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [, setLoadingAttempts] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabItem['id']>('overview');

  // Timeframe dropdown
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Extra profile fields stored in localStorage for custom personalization
  const [extras, setExtras] = useState<ProfileExtras>(() => {
    try {
      const saved = localStorage.getItem('pk_student_profile_extras');
      if (saved) {
        return { ...DEFAULT_EXTRAS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_EXTRAS;
  });

  const saveExtras = (newExtras: ProfileExtras) => {
    setExtras(newExtras);
    try {
      localStorage.setItem('pk_student_profile_extras', JSON.stringify(newExtras));
    } catch {
      // ignore storage quota error
    }
  };

  // Modals state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalTab, setSupportModalTab] = useState<'create' | 'history'>('create');

  // Profile Edit Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileEditError, setProfileEditError] = useState<string | null>(null);

  // Goal Edit State
  const [goalInput, setGoalInput] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch student mock test attempts
  const fetchAttempts = useCallback(async () => {
    if (!user) {
      setLoadingAttempts(false);
      return;
    }
    setLoadingAttempts(true);
    try {
      const data = await api.getUserAttempts(user.id);
      setAttempts(data || []);
    } catch (err) {
      console.error('Failed to load user attempts for profile:', err);
    } finally {
      setLoadingAttempts(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  // Derived metrics from genuine test attempts
  const completedAttempts = useMemo(() => {
    return attempts.filter((a) => a.status === 'completed');
  }, [attempts]);

  const testsCount = completedAttempts.length;

  const avgAccuracy = useMemo(() => {
    if (completedAttempts.length === 0) return 0;
    const totalAcc = completedAttempts.reduce((acc, a) => acc + (a.accuracy || 0), 0);
    return Math.round(totalAcc / completedAttempts.length);
  }, [completedAttempts]);

  const bestScoreDisplay = useMemo(() => {
    if (completedAttempts.length === 0) return '0/0';
    let maxSc = 0;
    let maxTm = 100;
    completedAttempts.forEach((a) => {
      const sc = a.score || 0;
      if (sc > maxSc) {
        maxSc = sc;
        maxTm = a.totalMarks || 100;
      }
    });
    return `${Math.round(maxSc)}/${Math.round(maxTm)}`;
  }, [completedAttempts]);

  // Streak & Rank & Monthly Progress derived from real attempts
  const dayStreak = useMemo(() => {
    if (completedAttempts.length === 0) return 0;
    const uniqueDays = new Set(
      completedAttempts
        .map((a) => (a.createdAt || '').slice(0, 10))
        .filter(Boolean)
    );
    return uniqueDays.size;
  }, [completedAttempts]);

  const currentRank = completedAttempts[0]?.rank || 0;

  const questionsSolvedCount = useMemo(
    () =>
      completedAttempts.reduce(
        (sum, a) => sum + (a.correctCount || 0) + (a.wrongCount || 0),
        0
      ),
    [completedAttempts]
  );

  const hoursStudied = useMemo(
    () =>
      Math.round(
        completedAttempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0) / 3600
      ),
    [completedAttempts]
  );

  const goalProgressPct = Math.min(100, avgAccuracy);

  // Member Since date
  const memberSince = useMemo(() => {
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `Member since ${month} ${year}`;
    }
    return 'Member';
  }, [user?.createdAt]);

  // Open Edit Profile Modal
  const openEditProfile = () => {
    setEditName(user?.fullName || '');
    setEditPhone(user?.phone || extras.phone || '');
    setEditHeadline(extras.headline || 'Aspirant | Keep Learning Keep Growing 🌱');
    const userDist = user?.district || (extras.location?.includes(',') ? extras.location.split(',')[0].trim() : '');
    setEditDistrict(userDist);
    setEditAvatarUrl(user?.avatarUrl || '');
    setProfileEditError(null);
    setIsEditProfileModalOpen(true);
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setProfileEditError('Please enter a valid full name (at least 2 characters).');
      return;
    }

    if (!editDistrict) {
      setProfileEditError('Please select your District. District is mandatory for statewide and district-wise rank.');
      return;
    }

    setIsSavingProfile(true);
    setProfileEditError(null);

    try {
      const res = await updateProfile({
        fullName: trimmedName,
        phone: editPhone.trim() || undefined,
        avatarUrl: editAvatarUrl.trim() || undefined,
        district: editDistrict,
      });

      if (res.error) {
        setProfileEditError(res.error.message || 'Failed to update profile.');
      } else {
        saveExtras({
          ...extras,
          phone: editPhone.trim(),
          headline: editHeadline.trim() || DEFAULT_EXTRAS.headline,
          location: `${editDistrict}, West Bengal`,
        });
        setIsEditProfileModalOpen(false);
        showToast('Profile updated successfully!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating profile.';
      setProfileEditError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Save Learning Goal
  const handleSaveGoal = () => {
    if (!goalInput.trim()) return;
    saveExtras({
      ...extras,
      learningGoal: goalInput.trim(),
    });
    setIsGoalModalOpen(false);
    showToast('Learning goal updated!');
  };

  // Toggle Subject in Subjects of Interest
  const toggleSubject = (sub: string) => {
    const exists = extras.subjects.includes(sub);
    let updated: string[];
    if (exists) {
      if (extras.subjects.length <= 1) {
        showToast('Select at least one subject of interest.');
        return;
      }
      updated = extras.subjects.filter((s) => s !== sub);
    } else {
      updated = [...extras.subjects, sub];
    }
    saveExtras({
      ...extras,
      subjects: updated,
    });
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password changed successfully!');
      }
    } catch {
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Download Student Data JSON
  const handleDownloadData = () => {
    const exportData = {
      profile: {
        id: user?.id,
        name: user?.fullName || 'Student',
        email: user?.email || '',
        phone: user?.phone || extras.phone,
        location: extras.location,
        headline: extras.headline,
        learningGoal: extras.learningGoal,
        memberSince: memberSince,
      },
      stats: {
        testsAttempted: testsCount,
        averageAccuracy: `${avgAccuracy}%`,
        bestScore: bestScoreDisplay,
        dayStreak: dayStreak,
        currentRank: currentRank > 0 ? `#${currentRank}` : '#-',
      },
      interests: extras.subjects,
      completedAttempts: completedAttempts.slice(0, 50).map((a) => ({
        testId: a.testId,
        score: a.score,
        totalMarks: a.totalMarks,
        accuracy: a.accuracy,
        status: a.status,
        date: a.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `practicekoro-profile-${user?.fullName?.replace(/\s+/g, '_') || 'student'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Student data exported successfully!');
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  // Avatar source resolution
  const avatarSrc = user?.avatarUrl || '/images/profile_user_avatar.jpg';

  // Exams list derived from real exams catalog
  const displayExams = useMemo(() => {
    const badges = [
      { badgeText: 'WB', badgeBg: 'bg-blue-50 text-[#1e60f2]', badgeBorder: 'border-blue-200/80' },
      { badgeText: '{ }', badgeBg: 'bg-emerald-50 text-emerald-600', badgeBorder: 'border-emerald-200/80' },
      { badgeText: '🏛️', badgeBg: 'bg-amber-50 text-amber-600', badgeBorder: 'border-amber-200/80' },
      { badgeText: 'A', badgeBg: 'bg-rose-50 text-rose-600', badgeBorder: 'border-rose-200/80' },
    ];
    const ordered: Exam[] = [];
    if (selectedExam) {
      ordered.push(selectedExam);
    }
    for (const ex of exams) {
      if (ex && !ordered.some((o) => o.id === ex.id)) {
        ordered.push(ex);
      }
      if (ordered.length >= 4) break;
    }
    return ordered.map((ex, idx) => {
      const style = badges[idx % badges.length];
      return {
        id: ex.id,
        title: ex.title,
        badgeText: ex.title.slice(0, 2).toUpperCase() || style.badgeText,
        badgeBg: style.badgeBg,
        badgeBorder: style.badgeBorder,
        isPrimary: idx === 0,
        originalExam: ex,
      };
    });
  }, [exams, selectedExam]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <StudentNavbar embedded onToggleMobileSidebar={onToggleMobileSidebar} />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/home" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-800 dark:text-slate-200 font-bold">Profile</span>
        </nav>

        {/* 2. Page Header with Mascot Art */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My <span className="text-[#1e60f2]">Profile</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Manage your account, track your progress, and customize your learning experience.
            </p>
          </div>

          {/* Top Right Decorative Illustration */}
          <div className="relative shrink-0 flex items-center justify-end">
            <img
              src="/images/profile_hero_art.png"
              alt="Better Aspirants Brighter Bengal - Small Steps Big Results"
              className="h-20 sm:h-24 w-auto object-contain select-none pointer-events-none drop-shadow-xs"
            />
          </div>
        </div>

        {/* 3. Hero Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-xs relative">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
            {/* Left: Avatar & Meta Details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full sm:w-auto">
              {/* Avatar with Camera Badge */}
              <div className="relative group shrink-0">
                <img
                  src={avatarSrc}
                  alt={user?.fullName || 'Student'}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-md border border-slate-200 dark:border-slate-700"
                  onError={(e) => {
                    e.currentTarget.src = '/images/profile_user_avatar.jpg';
                  }}
                />
                <button
                  type="button"
                  onClick={openEditProfile}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#1e60f2] text-white hover:bg-blue-700 shadow-md transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                  title="Update profile photo"
                  aria-label="Update profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User Bio and Meta */}
              <div className="space-y-1.5 min-w-0">
                {/* Name Row */}
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {user?.fullName || 'Student'}
                  </h2>
                  <button
                    type="button"
                    onClick={openEditProfile}
                    className="p-1 rounded-md text-slate-400 hover:text-[#1e60f2] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Name"
                    aria-label="Edit Name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Aspirant Headline */}
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span>{extras.headline || 'Aspirant | Keep Learning Keep Growing 🌱'}</span>
                </p>

                {/* Metadata Row: Email, Phone, Location, Member Since */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user?.email || 'No email linked'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user?.phone || extras.phone || 'Not added'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{user?.district ? `${user.district}, West Bengal` : (extras.location || 'West Bengal')}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{memberSince}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Edit Profile Button */}
            <div className="self-end sm:self-start shrink-0">
              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#1e60f2] dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Motivational Quote Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="italic text-slate-500 dark:text-slate-400 font-normal">
              &quot;Discipline today creates success tomorrow.&quot;
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              — PracticeKoro
            </span>
          </div>
        </div>

        {/* 4. Stat Cards Row (5 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Tests Attempted */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1e60f2] border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                {testsCount}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                Tests Attempted
              </div>
            </div>
          </div>

          {/* Card 2: Average Accuracy */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 border border-pink-100 dark:border-pink-900/50 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                {avgAccuracy}%
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                Average Accuracy
              </div>
            </div>
          </div>

          {/* Card 3: Best Score */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                {bestScoreDisplay}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                Best Score
              </div>
            </div>
          </div>

          {/* Card 4: Day Streak */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-amber-500/20" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                {dayStreak}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                Day Streak
              </div>
            </div>
          </div>

          {/* Card 5: Current Rank */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
            <div className="w-11 h-11 rounded-xl bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 border border-yellow-100 dark:border-yellow-900/50 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
                {currentRank > 0 ? `#${currentRank}` : '#-'}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                Current Rank
              </div>
            </div>
          </div>
        </div>

        {/* 5. Horizontal Tab Strip */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#1e60f2] bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1e60f2]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 6. Tab Content: Overview (Default Exact Screenshot View) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Column 1: My Exams (4 Cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">My Exams</h3>
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(true)}
                  className="text-xs font-bold text-[#1e60f2] hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-2.5">
                {displayExams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => {
                      if (exam.originalExam) setSelectedExam(exam.originalExam);
                      setIsExamModalOpen(true);
                    }}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 bg-white dark:bg-slate-900/70 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl ${exam.badgeBg} flex items-center justify-center font-bold text-xs shrink-0 border ${exam.badgeBorder}`}
                      >
                        {exam.badgeText}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {exam.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {exam.isPrimary ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1e60f2] border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                          Primary Exam
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          Added
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1e60f2] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Subjects of Interest & Learning Goal (4 Cols) */}
            <div className="lg:col-span-4 space-y-5 sm:space-y-6">
              {/* Subjects of Interest */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Subjects of Interest
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSubjectsModalOpen(true)}
                    className="text-xs font-bold text-[#1e60f2] hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {extras.subjects.map((sub) => {
                    const style =
                      SUBJECT_STYLES[sub] ||
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
                    return (
                      <span
                        key={sub}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${style}`}
                      >
                        {sub}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Learning Goal */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Learning Goal
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setGoalInput(extras.learningGoal);
                      setIsGoalModalOpen(true);
                    }}
                    className="text-xs font-bold text-[#1e60f2] hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f0fdf4] dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-emerald-900/40 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {extras.learningGoal}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 3: My Progress This Month (4 Cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  My Progress This Month
                </h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTimeframeOpen((prev) => !prev)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{extras.selectedTimeframe}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isTimeframeOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                      {['This Month', 'Last 30 Days', 'All Time'].map((tf) => (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => {
                            saveExtras({ ...extras, selectedTimeframe: tf });
                            setIsTimeframeOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            extras.selectedTimeframe === tf
                              ? 'text-[#1e60f2] font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Donut Chart & Statistics */}
              <div className="flex items-center justify-between gap-4 pt-1">
                {/* SVG Donut Chart */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f1f5f9"
                      strokeWidth="9"
                      fill="transparent"
                      className="dark:stroke-slate-800"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1e60f2"
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - goalProgressPct / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                      {goalProgressPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Goal Progress
                    </span>
                  </div>
                </div>

                {/* 3 Metric Points */}
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Tests Taken
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{testsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      Hours Studied
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{hoursStudied}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Questions Solved
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{questionsSolvedCount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Motivational Banner */}
              <div className="mt-2 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
                <div className="p-1 rounded-md text-[#1e60f2]">
                  <Flag className="w-4 h-4 fill-blue-500/20" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    You are on the right track!
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Keep practicing to achieve your goal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Exam Settings */}
        {activeTab === 'exam-settings' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exam Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your primary target competitive exam for tailored questions and analytics.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {exams.map((exam) => {
                const isSelected = selectedExam?.id === exam.id;
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => {
                      setSelectedExam(exam);
                      showToast(`Primary exam set to ${exam.title}`);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1e60f2] bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{exam.title}</p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{exam.category}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#1e60f2] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Preferences */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Portal Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personalize language, appearance, and study reminders.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">Portal Language</p>
                <p className="text-slate-500">Official standard exam format</p>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-blue-600 font-bold border border-slate-200 dark:border-slate-700">
                  Standard Format
                </span>
              </div>
              <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <p className="font-bold text-slate-800 dark:text-slate-200">Daily Revision Reminder</p>
                <p className="text-slate-500">Daily notification alert for streak retention</p>
                <span className="inline-block px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 font-bold border border-slate-200 dark:border-slate-700">
                  Active (8:00 PM)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Subscription */}
        {activeTab === 'subscription' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro Pass & Billing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your All-Access Pro Pass membership and benefits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/subscription')}
                className="text-xs font-bold text-[#1e60f2] hover:underline"
              >
                Plan Details
              </button>
            </div>
            {isPro || subscriptionDetails?.isActive ? (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
                  <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>Pro Pass Active</span>
                </div>
                <h4 className="text-2xl font-black">All-Access Pro Pass</h4>
                <p className="text-xs text-blue-100">
                  Unlimited mock tests, PYQs, detailed step-by-step solutions, and state rank analytics.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Free Student Tier</h4>
                  <p className="text-xs text-slate-500 mt-1">Upgrade to Pro Pass for ₹299 / 365 Days for unlimited access.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  className="px-4 py-2.5 rounded-xl bg-[#1e60f2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                >
                  Upgrade to Pro Pass
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Achievements */}
        {activeTab === 'achievements' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Earned Badges</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Milestones unlocked through consistent study and high test accuracy.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Test Pioneer', desc: 'Attempted first 10 tests', icon: Trophy, unlocked: true },
                { title: '7-Day Streak', desc: 'Maintained 7 consecutive days', icon: Flame, unlocked: true },
                { title: 'Accuracy Guru', desc: 'Score above 80% accuracy', icon: Target, unlocked: true },
                { title: 'Centurion', desc: 'Solve 1,000+ questions', icon: Award, unlocked: true },
              ].map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.title}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{badge.title}</p>
                    <p className="text-[11px] text-slate-500">{badge.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Activity */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Test Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Completed mock test sessions and scorecards.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/results')}
                className="text-xs font-bold text-[#1e60f2] hover:underline"
              >
                View All Results
              </button>
            </div>
            {completedAttempts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No recent tests recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedAttempts.slice(0, 5).map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white">Mock Test Attempt</p>
                      <p className="text-slate-400">
                        {new Date(att.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-blue-600 text-sm">{att.score} pts</span>
                      <p className="text-[11px] text-slate-500">Accuracy: {att.accuracy || 0}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Security */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Security</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage authentication, login sessions, and credentials.</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Account Password</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Keep your PracticeKoro credentials protected</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#1e60f2] shadow-2xs hover:bg-slate-50"
              >
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* 7. Account Actions Row */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Account Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* 1. Edit Profile */}
            <button
              type="button"
              onClick={openEditProfile}
              className="p-3 rounded-2xl bg-blue-50/60 dark:bg-slate-800/70 hover:bg-blue-100/70 dark:hover:bg-slate-800 text-[#1e60f2] dark:text-blue-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-100 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            {/* 2. Change Password */}
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="p-3 rounded-2xl bg-blue-50/60 dark:bg-slate-800/70 hover:bg-blue-100/70 dark:hover:bg-slate-800 text-[#1e60f2] dark:text-blue-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-100 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </button>

            {/* 3. Notification Settings */}
            <button
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              className="p-3 rounded-2xl bg-blue-50/60 dark:bg-slate-800/70 hover:bg-blue-100/70 dark:hover:bg-slate-800 text-[#1e60f2] dark:text-blue-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-100 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Notification Settings</span>
            </button>

            {/* 4. Download My Data */}
            <button
              type="button"
              onClick={handleDownloadData}
              className="p-3 rounded-2xl bg-blue-50/60 dark:bg-slate-800/70 hover:bg-blue-100/70 dark:hover:bg-slate-800 text-[#1e60f2] dark:text-blue-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-100 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download My Data</span>
            </button>

            {/* 5. Logout */}
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-100 dark:border-rose-900/50 transition-colors cursor-pointer col-span-2 sm:col-span-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Support & Help Desk Section */}
          <div className="mt-4 p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 dark:from-slate-850 dark:via-slate-800 dark:to-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Support & Help Desk
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  সাহায্য ও সাপোর্ট: Raise tickets & report issues
                </p>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                  <span>সাপোর্ট ও অভিযোগ ডেস্ক (Direct Support Desk)</span>
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSupportModalTab('history');
                  setIsSupportModalOpen(true);
                }}
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                className="text-xs font-bold grow sm:grow-0"
              >
                টিকেট হিস্ট্রি
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setSupportModalTab('create');
                  setIsSupportModalOpen(true);
                }}
                leftIcon={<LifeBuoy className="w-3.5 h-3.5" />}
                className="text-xs font-bold grow sm:grow-0"
              >
                টিকেট তৈরি করুন
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Edit Profile Modal                                              */}
      {/* ========================================================================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#1e60f2] flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile</h3>
                  <p className="text-xs text-slate-500">Update personal and candidate details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingProfile && setIsEditProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {profileEditError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileEditError}</span>
                </div>
              )}

              {/* Avatar Live Preview */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-blue-50/40 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                <img
                  src={editAvatarUrl.trim() || avatarSrc}
                  alt="Candidate preview"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-300"
                  onError={(e) => {
                    e.currentTarget.src = '/images/profile_user_avatar.jpg';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {editName.trim() || 'Candidate Name'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {editHeadline.trim() || 'Aspirant'}
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Susanta Lohar"
                  required
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2]"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9547771118"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2]"
                />
              </div>

              {/* Headline / Bio */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Headline / Aspirant Tagline
                </label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="Aspirant | Keep Learning Keep Growing 🌱"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2]"
                />
              </div>

              {/* District Selection (Mandatory) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>
                    District (West Bengal) <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Mandatory for District Rank
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={editDistrict}
                    onChange={(e) => {
                      setEditDistrict(e.target.value);
                    }}
                    required
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2] appearance-none cursor-pointer pr-10"
                  >
                    <option value="" disabled>
                      -- Select your District --
                    </option>
                    {WEST_BENGAL_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Avatar URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Profile Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://... photo link"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl bg-[#1e60f2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Change Password Modal                                           */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#1e60f2] flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
                  <p className="text-xs text-slate-500">Update your account login password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-xl bg-[#1e60f2] hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Manage Exams Modal                                              */}
      {/* ========================================================================= */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage My Exams</h3>
                <p className="text-xs text-slate-500">Choose your primary target exam</p>
              </div>
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {exams.map((exam) => {
                const isSelected = selectedExam?.id === exam.id;
                return (
                  <div
                    key={exam.id}
                    onClick={() => {
                      setSelectedExam(exam);
                      showToast(`Primary exam updated to ${exam.title}`);
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#1e60f2] bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{exam.title}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{exam.category}</p>
                    </div>
                    {isSelected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1e60f2] text-white">
                        Selected
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800">
                        Set as Primary
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExamModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#1e60f2] text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Edit Subjects Modal                                             */}
      {/* ========================================================================= */}
      {isSubjectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Subjects of Interest</h3>
                <p className="text-xs text-slate-500">Pick subjects you are actively studying</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubjectsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex flex-wrap gap-2">
                {ALL_SUBJECT_OPTIONS.map((sub) => {
                  const isChecked = extras.subjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#1e60f2] text-white border-[#1e60f2] shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsSubjectsModalOpen(false);
                  showToast('Subjects of interest updated!');
                }}
                className="px-4 py-2 rounded-xl bg-[#1e60f2] text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: Edit Learning Goal Modal                                        */}
      {/* ========================================================================= */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Learning Goal</h3>
                <p className="text-xs text-slate-500">Write your target competitive exam aspiration</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                rows={3}
                placeholder="e.g. Clear WBP Constable 2024 with a top rank and secure a government job."
                className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1e60f2]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  className="px-4 py-2 rounded-xl bg-[#1e60f2] text-white font-bold text-xs"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: Notification Settings Modal                                     */}
      {/* ========================================================================= */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#1e60f2] flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
                  <p className="text-xs text-slate-500">Configure alerts and email notifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {[
                { key: 'examAlerts', label: 'Exam Date & Admit Card Alerts', desc: 'Critical official exam announcement updates' },
                { key: 'newTests', label: 'New Mock Tests & PYQs', desc: 'Alerts when fresh test sets are published' },
                { key: 'weeklyReport', label: 'Weekly Performance Report', desc: 'Summary of questions solved & accuracy trends' },
              ].map((item) => {
                const checked = extras.notifications[item.key as keyof typeof extras.notifications];
                return (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        saveExtras({
                          ...extras,
                          notifications: {
                            ...extras.notifications,
                            [item.key]: !checked,
                          },
                        });
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        checked ? 'bg-[#1e60f2]' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationModalOpen(false);
                    showToast('Notification settings saved!');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1e60f2] text-white font-bold text-xs"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: Logout Confirmation Modal                                       */}
      {/* ========================================================================= */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Are you sure you want to logout?</h3>
              <p className="text-xs text-slate-500">Your test progress and answers remain securely saved.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Support Ticket Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        initialTab={supportModalTab}
      />
    </div>
  );
};
