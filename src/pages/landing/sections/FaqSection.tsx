import React, { useState } from 'react';
import { ArrowUpRight, LifeBuoy, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { faqs } from '../data';
import { Reveal } from './Reveal';

export const FaqSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="relative isolate overflow-hidden border-t border-slate-100 bg-[#f5f8ff] py-16 scroll-mt-24 dark:border-slate-800/80 dark:bg-slate-950 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-700/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-700/10"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:px-8">
        <Reveal className="h-full">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#081d50] via-[#0640a8] to-[#0158fc] p-6 text-white shadow-[0_24px_70px_-32px_rgba(1,88,252,0.65)] sm:p-9 lg:sticky lg:top-28 lg:min-h-[470px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-16 h-64 w-64 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-9 -top-5 h-44 w-44 rounded-full border border-white/10"
            />

            <div className="relative z-10 flex flex-1 flex-col">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-100 backdrop-blur sm:text-[11px]">
                <LifeBuoy className="h-4 w-4 text-sky-200" aria-hidden="true" />
                Help Center
              </span>

              <h2 className="mt-7 max-w-md text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.6rem]">
                Frequently Asked{' '}
                <span className="bg-gradient-to-r from-sky-200 via-white to-blue-100 bg-clip-text text-transparent">
                  Questions
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/85 sm:text-base sm:leading-7">
                Quick answers about tests, your account, and getting the most from PracticeKoro.
              </p>

              <div className="mt-auto pt-10">
                <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-4 backdrop-blur-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sky-100">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-white">Still need a hand?</p>
                      <p className="mt-1 text-xs leading-5 text-blue-100/80 sm:text-sm">
                        Our support team is ready to help you get back to your preparation.
                      </p>
                      <Link
                        to="/contact-us"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#0640a8] shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
                      >
                        Contact support
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="min-w-0">
          <Reveal className="mb-5 sm:mb-7">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300 sm:text-[11px]">
                  Common questions
                </p>
                <p className="mt-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Choose a question to see the answer.
                </p>
              </div>
              <span className="rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {String(faqs.length).padStart(2, '0')} answers
              </span>
            </div>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              const answerId = `faq-answer-${index}`;

              return (
                <Reveal key={faq.q} delay={index * 55}>
                  <div
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-white/90 shadow-[0_8px_28px_-20px_rgba(15,23,42,0.28)] transition-all duration-300 dark:bg-slate-900/90',
                      isOpen
                        ? 'border-blue-300 shadow-[0_14px_36px_-22px_rgba(1,88,252,0.45)] dark:border-blue-700'
                        : 'border-slate-200/80 hover:-translate-y-0.5 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-900'
                    )}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => toggleFaq(index)}
                      className="group flex w-full items-center gap-3.5 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-[1.125rem]"
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-colors sm:h-10 sm:w-10',
                          isOpen
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                            : 'bg-blue-50 text-blue-700 group-hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:group-hover:bg-blue-950'
                        )}
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 text-[13px] font-extrabold leading-5 text-slate-900 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300 sm:text-sm sm:leading-6">
                        {faq.q}
                      </span>
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                          isOpen
                            ? 'rotate-45 bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-300'
                        )}
                        aria-hidden="true"
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>

                    <div
                      id={answerId}
                      className={cn(
                        'grid transition-all duration-300 ease-in-out',
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="border-t border-slate-100 px-4 pb-5 pt-3.5 pl-[4.25rem] text-[13px] leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:px-5 sm:pl-[4.75rem] sm:text-sm">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
