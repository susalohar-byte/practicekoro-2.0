import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useAuth } from '@/context/AuthContext';
import {
  Wrench,
  Clock,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface MaintenanceScreenProps {
  title?: string;
  description?: string;
  allowAdminBypass?: boolean;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  title,
  description,
  allowAdminBypass = true,
}) => {
  const navigate = useNavigate();
  const { checkMaintenanceMode, supportEmail, supportPhone, appName } = useMaintenance();
  const { isAdmin, user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [checkStatusMessage, setCheckStatusMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setIsChecking(true);
      setCheckStatusMessage(null);
      const isStillMaint = await checkMaintenanceMode();
      if (!isStillMaint) {
        setCheckStatusMessage('Maintenance completed! Reloading page...');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setCheckStatusMessage(
          'System is currently undergoing maintenance. Please try again shortly.'
        );
        setTimeout(() => setCheckStatusMessage(null), 4000);
      }
    } catch {
      setCheckStatusMessage('Status check failed. Please check your internet connection.');
      setTimeout(() => setCheckStatusMessage(null), 3000);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-icon-circle.png" alt={appName} className="w-8 h-8 rounded-xl object-contain" />
          <span className="text-base font-black tracking-tight text-white">
            {appName || 'Practice'}
            <span className="text-amber-400">Koro</span>
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Scheduled Maintenance Active</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center my-auto">
        {/* Animated Badge / Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 backdrop-blur-sm">
            <Wrench className="w-10 h-10 animate-bounce" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Headings */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          {title || 'প্ল্যাটফর্ম সাময়িক রক্ষণাবেক্ষণে রয়েছে'}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-amber-400/90 tracking-wide uppercase mb-4">
          Platform Maintenance & Infrastructure Upgrade in Progress
        </p>

        {/* Descriptive Body */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 sm:p-6 text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 backdrop-blur-sm shadow-2xl text-left sm:text-center space-y-2">
          <p>
            {description ||
              'A routine system upgrade is underway to optimize server performance, improve page loading times, and ensure maximum test evaluation accuracy.'}
          </p>
          <p className="text-slate-400 text-xs">
            Test attempts, question evaluation, and results are temporarily paused. All services
            will resume automatically once the upgrade concludes. We apologize for any inconvenience.
          </p>
        </div>

        {/* Live status alert message */}
        {checkStatusMessage && (
          <div className="w-full mb-4 p-3 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{checkStatusMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isChecking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking status...' : 'আবার চেষ্টা করুন (Check Status Again)'}</span>
          </button>

          {allowAdminBypass && isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Enter Admin Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Support Hotline / Helpline cards */}
        <div className="mt-8 pt-6 border-t border-slate-850 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Support Email (সাপোর্ট ইমেইল)
              </p>
              <a
                href={`mailto:${supportEmail}`}
                className="text-xs font-semibold text-slate-200 hover:text-white hover:underline transition-colors"
              >
                {supportEmail || 'support@practicekoro.online'}
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Emergency Helpline (জরুরি হেল্পলাইন)
              </p>
              <p className="text-xs font-semibold text-slate-200">
                {supportPhone || '+91 98765 43210'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Subtle Admin link */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-4 text-center border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <p>
          © {new Date().getFullYear()} {appName || 'PracticeKoro'}. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {!user && (
            <a
              href="/login"
              className="text-slate-400 hover:text-amber-400 transition-colors underline decoration-slate-700"
            >
              Administrator Login
            </a>
          )}
          {user && !isAdmin && (
            <span className="text-slate-500">Student ID: {user.id.slice(0, 8)}...</span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default MaintenanceScreen;
