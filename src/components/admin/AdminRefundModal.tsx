import React, { useState, useId } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  Zap,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/services/api';
import type { AdminPaymentRow, ProcessRefundRequest } from '@/types';
import { cn } from '@/lib/utils';

interface AdminRefundModalProps {
  payment: AdminPaymentRow | null;
  isOpen: boolean;
  onClose: () => void;
  onRefundSuccess: (updatedPayment: AdminPaymentRow) => void;
}

const PRESET_REASONS = [
  'Accidental duplicate / double payment',
  'Student requested cancellation within refund window (7 days)',
  'Wrong exam package / plan selected by student',
  'Technical issue during payment checkout',
  'Customer satisfaction / goodwill resolution',
  'Other reason',
];

export const AdminRefundModal: React.FC<AdminRefundModalProps> = ({
  payment,
  isOpen,
  onClose,
  onRefundSuccess,
}) => {
  const reasonSelectId = useId();
  const notesTextareaId = useId();
  const customReasonInputId = useId();
  const refundAmountInputId = useId();
  const refundReferenceInputId = useId();

  if (!isOpen || !payment) return null;

  const originalAmount = Number(payment.amount || 0);
  const razorpayPaymentId = payment.razorpayPaymentId || payment.transactionId;
  const hasRazorpayId = Boolean(razorpayPaymentId && razorpayPaymentId.startsWith('pay_'));

  const [refundAmount, setRefundAmount] = useState<string>(String(originalAmount));
  const [refundMode, setRefundMode] = useState<'gateway' | 'manual'>(
    hasRazorpayId ? 'gateway' : 'manual'
  );
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [revokeSubscription, setRevokeSubscription] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const numericRefund = Number(refundAmount);
  const isValidAmount =
    !isNaN(numericRefund) && numericRefund > 0 && numericRefund <= originalAmount;
  const isPartial = numericRefund < originalAmount;
  const retainedAmount = Math.max(0, originalAmount - (isValidAmount ? numericRefund : 0));

  const handleQuickPercent = (percent: number) => {
    const val = (originalAmount * percent) / 100;
    setRefundAmount(String(Math.round(val * 100) / 100));
  };

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidAmount) {
      setErrorMessage(`Please enter a valid refund amount between ₹1 and ₹${originalAmount.toLocaleString('en-IN')}.`);
      return;
    }

    const finalReason =
      selectedReason === 'Other reason'
        ? customReason.trim() || 'Other reason'
        : selectedReason;

    setIsSubmitting(true);

    try {
      const payload: ProcessRefundRequest = {
        paymentId: payment.id,
        refundAmount: numericRefund,
        refundReason: finalReason,
        refundMode,
        refundId: referenceId.trim() || undefined,
        revokeSubscription,
        notes: adminNotes.trim() || undefined,
      };

      const result = await api.processPaymentRefund(payload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to process refund');
      }

      const updatedPaymentRow: AdminPaymentRow = {
        ...payment,
        status: 'refunded',
        refundAmount: numericRefund,
        refundId: result.refundId || referenceId.trim() || `rfnd_${Date.now()}`,
        refundReason: finalReason,
        refundedAt: new Date().toISOString(),
      };

      onRefundSuccess(updatedPaymentRow);
      onClose();
    } catch (err: any) {
      console.error('Refund processing error:', err);
      setErrorMessage(err.message || 'Refund processing failed. Please check parameters.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B132B] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080E21]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Process Payment Refund</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  {isPartial ? 'Partial Refund' : 'Full Refund'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authoritative transaction refund and student subscription cancellation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Target Payment Card */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {payment.studentName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {payment.studentEmail}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {payment.planTitle || 'Pro Pass'}
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  ₹{originalAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 font-medium">Gateway:</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  {payment.gateway || 'Razorpay'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Payment ID:</span>
                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                  <span className="truncate max-w-[100px]">{payment.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(payment.id)}
                    className="text-slate-400 hover:text-slate-600"
                    title="Copy Payment ID"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {payment.razorpayPaymentId && (
                <div>
                  <span className="text-slate-400 font-medium">Razorpay ID:</span>
                  <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                    {payment.razorpayPaymentId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Refund Amount Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor={refundAmountInputId} className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Refund Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[100, 75, 50, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors border',
                      Math.abs(numericRefund - (originalAmount * pct) / 100) < 0.01
                        ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {pct === 100 ? 'Full (100%)' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₹
              </span>
              <input
                id={refundAmountInputId}
                type="number"
                step="0.01"
                min="0.01"
                max={originalAmount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {isValidAmount && (
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-0.5">
                <span>
                  Refund: <strong className="text-rose-600 dark:text-rose-400">₹{numericRefund.toLocaleString('en-IN')}</strong>
                </span>
                <span>
                  Retained Revenue: <strong className="text-slate-700 dark:text-slate-300">₹{retainedAmount.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Refund Processing Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Processing Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRefundMode('gateway')}
                disabled={!hasRazorpayId}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between',
                  refundMode === 'gateway'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300',
                  !hasRazorpayId && 'opacity-60 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <span>Razorpay API Auto-Refund</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Direct instant gateway refund credited back to student's original payment method.
                </p>
                {!hasRazorpayId && (
                  <span className="text-[10px] text-amber-600 font-semibold mt-1">
                    (Requires Razorpay `pay_...` ID)
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRefundMode('manual')}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between',
                  refundMode === 'manual'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                )}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Record Manual / Dashboard Refund</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  For refunds executed directly in Razorpay Dashboard, UPI, or bank transfer.
                </p>
              </button>
            </div>
          </div>

          {/* Reference ID (for manual mode or reference tracking) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={refundReferenceInputId} className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Refund Reference ID
              </label>
              <span className="text-[11px] text-slate-400">
                {refundMode === 'manual' ? 'Optional (e.g. rfnd_... or Bank UTR)' : 'Auto-generated by Razorpay'}
              </span>
            </div>
            <input
              id={refundReferenceInputId}
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder={refundMode === 'manual' ? 'rfnd_123456789 or UPI-UTR-...' : 'Will be returned by Razorpay API'}
              disabled={refundMode === 'gateway'}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-70"
            />
          </div>

          {/* Reason Selector */}
          <div className="space-y-1.5">
            <label htmlFor={reasonSelectId} className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Refund Reason <span className="text-rose-500">*</span>
            </label>
            <select
              id={reasonSelectId}
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === 'Other reason' && (
            <div className="space-y-1.5">
              <label htmlFor={customReasonInputId} className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Specific Reason Description
              </label>
              <input
                id={customReasonInputId}
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="State specific reason for audit log..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-1.5">
            <label htmlFor={notesTextareaId} className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Admin Audit Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id={notesTextareaId}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Internal justification notes for administrative audit log..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Revoke Pro Subscription Warning Box */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeSubscription}
                onChange={(e) => setRevokeSubscription(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Auto-Revoke Student Pro Subscription
                </span>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                  Immediately demotes student account to <strong>Free Tier</strong> and cancels active subscription validity.
                </p>
              </div>
            </label>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-bold">Refund Error</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isValidAmount}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Refund...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm & Issue ₹{numericRefund > 0 ? numericRefund.toLocaleString('en-IN') : '0'} Refund
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
