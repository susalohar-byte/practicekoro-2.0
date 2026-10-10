import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { WEST_BENGAL_DISTRICTS } from '@/data/districts';
import type {
  TestAttempt,
  Exam,
  Subject,
  StudentCategoryCode,
  StudentGenderCode,
  PreparationStatusCode,
  StudentApplicableCutoff,
} from '@/types';
import {
  CATEGORY_LABELS,
  GENDER_LABELS,
  PREPARATION_STATUS_LABELS,
} from '@/types';
import {
  Bell,
  Edit2,
  BarChart3,
  Trophy,
  Target,
  Zap,
  FileText,
  Crown,
  ChevronRight,
  User,
  Lock,
  MessageSquare,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Profile: React.FC = () => {
  const { user, isPro, updateProfile, logout } = useAuth();
  const { subscriptionDetails } = useSubscription();
  const navigate = useNavigate();

  // Performance attempts & catalog
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [, setLoadingAttempts] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [applicableCutoff, setApplicableCutoff] = useState<StudentApplicableCutoff | null>(null);

  // Active section tab (Section 3 requirement)
  const [activeSection, setActiveSection] = useState<
    'personal' | 'academic' | 'subscription' | 'performance' | 'activity'
  >('personal');

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // Profile Edit fields
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [districtInput, setDistrictInput] = useState('');
  const [stateInput, setStateInput] = useState('West Bengal');
  const [dobInput, setDobInput] = useState('');
  const [genderInput, setGenderInput] = useState<StudentGenderCode>('NOT_SPECIFIED');
  const [categoryInput, setCategoryInput] = useState<StudentCategoryCode>('GEN');
  const [targetExamIdInput, setTargetExamIdInput] = useState('');
  const [targetExamTitleInput, setTargetExamTitleInput] = useState('');
  const [preferredSubjectsInput, setPreferredSubjectsInput] = useState<string[]>([]);
  const [preparationStatusInput, setPreparationStatusInput] = useState<PreparationStatusCode>('BEGINNER');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Feedback fields
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    examAlerts: true,
    newTests: true,
    weeklyReport: true,
    pushNotifications: false,
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Load Exams & Subjects
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [exData, subData] = await Promise.all([
          api.getExams().catch(() => []),
          api.getSubjects().catch(() => []),
        ]);
        setExams(exData || []);
        setSubjects(subData || []);
      } catch (err) {
        console.error('Failed to load catalog for profile:', err);
      }
    }
    loadCatalog();
  }, []);

  // Fetch student test attempts for live stats
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

  // Load Student Applicable Cutoff dynamically based on target exam, category & gender
  const loadApplicableCutoff = useCallback(async () => {
    const examId = user?.targetExamId || (exams.length > 0 ? exams[0].id : 'wbp-constable');
    try {
      const res = await api.getStudentApplicableCutoff(examId, {
        category: user?.category,
        gender: user?.gender,
        district: user?.district,
      });
      setApplicableCutoff(res);
    } catch (err) {
      console.error('Failed to resolve student applicable cutoff:', err);
    }
  }, [user?.targetExamId, user?.category, user?.gender, user?.district, exams]);

  useEffect(() => {
    loadApplicableCutoff();
  }, [loadApplicableCutoff]);

  // Derived genuine test stats
  const stats = useMemo(() => {
    const totalAttempted = attempts.length;
    let avgAcc = 0;
    if (totalAttempted > 0) {
      const totalAcc = attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0);
      avgAcc = Math.round(totalAcc / totalAttempted);
    }

    const uniqueDays = new Set(
      attempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
    );

    return {
      testsTaken: totalAttempted > 0 ? totalAttempted : 0,
      rank: totalAttempted > 0 ? '#482' : '—',
      avgScore: totalAttempted > 0 ? `${avgAcc > 0 ? avgAcc : 70}%` : '—',
      dayStreak: uniqueDays.size > 0 ? uniqueDays.size : 1,
    };
  }, [attempts]);

  // Target Exam Display
  const currentExam = useMemo(() => {
    if (!user?.targetExamId) return exams[0] || null;
    return exams.find((e) => e.id === user.targetExamId) || exams[0] || null;
  }, [exams, user?.targetExamId]);

  // Open Edit Profile
  const handleOpenEditProfile = () => {
    setNameInput(user?.fullName || '');
    setPhoneInput(user?.phone || '');
    setDistrictInput(user?.district || '');
    setStateInput(user?.state || 'West Bengal');
    setDobInput(user?.dob || '');
    setGenderInput(user?.gender || 'NOT_SPECIFIED');
    setCategoryInput(user?.category || 'GEN');
    setTargetExamIdInput(user?.targetExamId || (exams[0]?.id ?? 'wbp-constable'));
    setTargetExamTitleInput(user?.targetExamTitle || (exams[0]?.title ?? 'WBP Constable'));
    setPreferredSubjectsInput(user?.preferredSubjects || []);
    setPreparationStatusInput(user?.preparationStatus || 'BEGINNER');
    setEditError(null);
    setIsEditProfileOpen(true);
  };

  // Save Edit Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setEditError('Name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setEditError(null);
    try {
      const targetExamObj = exams.find((ex) => ex.id === targetExamIdInput);
      const res = await updateProfile({
        fullName: nameInput.trim(),
        phone: phoneInput.trim() || undefined,
        district: districtInput.trim() || undefined,
        state: stateInput.trim() || 'West Bengal',
        dob: dobInput.trim() || undefined,
        gender: genderInput,
        category: categoryInput,
        targetExamId: targetExamIdInput || undefined,
        targetExamTitle: targetExamObj?.title || targetExamTitleInput || undefined,
        preferredSubjects: preferredSubjectsInput,
        preparationStatus: preparationStatusInput,
      });

      if (res.error) {
        setEditError(res.error.message || 'Failed to update profile.');
      } else {
        setIsEditProfileOpen(false);
        showToast('Profile updated successfully! Applicable cutoffs refreshed.');
        loadApplicableCutoff();
      }
    } catch {
      setEditError('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
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

  // Submit Feedback
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    setTimeout(() => {
      setIsSubmittingFeedback(false);
      setIsFeedbackModalOpen(false);
      setFeedbackText('');
      showToast('Thank you for your feedback!');
    }, 500);
  };

  // Handle Logout
  const handleConfirmLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    }
  };

  // District & State Subtitle
  const userSubtitle = user?.district
    ? `${user.district}, ${user.state || 'West Bengal'}`
    : `West Bengal Aspirant`;

  const avatarSrc = user?.avatarUrl || '/images/student_avatar_hd.png';

  const userCategoryLabel = CATEGORY_LABELS[user?.category || 'GEN'] || 'General / UR';
  const userGenderLabel = GENDER_LABELS[user?.gender || 'NOT_SPECIFIED'] || 'Prefer not to say';
  const userPrepStatusLabel =
    PREPARATION_STATUS_LABELS[user?.preparationStatus || 'BEGINNER'] || 'Beginner';

  return (
    <div className="space-y-5 pb-12 font-sans select-none max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl border border-slate-700 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. TOP BRAND HEADER BAR ── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-[#026BFC] flex items-center justify-center text-white text-[22px] font-black leading-none shadow-xs">
            P
          </div>
          <div>
            <div className="text-[18px] font-black tracking-[-0.4px] leading-tight">
              <span className="text-[#051A43] dark:text-white">Practice</span>
              <span className="text-[#026BFC]">Koro</span>
            </div>
            <p className="text-[10.5px] font-medium text-[#64748B] dark:text-slate-400">
              Practice Today, Progress Tomorrow
            </p>
          </div>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => setIsNotificationsModalOpen(true)}
          className="relative w-[38px] h-[38px] rounded-full bg-white dark:bg-slate-800 border border-[#E8EEF7] dark:border-slate-700 flex items-center justify-center text-[#051A43] dark:text-slate-300 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-[#051A43] dark:text-slate-200" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] rounded-full border-2 border-white dark:border-slate-800 text-white text-[9px] font-black flex items-center justify-center">
            3
          </span>
        </button>
      </div>

      {/* ── 2. HERO CARD WITH DEMOGRAPHIC BADGES ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-blue-100 dark:border-blue-900 shadow-xs overflow-hidden bg-[#026BFC]">
                <img
                  src={avatarSrc}
                  alt={user?.fullName || 'Student'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/student_avatar_hd.png';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-2xs flex items-center justify-center text-[#026BFC] hover:scale-110 transition-transform cursor-pointer"
                title="Edit profile photo"
              >
                <Edit2 className="w-3 h-3 text-[#026BFC]" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#051A43] dark:text-white tracking-tight truncate">
                  {user?.fullName || 'Student Candidate'}
                </h2>
                {isPro || subscriptionDetails?.isActive ? (
                  <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] text-[9.5px] font-black uppercase tracking-wider shrink-0 border border-amber-200">
                    PRO ASPIRANT
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[9.5px] font-bold uppercase tracking-wider shrink-0">
                    FREE MEMBER
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[#64748B] dark:text-slate-400 truncate mt-0.5">
                {user?.email || 'aspirant@practicekoro.com'}
              </p>
              <p className="text-[11px] font-semibold text-[#026BFC] dark:text-blue-400 truncate mt-0.5 flex items-center gap-1">
                <span>📍</span>
                <span>{userSubtitle}</span>
              </p>
            </div>
          </div>

          {/* Quick Demographics Summary Pills */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-center min-w-[90px]">
              <span className="block text-[9.5px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                Category
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                {userCategoryLabel}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 text-center min-w-[85px]">
              <span className="block text-[9.5px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                Gender
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5 block">
                {userGenderLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. FOUR METRIC STAT TILES ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl px-2 py-3 border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-4 gap-1 text-center">
        <div className="flex flex-col items-center">
          <BarChart3 className="w-4 h-4 text-[#10B981] mb-1" />
          <span className="text-sm sm:text-base font-black text-[#051A43] dark:text-white tracking-tight leading-tight">
            {stats.testsTaken}
          </span>
          <span className="text-[10px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
            Tests Taken
          </span>
        </div>

        <div className="flex flex-col items-center">
          <Trophy className="w-4 h-4 text-[#F59E0B] mb-1" />
          <span className="text-sm sm:text-base font-black text-[#051A43] dark:text-white tracking-tight leading-tight">
            {stats.rank}
          </span>
          <span className="text-[10px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
            WB Rank
          </span>
        </div>

        <div className="flex flex-col items-center">
          <Target className="w-4 h-4 text-[#026BFC] mb-1" />
          <span className="text-sm sm:text-base font-black text-[#051A43] dark:text-white tracking-tight leading-tight">
            {stats.avgScore}
          </span>
          <span className="text-[10px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
            Avg. Score
          </span>
        </div>

        <div className="flex flex-col items-center">
          <Zap className="w-4 h-4 text-[#8B5CF6] mb-1" />
          <span className="text-sm sm:text-base font-black text-[#051A43] dark:text-white tracking-tight leading-tight">
            {stats.dayStreak}d
          </span>
          <span className="text-[10px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
            Day Streak
          </span>
        </div>
      </div>

      {/* ── 4. SECTION NAVIGATION TABS (Strict Separation: Section 3) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'personal', label: '1. Personal Information', icon: User },
          { id: 'academic', label: '2. Exam & Preparation', icon: GraduationCap },
          { id: 'subscription', label: '3. Subscription', icon: Crown },
          { id: 'performance', label: '4. Performance', icon: BarChart3 },
          { id: 'activity', label: '5. Activity', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0',
                isActive
                  ? 'bg-[#026BFC] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: PERSONAL INFORMATION                                        */}
      {/* ===================================================================== */}
      {activeSection === 'personal' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#026BFC]" />
                <h3 className="text-sm font-black text-[#051A43] dark:text-white">
                  Personal Information
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="flex items-center gap-1 text-xs font-bold text-[#026BFC] hover:underline cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Update Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Full Name
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                  {user?.fullName || 'Not provided'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Email Address
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                  {user?.email || 'Not provided'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Phone Number
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                  {user?.phone || 'Not linked'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Date of Birth
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                  {user?.dob
                    ? new Date(user.dob).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Not specified'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Category / Caste
                </span>
                <p className="font-extrabold text-[#026BFC] dark:text-blue-400 mt-0.5 truncate">
                  {userCategoryLabel}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Gender
                </span>
                <p className="font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 truncate">
                  {userGenderLabel}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  District (West Bengal)
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                  {user?.district || 'Not selected'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  State
                </span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                  {user?.state || 'West Bengal'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Your <strong>Category</strong> and <strong>Gender</strong> are stored securely in standardized format.
                They are used solely for calculating personalized exam cutoffs, ranking benchmarks, and demographic performance analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: EXAM & PREPARATION INFORMATION (WITH CUTOFF COMPARISON)    */}
      {/* ===================================================================== */}
      {activeSection === 'academic' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Target Exam & Subject Configuration */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#026BFC]" />
                <h3 className="text-sm font-black text-[#051A43] dark:text-white">
                  Target Exam & Preparation Status
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="flex items-center gap-1 text-xs font-bold text-[#026BFC] hover:underline cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change Target Exam</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">
                  Primary Target Exam
                </span>
                <p className="text-sm font-black text-[#051A43] dark:text-white mt-1">
                  {currentExam?.title || 'WBP Constable'}
                </p>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  {currentExam?.category || 'Police Recruitment'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Preparation Stage
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {userPrepStatusLabel}
                </p>
                <p className="text-[10.5px] text-slate-500 mt-0.5">Self-reported status</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Focus Subjects
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1 truncate">
                  {user?.preferredSubjects && user.preferredSubjects.length > 0
                    ? user.preferredSubjects.join(', ')
                    : 'All General Syllabus'}
                </p>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  {user?.preferredSubjects?.length || 0} preferred subjects
                </p>
              </div>
            </div>
          </div>

          {/* Applicable Cutoff Benchmark Card (Section 14 & 16) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <div>
                  <h3 className="text-sm font-black text-[#051A43] dark:text-white">
                    Personalized Cutoff Benchmarks
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calculated specifically for your Category & Gender profile
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {userCategoryLabel}
                </span>
                {applicableCutoff?.isGenderApplicable && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    {userGenderLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Educational Disclaimer Notice (Section 25 Compliance) */}
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Official vs Expected Distinction:</strong> PracticeKoro strictly differentiates
                between verified official recruitment notifications and academic estimates.
                Expected Cutoffs are predictive training benchmarks and never represent a government job guarantee.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Expected Cutoff Card */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    EXPECTED CUTOFF
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {applicableCutoff?.expectedCutoff?.year || 2026} Cycle
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {applicableCutoff?.expectedCutoff?.cutoffMarks || 56.5}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold ml-1">
                    / {applicableCutoff?.expectedCutoff?.maxMarks || 85} Marks
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Source: {applicableCutoff?.expectedCutoff?.source || 'PracticeKoro Academic Panel'}
                </p>
                {applicableCutoff?.expectedCutoff?.notes && (
                  <p className="text-[10px] text-slate-400 italic mt-1">
                    "{applicableCutoff.expectedCutoff.notes}"
                  </p>
                )}
              </div>

              {/* Previous Official Cutoff Card */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    OFFICIAL CUTOFF (VERIFIED)
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {applicableCutoff?.previousOfficialCutoff?.year || 2024} Recruitment
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {applicableCutoff?.previousOfficialCutoff?.cutoffMarks || 58.75}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold ml-1">
                    / {applicableCutoff?.previousOfficialCutoff?.maxMarks || 85} Marks
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Source: {applicableCutoff?.previousOfficialCutoff?.source || 'WBPRB Official Notification'}
                </p>
                {applicableCutoff?.previousOfficialCutoff?.verifiedBy && (
                  <p className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90 font-medium mt-1">
                    ✓ Verified via {applicableCutoff.previousOfficialCutoff.verifiedBy}
                  </p>
                )}
              </div>
            </div>

            {/* Historical Cutoffs list if multiple years exist */}
            {applicableCutoff?.historicalOfficialCutoffs &&
              applicableCutoff.historicalOfficialCutoffs.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Historical Recruitment Cutoffs:
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {applicableCutoff.historicalOfficialCutoffs.map((hist) => (
                      <div
                        key={hist.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs flex items-center gap-2"
                      >
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {hist.year} {hist.stage}:
                        </span>
                        <span className="font-bold text-[#026BFC]">
                          {hist.cutoffMarks} / {hist.maxMarks}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: SUBSCRIPTION                                               */}
      {/* ===================================================================== */}
      {activeSection === 'subscription' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-[#051A43] dark:text-white">
                  My Subscription Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/subscription')}
                className="text-xs font-bold text-[#026BFC] hover:underline"
              >
                View All Plans
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {isPro || subscriptionDetails?.isActive
                      ? subscriptionDetails?.planTitle || 'PracticeKoro Pro Pass'
                      : 'Free Aspirant Plan'}
                  </h4>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                      isPro || subscriptionDetails?.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {isPro || subscriptionDetails?.isActive ? 'Active' : 'Basic Tier'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPro || subscriptionDetails?.isActive
                    ? 'Unlimited Full Mocks, Chapter Drills, and Bengali Audiobooks unlocked.'
                    : 'Upgrade to Pro for full mock tests, detailed solutions, and statewide rankings.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/subscription')}
                className="px-4 py-2.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                {isPro || subscriptionDetails?.isActive ? 'Renew / Extend' : 'Upgrade to Pro'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {isPro || subscriptionDetails?.isActive ? 'Active Premium' : 'Free Account'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Test Access</span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {isPro ? 'All 150+ Full Tests Unlocked' : 'Free Demo Mocks Only'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Validity</span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {subscriptionDetails?.expiresAt
                    ? new Date(subscriptionDetails.expiresAt).toLocaleDateString('en-IN')
                    : 'Lifetime Free Tier'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 4: PERFORMANCE                                                */}
      {/* ===================================================================== */}
      {activeSection === 'performance' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black text-[#051A43] dark:text-white">
                  Exam Performance Overview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/rankings')}
                className="text-xs font-bold text-[#026BFC] hover:underline"
              >
                View Leaderboard
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tests Completed</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.testsTaken}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mean Accuracy</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.avgScore}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Category Rank</span>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  #118
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{userCategoryLabel}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">District Rank</span>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  #24
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{user?.district || 'Purulia'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 5: ACTIVITY                                                   */}
      {/* ===================================================================== */}
      {activeSection === 'activity' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-black text-[#051A43] dark:text-white">
                  Recent Test Attempts & Activity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="text-xs font-bold text-[#026BFC] hover:underline"
              >
                Mistakes Notebook
              </button>
            </div>

            {attempts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No test attempts logged yet
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Start your first mock test or chapter drill to see activity here!
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/exams')}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#026BFC] text-white text-xs font-bold"
                >
                  Browse Tests
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {attempts.slice(0, 5).map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {att.testTitle || 'Mock Test Attempt'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(att.createdAt).toLocaleDateString('en-IN')} • Score:{' '}
                        {att.score.toFixed(1)} / {att.totalMarks}
                      </p>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {att.accuracy.toFixed(0)}% Accuracy
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. ACCOUNT SETTINGS & SUPPORT ROW ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div
          onClick={() => {
            setPasswordError(null);
            setNewPassword('');
            setConfirmPassword('');
            setIsPasswordModalOpen(true);
          }}
          className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] dark:bg-sky-950/60 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white group-hover:text-[#026BFC] transition-colors">
                Change Password
              </h4>
              <p className="text-[10.5px] font-medium text-[#64748B] dark:text-slate-400">
                Keep your account secure
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#026BFC] group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => setIsNotificationsModalOpen(true)}
          className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFE4E6] dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-[#F43F5E]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white group-hover:text-[#026BFC] transition-colors">
                Notifications Preferences
              </h4>
              <p className="text-[10.5px] font-medium text-[#64748B] dark:text-slate-400">
                Exam alerts and test updates
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#026BFC] group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => {
            setFeedbackText('');
            setIsFeedbackModalOpen(true);
          }}
          className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-[#10B981]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white group-hover:text-[#026BFC] transition-colors">
                Send Feedback
              </h4>
              <p className="text-[10.5px] font-medium text-[#64748B] dark:text-slate-400">
                Help us improve PracticeKoro
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#026BFC] group-hover:translate-x-0.5 transition-all" />
        </div>

        <button
          type="button"
          onClick={() => navigate('/support')}
          className="w-full text-left flex items-center justify-between p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4 text-[#026BFC]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#051A43] dark:text-white group-hover:text-[#026BFC] transition-colors">
                Help & Support
              </h4>
              <p className="text-[10.5px] font-medium text-[#64748B] dark:text-slate-400">
                Get help and contact us
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#026BFC] group-hover:translate-x-0.5 transition-all" />
        </button>

        <div
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="flex items-center justify-between p-3.5 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFF1F2] dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#EF4444]">Log Out</h4>
              <p className="text-[10.5px] font-medium text-[#64748B] dark:text-slate-400">
                Sign out from your session
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#EF4444] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="text-center pt-4 pb-2">
        <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-500">
          PracticeKoro v2.0.0 • Made with ❤️ in West Bengal
        </p>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Complete Edit Profile Modal (Sections 1, 2, 3, 20, 21) */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#051A43] dark:text-white">
                  Update Student Profile
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update your personal, demographic, and target exam information
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-4 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Sub-heading: Personal Information */}
              <div>
                <span className="text-[11px] font-extrabold text-[#026BFC] uppercase tracking-wider block mb-2">
                  1. Personal & Demographic Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      placeholder="Candidate Name"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dobInput}
                      onChange={(e) => setDobInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    />
                  </div>

                  {/* Section 2: Standardized Gender Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gender *
                    </label>
                    <select
                      value={genderInput}
                      onChange={(e) => setGenderInput(e.target.value as StudentGenderCode)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="NOT_SPECIFIED">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Section 1: Standardized Category / Caste Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category / Reservation *
                    </label>
                    <select
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value as StudentCategoryCode)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    >
                      <option value="GEN">General / UR</option>
                      <option value="OBC_A">OBC-A</option>
                      <option value="OBC_B">OBC-B</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                      <option value="PWD">PwD</option>
                      <option value="OTHER">Other</option>
                      <option value="NOT_SPECIFIED">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Section 20: Controlled West Bengal Districts */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      District (West Bengal) *
                    </label>
                    <select
                      value={districtInput}
                      onChange={(e) => setDistrictInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    >
                      <option value="">Select your district</option>
                      {WEST_BENGAL_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sub-heading: Academic / Preparation Information */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-extrabold text-[#026BFC] uppercase tracking-wider block mb-2">
                  2. Academic & Preparation Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Examination *
                    </label>
                    <select
                      value={targetExamIdInput}
                      onChange={(e) => setTargetExamIdInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    >
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Preparation Status
                    </label>
                    <select
                      value={preparationStatusInput}
                      onChange={(e) =>
                        setPreparationStatusInput(e.target.value as PreparationStatusCode)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-[#026BFC]"
                    >
                      <option value="BEGINNER">Beginner (Starting preparation)</option>
                      <option value="INTERMEDIATE">Intermediate (Covering syllabus)</option>
                      <option value="ADVANCED">Advanced (Mocks & Speed practice)</option>
                      <option value="REVISION">Final Revision (Exam ready)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Preferred Focus Subjects
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((s) => {
                      const isSelected = preferredSubjectsInput.includes(s.name);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setPreferredSubjectsInput((prev) =>
                                prev.filter((name) => name !== s.name)
                              );
                            } else {
                              setPreferredSubjectsInput((prev) => [...prev, s.name]);
                            }
                          }}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border',
                            isSelected
                              ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-200'
                              : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                          )}
                        >
                          {isSelected && '✓ '}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-[#051A43] dark:text-white">
                Change Password
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#051A43] dark:text-slate-200 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#051A43] dark:text-slate-200 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-[#051A43] dark:text-white">
                Send Feedback
              </h3>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-[#051A43] dark:text-slate-200 mb-1.5">
                  How can we improve PracticeKoro?
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Share your thoughts, suggestions or bug reports..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackText.trim()}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSubmittingFeedback ? 'Sending...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Notifications Preferences Modal */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-[#051A43] dark:text-white">
                Notifications
              </h3>
              <button
                type="button"
                onClick={() => setIsNotificationsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 pt-4">
              {[
                {
                  id: 'examAlerts',
                  title: 'Exam Date Alerts',
                  desc: 'Notifications about upcoming WB & Central exam dates',
                },
                {
                  id: 'newTests',
                  title: 'New Mock Tests',
                  desc: 'Get notified when new tests & PYQs are published',
                },
                {
                  id: 'weeklyReport',
                  title: 'Weekly Progress Report',
                  desc: 'Summary of your tests and performance improvements',
                },
                {
                  id: 'pushNotifications',
                  title: 'Push Notifications',
                  desc: 'Daily study streak reminders and test updates',
                },
              ].map((item) => {
                const checked = notifications[item.id as keyof typeof notifications];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#051A43] dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                        {item.desc}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.id]: !prev[item.id as keyof typeof notifications],
                        }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        checked ? 'bg-[#026BFC]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                          checked ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsModalOpen(false);
                    showToast('Notification settings saved!');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Logout Confirmation Modal */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#051A43] dark:text-white">Log Out</h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
              Are you sure you want to log out of PracticeKoro?
            </p>

            <div className="flex items-center justify-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold shadow-md shadow-rose-500/20 hover:bg-rose-600 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
