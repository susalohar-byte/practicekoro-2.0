import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingModal } from '@/components/student/OnboardingModal';
import { Sparkles, PlayCircle, ArrowRight } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);

  const handleComplete = () => {
    try {
      localStorage.setItem('pk_onboarded', 'true');
    } catch {
      // ignore
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#063585] to-[#0158FC] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Ambient Lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float-reverse pointer-events-none" />

      {/* Main Container when modal is closed or for background presentation */}
      <div className="max-w-md w-full text-center space-y-6 z-10 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl animate-slide-up-fade">
        <img
          src="/logo-icon-circle.png"
          alt="PracticeKoro"
          className="w-20 h-20 mx-auto rounded-3xl object-contain filter drop-shadow-md animate-float"
        />

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aspirant Onboarding Experience</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome to PracticeKoro
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
            Your comprehensive preparation portal for WBSSC, WBP, WBPSC, Rail & Central exams.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-blue-600 font-bold text-xs shadow-lg hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch Animated Tour</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Animated Onboarding Modal */}
      <OnboardingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleComplete}
      />
    </div>
  );
};
export default Onboarding;
