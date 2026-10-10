import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCoupons } from './AdminCoupons';
import { api } from '@/services/api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', fullName: 'Super Admin', email: 'admin@practicekoro.com' },
    role: 'admin',
    isPro: true,
    isAdmin: true,
    adminRole: 'super_admin',
    hasPermission: () => true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    getAdminCoupons: vi.fn(),
    createAdminCoupon: vi.fn(),
    updateAdminCoupon: vi.fn(),
    deleteAdminCoupon: vi.fn(),
    getSubscriptionPlans: vi.fn().mockResolvedValue([]),
  },
}));

describe('AdminCoupons Page', () => {
  const mockCoupons = [
    {
      id: 'c1',
      code: 'WELCOME50',
      description: 'Introductory discount',
      discountType: 'fixed' as const,
      discountValue: 50,
      minOrderAmount: 199,
      maxUses: 500,
      usedCount: 30,
      maxUsesPerUser: 1,
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2026-12-31T23:59:59Z',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'c2',
      code: 'FESTIVE20',
      description: 'Festive offer',
      discountType: 'percentage' as const,
      discountValue: 20,
      maxDiscountAmount: 100,
      minOrderAmount: 299,
      maxUses: 1000,
      usedCount: 75,
      maxUsesPerUser: 1,
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2026-12-31T23:59:59Z',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getAdminCoupons).mockResolvedValue(mockCoupons);
  });

  const renderCoupons = () =>
    render(
      <MemoryRouter>
        <AdminCoupons />
      </MemoryRouter>
    );

  it('renders metrics and coupon list', async () => {
    renderCoupons();

    await screen.findByRole('heading', { name: /^Coupons$/i });
    expect(screen.getAllByText('WELCOME50').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FESTIVE20').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹50/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/20%/).length).toBeGreaterThan(0);
  });

  it('filters coupons by search term', async () => {
    renderCoupons();

    await waitFor(() => {
      expect(screen.getAllByText('FESTIVE20').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/search by code/i);
    fireEvent.change(searchInput, { target: { value: 'FESTIVE' } });

    expect(screen.getAllByText('FESTIVE20').length).toBeGreaterThan(0);
  });

  it('submits new coupon via the create form panel', async () => {
    vi.mocked(api.createAdminCoupon).mockResolvedValueOnce({
      success: true,
      coupon: {
        id: 'c3',
        code: 'NEWUSER50',
        description: 'Flat ₹50 introductory off for new students',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 199,
        maxUses: 500,
        usedCount: 0,
        maxUsesPerUser: 1,
        validFrom: '2026-03-18T00:00:00Z',
        isActive: true,
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      },
    });

    renderCoupons();

    await waitFor(() => {
      expect(screen.getByText('Create New Coupon')).toBeInTheDocument();
    });

    // Fill form in the side panel
    const codeInput = screen.getByLabelText(/coupon code/i);
    fireEvent.change(codeInput, { target: { value: 'NEWUSER50' } });

    const fixedBtn = screen.getByRole('button', { name: /fixed amount/i });
    fireEvent.click(fixedBtn);

    const submitBtn = screen.getAllByRole('button', { name: /^Create Coupon$/i }).find(b => b.getAttribute('type') === 'submit')!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createAdminCoupon).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NEWUSER50',
          discountType: 'fixed',
        })
      );
    });
  });

  it('deletes coupon via action menu', async () => {
    vi.mocked(api.deleteAdminCoupon).mockResolvedValueOnce({ success: true });

    renderCoupons();

    await waitFor(() => {
      expect(screen.getAllByText('FESTIVE20').length).toBeGreaterThan(0);
    });

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const menuBtn = within(firstDataRow).getByRole('button');
    fireEvent.click(menuBtn);

    const deleteBtn = await screen.findByRole('button', { name: /^Delete$/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteAdminCoupon).toHaveBeenCalledWith('c1');
    });
  });
});
