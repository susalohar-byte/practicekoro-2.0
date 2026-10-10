import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMaintenance } from '@/context/MaintenanceContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import {
  LifeBuoy,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  HelpCircle,
  ChevronDown,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StudentLoadError } from '@/components/student/StudentLoadState';
import { getErrorMessage } from '@/lib/errors';
import type { SupportTicketItem } from '@/types';
import type { SupportCategory } from '@/components/student/StudentSupportModal';

export const Support: React.FC = () => {
  const { user, isPro } = useAuth();
  const { supportEmail, supportPhone, supportWhatsapp, supportHours } = useMaintenance();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Form State
  const [category, setCategory] = useState<SupportCategory>('Technical Issue');
  const [priority, setPriority] = useState<SupportTicketItem['priority']>('medium');
  const [subject, setSubject] = useState('');
  const [issue, setIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // History State
  const [myTickets, setMyTickets] = useState<SupportTicketItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const historyVersion = useRef(0);
  const submitLock = useRef(false);

  // FAQs Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What if a question or answer key seems incorrect in a test?',
      a: 'You can report it directly from the Test Solutions page by clicking "Report Issue" next to that question, or submit a ticket here under "Exam & Question Issue". Our academic editorial team verifies the discrepancy and updates the question bank within 24-48 hours.',
    },
    {
      q: 'My payment succeeded but Pro Pass was not unlocked?',
      a: 'Occasionally payment gateway webhooks face a short delay. Submit a ticket under "Payment & Transaction" with your Payment ID or UTR number. Our admin support team verifies the transaction and activates your Pro subscription immediately.',
    },
    {
      q: 'How does negative marking and percentile ranking work?',
      a: 'PracticeKoro strictly follows the official examination pattern (e.g. 0.25 negative marks for WBP / KP / Food SI). Your percentile and live ranks are dynamically recalculated against all candidates who completed the test.',
    },
    {
      q: 'Can I re-attempt a mock test after submission?',
      a: 'Yes, you can re-attempt practice tests anytime. Your latest attempt as well as past analytics remain safely saved in your Results history and Mistakes Notebook.',
    },
  ];

  const loadHistory = useCallback(async () => {
    const version = ++historyVersion.current;
    setHistoryError('');
    if (!user?.id) {
      setMyTickets([]);
      setIsLoadingHistory(false);
      return;
    }
    try {
      setIsLoadingHistory(true);
      const tickets = await api.getStudentSupportTickets(user.id);
      if (version === historyVersion.current) setMyTickets(tickets);
    } catch (err) {
      if (version === historyVersion.current)
        setHistoryError(getErrorMessage(err, 'Support history could not be loaded.'));
    } finally {
      if (version === historyVersion.current) setIsLoadingHistory(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setMyTickets([]);
    void loadHistory();
    const counter = historyVersion;
    return () => {
      counter.current++;
    };
  }, [loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    if (!user?.id) {
      setErrorMsg('Please sign in before submitting a ticket.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Please enter a clear subject.');
      return;
    }
    if (!issue.trim()) {
      setErrorMsg('Please describe the issue or problem in detail.');
      return;
    }

    submitLock.current = true;
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await api.createSupportTicket({
        userId: user?.id,
        studentName: user?.fullName || 'Student Aspirant',
        studentEmail: user?.email || '',
        subject: subject.trim(),
        issue: issue.trim(),
        category,
        priority,
        status: 'open',
      });

      if (!res.success || !res.ticketId) {
        throw new Error(res.error || 'Failed to submit support ticket');
      }

      setIsSuccess(true);
      loadHistory();

      setTimeout(() => {
        setIsSuccess(false);
        setSubject('');
        setIssue('');
        setActiveTab('history');
      }, 1500);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to submit support ticket. Please try again.'));
    } finally {
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 pk-student-page">
      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
            <LifeBuoy className="w-3.5 h-3.5 text-blue-200" />
            <span>PracticeKoro Support Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Report question discrepancies, mock test errors, or get prompt assistance from the
            PracticeKoro academic & tech team.
          </p>
        </div>
      </div>

      {/* Support Channels Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="p-4 border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 bg-white dark:bg-slate-900">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Helpline</p>
            <a
              href={supportEmail ? `mailto:${supportEmail}` : undefined}
              className="text-xs sm:text-sm font-black text-slate-900 dark:text-white hover:text-blue-600 truncate block"
            >
              {supportEmail || 'Use the ticket form below'}
            </a>
            <p className="text-[10px] text-slate-400">Contact the support team</p>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 bg-white dark:bg-slate-900">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Direct Helpline / WhatsApp
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {supportWhatsapp ? (
                <a
                  href={
                    /^[+\d\s()-]+$/.test(supportWhatsapp) &&
                    supportWhatsapp.replace(/\D/g, '').length >= 7
                      ? `https://wa.me/${supportWhatsapp.replace(/\D/g, '')}`
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {supportWhatsapp}
                </a>
              ) : supportPhone ? (
                <a
                  href={
                    /^[+\d\s()-]+$/.test(supportPhone) &&
                    supportPhone.replace(/\D/g, '').length >= 7
                      ? `tel:${supportPhone.replace(/[^+\d]/g, '')}`
                      : undefined
                  }
                >
                  {supportPhone}
                </a>
              ) : (
                'Direct helpline not configured'
              )}
            </p>
            <p className="text-[10px] text-slate-400">
              {supportHours || 'Availability depends on the support team'}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 bg-white dark:bg-slate-900">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Account Status</p>
            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
              <span>{isPro ? 'Pro Pass Active' : 'Free Aspirant'}</span>
              {isPro && <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            </p>
            <p className="text-[10px] text-slate-400">
              {isPro ? 'Pro subscription enabled' : 'Submit a ticket for assistance'}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Support Interaction: Tabs for Raise Ticket & My Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Raise Ticket / My Tickets */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            {/* Tab Header */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-5 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'create'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Raise Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  loadHistory();
                }}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>My Tickets</span>
                {myTickets.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {myTickets.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-5 sm:p-6">
              {activeTab === 'create' ? (
                isSuccess ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Support Ticket Submitted!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Your query has been sent directly to our Admin Support Desk. The team will
                      examine your query and post the resolution note in your "My Tickets" tab.
                    </p>
                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                      >
                        Track Status in My Tickets
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMsg && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Issue Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as SupportCategory)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Technical Issue">Technical / App Bug</option>
                          <option value="Test Issue">Exam & Question Discrepancy</option>
                          <option value="Result Issue">Result & Scoring Issue</option>
                          <option value="Payment Issue">Payment & Transaction</option>
                          <option value="Subscription Issue">Subscription & Pro Pass</option>
                          <option value="Account Issue">Account & Login</option>
                          <option value="Other">General Query / Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Urgency Level
                        </label>
                        <select
                          value={priority}
                          onChange={(e) =>
                            setPriority(e.target.value as SupportTicketItem['priority'])
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="low">Low - General query</option>
                          <option value="medium">Medium - Normal issue</option>
                          <option value="high">High - Test / Exam blocking</option>
                          <option value="urgent">Urgent - Payment / Access issue</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Subject <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Question #15 explanation has mathematical error in WBP Mock 03"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Detailed Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        rows={4}
                        placeholder="Please describe exactly what happened. If you are reporting a question, mention the question text or test name..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium leading-relaxed resize-none"
                        required
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>Submitting as:</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {user?.fullName || 'Student'} ({user?.email || 'guest account'})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[11px] text-slate-400 hidden sm:block">
                        Direct sync to Admin Support Desk
                      </p>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 px-5 py-2.5 shadow-md shadow-blue-600/20"
                      >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
                      </Button>
                    </div>
                  </form>
                )
              ) : (
                /* History Tab */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Submitted Tickets ({myTickets.length})
                    </span>
                    <button
                      type="button"
                      onClick={loadHistory}
                      disabled={isLoadingHistory}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`}
                      />
                      Refresh List
                    </button>
                  </div>

                  {isLoadingHistory ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading your support tickets...
                    </div>
                  ) : historyError ? (
                    <StudentLoadError message={historyError} onRetry={() => void loadHistory()} />
                  ) : myTickets.length === 0 ? (
                    <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
                      <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No support tickets raised yet
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Facing an issue during practice? Submit your first ticket and our academic &
                        support desk will assist you.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab('create')}
                        className="text-xs font-bold mt-2"
                      >
                        Raise a Ticket Now
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTickets.map((t) => {
                        const isOpen = t.status === 'open';
                        const isResolved = t.status === 'resolved';

                        return (
                          <div
                            key={t.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                                {t.subject}
                              </h4>
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Status Badge */}
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isResolved
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                      : isOpen
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  }`}
                                >
                                  {isResolved ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : isOpen ? (
                                    <AlertCircle className="w-3 h-3" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  {t.status.toUpperCase()}
                                </span>

                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {t.category}
                                </span>
                              </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 font-medium">
                              {t.issue}
                            </p>

                            {/* Admin Resolution Note */}
                            {t.messages
                              ?.filter((m) => m.authorKind === 'support')
                              .map((m) => (
                                <div
                                  key={m.id}
                                  className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
                                >
                                  <p className="text-xs font-bold">
                                    Support reply — {m.authorName}
                                  </p>
                                  <p className="text-xs whitespace-pre-wrap mt-1">{m.body}</p>
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    {new Date(m.createdAt).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              ))}
                            {t.resolutionNotes && (
                              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
                                <div className="flex items-center gap-1.5 font-bold mb-1 text-xs">
                                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Admin Resolution:</span>
                                </div>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                                  {t.resolutionNotes}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span>
                                Submitted:{' '}
                                {t.createdAt
                                  ? new Date(t.createdAt).toLocaleDateString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Recently'}
                              </span>
                              <span className="capitalize font-semibold text-slate-500">
                                Priority: {t.priority}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: FAQs */}
        <div className="space-y-4">
          <Card className="p-5 border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-3 text-left flex items-start justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {faq.q}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/30">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;
