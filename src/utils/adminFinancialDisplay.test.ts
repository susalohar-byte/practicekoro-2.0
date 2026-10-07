import { describe, expect, it } from 'vitest';
import type { AdminPaymentRow } from '@/types';
import {
  formatRecordedAmount,
  getAdminPaymentDisplayStatus,
  getAdminSubscriptionDisplay,
  getRecordedSubscriptionRevenue,
} from './adminFinancialDisplay';

describe('admin financial display', () => {
  it.each([
    ['completed', 'Success'],
    ['pending', 'Pending'],
    ['failed', 'Failed'],
    ['refunded', 'Refunded'],
    ['unexpected', 'Unknown'],
    [undefined, 'Unknown'],
  ])('classifies %s without assuming payment success', (status, expected) => {
    expect(getAdminPaymentDisplayStatus({
      status: status as AdminPaymentRow['status'],
    }).status).toBe(expected);
  });

  it('retains refund evidence instead of counting it as successful', () => {
    expect(getAdminPaymentDisplayStatus({
      status: 'completed', refundId: 'rfnd_1',
    }).status).toBe('Refunded');
  });

  it('uses actual expiry and calculates exact remaining days', () => {
    const display = getAdminSubscriptionDisplay({
      subscriptionStatus: 'active',
      subscriptionExpiresAt: '2026-11-12T00:00:00Z',
    }, Date.parse('2026-11-10T00:00:00Z'));
    expect(display).toEqual({
      validTill: new Date('2026-11-12T00:00:00Z').toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
      daysRemaining: 2,
      active: true,
    });
  });

  it('keeps expired days at zero rather than replacing them with fake months', () => {
    expect(getAdminSubscriptionDisplay({
      subscriptionStatus: 'active',
      subscriptionExpiresAt: '2026-11-01T00:00:00Z',
    }, Date.parse('2026-11-10T00:00:00Z'))).toMatchObject({
      daysRemaining: 0, active: false,
    });
  });

  it('does not show a cancelled subscription as active', () => {
    expect(getAdminSubscriptionDisplay({
      subscriptionStatus: 'cancelled',
      subscriptionExpiresAt: '2026-11-12T00:00:00Z',
    }, Date.parse('2026-11-10T00:00:00Z')).active).toBe(false);
  });

  it.each([undefined, 'invalid'])('does not fabricate expiry when it is %s', (expiry) => {
    expect(getAdminSubscriptionDisplay({ subscriptionExpiresAt: expiry })).toEqual({});
  });

  it('distinguishes a recorded zero amount from unavailable financial data', () => {
    expect(formatRecordedAmount(0)).toContain('0');
    expect(formatRecordedAmount(undefined)).toBe('Unavailable');
    expect(formatRecordedAmount(NaN)).toBe('Unavailable');
    expect(formatRecordedAmount(249.5)).toContain('249.5');
  });

  it('counts only completed linked payments once, not fake prices or grants', () => {
    expect(getRecordedSubscriptionRevenue([
      { paymentId: 'p1', amount: 249.5, paymentStatus: 'completed' },
      { paymentId: 'p1', amount: 249.5, paymentStatus: 'completed' },
      { paymentId: 'p2', amount: 999, paymentStatus: 'pending' },
      { paymentId: 'p3', amount: 999, paymentStatus: 'failed' },
      { paymentId: 'p4', amount: 999, paymentStatus: 'refunded' },
      { paymentId: 'p5', paymentStatus: 'completed' },
      { amount: 999, paymentStatus: 'completed' },
    ])).toBe(249.5);
  });
});