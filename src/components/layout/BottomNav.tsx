import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn, isStudentNavActive } from '@/lib/utils';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const isHomeActive = isStudentNavActive(location.pathname, 'Home');
  const isTestSeriesActive = isStudentNavActive(location.pathname, 'Test Series');
  const isPracticeActive = isStudentNavActive(location.pathname, 'Practice');
  const isResultsActive = isStudentNavActive(location.pathname, 'Results');
  const isProfileActive = isStudentNavActive(location.pathname, 'Profile');

  return (
    <nav
      className="lg:hidden fixed bottom-2 sm:bottom-3 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile Bottom Navigation"
    >
      <div className="relative max-w-[440px] mx-auto pointer-events-auto">
        {/* ── Left Playful Sunburst Doodle (Orange rays \ | /) ── */}
        <div
          className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-0"
          aria-hidden="true"
        >
          <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
            {/* Top angled ray */}
            <path
              d="M14 6L4 2"
              stroke="#F97316"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Middle horizontal ray */}
            <path
              d="M16 14L2 14"
              stroke="#F97316"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* Bottom angled ray */}
            <path
              d="M14 22L4 26"
              stroke="#F97316"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ── Right Playful Sunburst Doodle (Orange rays / | \) ── */}
        <div
          className="absolute -right-2.5 sm:-right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-0"
          aria-hidden="true"
        >
          <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
            {/* Top angled ray */}
            <path
              d="M4 6L14 2"
              stroke="#F97316"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Middle horizontal ray */}
            <path
              d="M2 14L16 14"
              stroke="#F97316"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* Bottom angled ray */}
            <path
              d="M4 22L14 26"
              stroke="#F97316"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ── Main Pill Navigation Container (White pill with warm ambient yellow glow) ── */}
        <div
          className={cn(
            'relative h-[68px] sm:h-[72px] bg-white rounded-full border border-[#F2ECE1] dark:border-slate-800',
            'shadow-[0_12px_36px_-6px_rgba(255,214,64,0.38),0_4px_16px_rgba(15,23,42,0.06)]',
            'flex items-center justify-between px-2 sm:px-3'
          )}
        >
          {/* 1. HOME */}
          <Link
            to="/dashboard"
            className="flex-1 h-full flex flex-col items-center justify-center relative touch-manipulation group transition-transform duration-100 active:scale-95"
            aria-label="Home"
          >
            {/* Soft Yellow Circular Active Highlight */}
            {isHomeActive && (
              <span
                className="absolute top-1.5 w-10 h-10 rounded-full bg-[#FFF082] pointer-events-none z-0 animate-in fade-in zoom-in-95 duration-150"
                aria-hidden="true"
              />
            )}

            {/* Home Icon */}
            <div className="relative z-10 w-7 h-7 flex items-center justify-center">
              {isHomeActive ? (
                // Colorful House: Red Roof, Yellow walls, Navy Outline & Door
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  {/* House Body */}
                  <path
                    d="M5 10.5V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V10.5"
                    fill="#FFE866"
                    stroke="#0B132B"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                  />
                  {/* Red Triangular Roof */}
                  <path
                    d="M3 11L11.08 3.5C11.6 3.02 12.4 3.02 12.92 3.5L21 11"
                    stroke="#0B132B"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="#EF4444"
                  />
                  {/* Roof Fill */}
                  <path
                    d="M4.2 10.2L12 3.8L19.8 10.2H4.2Z"
                    fill="#EF4444"
                  />
                  {/* Navy Door Arch */}
                  <path
                    d="M10 21V15.5C10 14.67 10.67 14 11.5 14H12.5C13.33 14 14 14.67 14 15.5V21"
                    fill="#0B132B"
                    stroke="#0B132B"
                    strokeWidth="1.2"
                  />
                </svg>
              ) : (
                // Inactive Clean Navy Outline House
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3.5 10.5L11.1 3.5C11.6 3.1 12.4 3.1 12.9 3.5L20.5 10.5"
                    stroke="#0B132B"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 9.5V19.5C5.5 20.3 6.2 21 7 21H17C17.8 21 18.5 20.3 18.5 19.5V9.5"
                    stroke="#0B132B"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 21V15C10 14.4 10.4 14 11 14H13C13.6 14 14 14.4 14 15V21"
                    stroke="#0B132B"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                'relative z-10 text-[10.5px] sm:text-[11px] leading-tight tracking-tight mt-0.5 text-[#0B132B]',
                isHomeActive ? 'font-black' : 'font-bold'
              )}
            >
              Home
            </span>

            {/* Active Indicator Dot */}
            {isHomeActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD84D] mt-0.5" />
            )}
          </Link>

          {/* 2. TEST SERIES */}
          <Link
            to="/test-series"
            className="flex-1 h-full flex flex-col items-center justify-center relative touch-manipulation group transition-transform duration-100 active:scale-95"
            aria-label="Test Series"
          >
            {/* Active Highlight */}
            {isTestSeriesActive && (
              <span
                className="absolute top-1.5 w-10 h-10 rounded-full bg-[#FFF082] pointer-events-none z-0 animate-in fade-in zoom-in-95 duration-150"
                aria-hidden="true"
              />
            )}

            {/* Document/Test-Paper Icon with Folded Corner & 3 Lines */}
            <div className="relative z-10 w-7 h-7 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                {/* Document Paper Outline */}
                <path
                  d="M15 2.5H6.5C5.4 2.5 4.5 3.4 4.5 4.5V19.5C4.5 20.6 5.4 21.5 6.5 21.5H17.5C18.6 21.5 19.5 20.6 19.5 19.5V7L15 2.5Z"
                  stroke="#0B132B"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={isTestSeriesActive ? '#FFFFFF' : 'none'}
                />
                {/* Corner Fold */}
                <path
                  d="M15 2.5V7H19.5"
                  stroke="#0B132B"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 3 Horizontal Content Lines */}
                <path
                  d="M8.5 11.5H15.5"
                  stroke="#0B132B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M8.5 15H15.5"
                  stroke="#0B132B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M8.5 18H12.5"
                  stroke="#0B132B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Label */}
            <span
              className={cn(
                'relative z-10 text-[10px] sm:text-[11px] leading-tight tracking-tight mt-0.5 text-[#0B132B] truncate max-w-full px-1',
                isTestSeriesActive ? 'font-black' : 'font-bold'
              )}
            >
              Test Series
            </span>

            {/* Active Indicator Dot */}
            {isTestSeriesActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD84D] mt-0.5" />
            )}
          </Link>

          {/* ── 3. PRACTICE (FLOATING CENTRAL PRIMARY ACTION) ── */}
          <Link
            to="/practice"
            className="flex-1 h-full flex flex-col items-center justify-start relative touch-manipulation group transition-transform duration-150 active:scale-95 z-20"
            aria-label="Practice"
          >
            {/* Floating Elevated Container */}
            <div className="relative -top-5 sm:-top-6 flex flex-col items-center">
              {/* Mascot in Circular Yellow Background */}
              <div className="relative">
                {/* Yellow Circle Glow & Background with Mascot */}
                <div
                  className={cn(
                    'w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-full p-0.5',
                    'shadow-[0_8px_20px_rgba(255,200,40,0.45),0_2px_8px_rgba(15,23,42,0.12)]',
                    'transition-transform duration-200 group-hover:scale-105'
                  )}
                >
                  <img
                    src="/images/mascot_with_crown_tight.png"
                    alt="PracticeKoro Mascot"
                    className="w-full h-full object-contain select-none pointer-events-none drop-shadow-xs"
                    onError={(e) => {
                      // Fallback to student avatar if custom crop fails
                      e.currentTarget.src = '/images/student_avatar.png';
                    }}
                  />
                </div>

                {/* Tiny Sparkle Doodle on bottom-left */}
                <div
                  className="absolute -left-2 bottom-1 pointer-events-none select-none"
                  aria-hidden="true"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 0L9.5 5.5L15 8L9.5 10.5L8 16L6.5 10.5L1 8L6.5 5.5L8 0Z"
                      fill="#F59E0B"
                    />
                  </svg>
                </div>
              </div>

              {/* Yellow Organic Pill for "Practice" Label */}
              <div
                className={cn(
                  'mt-0.5 px-3 py-0.5 rounded-full bg-[#FFDE31] border border-[#EAB308]/40 shadow-xs',
                  'transition-all duration-150',
                  isPracticeActive && 'ring-2 ring-[#0B132B]/20'
                )}
              >
                <span className="text-[10.5px] sm:text-[11px] font-black text-[#0B132B] tracking-tight leading-none block">
                  Practice
                </span>
              </div>
            </div>
          </Link>

          {/* 4. RESULTS */}
          <Link
            to="/results"
            className="flex-1 h-full flex flex-col items-center justify-center relative touch-manipulation group transition-transform duration-100 active:scale-95"
            aria-label="Results"
          >
            {/* Active Highlight */}
            {isResultsActive && (
              <span
                className="absolute top-1.5 w-10 h-10 rounded-full bg-[#FFF082] pointer-events-none z-0 animate-in fade-in zoom-in-95 duration-150"
                aria-hidden="true"
              />
            )}

            {/* Trophy Icon with Soft Blue Cup Fill & Navy Outline */}
            <div className="relative z-10 w-7 h-7 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                {/* Cup Bowl */}
                <path
                  d="M6 3.5H18V11C18 14.3 15.3 17 12 17C8.7 17 6 14.3 6 11V3.5Z"
                  fill="#BFDBFE"
                  stroke="#0B132B"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                {/* Left Handle */}
                <path
                  d="M6 6H3.5C2.7 6 2 6.7 2 7.5C2 10.2 4.1 12.3 6.8 12.5"
                  stroke="#0B132B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Right Handle */}
                <path
                  d="M18 6H20.5C21.3 6 22 6.7 22 7.5C22 10.2 19.9 12.3 17.2 12.5"
                  stroke="#0B132B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Stem & Base */}
                <path
                  d="M12 17V20.5"
                  stroke="#0B132B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  d="M8.5 21H15.5"
                  stroke="#0B132B"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Label */}
            <span
              className={cn(
                'relative z-10 text-[10.5px] sm:text-[11px] leading-tight tracking-tight mt-0.5 text-[#0B132B]',
                isResultsActive ? 'font-black' : 'font-bold'
              )}
            >
              Results
            </span>

            {/* Active Indicator Dot */}
            {isResultsActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD84D] mt-0.5" />
            )}
          </Link>

          {/* 5. PROFILE */}
          <Link
            to="/profile"
            className="flex-1 h-full flex flex-col items-center justify-center relative touch-manipulation group transition-transform duration-100 active:scale-95"
            aria-label="Profile"
          >
            {/* Active Highlight */}
            {isProfileActive && (
              <span
                className="absolute top-1.5 w-10 h-10 rounded-full bg-[#FFF082] pointer-events-none z-0 animate-in fade-in zoom-in-95 duration-150"
                aria-hidden="true"
              />
            )}

            {/* Clean Rounded User Profile Icon */}
            <div className="relative z-10 w-7 h-7 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                {/* Head Circle */}
                <circle
                  cx="12"
                  cy="7.5"
                  r="4"
                  stroke="#0B132B"
                  strokeWidth="2.3"
                  fill={isProfileActive ? '#FFE866' : 'none'}
                />
                {/* Shoulders Body Curve */}
                <path
                  d="M4.5 20.5C4.5 16.6 7.9 13.5 12 13.5C16.1 13.5 19.5 16.6 19.5 20.5"
                  stroke="#0B132B"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Label */}
            <span
              className={cn(
                'relative z-10 text-[10.5px] sm:text-[11px] leading-tight tracking-tight mt-0.5 text-[#0B132B]',
                isProfileActive ? 'font-black' : 'font-bold'
              )}
            >
              Profile
            </span>

            {/* Active Indicator Dot */}
            {isProfileActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD84D] mt-0.5" />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};
