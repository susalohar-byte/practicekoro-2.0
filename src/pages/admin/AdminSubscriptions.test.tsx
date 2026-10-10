import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminSubscriptions, mapAdminSubscriptionRow } from './AdminSubscriptions';
import type { AdminSubscriptionRow } from '@/types';

vi.mock('@/services/api', () => ({
  api: {
    getAllAdminSubscriptions: vi.fn(),
    cancelSubscription: vi.fn(),
    getSubscriptionPlans: vi.fn().mockResolvedValue([]),
  },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AdminSubscriptions cancellation', () => {
  it('updates the subscription after backend success without changing recorded revenue', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAllAdminSubscriptions).mockResolvedValue([row]);
    vi.mocked(api.cancelSubscription).mockResolvedValue({
      success: true,
      expiresAt: '2026-10-01T00:00:00Z',
    });
    render(<AdminSubscriptions />);
    const tableRow = (await screen.findByText('Actual Student')).closest('tr')!;
    fireEvent.click(within(tableRow).getByRole('button'));
    fireEvent.click(within(tableRow).getByRole('button', { name: 'Cancel Plan' }));
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getByText('Expired')).toBeInTheDocument()
    );
    expect(api.cancelSubscription).toHaveBeenCalledWith('s1');
    expect(screen.getByText('Recorded Revenue').parentElement).toHaveTextContent('249.5');
  });

  it('keeps active state and shows an error when cancellation fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAllAdminSubscriptions).mockResolvedValue([row]);
    vi.mocked(api.cancelSubscription).mockResolvedValue({ success: false, error: 'Denied' });
    render(<AdminSubscriptions />);
    const tableRow = (await screen.findByText('Actual Student')).closest('tr')!;
    fireEvent.click(within(tableRow).getByRole('button'));
    fireEvent.click(within(tableRow).getByRole('button', { name: 'Cancel Plan' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Denied');
    expect(within(screen.getByRole('table')).getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText(/Subscription cancelled for/)).not.toBeInTheDocument();
  });

  it('cancels the clicked table row, not a different selected subscription', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAllAdminSubscriptions).mockResolvedValue([
      row,
      { ...row, id: 's2', studentName: 'Second Student', paymentId: 'p2' },
    ]);
    vi.mocked(api.cancelSubscription).mockResolvedValue({
      success: true,
      expiresAt: '2026-10-01T00:00:00Z',
    });
    render(<AdminSubscriptions />);
    const name = await screen.findByText('Second Student');
    const secondRow = name.closest('tr')!;
    fireEvent.click(within(secondRow).getByRole('button'));
    fireEvent.click(within(secondRow).getByRole('button', { name: 'Cancel Plan' }));
    await waitFor(() => expect(api.cancelSubscription).toHaveBeenCalledWith('s2'));
    await waitFor(() => expect(within(secondRow).getByText('Expired')).toBeInTheDocument());
    const firstRow = within(screen.getByRole('table')).getByText('Actual Student').closest('tr')!;
    expect(within(firstRow).getByText('Active')).toBeInTheDocument();
  });
});

const row: AdminSubscriptionRow = {
  id: 's1',
  userId: 'u1',
  studentName: 'Actual Student',
  studentEmail: 'actual@example.com',
  planId: 'pro',
  planTitle: 'Pro',
  status: 'active',
  startsAt: '2026-10-01T00:00:00Z',
  expiresAt: '2099-12-31T00:00:00Z',
  paymentId: 'p1',
  paymentAmount: 249.5,
  paymentStatus: 'completed',
  paymentGateway: 'upi',
  paymentCurrency: 'INR',
  paymentTransactionId: 'real_txn',
  daysRemaining: 10,
  createdAt: '2026-10-01T00:00:00Z',
};

describe('AdminSubscriptions authoritative financial display', () => {
  it('maps actual amounts, methods, transaction IDs, and expiry dates', () => {
    const mapped = mapAdminSubscriptionRow(row);
    expect(mapped).toMatchObject({
      amount: 249.5,
      paymentMethod: 'UPI',
      transactionId: 'real_txn',
      paymentId: 'p1',
      paymentStatus: 'completed',
    });
    expect(mapped.endDate).toContain('2099');
  });

  it('correctly maps student avatar when avatarUrl is present vs missing', () => {
    const mappedWithPhoto = mapAdminSubscriptionRow({
      ...row,
      avatarUrl: 'https://example.com/student.jpg',
    });
    expect(mappedWithPhoto.avatarType).toBe('photo');
    expect(mappedWithPhoto.avatarSrc).toBe('https://example.com/student.jpg');

    const mappedWithInitials = mapAdminSubscriptionRow({
      ...row,
      avatarUrl: undefined,
    });
    expect(mappedWithInitials.avatarType).toBe('initials');
    expect(mappedWithInitials.avatarSrc).toBeUndefined();
    expect(mappedWithInitials.avatarInitials).toBe('AS');
  });

  it('does not fabricate amount, gateway, transaction, or expiry for missing data', () => {
    const mapped = mapAdminSubscriptionRow({
      ...row,
      paymentAmount: undefined,
      paymentGateway: undefined,
      paymentTransactionId: undefined,
      expiresAt: '',
    });
    expect(mapped.amount).toBeUndefined();
    expect(mapped.paymentMethod).toBe('—');
    expect(mapped.transactionId).toBeUndefined();
    expect(mapped.endDate).toBe('Unavailable');
  });

  it('shows actual amount and sums only completed linked payments', async () => {
    vi.mocked(api.getAllAdminSubscriptions).mockResolvedValue([
      row,
      { ...row, id: 's2', paymentId: 'p2', paymentAmount: 999, paymentStatus: 'pending' },
    ]);
    render(<AdminSubscriptions />);
    await screen.findAllByText('Actual Student');
    expect(screen.getByText('Recorded Revenue').parentElement).toHaveTextContent('249.5');
    expect(within(screen.getByRole('table')).queryByText('₹99')).not.toBeInTheDocument();
  });

  it('shows unavailable financial data rather than stale cached ₹99 prices', async () => {
    localStorage.setItem(
      'practicekoro_admin_subscriptions_v2',
      JSON.stringify([
        {
          id: 'fake',
          studentName: 'Cached Fake',
          amount: 99,
        },
      ])
    );
    vi.mocked(api.getAllAdminSubscriptions).mockResolvedValue([
      {
        ...row,
        paymentAmount: undefined,
        paymentStatus: undefined,
      },
    ]);
    render(<AdminSubscriptions />);
    await screen.findAllByText('Actual Student');
    expect(screen.getByText('Recorded Revenue').parentElement).toHaveTextContent('Unavailable');
    expect(screen.queryByText('Cached Fake')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Unavailable')).toBeInTheDocument();
  });

  it('shows a failed complete load and prevents misleading CSV export', async () => {
    vi.mocked(api.getAllAdminSubscriptions).mockRejectedValue(new Error('Later page failed'));
    render(<AdminSubscriptions />);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be fully loaded');
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });
});
