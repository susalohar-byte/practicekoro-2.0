import { describe, it, expect } from 'vitest';
import {
  paymentRange,
  paymentInRange,
  retainedPaymentAmount,
  recordedRefundAmount,
  paymentChart,
  cashFlowChart,
  refundInCashFlowRange,
} from './adminPaymentReporting';
import type { AdminPaymentRow } from '@/types';
const row = (patch: Partial<AdminPaymentRow> = {}): AdminPaymentRow => ({
  id: 'p',
  userId: 's',
  studentName: 'Student',
  studentEmail: 's@example.test',
  amount: 100,
  currency: 'INR',
  gateway: 'razorpay',
  status: 'completed',
  createdAt: '2026-10-07T10:00:00Z',
  ...patch,
});
describe('Payment reporting integrity', () => {
  it('uses Kolkata inclusive calendar boundaries for 30/90 days and year', () => {
    const now = new Date('2026-10-07T20:00:00Z'); // Kolkata Oct 8
    expect(paymentRange('Last 30 Days', now).startIso).toBe('2026-09-08T18:30:00.000Z');
    expect(paymentRange('Last 90 Days', now).daysCount).toBe(90);
    expect(paymentRange('This Year', now).startIso).toBe('2025-12-31T18:30:00.000Z');
  });
  it('includes exact period edges and rejects invalid/older timestamps', () => {
    const range = paymentRange('Last 30 Days', new Date('2026-10-07T10:00:00Z'));
    expect(paymentInRange(row({ createdAt: range.startIso }), range)).toBe(true);
    expect(paymentInRange(row({ createdAt: range.endIso }), range)).toBe(true);
    expect(paymentInRange(row({ createdAt: '2026-01-01' }), range)).toBe(false);
    expect(paymentInRange(row({ createdAt: 'invalid' }), range)).toBe(false);
  });
  it('excludes pending/failed/full refunds, subtracts partial refunds without negative revenue', () => {
    expect(retainedPaymentAmount(row({ status: 'pending' }))).toBe(0);
    expect(retainedPaymentAmount(row({ status: 'failed' }))).toBe(0);
    expect(retainedPaymentAmount(row({ status: 'refunded' }))).toBe(0);
    expect(retainedPaymentAmount(row({ refundAmount: 20 }))).toBe(80);
    expect(retainedPaymentAmount(row({ refundAmount: 200 }))).toBe(0);
    expect(recordedRefundAmount(row({ status: 'refunded' }))).toBe(100);
  });
  it('chart totals reconcile with real retained amounts and recorded refunds', () => {
    const range = paymentRange('Last 30 Days', new Date('2026-10-07T10:00:00Z'));
    const points = paymentChart(
      [
        row({ refundAmount: 20 }),
        row({ status: 'refunded', refundAmount: 100 }),
        row({ status: 'pending' }),
      ],
      range
    );
    expect(points.reduce((s, p) => s + p.revenue, 0)).toBe(80);
    expect(points.reduce((s, p) => s + p.refunds, 0)).toBe(120);
    expect(paymentChart([], range).every((p) => p.revenue === 0 && p.refunds === 0)).toBe(true);
  });
  it('keeps older records accessible through All Time without inventing empty history', () => {
    const range = paymentRange('All Time');
    expect(paymentInRange(row({ createdAt: '2023-01-01T10:00:00Z' }), range)).toBe(true);
    expect(paymentChart([], range)).toEqual([]);
  });
  it('correctly attributes cash flow refunds based on refundedAt', () => {
    const range = paymentRange('Last 30 Days', new Date('2026-10-07T10:00:00Z'));
    const oldCreatedRefundedNow = row({
      createdAt: '2026-01-01T10:00:00Z',
      refundedAt: '2026-10-05T10:00:00Z',
      refundAmount: 50,
      status: 'completed',
    });
    const oldCreatedRefundedOld = row({
      createdAt: '2026-01-01T10:00:00Z',
      refundedAt: '2026-01-02T10:00:00Z',
      refundAmount: 50,
      status: 'completed',
    });
    expect(refundInCashFlowRange(oldCreatedRefundedNow, range)).toBe(true);
    expect(refundInCashFlowRange(oldCreatedRefundedOld, range)).toBe(false);

    const points = cashFlowChart([oldCreatedRefundedNow], range);
    expect(points.reduce((s, p) => s + p.refunds, 0)).toBe(50);
  });
});

