import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useExam } from '@/context/ExamContext';
import { useLanguage } from '@/context/LanguageContext';
import { useContentLanguage } from '@/context/MaintenanceContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  Languages,
  Target,
  Shield,
  LogOut,
  Info,
  Check,
  ArrowLeft,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { exams, selectedExam, setSelectedExam } = useExam();
  const navigate = useNavigate();

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Language preference: state for UI and question content.
  const { lang: language, setLang: handleLanguageChange } = useLanguage();
  const { isBilingualEnabled } = useContentLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pk-student-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            aria-label="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your language, target exam, and account preferences
            </p>
          </div>
        </div>
      </div>

      {/* B1. Language Preferences */}
      <Card className="p-5 sm:p-6 border-slate-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-100 shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Question Language Preference
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your default language for mock tests, questions, and explanations
            </p>
          </div>
        </div>

        {isBilingualEnabled ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleLanguageChange('bn')}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                language === 'bn'
                  ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="text-sm font-bold text-slate-900">বাংলা (Bengali)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Questions and explanations in Bengali by default
                </p>
              </div>
              {language === 'bn' && (
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                language === 'en'
                  ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="text-sm font-bold text-slate-900">English</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Questions and explanations in English by default
                </p>
              </div>
              {language === 'en' && (
                <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">বাংলা (Bengali Only)</p>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-600 text-white">সক্রিয়</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                মক টেস্ট এবং প্রশ্নাবলী সম্পূর্ণ বাংলা ভাষায় প্রস্তুত করা হয়েছে।
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        )}
      </Card>

      {/* B2. Target Exam Preference */}
      <Card className="p-5 sm:p-6 border-slate-200">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Target Exam Preference
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Switching your target exam tailors Home, subject mock tests, and practice questions
              </p>
            </div>
          </div>
          {selectedExam && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100">
              <span>🎯</span>
              <span>{selectedExam.title}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {exams.map((exam) => {
            const isSelected = selectedExam?.id === exam.id;
            return (
              <button
                key={exam.id}
                type="button"
                onClick={() => setSelectedExam(exam)}
                className={`p-3.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">{exam.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{exam.category}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* B3. Security & Session */}
      <Card className="p-5 sm:p-6 border-slate-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Security & Active Session
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your active student authentication session
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{user?.fullName || 'Student'}</p>
              <p className="text-[11px] text-slate-500">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
            className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 font-bold text-xs w-full sm:w-auto"
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Help & Support Desk */}
      <Card className="p-5 sm:p-6 border-slate-200 bg-gradient-to-br from-blue-50/40 to-white dark:from-blue-950/20 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Helpdesk & Support
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Experiencing technical bugs, question discrepancies, or payment issues? Submit a
                support ticket directly to our administration.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/support"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <span>Help Center</span>
            </Link>
            <Button
              onClick={() => setIsSupportModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Raise Support Ticket</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* B4. Account Actions */}
      <Card className="p-5 sm:p-6 border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Account Management</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Account deletion requires a dedicated secure backend workflow. To request permanent
              deletion of your account and personal data, please contact PracticeKoro support at{' '}
              <span className="font-semibold text-slate-900">support@practicekoro.com</span>.
            </p>
          </div>
        </div>
      </Card>

      {/* B5. About PracticeKoro */}
      <Card className="p-5 sm:p-6 border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              PracticeKoro Platform Version 2.0.0
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Focused Mock Test & Competitive Exam Preparation
            </p>
          </div>
        </div>
      </Card>

      {/* Student Support Ticket Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};
