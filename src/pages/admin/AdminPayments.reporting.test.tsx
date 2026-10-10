import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AdminPayments } from './AdminPayments';
import { api } from '@/services/api';
import type { AdminPaymentRow } from '@/types';
vi.mock('@/services/api', () => ({ api: { getAllAdminPayments: vi.fn() } }));
vi.mock('@/components/admin/AdminRefundModal', () => ({ AdminRefundModal: () => null }));
const payment = (
  id: string,
  createdAt: string,
  patch: Partial<AdminPaymentRow> = {}
): AdminPaymentRow => ({
  id,
  userId: 's',
  studentName: id,
  studentEmail: `${id}@example.test`,
  amount: 100,
  currency: 'INR',
  gateway: 'razorpay',
  status: 'completed',
  createdAt,
  transactionId: id,
  ...patch,
});
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe('Payment period reporting UI', () => {
  it('filters rows and totals by the selected actual range and renders no static growth badges', async () => {
    const now = new Date();
    const old = new Date(now.getTime() - 60 * 86400000).toISOString();
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([
      payment('recent-payment', now.toISOString(), { refundAmount: 20 }),
      payment('older-payment', old, { amount: 200 }),
      payment('pending-payment', now.toISOString(), { status: 'pending', amount: 999 }),
    ]);
    render(<AdminPayments />);
    await screen.findAllByText('recent-payment');
    expect(screen.queryByText('older-payment')).not.toBeInTheDocument();
    expect(screen.getAllByText('₹80').length).toBeGreaterThan(0);
    expect(screen.queryByText('↑ 32%')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Payment reporting period'), {
      target: { value: 'Last 90 Days' },
    });
    await screen.findAllByText('older-payment');
    expect(screen.getAllByText('₹280').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Send Receipt' })).not.toBeInTheDocument();
  });
  it('shows errors rather than zero financial summary or static charts', async () => {
    vi.mocked(api.getAllAdminPayments).mockRejectedValue(new Error('permission denied'));
    render(<AdminPayments />);
    await screen.findByText(/Payments could not be fully loaded/);
    expect(screen.queryByText('Revenue Trend')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/ })).toBeDisabled();
  });
  it('renders actual donut proportions, including unknown gateway in Other', async () => {
    const now = new Date().toISOString();
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([
      payment('unknown', now, { gateway: 'other-provider', amount: 25 }),
      payment('razorpay', now, { amount: 75 }),
    ]);
    const { container } = render(<AdminPayments />);
    await screen.findAllByText('unknown');
    const svg = container.querySelector('svg[viewBox="0 0 100 100"]')!;
    const circles = [...svg.querySelectorAll('circle')];
    expect(parseFloat(circles[1].getAttribute('stroke-dasharray')!)).toBeCloseTo(
      2 * Math.PI * 38 * 0.75
    );
    expect(parseFloat(circles[4].getAttribute('stroke-dasharray')!)).toBeCloseTo(
      2 * Math.PI * 38 * 0.25
    );
    expect(await screen.findByText('25%')).toBeInTheDocument();
  });
  it('toggles between Accrual (Payment Date) and Cash Flow (Refund Date) attribution mode', async () => {
    const now = new Date();
    const old = new Date(now.getTime() - 60 * 86400000).toISOString();
    const paymentRefundedNow = payment('old-payment-refunded-now', old, {
      refundAmount: 50,
      refundedAt: now.toISOString(),
      amount: 100,
    });
    vi.mocked(api.getAllAdminPayments).mockResolvedValue([
      payment('recent-payment', now.toISOString(), { amount: 200 }),
      paymentRefundedNow,
    ]);
    render(<AdminPayments />);
    await screen.findAllByText('recent-payment');

    // Default mode is accrual
    expect(screen.getByText(/Refunds are attributed to the original payment date/)).toBeInTheDocument();

    // Switch to Cash Flow mode
    fireEvent.click(screen.getByRole('button', { name: 'Cash flow attribution mode' }));
    expect(
      await screen.findByText(/Cash flow mode: Refunds are attributed to actual refund settlement date/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Disbursed Refunds:/)).toBeInTheDocument();
    expect(screen.getByText('-₹50')).toBeInTheDocument();
    expect(screen.getAllByText('₹150').length).toBeGreaterThan(0);
  });
});
