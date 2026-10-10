import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
const m = vi.hoisted(() => ({
  history: vi.fn(),
  validate: vi.fn(),
  create: vi.fn(),
  user: { id: 'u', email: 'u@example.test', fullName: 'Student' },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: m.user, refreshProStatus: vi.fn() }),
}));
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    plans: [
      {
        id: 'pro_1_year',
        title: 'Pro',
        price: 100,
        durationDays: 365,
        features: [],
        isActive: true,
      },
    ],
    subscriptionDetails: { isActive: false, hasSubscription: false },
    refreshSubscription: vi.fn(),
  }),
}));
vi.mock('@/services/api', () => ({
  api: {
    getStudentPaymentHistory: m.history,
    validateCoupon: m.validate,
    createRazorpayOrder: m.create,
  },
}));
vi.mock('@/components/student/StudentSupportModal', () => ({ StudentSupportModal: () => null }));
import { Subscription } from './Subscription';
describe('Subscription truthful payment UI', () => {
  beforeEach(() => {
    m.history.mockReset().mockResolvedValue([]);
    m.validate.mockReset();
    m.create.mockReset();
  });
  it('clearly disables unsupported coupon checkout instead of promising a discount', async () => {
    render(
      <MemoryRouter>
        <Subscription />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Coupon checkout unavailable')).toBeDisabled()
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByText(/Purchases use the listed plan price/)).toBeInTheDocument();
    expect(m.validate).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });
  it('shows history errors and supports retry rather than false empty history', async () => {
    m.history.mockRejectedValueOnce(new Error('Connection unavailable'));
    render(
      <MemoryRouter>
        <Subscription />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Connection unavailable')
    );
    expect(screen.queryByText(/No payment records found/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry payment history' }));
    await waitFor(() => expect(screen.getByText(/No payment records found/)).toBeInTheDocument());
    expect(m.history).toHaveBeenCalledTimes(2);
  });
});
