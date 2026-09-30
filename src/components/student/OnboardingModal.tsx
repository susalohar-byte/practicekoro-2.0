import React, { useState } from 'react';
import {
  ArrowRight,
  Trophy,
  BookOpen,
  Layers,
  Zap,
  BarChart3,
  Sparkles,
  Star,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(0); // 0 = Splash, 1 = Onboarding 1, 2 = Onboarding 2, 3 = Onboarding 3

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (onComplete) onComplete();
      onClose();
    }
  };

  const handleSkip = () => {
    if (onComplete) onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/35 p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all flex flex-col min-h-[580px] max-h-[92vh] animate-in zoom-in-95 duration-300 ease-out">
        {/* Top Header Controls (for onboarding steps 1-3) */}
        {step > 0 && (
          <div className="flex items-center justify-between p-5 pb-0 z-10 animate-in fade-in duration-200">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>{step > 1 ? 'Back' : 'Home'}</span>
            </button>
            <button
              onClick={handleSkip}
              className="px-3.5 py-1 rounded-full text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all hover:scale-105 active:scale-95"
            >
              Skip Tour
            </button>
          </div>
        )}

        {/* STEP 0: Splash Screen (Screen 1) */}
        {step === 0 && (
          <div
            key="step-0"
            className="flex-1 bg-gradient-to-b from-[#0158fc] via-[#0051e8] to-[#0b1f44] text-white flex flex-col items-center justify-between p-8 text-center select-none relative overflow-hidden animate-in fade-in duration-300"
          >
            {/* Ambient Background Glows with breathing & drifting animations */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-10 right-0 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none animate-float-reverse" />
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-sky-400/20 rounded-full blur-2xl pointer-events-none animate-halo-spin" />

            {/* Micro Floating Sparkle Particles */}
            <div className="absolute top-12 left-10 w-1.5 h-1.5 rounded-full bg-white/70 animate-ping pointer-events-none" />
            <div className="absolute top-1/3 right-12 w-2 h-2 rounded-full bg-amber-300/80 animate-pulse pointer-events-none" />
            <div className="absolute bottom-32 left-14 w-1.5 h-1.5 rounded-full bg-blue-200/60 animate-bounce pointer-events-none" />

            {/* Top Quick Action */}
            <div className="w-full flex justify-end z-10">
              <button
                onClick={() => setStep(1)}
                className="group text-xs font-bold text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95"
              >
                <span>Enter App</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Central Animated Logo & Brand Container */}
            <div className="space-y-4 my-auto relative z-10 flex flex-col items-center">
              {/* Floating Animated 3D Logo Box with Pulsing Radar Ring & Shine Glint */}
              <div className="relative">
                {/* Concentric ambient radar pulse ring */}
                <div className="absolute -inset-2 rounded-3xl border border-white/25 animate-pulse-ring pointer-events-none" />
                <img
                  src="/logo-icon-circle.png"
                  alt="PracticeKoro"
                  className="w-24 h-24 rounded-3xl object-contain filter drop-shadow-lg animate-float hover:scale-110 hover:rotate-2 transition-all duration-300 cursor-pointer"
                />
                {/* Rotating Sparkle Star */}
                <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2.5 -right-2.5 animate-spin-slow drop-shadow-md" />
                <Star className="w-4 h-4 text-sky-200 fill-sky-200 absolute -bottom-1 -left-2 animate-pulse drop-shadow" />
              </div>

              {/* Brand Typography with Staggered Entrance and Gradient Sheen */}
              <div className="space-y-1 animate-slide-up-fade">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                  Practice<span className="text-sky-300">Koro</span>
                </h1>
                <p className="text-xs font-semibold tracking-wider uppercase text-blue-100/90">
                  Practice Today • Progress Tomorrow
                </p>
              </div>

              {/* Bengali & English Tagline Pill with Breathing Pulse */}
              <div className="pt-2 animate-slide-up-fade">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-serif italic text-xs shadow-md animate-pulse-glow hover:scale-105 transition-transform cursor-default">
                  <span className="animate-spin-slow">✨</span>
                  <span>Small Steps, Big Results</span>
                </span>
              </div>
            </div>

            {/* Bottom Progress Loading Bar with Shimmer */}
            <div className="w-full max-w-xs space-y-2.5 z-10 animate-slide-up-fade">
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden relative shadow-inner">
                <div className="h-full bg-gradient-to-r from-sky-300 via-white to-sky-300 rounded-full w-3/4 relative overflow-hidden shadow-xs">
                  {/* Continuous Infinite Shimmer Highlight */}
                  <div className="absolute inset-0 bg-white/70 animate-shimmer" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-blue-100/80 font-medium px-1">
                <span>Loading workspace...</span>
                <span className="animate-pulse">● Ready</span>
              </div>
              <button
                onClick={() => setStep(1)}
                className="mt-2 w-full py-3.5 rounded-2xl bg-white text-blue-600 hover:text-blue-700 font-black text-xs shadow-xl shadow-blue-950/40 hover:bg-blue-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-blue-100/40 to-transparent animate-shine pointer-events-none" />
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Onboarding 1 - Your Dream Starts with Practice (Screen 2) */}
        {step === 1 && (
          <div
            key="step-1"
            className="flex-1 flex flex-col justify-between p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {/* Header Text */}
            <div className="space-y-2 animate-slide-up-fade">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] tracking-wide uppercase">
                <Award className="w-3.5 h-3.5" />
                <span>Smart Preparation</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Your Dream <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Starts with Practice
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                High-quality mock tests, official PYQs and topic practice tailored for all West Bengal government exams.
              </p>
            </div>

            {/* Central Graphic Illustration with Concentric Animated Rings & 3D Floating Book */}
            <div className="my-auto py-6 flex flex-col items-center justify-center relative">
              {/* Outer Ripple Ring */}
              <div className="w-60 h-60 rounded-full border border-blue-200/50 dark:border-blue-800/40 animate-pulse-ring absolute pointer-events-none" />

              {/* Concentric Ambient Ring */}
              <div className="w-52 h-52 rounded-full bg-gradient-to-tr from-blue-100/90 via-sky-50 to-indigo-100/80 dark:from-blue-900/40 dark:to-slate-800 flex items-center justify-center relative shadow-inner animate-pulse-glow">
                {/* 3D Floating Book Card */}
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600 via-[#0158FC] to-[#0047cc] text-white flex flex-col items-center justify-center p-4 shadow-2xl shadow-blue-500/30 transform -rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 animate-float cursor-pointer relative overflow-hidden group">
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine pointer-events-none" />
                  <BookOpen className="w-10 h-10 text-white stroke-[2] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black tracking-wide mt-2">PracticeKoro</span>
                </div>

                {/* Floating Badge 1 (Mock Tests) with Glowing Beacon */}
                <div className="absolute top-2 -left-4 bg-white/95 dark:bg-slate-800 rounded-2xl p-2.5 px-3 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 animate-float hover:scale-110 hover:-translate-y-1 transition-all select-none cursor-default">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Mock Tests</span>
                </div>

                {/* Floating Badge 2 (Real Exam PYQ) with Emerald Beacon */}
                <div className="absolute bottom-2 -right-4 bg-white/95 dark:bg-slate-800 rounded-2xl p-2.5 px-3 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 animate-float-reverse hover:scale-110 hover:-translate-y-1 transition-all select-none cursor-default">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Real Exam PYQ</span>
                </div>

                {/* Floating Badge 3 (Top-Right Chip) */}
                <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider shadow-md animate-float hover:scale-105 transition-transform select-none">
                  Bengal Focused
                </div>
              </div>

              {/* Dynamic Soft Shadow Underneath */}
              <div className="w-24 h-3 bg-slate-400/20 dark:bg-slate-900/60 rounded-full blur-xs mt-2 animate-shadow-pulse" />
            </div>

            {/* Bottom Controls (Dots + Circle Arrow Button) */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-2 rounded-full bg-blue-600 transition-all duration-300" />
                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all" />
                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all" />
              </div>
              <button
                onClick={handleNext}
                className="group w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-[#0047cc] hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-110 active:scale-95"
                aria-label="Next slide"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Onboarding 2 - Learn Smarter Not Harder (Screen 3) */}
        {step === 2 && (
          <div
            key="step-2"
            className="flex-1 flex flex-col justify-between p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {/* Header Text */}
            <div className="space-y-2 animate-slide-up-fade">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 font-bold text-[11px] tracking-wide uppercase">
                <Zap className="w-3.5 h-3.5" />
                <span>Adaptive Learning</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Learn Smarter <br />
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Not Harder
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Practice with detailed step-by-step solutions, performance analytics, and personalized recommendations.
              </p>
            </div>

            {/* Feature Stack Cards (Screen 3) with Staggered Entrance & Interactive Hover Effects */}
            <div className="my-auto py-3 space-y-2.5 max-w-sm mx-auto w-full">
              {/* Card 1: Full Mock Tests */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-blue-300 transition-all duration-200 animate-pop-in cursor-default group"
                style={{ animationDelay: '60ms' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                      Full Mock Tests
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">Real exam timer & marking scheme</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 font-bold text-[9px] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Timed</span>
                </span>
              </div>

              {/* Card 2: Topic Practice */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/60 shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-teal-300 transition-all duration-200 animate-pop-in cursor-default group"
                style={{ animationDelay: '140ms' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition-colors">
                      Topic Practice
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">Chapter-wise targeted drills</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300 font-bold text-[9px] flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Subject</span>
                </span>
              </div>

              {/* Card 3: Previous Year Questions */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/60 shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-purple-300 transition-all duration-200 animate-pop-in cursor-default group"
                style={{ animationDelay: '220ms' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors">
                      Previous Year Questions
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">Official verified papers (2018-2025)</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 font-bold text-[9px] flex items-center gap-1">
                  <Star className="w-2.5 h-2.5" />
                  <span>Official</span>
                </span>
              </div>

              {/* Card 4: Performance Analytics */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/60 shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-rose-300 transition-all duration-200 animate-pop-in cursor-default group"
                style={{ animationDelay: '300ms' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-110 group-hover:rotate-2 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 transition-colors">
                      Performance Analytics
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">Instant accuracy, percentile & weak areas</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-800/50 text-rose-700 dark:text-rose-300 font-bold text-[9px] flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Insights</span>
                </span>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all" />
                <span className="w-7 h-2 rounded-full bg-blue-600 transition-all duration-300" />
                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all" />
              </div>
              <button
                onClick={handleNext}
                className="group w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-[#0047cc] hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-110 active:scale-95"
                aria-label="Next slide"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Onboarding 3 - Be Exam Ready With PracticeKoro (Screen 4) */}
        {step === 3 && (
          <div
            key="step-3"
            className="flex-1 flex flex-col justify-between p-6 sm:p-8 text-center animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {/* Header Text */}
            <div className="space-y-2 animate-slide-up-fade">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold text-[11px] tracking-wide uppercase">
                <Trophy className="w-3.5 h-3.5" />
                <span>Aspirant Success</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Be Exam Ready <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 bg-clip-text text-transparent">
                  With PracticeKoro
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
                Join thousands of aspirants across West Bengal who practice daily and excel in competitive exams.
              </p>
            </div>

            {/* Golden Trophy Graphic with Rotating Ambient Halo & Sparkles */}
            <div className="my-auto py-4 flex flex-col items-center justify-center">
              <div className="relative">
                {/* Rotating Ambient Sunburst Halo */}
                <div className="absolute -inset-3 rounded-full border border-amber-300/40 dark:border-amber-500/20 animate-halo-spin pointer-events-none" />

                {/* Inner Glowing Amber Sphere */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-400/25 via-amber-300/15 to-orange-400/25 dark:from-amber-500/20 dark:to-slate-800 flex items-center justify-center p-4 shadow-inner animate-pulse-glow">
                  <Trophy className="w-18 h-18 text-amber-500 stroke-[2] drop-shadow-xl animate-float cursor-pointer hover:scale-110 transition-transform" />
                </div>

                {/* Twinkling Sparkles */}
                <Sparkles className="w-6 h-6 text-amber-400 absolute top-0 right-1 animate-spin-slow drop-shadow" />
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute bottom-1 left-1 animate-pulse drop-shadow" />

                {/* Motto Pill */}
                <div className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[10px] tracking-wider uppercase shadow-md shadow-amber-500/30 animate-slide-up-fade flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Discipline Today • Success Tomorrow</span>
                </div>
              </div>

              {/* 3 Metric Badges with Pop-in Animations and Spring Lift */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs mt-6">
                <div
                  className="p-3 rounded-2xl bg-blue-50/90 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 shadow-xs hover:scale-105 hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-pop-in cursor-default"
                  style={{ animationDelay: '100ms' }}
                >
                  <span className="block text-sm sm:text-base font-black text-blue-600 dark:text-blue-400">10K+</span>
                  <span className="text-[10px] font-semibold text-slate-500">Students</span>
                </div>
                <div
                  className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/60 shadow-xs hover:scale-105 hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-pop-in cursor-default"
                  style={{ animationDelay: '180ms' }}
                >
                  <span className="block text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">100%</span>
                  <span className="text-[10px] font-semibold text-slate-500">Verified PYQ</span>
                </div>
                <div
                  className="p-3 rounded-2xl bg-purple-50/90 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/60 shadow-xs hover:scale-105 hover:-translate-y-1 hover:shadow-md transition-all duration-200 animate-pop-in cursor-default"
                  style={{ animationDelay: '260ms' }}
                >
                  <span className="block text-sm sm:text-base font-black text-purple-600 dark:text-purple-400">Higher</span>
                  <span className="text-[10px] font-semibold text-slate-500">Success Rate</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all" />
                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all" />
                <span className="w-7 h-2 rounded-full bg-blue-600 transition-all duration-300" />
              </div>
              <button
                onClick={handleNext}
                className="group px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-[#0158fc] to-[#0047cc] hover:from-blue-700 hover:to-blue-900 text-white flex items-center gap-2 font-black text-xs sm:text-sm shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden"
              >
                <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shine pointer-events-none" />
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
