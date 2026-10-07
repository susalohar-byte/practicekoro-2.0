import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminPayments } from './AdminPayments';
import type { AdminPaymentRow } from '@/types';

vi.mock('@/services/api', () => ({
  api: { getAdminPayments: vi.fn(), processPaymentRefund: vi.fn(), cancelSubscription: vi.fn() },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => vi.clearAllMocks());

const payment: AdminPaymentRow = {
  id: 'p1', userId: 'u1', studentName: 'Paid Student', studentEmail: 'paid@example.com',
  amount: 199, currency: 'INR', gateway: 'razorpay', status: 'completed',
  transactionId: 'pay_verified', createdAt: '2026-10-01T00:00:00Z',
};

describe('AdminPayments status and subscription display', () => {
  it('excludes pending, failed, and refunded amounts from successful revenue', async () => {
    vi.mocked(api.getAdminPayments).mockResolvedValue([
      payment,
      { ...payment, id: 'p2', studentName: 'Pending Student', amount: 699, status: 'pending' },
      { ...payment, id: 'p3', studentName: 'Failed Student', amount: 999, status: 'failed' },
      { ...payment, id: 'p4', studentName: 'Refunded Student', amount: 499, status: 'refunded' },
    ]);
    render(<AdminPayments />);
    await screen.findByText('Pending Student');
    expect(screen.getAllByText('Total Revenue')[0].parentElement).toHaveTextContent('₹199');
    expect(screen.getAllByText('Successful')[0].parentElement).toHaveTextContent('25%');
    expect(within(screen.getByRole('table')).getByText('Pending')).toBeInTheDocument();
  });

  it('offers a Pending filter that only displays pending payments', async () => {
    vi.mocked(api.getAdminPayments).mockResolvedValue([
      payment,
      { ...payment, id: 'p2', studentName: 'Pending Student', status: 'pending' },
    ]);
    render(<AdminPayments />);
    await screen.findByText('Pending Student');
    fireEvent.change(screen.getByDisplayValue('All Status'), { target: { value: 'Pending' } });
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Pending Student')).toBeInTheDocument();
    expect(table.queryByText('Paid Student')).not.toBeInTheDocument();
  });

  it('disables refund for a pending payment and does not invent subscription expiry', async () => {
    vi.mocked(api.getAdminPayments).mockResolvedValue([{ ...payment, status: 'pending' }]);
    render(<AdminPayments />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refund Payment' })).toBeDisabled());
    expect(screen.getByText('Subscription details unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/12 Feb 2027/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Total Revenue')[0].parentElement).toHaveTextContent('₹0');
  });

  it('shows real expired subscription date and zero days left for a completed payment', async () => {
    vi.mocked(api.getAdminPayments).mockResolvedValue([{
      ...payment, subscriptionStatus: 'expired', subscriptionExpiresAt: '2020-01-02T00:00:00Z',
    }]);
    render(<AdminPayments />);
    expect(await screen.findByText(/Valid till.*2020.*0 days left/)).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refund Payment' })).toBeEnabled();
  });
});

describe('AdminPayments subscription cancellation', () => {
  const linkedPayment: AdminPaymentRow = {
    ...payment,
    subscriptionId: 'subscription-real-id',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: '2099-12-31T00:00:00Z',
  };

  it('waits for backend revocation and preserves successful payment and revenue', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAdminPayments).mockResolvedValue([linkedPayment]);
    let finish!: (result: { success: boolean; expiresAt?: string }) => void;
    vi.mocked(api.cancelSubscription).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<AdminPayments />);
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(api.cancelSubscription).toHaveBeenCalledWith('subscription-real-id');
    expect(screen.getByRole('button', { name: 'Cancelling…' })).toBeDisabled();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText(/Subscription cancelled for/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelling…' }));
    expect(api.cancelSubscription).toHaveBeenCalledTimes(1);

    await act(async () => finish({ success: true, expiresAt: '2026-10-01T00:00:00Z' }));
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeDisabled();
    expect(within(screen.getByRole('table')).getByText('Success')).toBeInTheDocument();
    expect(screen.getAllByText('Total Revenue')[0].parentElement).toHaveTextContent('₹199');
  });

  it('retains active access in the UI and shows an error when backend denies cancellation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAdminPayments).mockResolvedValue([linkedPayment]);
    vi.mocked(api.cancelSubscription).mockResolvedValue({ success: false, error: 'Permission denied' });
    render(<AdminPayments />);
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText(/Subscription cancelled for/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeEnabled();
  });

  it('handles network errors without showing a successful cancellation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAdminPayments).mockResolvedValue([linkedPayment]);
    vi.mocked(api.cancelSubscription).mockRejectedValue(new Error('Network unavailable'));
    render(<AdminPayments />);
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not revoke access when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.mocked(api.getAdminPayments).mockResolvedValue([linkedPayment]);
    render(<AdminPayments />);
    await screen.findByText('Active');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Subscription' }));
    expect(api.cancelSubscription).not.toHaveBeenCalled();
  });

  it('disables cancellation if no linked active subscription is known', async () => {
    vi.mocked(api.getAdminPayments).mockResolvedValue([payment]);
    render(<AdminPayments />);
    await screen.findByText('Subscription details unavailable');
    expect(screen.getByRole('button', { name: 'Cancel Subscription' })).toBeDisabled();
    expect(api.cancelSubscription).not.toHaveBeenCalled();
  });
});