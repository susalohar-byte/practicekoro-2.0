import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Exams', href: '#exams' },
  { label: 'App Features', href: '#inside-app' },
  { label: 'Pro Pass', href: '#pro-pass' },
  { label: 'Install App', href: '#app-install' },
  { label: 'FAQ', href: '#faq' },
];

const SOCIALS = [
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  {
    label: 'Telegram',
    href: 'https://telegram.org',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      id="about"
      className="relative bg-white border-t border-slate-200 pt-10 sm:pt-14 pb-8 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[200px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
      />
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/logo-icon-circle.png"
                alt="PracticeKoro"
                className="w-9 h-9 rounded-xl object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-black text-xl text-slate-900 tracking-tight">
                Practice<span className="text-blue-600 dark:text-blue-400">Koro</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Smart practice for a brighter tomorrow. Mock tests, PYQs &amp; topic-wise practice —
              made for West Bengal&apos;s aspirants.
            </p>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Made in West Bengal, India
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Email:{' '}
              <a href="mailto:support@practicekoro.com" className="text-blue-600 hover:underline">
                support@practicekoro.com
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-blue-600 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Support
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              <li>
                <Link to="/contact-us" className="hover:text-blue-600 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-blue-600 transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="col-span-2 md:col-span-3 space-y-3 pt-2 md:pt-0">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Follow Us
            </h4>
            <div className="flex items-center gap-2.5">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:-translate-y-0.5 flex items-center justify-center text-slate-500 transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Daily practice tips, exam updates &amp; free test alerts.
            </p>
          </div>
        </div>

        <div className="pt-6 sm:pt-7 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-left">
          <p>© {year} PracticeKoro. All rights reserved.</p>
          <p>Designed for serious West Bengal &amp; Central competitive exam preparation.</p>
        </div>
      </div>
    </footer>
  );
};
