import { csvCell } from '@/utils/csvExport';
import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  CreditCard,
  Crown,
  Ban,
  Calendar,
  Check,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminMoneyChart } from '@/components/admin/AdminMoneyChart';
import { getKolkataDateString } from '@/services/domains/admin.dashboard';
import {
  paymentRange,
  paymentInRange,
  paymentChart,
  retainedPaymentAmount,
  recordedRefundAmount,
  cashFlowChart,
  refundInCashFlowRange,
} from '@/utils/adminPaymentReporting';
import { api } from '@/services/api';
import { AdminRefundModal } from '@/components/admin/AdminRefundModal';
import type { AdminPaymentRow } from '@/types';
import {
  getAdminPaymentDisplayStatus,
  getAdminSubscriptionDisplay,
  type AdminPaymentDisplayStatus,
} from '@/utils/adminFinancialDisplay';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface PaymentItem {
  id: number | string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  plan: string;
  planDuration: string;
  planBadgeClass: string;
  amount: number;
  paymentMethod: 'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card' | '—';
  transactionId: string;
  date: string;
  time: string;
  status: AdminPaymentDisplayStatus;
  sourcePayment: AdminPaymentRow;
  statusBadgeClass: string;
  gatewayOrderId?: string;
  paymentId?: string;
  bankReference?: string;
  subscriptionValidTill?: string;
  subscriptionDaysLeft?: number;
  subscriptionActive?: boolean;
}

// Payment Gateway Logo helper
const PaymentMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  if (method === 'Razorpay') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#0C2340] text-blue-400 rounded flex items-center justify-center font-black text-[9px]">
          P
        </div>
        <span className="text-xs text-slate-700 font-medium">Razorpay</span>
      </div>
    );
  }
  if (method === 'UPI') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#0F766E] text-white rounded flex items-center justify-center font-bold text-[8px]">
          ▲
        </div>
        <span className="text-xs text-slate-700 font-medium">UPI</span>
      </div>
    );
  }
  if (method === 'PhonePe') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-[#6739B7] text-white rounded-full flex items-center justify-center font-bold text-[9px]">
          পে
        </div>
        <span className="text-xs text-slate-700 font-medium">PhonePe</span>
      </div>
    );
  }
  if (method === 'Credit Card') {
    return (
      <div className="flex items-center gap-1.5">
        <CreditCard className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-700 font-medium">Credit Card</span>
      </div>
    );
  }
  return <span className="text-xs text-slate-400 font-medium">—</span>;
};

// Payment Receipt Document Generator
function downloadReceiptDocument(payment: PaymentItem) {
  const escapeHtml = (str: string | undefined | null) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${escapeHtml(payment.transactionId)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.5; }
    .header { border-bottom: 2px solid #026bfc; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-refunded { background: #fee2e2; color: #b91c1c; }
    .badge-other { background: #f1f5f9; color: #475569; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
    .table { width: 100%; border-collapse: collapse; }
    .table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .table td.label { color: #64748b; width: 40%; }
    .table td.value { font-weight: 500; text-align: right; }
    .amount-row td { font-size: 18px; font-weight: bold; color: #026bfc; border-top: 2px solid #e2e8f0; border-bottom: none; padding-top: 14px; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">PracticeKoro</div>
      <div style="font-size: 13px; color: #64748b;">Payment Receipt &amp; Transaction Summary</div>
    </div>
    <span class="badge ${payment.status === 'Success' ? 'badge-success' : payment.status === 'Refunded' ? 'badge-refunded' : 'badge-other'}">
      ${escapeHtml(payment.status)}
    </span>
  </div>
  <div class="section">
    <div class="section-title">Student Information</div>
    <table class="table">
      <tr><td class="label">Student Name</td><td class="value">${escapeHtml(payment.studentName)}</td></tr>
      <tr><td class="label">Email Address</td><td class="value">${escapeHtml(payment.studentEmail)}</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Transaction Details</div>
    <table class="table">
      <tr><td class="label">Transaction ID</td><td class="value" style="font-family: monospace;">${escapeHtml(payment.transactionId)}</td></tr>
      ${payment.gatewayOrderId ? `<tr><td class="label">Order ID</td><td class="value" style="font-family: monospace;">${escapeHtml(payment.gatewayOrderId)}</td></tr>` : ''}
      <tr><td class="label">Payment Date</td><td class="value">${escapeHtml(payment.date)} ${escapeHtml(payment.time)}</td></tr>
      <tr><td class="label">Payment Gateway</td><td class="value">${escapeHtml(payment.paymentMethod)}</td></tr>
      <tr><td class="label">Subscription Plan</td><td class="value">${escapeHtml(payment.plan)}</td></tr>
      ${payment.subscriptionValidTill ? `<tr><td class="label">Valid Till</td><td class="value">${escapeHtml(payment.subscriptionValidTill)}</td></tr>` : ''}
      <tr class="amount-row"><td class="label">Total Amount</td><td class="value">₹${payment.amount} INR</td></tr>
    </table>
  </div>
  <div class="footer">
    This document serves as an administrative payment confirmation and transaction summary for PracticeKoro services.
  </div>
</body>
</html>`;

  const blob = new Blob([receiptHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt_${payment.transactionId || 'payment'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// MAIN COMPONENT: ADMIN PAYMENTS
// ============================================================================

export const AdminPayments: React.FC = () => {
  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<number | string>('');
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(false);

  // Load real payments from database on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getAllAdminPayments()
      .then((remote) => {
        if (!isMounted) return;
        setRecordsLoading(false);
        if (!remote || remote.length === 0) {
          setPaymentsList([]);
          setSelectedRowId('');
          return;
        }
        const mapped: PaymentItem[] = remote.map((d) => {
          const dDate = new Date(d.createdAt || Date.now());
          const dateStr = dDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const timeStr = dDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          const { status: displayStatus, badgeClass: statusBadge } =
            getAdminPaymentDisplayStatus(d);
          const subscription = getAdminSubscriptionDisplay(d);

          let method: 'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card' | '—' = '—';
          if (d.gateway === 'razorpay') method = 'Razorpay';
          else if (d.gateway === 'credit_card') method = 'Credit Card';
          else if (d.gateway === 'phonepe') method = 'PhonePe';
          else if (d.gateway === 'upi') method = 'UPI';

          return {
            id: d.id,
            studentName: d.studentName || 'Student Aspirant',
            studentEmail: d.studentEmail || '',
            avatarType: 'initials',
            avatarInitials: (d.studentName || 'Student')
              .split(/\s+/)
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase(),
            avatarBgColor: 'bg-blue-100',
            avatarTextColor: 'text-blue-700',
            plan: d.planTitle || 'Plan unavailable',
            planDuration: `${d.planTitle || 'Plan unavailable'}`,
            planBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
            amount: d.amount,
            paymentMethod: method,
            transactionId: d.transactionId || d.razorpayPaymentId || 'Unavailable',
            date: dateStr,
            time: timeStr,
            status: displayStatus,
            sourcePayment: d,
            statusBadgeClass: statusBadge,
            gatewayOrderId: d.orderId || d.razorpayOrderId,
            paymentId: d.razorpayPaymentId || d.transactionId,
            bankReference: d.transactionId,
            subscriptionValidTill: subscription.validTill,
            subscriptionDaysLeft: subscription.daysRemaining,
            subscriptionActive: subscription.active,
          };
        });
        setPaymentsList(mapped);
        setSelectedRowId((prev) => {
          if (!prev) return '';
          return mapped.some((m) => m.id === prev) ? prev : '';
        });
      })
      .catch((err) => {
        console.warn('Failed to load admin payments from database:', err);
        if (isMounted) {
          setRecordsLoading(false);
          setRecordsError(
            'Payments could not be fully loaded. Totals and exports are unavailable; please refresh.'
          );
        }
        if (isMounted) setPaymentsList([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Checkbox selection state
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<(number | string)[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [filterMethod, setFilterMethod] = useState('All Payment Gateways');

  // Time range selector
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [attributionMode, setAttributionMode] = useState<'accrual' | 'cashflow'>('accrual');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [refundModalPayment, setRefundModalPayment] = useState<AdminPaymentRow | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  // Selected payment record
  const selectedPayment = useMemo(() => {
    if (!selectedRowId) return null;
    return paymentsList.find((p) => p.id === selectedRowId) || null;
  }, [paymentsList, selectedRowId]);

  const range = useMemo(() => paymentRange(timeRange), [timeRange]);
  const periodPayments = useMemo(
    () => paymentsList.filter((p) => paymentInRange(p.sourcePayment, range)),
    [paymentsList, range]
  );
  const chartPoints = useMemo(
    () =>
      attributionMode === 'cashflow'
        ? cashFlowChart(
            paymentsList.map((p) => p.sourcePayment),
            range
          )
        : paymentChart(
            periodPayments.map((p) => p.sourcePayment),
            range
          ),
    [attributionMode, paymentsList, periodPayments, range]
  );

  const cashFlowStats = useMemo(() => {
    const grossInflow = periodPayments
      .filter((p) => p.status === 'Success' || p.status === 'Refunded')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const periodDisbursedRefunds = paymentsList.filter((p) =>
      refundInCashFlowRange(p.sourcePayment, range)
    );
    const refundOutflow = periodDisbursedRefunds.reduce(
      (sum, p) => sum + recordedRefundAmount(p.sourcePayment),
      0
    );

    const netCashFlow = grossInflow - refundOutflow;
    return {
      grossInflow,
      refundOutflow,
      netCashFlow,
      refundCount: periodDisbursedRefunds.length,
    };
  }, [paymentsList, periodPayments, range]);
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCheckboxes([]);
  }, [timeRange]);
  // Computed summary metrics
  const totalRevenue = useMemo(() => {
    return periodPayments
      .filter((p) => p.status === 'Success')
      .reduce((sum, p) => sum + retainedPaymentAmount(p.sourcePayment), 0);
  }, [periodPayments]);

  const totalPayments = periodPayments.length;

  const successfulPayments = useMemo(() => {
    return periodPayments.filter((p) => p.status === 'Success').length;
  }, [periodPayments]);

  const failedPayments = useMemo(() => {
    return periodPayments.filter((p) => p.status === 'Failed').length;
  }, [periodPayments]);

  const refundedPayments = useMemo(() => {
    return periodPayments.filter((p) => p.status === 'Refunded').length;
  }, [periodPayments]);

  const successRate =
    totalPayments > 0 ? `${Math.round((successfulPayments / totalPayments) * 100)}%` : '0%';

  const methodStats = useMemo(() => {
    const total = totalRevenue || 1;
    const calc = (m: string) => {
      const items = periodPayments.filter((p) => p.paymentMethod === m && p.status === 'Success');
      const sum = items.reduce((acc, p) => acc + retainedPaymentAmount(p.sourcePayment), 0);
      const pct = totalRevenue > 0 ? Math.round((sum / total) * 100) : 0;
      return { sum, pct };
    };
    return {
      upi: calc('UPI'),
      razorpay: calc('Razorpay'),
      phonepe: calc('PhonePe'),
      card: calc('Credit Card'),
      other: {
        sum: periodPayments
          .filter(
            (p) =>
              !['UPI', 'Razorpay', 'PhonePe', 'Credit Card'].includes(p.paymentMethod) &&
              p.status === 'Success'
          )
          .reduce((acc, p) => acc + retainedPaymentAmount(p.sourcePayment), 0),
        pct:
          totalRevenue > 0
            ? Math.round(
                (periodPayments
                  .filter(
                    (p) => !['UPI', 'Razorpay', 'PhonePe', 'Credit Card'].includes(p.paymentMethod)
                  )
                  .reduce((sum, p) => sum + retainedPaymentAmount(p.sourcePayment), 0) /
                  totalRevenue) *
                  100
              )
            : 0,
      },
    };
  }, [periodPayments, totalRevenue]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return periodPayments.filter((item) => {
      if (filterStatus !== 'All Status' && item.status !== filterStatus) return false;
      if (filterPlan !== 'All Plans' && !item.plan.includes(filterPlan.replace(' Plans', '')))
        return false;
      if (filterMethod !== 'All Payment Gateways' && item.paymentMethod !== filterMethod)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.studentName.toLowerCase().includes(q) ||
          item.studentEmail.toLowerCase().includes(q) ||
          item.transactionId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [periodPayments, filterStatus, filterPlan, filterMethod, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCheckboxes([]);
  }, [searchQuery, filterStatus, filterPlan, filterMethod, rowsPerPage]);
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  // Handle Select All Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCheckboxes(filteredRows.map((r) => r.id));
    } else {
      setSelectedCheckboxes([]);
    }
  };

  const handleToggleRowCheckbox = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export CSV
  const handleExportPayments = () => {
    if (recordsLoading || recordsError) return;
    const headers = [
      'Transaction ID',
      'Student Name',
      'Student Email',
      'Plan',
      'Amount',
      'Payment Gateway',
      'Date',
      'Status',
      'Gateway Order ID',
      'Bank Reference',
    ];
    const rows = filteredRows.map((p) => [
      p.transactionId,
      p.studentName,
      p.studentEmail,
      p.plan,
      p.amount,
      p.paymentMethod,
      `${p.date} ${p.time}`,
      p.status,
      p.gatewayOrderId || 'N/A',
      p.bankReference || 'N/A',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');
    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment records exported to CSV successfully.');
  };

  // Download Payment Receipt / Transaction Summary
  const handleDownloadInvoice = () => {
    if (!selectedPayment) return;
    downloadReceiptDocument(selectedPayment);
    showToast(`Payment receipt downloaded for ${selectedPayment.transactionId}`);
  };

  // Send Receipt Action (download receipt and clarify email availability)
  const handleSendReceipt = () => {
    if (!selectedPayment) return;
    downloadReceiptDocument(selectedPayment);
    showToast(`Receipt downloaded for ${selectedPayment.transactionId}. No email was sent.`);
  };

  // Open Refund Dialog
  const handleOpenRefund = (payment: PaymentItem) => {
    if (payment.status !== 'Success') return;
    setRefundModalPayment(payment.sourcePayment);
    setIsRefundModalOpen(true);
  };

  // Revoke only the linked subscription; do not change settled payment history.
  const handleCancelPayment = async () => {
    if (!selectedPayment || isCancellingSubscription) return;
    const target = selectedPayment;
    const subscriptionId = target.sourcePayment.subscriptionId;
    if (!subscriptionId || target.subscriptionActive !== true) {
      showToast('No active linked subscription is available to cancel.', 'error');
      return;
    }
    if (!window.confirm(`Cancel subscription and revoke plan access for ${target.studentName}?`))
      return;

    setIsCancellingSubscription(true);
    try {
      const result = await api.cancelSubscription(subscriptionId);
      if (!result.success) {
        showToast(result.error || 'Could not cancel the subscription.', 'error');
        return;
      }
      setPaymentsList((prev) =>
        prev.map((p) => {
          if (p.sourcePayment.subscriptionId !== subscriptionId) return p;
          const sourcePayment: AdminPaymentRow = {
            ...p.sourcePayment,
            subscriptionStatus: 'cancelled',
            subscriptionExpiresAt: result.expiresAt || p.sourcePayment.subscriptionExpiresAt,
          };
          const subscription = getAdminSubscriptionDisplay(sourcePayment);
          return {
            ...p,
            sourcePayment,
            subscriptionActive: false,
            subscriptionValidTill: subscription.validTill,
            subscriptionDaysLeft: 0,
          };
        })
      );
      showToast(`Subscription cancelled for ${target.studentName}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not cancel the subscription.', 'error');
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  return withAdminSkeleton(
    recordsLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {recordsError && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {recordsError}
        </div>
      )}
      {recordsLoading && (
        <div role="status" className="text-sm text-slate-500">
          Loading all records…
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastType === 'error' ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200"
        >
          {toastType === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            View and manage all payment transactions, refunds and subscription purchases.
          </p>
        </div>

        <button
          disabled={recordsLoading || !!recordsError}
          onClick={handleExportPayments}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors self-start shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Payments</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {!recordsLoading && !recordsError && (
        <>
          {/* 2. FIVE SUMMARY METRICS CARDS                                       */}
          {/* ==================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Retained Revenue */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg shrink-0">
                ₹
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Retained Revenue
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 leading-tight">
                    ₹{totalRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                  {timeRange}
                </span>
              </div>
            </div>

            {/* Card 2: Total Payments */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 block">Total Payments</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 leading-tight">
                    {totalPayments.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                  {timeRange}
                </span>
              </div>
            </div>

            {/* Card 3: Successful */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 block">Successful</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 leading-tight">
                    {successfulPayments.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {successRate}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                  success rate
                </span>
              </div>
            </div>

            {/* Card 4: Failed */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 block">Failed</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 leading-tight">
                    {failedPayments.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                  {timeRange}
                </span>
              </div>
            </div>

            {/* Card 5: Refunded */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 block">Refunded</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-slate-900 leading-tight">
                    {refundedPayments.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                  {timeRange}
                </span>
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* 3. CHARTS ROW (Revenue Trend & Payment Gateways)                      */}
          {/* ==================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: Revenue Trend */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-bold text-slate-900">Revenue Trend</h2>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span>Retained revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
                    <span>Refunded</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
                    <button
                      type="button"
                      aria-label="Accrual attribution mode"
                      onClick={() => setAttributionMode('accrual')}
                      className={cn(
                        'px-2 py-1 rounded-md font-medium transition-colors cursor-pointer',
                        attributionMode === 'accrual'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      )}
                    >
                      Payment Date (Accrual)
                    </button>
                    <button
                      type="button"
                      aria-label="Cash flow attribution mode"
                      onClick={() => setAttributionMode('cashflow')}
                      className={cn(
                        'px-2 py-1 rounded-md font-medium transition-colors cursor-pointer',
                        attributionMode === 'cashflow'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      )}
                    >
                      Refund Date (Cash Flow)
                    </button>
                  </div>

                  {/* Time Filter */}
                  <div className="relative">
                    <select
                      aria-label="Payment reporting period"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="Last 90 Days">Last 90 Days</option>
                      <option value="This Year">This Year</option>
                      <option value="All Time">All Time</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-slate-500">
                  {getKolkataDateString(new Date(range.startIso))} to{' '}
                  {getKolkataDateString(new Date(range.endIso))} · Asia/Kolkata.{' '}
                  {attributionMode === 'accrual'
                    ? 'Refunds are attributed to the original payment date, not refund cash-flow date.'
                    : `Cash flow mode: Refunds are attributed to actual refund settlement date (${cashFlowStats.refundCount} refund${cashFlowStats.refundCount === 1 ? '' : 's'} totalling ₹${cashFlowStats.refundOutflow.toLocaleString('en-IN')}).`}
                </p>
                {attributionMode === 'cashflow' && (
                  <div className="mt-2.5 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Gross Inflow:</span>{' '}
                      <span className="font-semibold text-slate-800">
                        ₹{cashFlowStats.grossInflow.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Disbursed Refunds:</span>{' '}
                      <span className="font-semibold text-rose-600">
                        -₹{cashFlowStats.refundOutflow.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Net Cash Flow:</span>{' '}
                      <span className="font-bold text-emerald-700">
                        ₹{cashFlowStats.netCashFlow.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <AdminMoneyChart points={chartPoints} />
            </div>

            {/* Right: Payment Gateways Donut */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Payment Gateways</h2>

              <div className="flex items-center gap-4 py-2">
                {/* SVG Donut Chart with center text */}
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return [
                        { ...methodStats.upi, color: '#0284C7' },
                        { ...methodStats.razorpay, color: '#06B6D4' },
                        { ...methodStats.phonepe, color: '#A855F7' },
                        { ...methodStats.card, color: '#F59E0B' },
                        { ...methodStats.other, color: '#64748B' },
                      ].map((method, i) => {
                        const circumference = 2 * Math.PI * 38;
                        const length =
                          totalRevenue > 0 ? (method.sum / totalRevenue) * circumference : 0;
                        const previousOffset = offset;
                        offset += length;
                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={method.color}
                            strokeWidth="16"
                            strokeDasharray={`${length} ${circumference - length}`}
                            strokeDashoffset={-previousOffset}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Donut Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      ₹{totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-normal">Retained Revenue</span>
                  </div>
                </div>

                {/* Methods Legend List */}
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#0284C7] shrink-0" />
                      <span className="text-slate-700 font-medium truncate">UPI</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{methodStats.upi.pct}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{methodStats.upi.sum.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4] shrink-0" />
                      <span className="text-slate-700 font-medium truncate">Razorpay</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{methodStats.razorpay.pct}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{methodStats.razorpay.sum.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#A855F7] shrink-0" />
                      <span className="text-slate-700 font-medium truncate">PhonePe</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{methodStats.phonepe.pct}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{methodStats.phonepe.sum.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                      <span className="text-slate-700 font-medium truncate">Credit/Debit Card</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{methodStats.card.pct}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{methodStats.card.sum.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#64748B] shrink-0" />
                      <span className="text-slate-700 font-medium truncate">Other</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{methodStats.other.pct}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{methodStats.other.sum.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
        </>
      )}
      {/* 4. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, transaction ID..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* All Status */}
        <div className="relative min-w-[120px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All Status">All Status</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
            <option value="Unknown">Unknown</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Plans */}
        <div className="relative min-w-[120px]">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All Plans">All Plans</option>
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Year">1 Year</option>
            <option value="Free Plan">Free Plan</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Payment Gateways */}
        <div className="relative min-w-[160px]">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All Payment Gateways">All Payment Gateways</option>
            <option value="UPI">UPI</option>
            <option value="Razorpay">Razorpay</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Credit Card">Credit Card</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeRange} · Asia/Kolkata</span>
        </div>

        {/* Filter and Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentPage(1);
              setSelectedCheckboxes([]);
            }}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('All Status');
              setFilterPlan('All Plans');
              setFilterMethod('All Payment Gateways');
              showToast('Filters reset to default view.');
            }}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2.5 py-2 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. SPLIT GRID LAYOUT (TABLE + RIGHT DETAILS PANEL)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PAYMENTS TABLE */}
        <div
          className={cn(
            'transition-all duration-300 space-y-4',
            isDetailsPanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          )}
        >
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table aria-label="Payment records" className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedCheckboxes.length > 0 &&
                          selectedCheckboxes.length === filteredRows.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-8 text-center">#</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment Gateway</th>
                    <th className="py-3 px-3">Transaction ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.slice(0, 10).map((row, idx) => {
                      const isSelected = Boolean(isDetailsPanelOpen && selectedRowId === row.id);
                      const isChecked = selectedCheckboxes.includes(row.id);
                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedRowId(row.id);
                            setIsDetailsPanelOpen(true);
                          }}
                          className={cn(
                            'transition-colors cursor-pointer group',
                            isSelected
                              ? 'bg-blue-50/50 hover:bg-blue-50/70'
                              : 'hover:bg-slate-50/60'
                          )}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => handleToggleRowCheckbox(row.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* # */}
                          <td className="py-3 px-2 text-center text-slate-500 font-normal">
                            {idx + 1}
                          </td>

                          {/* Student */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {row.avatarType === 'photo' && row.avatarSrc ? (
                                <img
                                  src={row.avatarSrc}
                                  alt={row.studentName}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                                    row.avatarBgColor || 'bg-blue-100',
                                    row.avatarTextColor || 'text-blue-600'
                                  )}
                                >
                                  {row.avatarInitials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 block truncate">
                                  {row.studentName}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {row.studentEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium',
                                row.planBadgeClass
                              )}
                            >
                              {row.plan}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3 font-semibold text-slate-800">₹{row.amount}</td>

                          {/* Payment Gateway */}
                          <td className="py-3 px-3">
                            <PaymentMethodBadge method={row.paymentMethod} />
                          </td>

                          {/* Transaction ID */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {row.transactionId}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3">
                            <span className="text-slate-700 block font-normal">{row.date}</span>
                            <span className="text-[11px] text-slate-400 block">{row.time}</span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium',
                                row.statusBadgeClass
                              )}
                            >
                              {row.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3 px-3 text-center relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === row.id ? null : row.id);
                                }}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {activeMenuId === row.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    onClick={() => {
                                      setSelectedRowId(row.id);
                                      setIsDetailsPanelOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    disabled={row.status !== 'Success'}
                                    onClick={() => {
                                      handleOpenRefund(row);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Refund Payment
                                  </button>
                                  <button
                                    onClick={() => {
                                      downloadReceiptDocument(row);
                                      showToast(
                                        `Payment receipt downloaded for ${row.transactionId}`
                                      );
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                                  >
                                    Download Receipt
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                Showing {filteredRows.length === 0 ? 0 : 1}–{Math.min(filteredRows.length, 10)} of{' '}
                {filteredRows.length.toLocaleString('en-IN')} payments
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from(
                  { length: Math.min(5, pageCount) },
                  (_, i) => Math.max(1, Math.min(currentPage - 2, pageCount - 4)) + i
                ).map((page) => (
                  <button
                    key={page}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-7 h-7 rounded-lg',
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  aria-label="Next page"
                  disabled={currentPage >= pageCount}
                  onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="relative ml-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="appearance-none border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 bg-white pr-6 cursor-pointer focus:outline-none"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PAYMENT DETAILS PANEL */}
        {isDetailsPanelOpen && selectedPayment && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Payment Details</h2>
              <button
                onClick={() => {
                  setIsDetailsPanelOpen(false);
                  setSelectedRowId('');
                }}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Profile Card */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedPayment.avatarType === 'photo' && selectedPayment.avatarSrc ? (
                  <img
                    src={selectedPayment.avatarSrc}
                    alt={selectedPayment.studentName}
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-blue-100"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-blue-100',
                      selectedPayment.avatarBgColor || 'bg-blue-100',
                      selectedPayment.avatarTextColor || 'text-blue-600'
                    )}
                  >
                    {selectedPayment.avatarInitials}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedPayment.studentName}
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    {selectedPayment.studentEmail}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {selectedPayment.studentPhone || 'Unavailable'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => showToast(`Opening profile for ${selectedPayment.studentName}...`)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 cursor-pointer"
              >
                View Student
              </button>
            </div>

            {/* Key-Value Breakdown List */}
            <div className="space-y-2.5 text-xs pt-1 border-t border-slate-100">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Transaction ID</span>
                <span className="font-mono text-slate-700">{selectedPayment.transactionId}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Payment Gateway</span>
                <span className="font-medium text-slate-800">{selectedPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Status</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-medium',
                    selectedPayment.statusBadgeClass
                  )}
                >
                  {selectedPayment.status}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Plan Name</span>
                <span className="font-medium text-slate-800">{selectedPayment.planDuration}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Amount</span>
                <span className="font-bold text-slate-900">₹{selectedPayment.amount}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Paid On</span>
                <span className="font-medium text-slate-800">
                  {selectedPayment.date}, {selectedPayment.time}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Payment Gateway</span>
                <span className="font-medium text-slate-800">
                  {selectedPayment.paymentMethod === 'Razorpay' ? 'Razorpay' : 'PhonePe / UPI'}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Gateway Order ID</span>
                <span className="font-mono text-slate-700">
                  {selectedPayment.gatewayOrderId || '—'}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Payment ID</span>
                <span className="font-mono text-slate-700">
                  {selectedPayment.paymentId || selectedPayment.transactionId}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400 font-normal">Bank Reference</span>
                <span className="font-mono text-slate-700">
                  {selectedPayment.bankReference || '—'}
                </span>
              </div>
              <div className="flex justify-between py-0.5 items-center">
                <span className="text-slate-400 font-normal">Receipt</span>
                <button
                  onClick={handleDownloadInvoice}
                  className="text-[#2563EB] hover:underline flex items-center gap-1 font-semibold text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Receipt</span>
                </button>
              </div>
            </div>

            {/* Subscription Status Green Box */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Subscription Status</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      {selectedPayment.subscriptionActive == null
                        ? 'Unavailable'
                        : selectedPayment.subscriptionActive
                          ? 'Active'
                          : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {selectedPayment.subscriptionValidTill
                      ? `Valid till ${selectedPayment.subscriptionValidTill} (${selectedPayment.subscriptionDaysLeft ?? 0} days left)`
                      : 'Subscription details unavailable'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => showToast('Managing subscription plan settings...')}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 font-medium shrink-0 cursor-pointer shadow-2xs"
              >
                Manage
              </button>
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleSendReceipt}
                className="border border-blue-200 text-[#2563EB] hover:bg-blue-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Receipt</span>
              </button>

              <button
                onClick={() => handleOpenRefund(selectedPayment)}
                disabled={selectedPayment.status !== 'Success'}
                className="border border-amber-200 text-amber-700 hover:bg-amber-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refund Payment</span>
              </button>

              <button
                onClick={handleCancelPayment}
                disabled={
                  isCancellingSubscription ||
                  selectedPayment.subscriptionActive !== true ||
                  !selectedPayment.sourcePayment.subscriptionId
                }
                className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isCancellingSubscription ? 'Cancelling…' : 'Cancel Subscription'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. ADMIN REFUND MODAL INTEGRATION                                    */}
      {/* ==================================================================== */}
      {isRefundModalOpen && (
        <AdminRefundModal
          payment={refundModalPayment}
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          onRefundSuccess={(updated) => {
            setPaymentsList((prev) =>
              prev.map((p) =>
                String(p.id) === String(updated.id) || p.id === Number(updated.id)
                  ? {
                      ...p,
                      status: 'Refunded',
                      statusBadgeClass: 'bg-[#FEF3C7] text-[#D97706]',
                      subscriptionActive: false,
                    }
                  : p
              )
            );
            setIsRefundModalOpen(false);
            showToast(`Refund processed for ${updated.studentName}`);
          }}
        />
      )}
    </div>,
    { label: 'Loading payments…', variant: 'dashboard' }
  );
};
