import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminPayments } from './AdminPayments';
import type { AdminPaymentRow } from '@/types';

vi.mock('@/services/api', () => ({
  api: { getAdminPayments: vi.fn(), processPaymentRefund: vi.fn() },
}));
afterEach(cleanup);
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