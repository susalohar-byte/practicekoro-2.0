import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminPaymentRow, AdminSubscriptionRow } from '@/types';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  results: {} as Record<string, { data: any[] | null; error: any }>,
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { rpc: mocks.rpc, from: mocks.from },
}));

import {
  enrichAdminPaymentSubscriptions,
  enrichAdminSubscriptionPayments,
} from './admin.financialDetails';
import { adminCommerceApi } from './adminCommerce';

const subscription: AdminSubscriptionRow = {
  id: 's1', userId: 'u1', studentName: 'Student', studentEmail: 'student@example.com',
  planId: 'plan1', planTitle: 'Pro', status: 'active', startsAt: '2026-10-01',
  expiresAt: '2026-11-01', paymentId: 'p1', daysRemaining: 31, createdAt: '2026-10-01',
};
const payment: AdminPaymentRow = {
  id: 'p1', userId: 'u1', studentName: 'Student', studentEmail: 'student@example.com',
  amount: 249.5, currency: 'INR', gateway: 'razorpay', status: 'completed',
  createdAt: '2026-10-01',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.results = {};
  mocks.from.mockImplementation((table: string) => {
    const query: any = {};
    for (const method of ['select', 'in', 'order', 'range', 'eq']) {
      query[method] = vi.fn(() => query);
    }
    query.then = (resolve: any) =>
      Promise.resolve(mocks.results[table] || { data: [], error: null }).then(resolve);
    return query;
  });
});

describe('authoritative admin financial joins', () => {
  it('reads the actual charged amount and gateway by linked payment ID', async () => {
    mocks.results.payments = { data: [{
      id: 'p1', user_id: 'u1', amount: '249.50', status: 'completed',
      gateway: 'upi', transaction_id: 'txn_1', currency: 'INR',
    }], error: null };
    expect((await enrichAdminSubscriptionPayments([subscription]))[0]).toMatchObject({
      paymentAmount: 249.5, paymentStatus: 'completed',
      paymentGateway: 'upi', paymentTransactionId: 'txn_1', paymentCurrency: 'INR',
    });
    expect(mocks.from.mock.results[0].value.in).toHaveBeenCalledWith('id', ['p1']);
  });

  it('preserves actual zero payments', async () => {
    mocks.results.payments = {
      data: [{ id: 'p1', user_id: 'u1', amount: 0, status: 'completed' }], error: null,
    };
    expect((await enrichAdminSubscriptionPayments([subscription]))[0].paymentAmount).toBe(0);
  });

  it.each([
    { data: null, error: { message: 'Lookup failed' } },
    { data: [], error: null },
    { data: [{ id: 'p1', user_id: 'other', amount: 99 }], error: null },
    { data: [{ id: 'p1', user_id: 'u1', amount: null }], error: null },
  ])('does not invent a payment amount from missing/invalid data', async (result) => {
    mocks.results.payments = result;
    expect((await enrichAdminSubscriptionPayments([subscription]))[0].paymentAmount).toBeUndefined();
  });

  it('does not query payments for a subscription without a payment link', async () => {
    const rows = await enrichAdminSubscriptionPayments([{ ...subscription, paymentId: undefined }]);
    expect(rows[0].paymentAmount).toBeUndefined();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('gets expiry from the subscription linked to this payment', async () => {
    mocks.results.subscriptions = { data: [{
      id: 's1', user_id: 'u1', payment_id: 'p1',
      status: 'expired', expires_at: '2026-10-02',
    }], error: null };
    expect((await enrichAdminPaymentSubscriptions([payment]))[0]).toMatchObject({
      subscriptionId: 's1', subscriptionStatus: 'expired', subscriptionExpiresAt: '2026-10-02',
    });
    expect(mocks.from.mock.results[0].value.in).toHaveBeenCalledWith('payment_id', ['p1']);
  });

  it('does not substitute another user or unrelated payment subscription', async () => {
    mocks.results.subscriptions = { data: [{
      id: 's2', user_id: 'other', payment_id: 'p1', expires_at: '2027-02-12',
    }, {
      id: 's3', user_id: 'u1', payment_id: 'different-payment', expires_at: '2027-02-12',
    }], error: null };
    expect((await enrichAdminPaymentSubscriptions([payment]))[0].subscriptionExpiresAt).toBeUndefined();
  });

  it('enriches the subscriptions RPC path', async () => {
    mocks.rpc.mockResolvedValue({ data: [{
      id: 's1', user_id: 'u1', payment_id: 'p1', status: 'active',
    }], error: null });
    mocks.results.payments = {
      data: [{ id: 'p1', user_id: 'u1', amount: 299, status: 'completed' }], error: null,
    };
    expect((await adminCommerceApi.getAdminSubscriptions())[0].paymentAmount).toBe(299);
  });

  it('enriches the payments RPC path without changing pending status', async () => {
    mocks.rpc.mockResolvedValue({ data: [{
      id: 'p1', user_id: 'u1', amount: 299, status: 'pending',
    }], error: null });
    mocks.results.subscriptions = { data: [{
      id: 's1', user_id: 'u1', payment_id: 'p1', status: 'active', expires_at: '2026-12-31',
    }], error: null };
    expect((await adminCommerceApi.getAdminPayments())[0]).toMatchObject({
      status: 'pending', subscriptionExpiresAt: '2026-12-31',
    });
  });

  it('enriches both direct-query fallback paths', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'RPC unavailable' } });
    mocks.results.subscriptions = { data: [{
      id: 's1', user_id: 'u1', payment_id: 'p1', status: 'active', expires_at: '2026-12-31',
    }], error: null };
    mocks.results.payments = { data: [{
      id: 'p1', user_id: 'u1', amount: 349, status: 'completed',
    }], error: null };
    expect((await adminCommerceApi.getAdminSubscriptions())[0].paymentAmount).toBe(349);
    expect((await adminCommerceApi.getAdminPayments())[0].subscriptionExpiresAt).toBe('2026-12-31');
  });
});