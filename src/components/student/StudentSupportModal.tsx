import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import {
  LifeBuoy,
  X,
  CheckCircle2,
  AlertCircle,
  Send,
  Clock,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import type { SupportTicketItem } from '@/types';

export type SupportCategory =
  | 'Technical Issue'
  | 'Payment Issue'
  | 'Subscription Issue'
  | 'Test Issue'
  | 'Result Issue'
  | 'Account Issue'
  | 'Other';

export interface StudentSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: SupportCategory;
  defaultSubject?: string;
  defaultIssue?: string;
  initialTab?: 'create' | 'history';
}

export const StudentSupportModal: React.FC<StudentSupportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Technical Issue',
  defaultSubject = '',
  defaultIssue = '',
  initialTab = 'create',
}) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>(initialTab);

  // Form State
  const [category, setCategory] = useState<SupportCategory>(defaultCategory);
  const [priority, setPriority] = useState<SupportTicketItem['priority']>('medium');
  const [subject, setSubject] = useState(defaultSubject);
  const [issue, setIssue] = useState(defaultIssue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // History State
  const [myTickets, setMyTickets] = useState<SupportTicketItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load ticket history
  const loadHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const tickets = await api.getStudentSupportTickets(user?.id);
      setMyTickets(tickets);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id]);

  // Update form and load history if modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (defaultCategory) setCategory(defaultCategory);
      if (defaultSubject) setSubject(defaultSubject);
      if (defaultIssue) setIssue(defaultIssue);
      if (initialTab) setActiveTab(initialTab);
      setIsSuccess(false);
      setErrorMsg('');
      loadHistory();
    }
  }, [isOpen, defaultCategory, defaultSubject, defaultIssue, initialTab, loadHistory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMsg('Please enter a specific subject or question name.');
      return;
    }
    if (!issue.trim()) {
      setErrorMsg('Please describe the issue or discrepancy in detail.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await api.createSupportTicket({
        userId: user?.id,
        studentName: user?.fullName || 'Student Candidate',
        studentEmail: user?.email || '',
        subject: subject.trim(),
        issue: issue.trim(),
        category,
        priority,
        status: 'open',
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to submit support ticket');
      }

      setIsSuccess(true);
      // Reload history in background
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center overflow-y-auto p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Student Support & Help</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-750 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Direct Desk
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Report test discrepancies, technical issues, or account queries
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0 px-4 sm:px-5 pt-2 bg-white dark:bg-[#0b1329]">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Raise Ticket</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>My Tickets</span>
            {myTickets.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {myTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto grow space-y-4">
          {activeTab === 'create' ? (
            isSuccess ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-50 dark:ring-emerald-900/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Ticket Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your ticket has been sent to the Admin Support Desk. You can track progress and
                  view admin replies in the "My Tickets" tab.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-bold"
                  >
                    View in My Tickets
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Issue Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SupportCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Technical Issue">Technical / App Bug</option>
                      <option value="Test Issue">Exam & Question Issue</option>
                      <option value="Result Issue">Result & Scoring Discrepancy</option>
                      <option value="Payment Issue">Payment & Transaction</option>
                      <option value="Subscription Issue">Subscription & Pro Pass</option>
                      <option value="Account Issue">Account & Login</option>
                      <option value="Other">General Inquiry / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Priority / Urgency
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as SupportTicketItem['priority'])}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="low">Low - General inquiry</option>
                      <option value="medium">Medium - Normal priority</option>
                      <option value="high">High - Test / Exam blocking</option>
                      <option value="urgent">Urgent - Payment / Access issue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question #12 has wrong answer key in KP SI Mock 02"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Detailed Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={4}
                    placeholder="Provide specific details, question numbers, test name, or error messages so the team can resolve it quickly..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium leading-relaxed resize-none"
                    required
                  />
                </div>

                {/* Submitting as info badge */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span>Submitting candidate:</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                    {user?.fullName || 'Student'} ({user?.email || 'Authenticated'})
                  </span>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 hidden sm:block">
                    Typical response time:{' '}
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      Within 24 hours
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
                    </Button>
                  </div>
                </div>
              </form>
            )
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Your Support Tickets ({myTickets.length})
                </span>
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading your tickets...
                </div>
              ) : myTickets.length === 0 ? (
                <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No tickets submitted yet
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    If you encounter any issues during mock tests or account management, raise a
                    ticket here.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('create')}
                    className="text-xs font-bold mt-2"
                  >
                    Raise Your First Ticket
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
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-1.5">
                          <h5 className="font-bold text-slate-900 dark:text-white leading-snug">
                            {t.subject}
                          </h5>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
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

                            {/* Category Badge */}
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {t.category}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                          {t.issue}
                        </p>

                        {/* Admin Resolution Feedback */}
                        {t.messages
                          ?.filter((m) => m.authorKind === 'support')
                          .map((m) => (
                            <div
                              key={m.id}
                              className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
                            >
                              <p className="text-xs font-bold">Support reply — {m.authorName}</p>
                              <p className="text-xs whitespace-pre-wrap mt-1">{m.body}</p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {new Date(m.createdAt).toLocaleString('en-IN')}
                              </p>
                            </div>
                          ))}
                        {t.resolutionNotes && (
                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Admin Resolution Note / সমাধান উত্তর:</span>
                            </div>
                            <p className="text-[11px] leading-relaxed whitespace-pre-wrap font-medium">
                              {t.resolutionNotes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>
                            Submitted:{' '}
                            {t.createdAt
                              ? new Date(t.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
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
      </div>
    </div>
  );
};
