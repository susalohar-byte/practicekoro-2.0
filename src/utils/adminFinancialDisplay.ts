import type { AdminPaymentRow, PaymentStatus } from '@/types';

export type AdminPaymentDisplayStatus = 'Success' | 'Pending' | 'Failed' | 'Refunded' | 'Unknown';

export function getAdminPaymentDisplayStatus(
  payment: Pick<AdminPaymentRow, 'status' | 'refundId'>
): { status: AdminPaymentDisplayStatus; badgeClass: string } {
  if (payment.status === 'failed') {
    return { status: 'Failed', badgeClass: 'bg-[#FEE2E2] text-[#DC2626]' };
  }
  if (payment.status === 'refunded' || payment.refundId) {
    return { status: 'Refunded', badgeClass: 'bg-[#FEF3C7] text-[#B45309]' };
  }
  if (payment.status === 'completed') {
    return { status: 'Success', badgeClass: 'bg-[#DCFCE7] text-[#15803D]' };
  }
  return {
    status: payment.status === 'pending' ? 'Pending' : 'Unknown',
    badgeClass: 'bg-slate-100 text-slate-600',
  };
}

export function getAdminSubscriptionDisplay(
  payment: Pick<AdminPaymentRow, 'subscriptionStatus' | 'subscriptionExpiresAt'>,
  now = Date.now()
): { validTill?: string; daysRemaining?: number; active?: boolean } {
  const expiry = payment.subscriptionExpiresAt
    ? new Date(payment.subscriptionExpiresAt).getTime()
    : NaN;
  if (!Number.isFinite(expiry)) return {};
  return {
    validTill: new Date(expiry).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }),
    daysRemaining: Math.max(0, Math.ceil((expiry - now) / 86400000)),
    active: payment.subscriptionStatus
      ? payment.subscriptionStatus === 'active' && expiry > now
      : undefined,
  };
}

export function formatRecordedAmount(amount?: number, currency = 'INR'): string {
  if (amount == null || !Number.isFinite(amount)) return 'Unavailable';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(amount);
}

export function getRecordedSubscriptionRevenue(
  rows: { paymentId?: string; amount?: number; paymentStatus?: PaymentStatus }[]
): number {
  const counted = new Set<string>();
  return rows.reduce((total, row) => {
    if (!row.paymentId || counted.has(row.paymentId) ||
        row.paymentStatus !== 'completed' || row.amount == null ||
        !Number.isFinite(row.amount) || row.amount < 0) return total;
    counted.add(row.paymentId);
    return total + row.amount;
  }, 0);
}