import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminSubscriptions, mapAdminSubscriptionRow } from './AdminSubscriptions';
import type { AdminSubscriptionRow } from '@/types';

vi.mock('@/services/api', () => ({
  api: { getAdminSubscriptions: vi.fn() },
}));
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

const row: AdminSubscriptionRow = {
  id: 's1', userId: 'u1', studentName: 'Actual Student', studentEmail: 'actual@example.com',
  planId: 'pro', planTitle: 'Pro', status: 'active',
  startsAt: '2026-10-01T00:00:00Z', expiresAt: '2099-12-31T00:00:00Z',
  paymentId: 'p1', paymentAmount: 249.5, paymentStatus: 'completed',
  paymentGateway: 'upi', paymentCurrency: 'INR', paymentTransactionId: 'real_txn',
  daysRemaining: 10, createdAt: '2026-10-01T00:00:00Z',
};

describe('AdminSubscriptions authoritative financial display', () => {
  it('maps actual amounts, methods, transaction IDs, and expiry dates', () => {
    const mapped = mapAdminSubscriptionRow(row);
    expect(mapped).toMatchObject({
      amount: 249.5, paymentMethod: 'UPI', transactionId: 'real_txn',
      paymentId: 'p1', paymentStatus: 'completed',
    });
    expect(mapped.endDate).toContain('2099');
  });

  it('does not fabricate amount, gateway, transaction, or expiry for missing data', () => {
    const mapped = mapAdminSubscriptionRow({
      ...row, paymentAmount: undefined, paymentGateway: undefined,
      paymentTransactionId: undefined, expiresAt: '',
    });
    expect(mapped.amount).toBeUndefined();
    expect(mapped.paymentMethod).toBe('—');
    expect(mapped.transactionId).toBeUndefined();
    expect(mapped.endDate).toBe('Unavailable');
  });

  it('shows actual amount and sums only completed linked payments', async () => {
    vi.mocked(api.getAdminSubscriptions).mockResolvedValue([
      row,
      { ...row, id: 's2', paymentId: 'p2', paymentAmount: 999, paymentStatus: 'pending' },
    ]);
    render(<AdminSubscriptions />);
    await screen.findAllByText('Actual Student');
    expect(screen.getByText('Recorded Revenue').parentElement).toHaveTextContent('249.5');
    expect(within(screen.getByRole('table')).queryByText('₹99')).not.toBeInTheDocument();
  });

  it('shows unavailable financial data rather than stale cached ₹99 prices', async () => {
    localStorage.setItem('practicekoro_admin_subscriptions_v2', JSON.stringify([{
      id: 'fake', studentName: 'Cached Fake', amount: 99,
    }]));
    vi.mocked(api.getAdminSubscriptions).mockResolvedValue([{
      ...row, paymentAmount: undefined, paymentStatus: undefined,
    }]);
    render(<AdminSubscriptions />);
    await screen.findAllByText('Actual Student');
    expect(screen.getByText('Recorded Revenue').parentElement).toHaveTextContent('Unavailable');
    expect(screen.queryByText('Cached Fake')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Unavailable')).toBeInTheDocument();
  });
});