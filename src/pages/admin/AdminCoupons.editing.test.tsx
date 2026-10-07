import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AdminCoupons } from './AdminCoupons';
import { api } from '@/services/api';
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/services/api', () => ({
  api: {
    getAdminCoupons: vi.fn(),
    getSubscriptionPlans: vi.fn(),
    createAdminCoupon: vi.fn(),
    updateAdminCoupon: vi.fn(),
    deleteAdminCoupon: vi.fn(),
  },
}));
const coupon = {
  id: 'real-coupon-id',
  code: 'SAVE20',
  description: 'Saved offer',
  discountType: 'fixed' as const,
  discountValue: 12,
  maxDiscountAmount: 15,
  minOrderAmount: 299,
  maxUses: 50,
  usedCount: 3,
  maxUsesPerUser: 2,
  applicablePlanId: 'plan-actual',
  validFrom: '2026-10-01T08:00:00.000Z',
  validUntil: '2026-12-01T18:00:00.000Z',
  isActive: false,
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
};
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(api.getAdminCoupons).mockResolvedValue([coupon]);
  vi.mocked(api.getSubscriptionPlans).mockResolvedValue([
    { id: 'plan-actual', title: 'Actual plan', price: 10 } as any,
  ]);
  vi.mocked(api.updateAdminCoupon).mockResolvedValue({ success: true });
  vi.mocked(api.createAdminCoupon).mockResolvedValue({ success: true, coupon });
});
async function edit() {
  render(<AdminCoupons />);
  const matches = await screen.findAllByText('SAVE20');
  fireEvent.click(matches.find((n) => n.closest('tr'))!);
  await screen.findByRole('button', { name: 'Save Coupon Changes' });
}
describe('Coupon editing integrity', () => {
  it('hydrates all restrictions and updates the real ID instead of creating a duplicate', async () => {
    await edit();
    expect(screen.getByLabelText('Discount value')).toHaveValue(12);
    expect(screen.getByLabelText('Maximum discount')).toHaveValue(15);
    expect(screen.getByLabelText('Applicable plan')).toHaveValue('plan-actual');
    expect(screen.getByLabelText('Usage limit')).toHaveValue(50);
    expect(screen.getByLabelText('Valid until')).toHaveValue('2026-12-01');
    fireEvent.change(screen.getByLabelText('Coupon description'), {
      target: { value: 'Updated offer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Coupon Changes' }));
    await waitFor(() =>
      expect(api.updateAdminCoupon).toHaveBeenCalledWith(
        'real-coupon-id',
        expect.objectContaining({
          description: 'Updated offer',
          discountType: 'fixed',
          discountValue: 12,
          maxDiscountAmount: 15,
          minOrderAmount: 299,
          maxUses: 50,
          maxUsesPerUser: 2,
          applicablePlanId: 'plan-actual',
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
          isActive: false,
        })
      )
    );
    expect(api.createAdminCoupon).not.toHaveBeenCalled();
  });
  it('preserves edited form and ID on failed update', async () => {
    vi.mocked(api.updateAdminCoupon).mockResolvedValue({
      success: false,
      error: 'permission denied',
    });
    await edit();
    fireEvent.change(screen.getByLabelText('Coupon description'), { target: { value: 'Draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Coupon Changes' }));
    await screen.findByText('permission denied');
    expect(screen.getByLabelText('Coupon description')).toHaveValue('Draft');
    expect(screen.getByRole('button', { name: 'Save Coupon Changes' })).toBeEnabled();
    expect(api.createAdminCoupon).not.toHaveBeenCalled();
  });
  it('locks synchronous duplicate submissions until confirmed response', async () => {
    let resolve!: (x: { success: boolean }) => void;
    vi.mocked(api.updateAdminCoupon).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    await edit();
    const form = screen.getByLabelText('Coupon code').closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(api.updateAdminCoupon).toHaveBeenCalledTimes(1);
    resolve({ success: true });
    await screen.findByText(/updated successfully/);
  });
  it('Cancel returns to create mode without modifying backend', async () => {
    await edit();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Save Coupon Changes' })).not.toBeInTheDocument();
    expect(api.updateAdminCoupon).not.toHaveBeenCalled();
  });
  it('clears optional restrictions explicitly rather than leaving old backend values', async () => {
    await edit();
    fireEvent.change(screen.getByLabelText('Maximum discount'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Usage limit'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Applicable plan'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Valid until'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Coupon Changes' }));
    await waitFor(() =>
      expect(api.updateAdminCoupon).toHaveBeenCalledWith(
        coupon.id,
        expect.objectContaining({
          maxDiscountAmount: 0,
          maxUses: 0,
          applicablePlanId: '',
          validUntil: '',
        })
      )
    );
  });
});
