import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AdminRefundModal } from './AdminRefundModal';
import type { AdminPaymentRow } from '@/types';

vi.mock('@/services/api', () => ({
  api: { processPaymentRefund: vi.fn() },
}));

afterEach(cleanup);

const payment: AdminPaymentRow = {
  id: 'payment-1',
  userId: 'student-1',
  studentName: 'Test Student',
  studentEmail: 'student@example.com',
  amount: 199,
  currency: 'INR',
  gateway: 'razorpay',
  transactionId: 'pay_test',
  status: 'completed',
  createdAt: '2026-10-01T00:00:00Z',
};

const callbacks = {
  onClose: vi.fn(),
  onRefundSuccess: vi.fn(),
};

describe('AdminRefundModal lifecycle', () => {
  it('opens from a closed modal with no payment without changing hook order', () => {
    const view = render(
      <AdminRefundModal {...callbacks} payment={null} isOpen={false} />
    );
    expect(screen.queryByText('Process Payment Refund')).not.toBeInTheDocument();

    view.rerender(
      <AdminRefundModal {...callbacks} payment={payment} isOpen />
    );
    expect(screen.getByText('Process Payment Refund')).toBeInTheDocument();
    expect(screen.getByLabelText(/Refund Amount/)).toHaveValue(199);
  });

  it('resets refund form state when closed and reopened', () => {
    const view = render(
      <AdminRefundModal {...callbacks} payment={payment} isOpen />
    );
    fireEvent.change(screen.getByLabelText(/Refund Amount/), {
      target: { value: '50' },
    });
    expect(screen.getByLabelText(/Refund Amount/)).toHaveValue(50);

    view.rerender(
      <AdminRefundModal {...callbacks} payment={payment} isOpen={false} />
    );
    view.rerender(
      <AdminRefundModal {...callbacks} payment={payment} isOpen />
    );
    expect(screen.getByLabelText(/Refund Amount/)).toHaveValue(199);
  });

  it('initializes the amount for a different payment while open', () => {
    const view = render(
      <AdminRefundModal {...callbacks} payment={payment} isOpen />
    );
    fireEvent.change(screen.getByLabelText(/Refund Amount/), {
      target: { value: '50' },
    });
    view.rerender(
      <AdminRefundModal
        {...callbacks}
        payment={{ ...payment, id: 'payment-2', amount: 499 }}
        isOpen
      />
    );
    expect(screen.getByLabelText(/Refund Amount/)).toHaveValue(499);
  });

  it('handles a missing payment while open and a subsequent valid payment', () => {
    const view = render(
      <AdminRefundModal {...callbacks} payment={payment} isOpen />
    );
    view.rerender(
      <AdminRefundModal {...callbacks} payment={null} isOpen />
    );
    expect(screen.queryByText('Process Payment Refund')).not.toBeInTheDocument();
    view.rerender(
      <AdminRefundModal {...callbacks} payment={payment} isOpen />
    );
    expect(screen.getByLabelText(/Refund Amount/)).toHaveValue(199);
  });
});