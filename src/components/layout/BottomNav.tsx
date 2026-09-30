import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Layers, BookOpen, BarChart3, User } from 'lucide-react';
import { cn, isStudentNavActive } from '@/lib/utils';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Test Series', path: '/test-series', icon: Layers },
    { label: 'Practice', path: '/practice', icon: BookOpen },
    { label: 'Results', path: '/results', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 safe-area-bottom pb-[max(env(safe-area-inset-bottom,0px),6px)] shadow-[0_-8px_30px_rgba(1,88,252,0.06)]">
      <div className="grid grid-cols-5 h-16 items-center px-1.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isStudentNavActive(location.pathname, tab.label);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 gap-1 transition-all duration-200 select-none group touch-manipulation active:scale-95',
                isActive
                  ? 'text-[#0158FC] dark:text-blue-400 font-extrabold'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-semibold'
              )}
            >
              <div
                className={cn(
                  'relative w-12 h-8 rounded-2xl flex items-center justify-center transition-all duration-200',
                  isActive
                    ? 'text-white shadow-sm shadow-blue-500/25 scale-105'
                    : 'group-hover:bg-slate-100/80 dark:group-hover:bg-slate-800/60'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileBottomNavPill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0158FC] to-[#0198FD] z-0"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 w-[18px] h-[18px] transition-transform',
                    isActive ? 'stroke-[2.5] text-white' : 'stroke-[1.9]'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight leading-none',
                  isActive ? 'font-extrabold text-[#0158FC] dark:text-blue-400' : 'font-semibold'
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

