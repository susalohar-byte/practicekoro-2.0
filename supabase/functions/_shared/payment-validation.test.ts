import { describe, expect, it } from 'vitest';
import { isOrderPayload, isVerificationPayload, isCompletedRefund } from './payment-validation';
describe('Payment runtime validation', () => {
  it.each([null, [], 'hello', 1, true, {}, { planId: {} }, { planId: ' ' }])(
    'rejects invalid order body %j',
    (body) => expect(isOrderPayload(body)).toBe(false)
  );
  it('accepts a real plan identifier', () =>
    expect(isOrderPayload({ planId: 'pro_1_year' })).toBe(true));
  it.each([
    null,
    [],
    {},
    { orderId: {}, paymentId: 'p', signature: 's', planId: 'plan' },
    { orderId: 'o', paymentId: 'p', signature: '', planId: 'plan' },
  ])('rejects invalid verification body %j', (body) =>
    expect(isVerificationPayload(body)).toBe(false)
  );
  it('accepts all non-empty verification strings', () =>
    expect(
      isVerificationPayload({ orderId: 'o', paymentId: 'p', signature: 's', planId: 'plan' })
    ).toBe(true));
  it.each(['refund.created', 'refund.speed_changed', 'refund.processed', 'payment.refunded'])(
    'does not process pending/failed refunds for %s',
    (event) => {
      expect(isCompletedRefund(event, 'pending')).toBe(false);
      expect(isCompletedRefund(event, 'failed')).toBe(false);
    }
  );
  it.each(['refund.processed', 'payment.refunded'])(
    'accepts completed event %s without a status',
    (event) => expect(isCompletedRefund(event, undefined)).toBe(true)
  );
  it('ignores creation without a status', () =>
    expect(isCompletedRefund('refund.created', undefined)).toBe(false));
  it('accepts explicit processed status', () =>
    expect(isCompletedRefund('refund.speed_changed', 'processed')).toBe(true));
});
