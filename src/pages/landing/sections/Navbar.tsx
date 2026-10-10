import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Exams', href: '/#exams' },
  { label: 'App Features', href: '/#inside-app' },
  { label: 'Pro Pass', href: '/#pro-pass' },
  { label: 'Install App', href: '/#app-install' },
  { label: 'FAQ', href: '/#faq' },
];

export const Navbar: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const dashboardUrl = isAdmin ? '/admin' : '/dashboard';
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-2.5 sm:top-4 left-0 right-0 z-50 w-full px-3 sm:px-6 lg:px-8 flex justify-center pointer-events-none">
      <div
        className={cn(
          'w-full max-w-6xl rounded-2xl sm:rounded-full px-3.5 sm:px-6 flex items-center justify-between pointer-events-auto transition-all duration-300',
          'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800',
          scrolled
            ? 'shadow-[0_12px_40px_-8px_rgba(37,99,235,0.18)] h-14 sm:h-[4.25rem]'
            : 'shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-14 sm:h-16'
        )}
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 group shrink-0"
          aria-label="PracticeKoro home"
        >
          <img
            src="/logo-icon-circle.png"
            alt="PracticeKoro"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="font-black text-lg sm:text-2xl text-pk-navy dark:text-white tracking-tight flex items-center">
            Practice<span className="text-pk-primary">Koro</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-pk-primary transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:rounded-full after:bg-pk-primary hover:after:w-full after:transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth / Dashboard CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>

          {user ? (
            <InteractiveHoverButton
              text="Dashboard"
              onClick={() => navigate(dashboardUrl)}
              className="w-26 sm:w-36 text-xs sm:text-sm h-8.5 sm:h-10 border-pk-blue-soft text-pk-primary shadow-xs transition-all"
            />
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-sm font-semibold text-pk-primary border-slate-200 hover:bg-pk-blue-light hover:border-pk-blue-soft px-5 py-2 rounded-xl transition-all"
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/register')}
                className="text-sm font-bold bg-gradient-to-r from-pk-primary to-pk-primary-bright hover:from-pk-primary-interactive hover:to-pk-primary text-white px-5 py-2 rounded-xl shadow-md shadow-pk-primary/25 transition-all"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          {!user && (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {!user && menuOpen && (
        <div className="sm:hidden absolute top-full mt-2 w-full max-w-6xl pointer-events-auto">
          <div className="mx-2 sm:mx-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-1">

            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-pk-blue-light dark:hover:bg-slate-800 hover:text-pk-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/login');
                }}
                className="font-semibold text-pk-primary border-slate-200 rounded-xl"
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/register');
                }}
                className="font-bold bg-pk-primary hover:bg-pk-primary-interactive text-white rounded-xl"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
