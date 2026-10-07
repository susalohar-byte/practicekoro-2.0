import type { AdminPaymentRow } from '@/types';
import {
  generateChartBuckets,
  getDateRangeBounds,
  getKolkataDateString,
} from '@/services/domains/admin.dashboard';

export function paymentRange(preset: string, now = new Date()) {
  if (preset === 'All Time') return getDateRangeBounds('All Time');
  const today = getKolkataDateString(now);
  const year = today.slice(0, 4);
  const from =
    preset === 'This Year'
      ? `${year}-01-01`
      : getKolkataDateString(
          new Date(
            new Date(`${today}T00:00:00+05:30`).getTime() -
              (preset === 'Last 90 Days' ? 89 : 29) * 86400000
          )
        );
  return getDateRangeBounds('Custom Range', from, today);
}
export function retainedPaymentAmount(p: AdminPaymentRow) {
  return p.status === 'completed'
    ? Math.max(
        0,
        Math.round(Number(p.amount) * 100) - Math.round(Number(p.refundAmount || 0) * 100)
      ) / 100
    : 0;
}
export function recordedRefundAmount(p: AdminPaymentRow) {
  return ['completed', 'refunded'].includes(p.status)
    ? Number(p.refundAmount ?? (p.status === 'refunded' ? p.amount : 0))
    : 0;
}
export function paymentInRange(p: AdminPaymentRow, range: ReturnType<typeof paymentRange>) {
  const stamp = Date.parse(p.createdAt || p.created_at || '');
  return stamp >= Date.parse(range.startIso) && stamp <= Date.parse(range.endIso);
}
export function paymentChart(rows: AdminPaymentRow[], range: ReturnType<typeof paymentRange>) {
  const valid = rows
    .map((p) => Date.parse(p.createdAt || p.created_at || ''))
    .filter((t) => Number.isFinite(t) && t <= Date.parse(range.endIso));
  if (range.isAllTime && !valid.length) return [];
  const chartStart = range.isAllTime ? new Date(Math.min(...valid)).toISOString() : range.startIso;
  return generateChartBuckets(chartStart, range.endIso, 8).map((b) => {
    const records = rows.filter((p) => {
      const stamp = Date.parse(p.createdAt || p.created_at || '');
      return stamp >= b.startMs && stamp <= b.endMs;
    });
    return {
      label: b.label,
      revenue: records.reduce((sum, p) => sum + retainedPaymentAmount(p), 0),
      refunds: records.reduce((sum, p) => sum + recordedRefundAmount(p), 0),
    };
  });
}
