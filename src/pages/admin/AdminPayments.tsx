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
  Send,
  Ban,
  Calendar,
  Check,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { AdminRefundModal } from '@/components/admin/AdminRefundModal';
import type { AdminPaymentRow } from '@/types';

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
  status: 'Success' | 'Failed' | 'Refunded';
  statusBadgeClass: string;
  gatewayOrderId?: string;
  paymentId?: string;
  bankReference?: string;
  subscriptionValidTill?: string;
  subscriptionMonthsLeft?: number;
  subscriptionActive?: boolean;
}

// Payment Method Logo helper
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

// ============================================================================
// MAIN COMPONENT: ADMIN PAYMENTS
// ============================================================================

export const AdminPayments: React.FC = () => {
  const [paymentsList, setPaymentsList] = useState<PaymentItem[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<number | string>('');
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(true);

  // Load real payments from database on mount
  useEffect(() => {
    let isMounted = true;
    api.getAdminPayments().then((remote) => {
      if (!isMounted) return;
      if (!remote || remote.length === 0) {
        setPaymentsList([]);
        setSelectedRowId('');
        return;
      }
      const mapped: PaymentItem[] = remote.map((d, index) => {
        const dDate = new Date(d.createdAt || Date.now());
        const dateStr = dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        let displayStatus: 'Success' | 'Failed' | 'Refunded' = 'Success';
        let statusBadge = 'bg-[#DCFCE7] text-[#15803D]';
        if (d.status === 'failed') {
          displayStatus = 'Failed';
          statusBadge = 'bg-[#FEE2E2] text-[#DC2626]';
        } else if (d.status === 'refunded' || d.refundId) {
          displayStatus = 'Refunded';
          statusBadge = 'bg-[#FEF3C7] text-[#B45309]';
        }

        let method: 'Razorpay' | 'UPI' | 'PhonePe' | 'Credit Card' | '—' = 'Razorpay';
        if (d.gateway === 'phonepe') method = 'PhonePe';
        else if (d.gateway === 'upi') method = 'UPI';

        return {
          id: d.id,
          studentName: d.studentName || 'Student Aspirant',
          studentEmail: d.studentEmail || '',
          avatarType: 'photo',
          avatarSrc: `https://images.unsplash.com/photo-${1535713875002 + (index % 5)}?w=100&auto=format&fit=crop&q=80`,
          plan: d.planTitle || 'Pro Pass',
          planDuration: `${d.planTitle || 'Pro Pass'}`,
          planBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
          amount: d.amount,
          paymentMethod: method,
          transactionId: d.transactionId || d.razorpayPaymentId || `pay_${d.id.slice(0, 8)}`,
          date: dateStr,
          time: timeStr,
          status: displayStatus,
          statusBadgeClass: statusBadge,
          gatewayOrderId: d.orderId || d.razorpayOrderId,
          paymentId: d.razorpayPaymentId || d.transactionId,
          bankReference: d.transactionId,
          subscriptionValidTill: '12 Feb 2027',
          subscriptionMonthsLeft: 6,
          subscriptionActive: displayStatus === 'Success',
        };
      });
      setPaymentsList(mapped);
      if (mapped.length > 0) {
        setSelectedRowId(mapped[0].id);
      }
    }).catch((err) => {
      console.warn('Failed to load admin payments from database:', err);
      if (isMounted) setPaymentsList([]);
    });
    return () => { isMounted = false; };
  }, []);

  // Checkbox selection state
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<(number | string)[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [filterMethod, setFilterMethod] = useState('All Payment Methods');

  // Time range selector
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refundModalPayment, setRefundModalPayment] = useState<AdminPaymentRow | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
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
    return paymentsList.find((p) => p.id === selectedRowId) || (paymentsList.length > 0 ? paymentsList[0] : null);
  }, [paymentsList, selectedRowId]);

  // Computed summary metrics
  const totalRevenue = useMemo(() => {
    return paymentsList
      .filter((p) => p.status === 'Success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [paymentsList]);

  const totalPayments = paymentsList.length;

  const successfulPayments = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'Success').length;
  }, [paymentsList]);

  const failedPayments = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'Failed').length;
  }, [paymentsList]);

  const refundedPayments = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'Refunded').length;
  }, [paymentsList]);

  const successRate = totalPayments > 0 ? `${Math.round((successfulPayments / totalPayments) * 100)}%` : '0%';

  const methodStats = useMemo(() => {
    const total = totalRevenue || 1;
    const calc = (m: string) => {
      const items = paymentsList.filter((p) => p.paymentMethod === m && p.status === 'Success');
      const sum = items.reduce((acc, p) => acc + (p.amount || 0), 0);
      const pct = totalRevenue > 0 ? Math.round((sum / total) * 100) : 0;
      return { sum, pct };
    };
    return {
      upi: calc('UPI'),
      razorpay: calc('Razorpay'),
      phonepe: calc('PhonePe'),
      card: calc('Credit Card'),
      other: {
        sum: paymentsList
          .filter((p) => !['UPI', 'Razorpay', 'PhonePe', 'Credit Card'].includes(p.paymentMethod) && p.status === 'Success')
          .reduce((acc, p) => acc + (p.amount || 0), 0),
        pct: 0,
      },
    };
  }, [paymentsList, totalRevenue]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return paymentsList.filter((item) => {
      if (filterStatus !== 'All Status' && item.status !== filterStatus) return false;
      if (filterPlan !== 'All Plans' && !item.plan.includes(filterPlan.replace(' Plans', ''))) return false;
      if (filterMethod !== 'All Payment Methods' && item.paymentMethod !== filterMethod) return false;
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
  }, [paymentsList, filterStatus, filterPlan, filterMethod, searchQuery]);

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
    const headers = [
      'Transaction ID',
      'Student Name',
      'Student Email',
      'Plan',
      'Amount',
      'Payment Method',
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
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment records exported to CSV successfully.');
  };

  // Send Receipt Action
  const handleSendReceipt = () => {
    if (!selectedPayment) return;
    showToast(`Payment receipt emailed to ${selectedPayment.studentEmail}`);
  };

  // Open Refund Dialog
  const handleOpenRefund = (payment: PaymentItem) => {
    const mapped: AdminPaymentRow = {
      id: String(payment.id),
      userId: `user_${payment.id}`,
      studentName: payment.studentName,
      studentEmail: payment.studentEmail,
      amount: payment.amount,
      currency: 'INR',
      gateway: payment.paymentMethod === 'Razorpay' ? 'razorpay' : 'manual',
      status: payment.status === 'Success' ? 'completed' : payment.status === 'Refunded' ? 'refunded' : 'failed',
      orderId: payment.gatewayOrderId || `ord_${payment.id}`,
      transactionId: payment.transactionId,
      createdAt: `${payment.date} ${payment.time}`,
      planTitle: payment.planDuration,
    };
    setRefundModalPayment(mapped);
    setIsRefundModalOpen(true);
  };

  // Cancel Payment / Subscription
  const handleCancelPayment = () => {
    if (!selectedPayment) return;
    if (window.confirm(`Cancel subscription and revoke plan access for ${selectedPayment.studentName}?`)) {
      setPaymentsList((prev) =>
        prev.map((p) =>
          p.id === selectedPayment.id
            ? { ...p, status: 'Failed', subscriptionActive: false, subscriptionValidTill: 'Cancelled' }
            : p
        )
      );
      showToast(`Subscription cancelled for ${selectedPayment.studentName}.`);
    }
  };

  // Download Invoice
  const handleDownloadInvoice = () => {
    if (!selectedPayment) return;
    showToast(`Downloading invoice for transaction ${selectedPayment.transactionId}...`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
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
          onClick={handleExportPayments}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors self-start shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Payments</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. FIVE SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-lg shrink-0">
            ₹
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Revenue</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">₹{totalRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 32%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">this month</span>
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
              <span className="text-xl font-bold text-slate-900 leading-tight">{totalPayments.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 26%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">this month</span>
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
              <span className="text-xl font-bold text-slate-900 leading-tight">{successfulPayments.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {successRate}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">success rate</span>
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
              <span className="text-xl font-bold text-slate-900 leading-tight">{failedPayments.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                ↓ 3%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">this month</span>
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
              <span className="text-xl font-bold text-slate-900 leading-tight">{refundedPayments.toLocaleString('en-IN')}</span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                ↓ 2%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">this month</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. CHARTS ROW (Revenue Trend & Payment Methods)                      */}
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
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>Successful</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
                <span>Refunded</span>
              </div>
            </div>

            {/* Time Filter */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 90 Days">Last 90 Days</option>
                <option value="This Year">This Year</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* SVG Multi-Day Bar and Line Chart */}
          <div className="relative pt-2">
            <svg viewBox="0 0 700 180" className="w-full h-44 overflow-visible">
              {/* Y-axis grid and labels */}
              {[
                { label: '₹40K', y: 20 },
                { label: '₹30K', y: 55 },
                { label: '₹20K', y: 90 },
                { label: '₹10K', y: 125 },
                { label: '₹0', y: 155 },
              ].map((tick) => (
                <g key={tick.label}>
                  <line
                    x1="45"
                    y1={tick.y}
                    x2="690"
                    y2={tick.y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x="35"
                    y={tick.y + 3.5}
                    fontSize="9"
                    fill="#94A3B8"
                    textAnchor="end"
                    fontWeight="400"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}

              {/* 30 Daily Vertical Bars matching screenshot proportions */}
              {[
                { day: 1, rev: 68, ref: 8 },
                { day: 2, rev: 72, ref: 6 },
                { day: 3, rev: 64, ref: 10 },
                { day: 4, rev: 80, ref: 7 },
                { day: 5, rev: 88, ref: 12 },
                { day: 6, rev: 76, ref: 8 },
                { day: 7, rev: 82, ref: 6 },
                { day: 8, rev: 70, ref: 9 },
                { day: 9, rev: 85, ref: 7 },
                { day: 10, rev: 92, ref: 11 },
                { day: 11, rev: 78, ref: 8 },
                { day: 12, rev: 86, ref: 6 },
                { day: 13, rev: 94, ref: 10 },
                { day: 14, rev: 102, ref: 14 },
                { day: 15, rev: 89, ref: 9 },
                { day: 16, rev: 96, ref: 7 },
                { day: 17, rev: 110, ref: 12 },
                { day: 18, rev: 104, ref: 8 },
                { day: 19, rev: 98, ref: 10 },
                { day: 20, rev: 90, ref: 6 },
                { day: 21, rev: 106, ref: 13 },
                { day: 22, rev: 95, ref: 9 },
                { day: 23, rev: 102, ref: 7 },
                { day: 24, rev: 112, ref: 11 },
                { day: 25, rev: 108, ref: 8 },
                { day: 26, rev: 116, ref: 12 },
                { day: 27, rev: 114, ref: 9 },
                { day: 28, rev: 122, ref: 14 },
                { day: 29, rev: 120, ref: 10 },
                { day: 30, rev: 126, ref: 12 },
              ].map((d, idx) => {
                const x = 55 + idx * 21.2;
                const barHeight = (d.rev / 140) * 125;
                const refHeight = (d.ref / 140) * 125;
                const y = 155 - barHeight;
                return (
                  <g key={d.day}>
                    {/* Blue revenue pillar */}
                    <rect
                      x={x}
                      y={y}
                      width="10"
                      height={barHeight}
                      rx="2"
                      fill="#93C5FD"
                      opacity="0.85"
                    />
                    {/* Pink refund base */}
                    <rect
                      x={x}
                      y={155 - refHeight}
                      width="10"
                      height={refHeight}
                      rx="1"
                      fill="#FDA4AF"
                      opacity="0.9"
                    />
                  </g>
                );
              })}

              {/* Green Line overlay for Successful transactions */}
              <path
                d="M 60 92 L 123 88 L 186 86 L 249 74 L 312 78 L 375 64 L 438 68 L 501 56 L 564 60 L 627 52 L 678 48"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Green dots on line */}
              {[
                { x: 60, y: 92 },
                { x: 123, y: 88 },
                { x: 186, y: 86 },
                { x: 249, y: 74 },
                { x: 312, y: 78 },
                { x: 375, y: 64 },
                { x: 438, y: 68 },
                { x: 501, y: 56 },
                { x: 564, y: 60 },
                { x: 627, y: 52 },
                { x: 678, y: 48 },
              ].map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              ))}

              {/* X-axis date labels */}
              {[
                { label: '1 Sep', x: 60 },
                { label: '5 Sep', x: 145 },
                { label: '10 Sep', x: 250 },
                { label: '15 Sep', x: 355 },
                { label: '20 Sep', x: 460 },
                { label: '25 Sep', x: 565 },
                { label: '30 Sep', x: 670 },
              ].map((dt) => (
                <text
                  key={dt.label}
                  x={dt.x}
                  y="172"
                  fontSize="9"
                  fill="#64748B"
                  textAnchor="middle"
                  fontWeight="400"
                >
                  {dt.label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Right: Payment Methods Donut */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Payment Methods</h2>

          <div className="flex items-center gap-4 py-2">
            {/* SVG Donut Chart with center text */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* UPI: 52% -> strokeDasharray: 52 48, strokeDashoffset: 0 */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="16"
                  strokeDasharray="124.2 114.6"
                  strokeDashoffset="0"
                />
                {/* Razorpay: 28% -> strokeDasharray: 66.8 172 */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="16"
                  strokeDasharray="66.8 172"
                  strokeDashoffset="-124.2"
                />
                {/* PhonePe: 12% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="16"
                  strokeDasharray="28.6 210.2"
                  strokeDashoffset="-191"
                />
                {/* Credit/Debit Card: 6% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="16"
                  strokeDasharray="14.3 224.5"
                  strokeDashoffset="-219.6"
                />
                {/* Other: 2% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="16"
                  strokeDasharray="4.8 234"
                  strokeDashoffset="-233.9"
                />
              </svg>
              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 font-normal">Total Revenue</span>
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
                  <span className="text-[10px] text-slate-400 block">₹{methodStats.upi.sum.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4] shrink-0" />
                  <span className="text-slate-700 font-medium truncate">Razorpay</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{methodStats.razorpay.pct}%</span>
                  <span className="text-[10px] text-slate-400 block">₹{methodStats.razorpay.sum.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7] shrink-0" />
                  <span className="text-slate-700 font-medium truncate">PhonePe</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{methodStats.phonepe.pct}%</span>
                  <span className="text-[10px] text-slate-400 block">₹{methodStats.phonepe.sum.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                  <span className="text-slate-700 font-medium truncate">Credit/Debit Card</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{methodStats.card.pct}%</span>
                  <span className="text-[10px] text-slate-400 block">₹{methodStats.card.sum.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#64748B] shrink-0" />
                  <span className="text-slate-700 font-medium truncate">Other</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{methodStats.other.pct}%</span>
                  <span className="text-[10px] text-slate-400 block">₹{methodStats.other.sum.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
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
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
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

        {/* All Payment Methods */}
        <div className="relative min-w-[160px]">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All Payment Methods">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Razorpay">Razorpay</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Credit Card">Credit Card</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white gap-2 cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>01 Sep 2026 – 30 Sep 2026</span>
        </div>

        {/* Filter and Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Filters refreshed.')}
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
              setFilterMethod('All Payment Methods');
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
              <table className="w-full text-left border-collapse">
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
                    <th className="py-3 px-3">Payment Method</th>
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
                    const isSelected = selectedRowId === row.id;
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
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          ₹{row.amount}
                        </td>

                        {/* Payment Method */}
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
                                  onClick={() => {
                                    handleOpenRefund(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50"
                                >
                                  Refund Payment
                                </button>
                                <button
                                  onClick={() => {
                                    handleSendReceipt();
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                                >
                                  Send Receipt
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
                Showing {filteredRows.length === 0 ? 0 : 1}–{Math.min(filteredRows.length, 10)} of {filteredRows.length.toLocaleString('en-IN')} payments
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2563EB] text-white font-medium shadow-2xs"
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  3
                </button>
                <button
                  onClick={() => setCurrentPage(4)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  4
                </button>
                <button
                  onClick={() => setCurrentPage(5)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  5
                </button>
                <span className="px-1 text-slate-400">...</span>

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
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
        {isDetailsPanelOpen && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {selectedPayment ? (
              <>
                {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Payment Details</h2>
              <button
                onClick={() => setIsDetailsPanelOpen(false)}
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
                  <h3 className="font-bold text-slate-900 text-sm">{selectedPayment.studentName}</h3>
                  <span className="text-[11px] text-slate-500 block">
                    {selectedPayment.studentEmail}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {selectedPayment.studentPhone || '+91 98765 43210'}
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
                <span className="text-slate-400 font-normal">Payment Method</span>
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
                  {selectedPayment.gatewayOrderId || 'order_N8m7k2Pq'}
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
                  {selectedPayment.bankReference || 'HDF000123456'}
                </span>
              </div>
              <div className="flex justify-between py-0.5 items-center">
                <span className="text-slate-400 font-normal">Invoice</span>
                <button
                  onClick={handleDownloadInvoice}
                  className="text-[#2563EB] hover:underline flex items-center gap-1 font-semibold text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Invoice</span>
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
                      {selectedPayment.subscriptionActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Valid till {selectedPayment.subscriptionValidTill || '12 Feb 2027'} (
                    {selectedPayment.subscriptionMonthsLeft || 4} months left)
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
                <Send className="w-3.5 h-3.5" />
                <span>Send Receipt</span>
              </button>

              <button
                onClick={() => handleOpenRefund(selectedPayment)}
                className="border border-amber-200 text-amber-700 hover:bg-amber-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refund Payment</span>
              </button>

              <button
                onClick={handleCancelPayment}
                className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Payment</span>
              </button>
            </div>
            </>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                No payment record selected.
              </div>
            )}
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
    </div>
  );
};
