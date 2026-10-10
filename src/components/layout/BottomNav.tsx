import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, House, UserRound, Zap } from 'lucide-react';
import { isStudentNavActive } from '@/lib/utils';
import '@/styles/student-panel.css';

const items = [
  { label: 'Home', path: '/dashboard', icon: House },
  { label: 'Test Series', path: '/test-series', icon: FileText },
  { label: 'Practice', path: '/practice', icon: Zap },
  { label: 'Results', path: '/results', icon: BarChart3 },
  { label: 'Profile', path: '/profile', icon: UserRound },
];

export const BottomNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <nav className="student-mobile-nav" aria-label="Mobile Bottom Navigation">
      <div>
        {items.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            aria-label={label}
            aria-current={isStudentNavActive(pathname, label) ? 'page' : undefined}
          >
            <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
