import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, FileText, Zap, BarChart3, User } from 'lucide-react';
import { cn, isStudentNavActive } from '@/lib/utils';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Test Series', path: '/test-series', icon: FileText },
    { label: 'Practice', path: '/practice', icon: Zap },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-2.5 left-0 right-0 z-40 px-4 pointer-events-none select-none">
      <div className="max-w-[460px] mx-auto pointer-events-auto h-[66px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-md rounded-full border border-[#E2EAF8] dark:border-slate-800 shadow-[0_8px_24px_rgba(10,46,101,0.08),0_2px_10px_rgba(8,102,245,0.04)] px-2 flex items-center justify-between relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isStudentNavActive(location.pathname, tab.label);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'relative flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-200 select-none group touch-manipulation z-10',
                isActive
                  ? 'text-[#0866F5] dark:text-blue-400'
                  : 'text-[#172B55] dark:text-slate-400 hover:text-[#0866F5]'
              )}
            >
              {/* Sliding circular elevated highlight for active item */}
              {isActive && (
                <motion.div
                  layoutId="appNavActiveHighlight"
                  className="absolute w-12 h-12 rounded-full bg-gradient-to-b from-[#EFF5FF] to-[#DBEAFE] dark:from-blue-950/70 dark:to-blue-900/70 border border-white dark:border-blue-700/50 shadow-[0_2.5px_8px_rgba(8,102,245,0.14),0_1px_3px_rgba(10,46,101,0.04)] z-0"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  'relative z-10 w-5 h-5 transition-transform',
                  isActive ? 'stroke-[2.4] scale-105' : 'stroke-[2]'
                )}
              />
              <span
                className={cn(
                  'relative z-10 text-[10.5px] leading-tight tracking-tight',
                  isActive ? 'font-bold' : 'font-semibold text-[#172B55]/80 dark:text-slate-400'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};


