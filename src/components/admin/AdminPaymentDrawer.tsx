import React, { useState } from 'react';
import {
  X,
  Receipt,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  CreditCard,
  User,
  Calendar,
  Shield,
} from 'lucide-react';
import type { AdminPaymentRow } from '@/types';
import { cn } from '@/lib/utils';

interface AdminPaymentDrawerProps {
  payment: AdminPaymentRow | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRefundModal: (payment: AdminPaymentRow) => void;
}

export const AdminPaymentDrawer: React.FC<AdminPaymentDrawerProps> = ({
  payment,
  isOpen,
  onClose,
  onOpenRefundModal,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !payment) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isRefunded = payment.status === 'refunded';
  const isCompleted = payment.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0B132B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080E21]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
                  isRefunded
                    ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                {isRefunded ? <RotateCcw className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Transaction Details
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {payment.id.slice(0, 18)}...
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            {/* Status & Amount Highlight */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Total Charged</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {payment.currency || 'INR'}
                  </span>
                </div>
              </div>

              <div>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Successful</span>
                  </span>
                )}
                {isRefunded && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refunded</span>
                  </span>
                )}
                {payment.status === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </span>
                )}
                {payment.status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Failed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Refund Information Banner (if refunded) */}
            {isRefunded && (
              <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/70 dark:bg-purple-950/30 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Refund Record
                  </span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    -₹{(payment.refundAmount ?? payment.amount).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] pt-1 border-t border-purple-200/60 dark:border-purple-800/60">
                  {payment.refundId && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Refund ID:</span>
                      <div className="flex items-center gap-1 font-mono text-purple-800 dark:text-purple-200 font-semibold">
                        <span>{payment.refundId}</span>
                        <button
                          onClick={() => handleCopy(payment.refundId!, 'rfnd')}
                          className="hover:text-purple-600"
                        >
                          {copiedKey === 'rfnd' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {payment.refundReason && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">Reason:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium text-right">
                        {payment.refundReason}
                      </span>
                    </div>
                  )}

                  {payment.refundedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Refunded On:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {new Date(payment.refundedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student Details */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Student Aspirant
              </h4>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {payment.studentName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {payment.studentEmail}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">User ID</span>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                    <span className="truncate max-w-[150px]">{payment.userId}</span>
                    <button
                      onClick={() => handleCopy(payment.userId, 'uid')}
                      className="hover:text-slate-800"
                    >
                      {copiedKey === 'uid' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription & Plan */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Plan & Item Details
              </h4>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Purchased Plan</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {payment.planTitle || 'Pro Pass'}
                  </span>
                </div>
                {payment.planId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Plan ID</span>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
                      {payment.planId}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payment Gateway</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {payment.gateway || 'Razorpay'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gateway Identifiers */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Payment Gateway Identifiers
              </h4>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Payment ID:</span>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <span>{payment.id}</span>
                    <button
                      onClick={() => handleCopy(payment.id, 'pid')}
                      className="hover:text-blue-600"
                    >
                      {copiedKey === 'pid' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {payment.razorpayPaymentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Razorpay Pay ID:</span>
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                      <span>{payment.razorpayPaymentId}</span>
                      <button
                        onClick={() => handleCopy(payment.razorpayPaymentId!, 'rzpid')}
                        className="hover:text-indigo-700"
                      >
                        {copiedKey === 'rzpid' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {(payment.razorpayOrderId || payment.orderId) && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Order ID:</span>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span>{payment.razorpayOrderId || payment.orderId}</span>
                      <button
                        onClick={() => handleCopy((payment.razorpayOrderId || payment.orderId)!, 'oid')}
                        className="hover:text-blue-600"
                      >
                        {copiedKey === 'oid' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Audit Timestamps
              </h4>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Payment Created</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(payment.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080E21]/60 flex items-center justify-between gap-3">
            {isCompleted ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRefundModal(payment);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Issue / Record Refund</span>
              </button>
            ) : isRefunded ? (
              <div className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>Refund Already Settled</span>
              </div>
            ) : (
              <div className="w-full text-center text-xs text-slate-400 py-1 font-medium">
                Payment status is "{payment.status}" (refund not applicable)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
