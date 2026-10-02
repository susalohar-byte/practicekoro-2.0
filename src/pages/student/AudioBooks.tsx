import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AudioLines, BookOpen, Headphones } from 'lucide-react';

export const AudioBooks: React.FC = () => (
  <main className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
    <section className="relative w-full overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-6 text-center shadow-[0_24px_80px_-48px_rgba(7,25,74,0.32)] dark:border-slate-800 dark:bg-slate-900 sm:p-10 lg:p-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl dark:bg-blue-900/20"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400 to-blue-700 text-white shadow-lg shadow-blue-600/25">
          <BookOpen className="h-10 w-10" aria-hidden="true" />
          <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-emerald-500 dark:border-slate-900">
            <Headphones className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
        </div>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          <AudioLines className="h-3.5 w-3.5" aria-hidden="true" />
          Coming soon
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-[#07194A] dark:text-white sm:text-3xl">
          Audio Books
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base sm:leading-7">
          Listen to focused lessons and revise your exam topics wherever you are. Audio learning is
          being prepared for PracticeKoro.
        </p>
        <Link
          to="/dashboard"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0158FC] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>
      </div>
    </section>
  </main>
);
