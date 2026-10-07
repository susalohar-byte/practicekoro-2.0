import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  configured: true,
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() { return mocks.configured; },
  supabaseRuntime: { from: mocks.from },
}));
import { adminCommerceApi } from './adminCommerce';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured = true;
  const query = {
    update: mocks.update, eq: mocks.eq, select: mocks.select, maybeSingle: mocks.maybeSingle,
  };
  for (const method of [mocks.from, mocks.update, mocks.eq, mocks.select]) {
    method.mockReturnValue(query);
  }
});

describe('persisted subscription cancellation', () => {
  it('cancels only the selected active subscription and returns persisted expiry', async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id: 's1', status: 'cancelled', expires_at: '2026-10-01T00:00:00Z' }, error: null,
    });
    expect(await adminCommerceApi.cancelSubscription('s1')).toEqual({
      success: true, expiresAt: '2026-10-01T00:00:00Z',
    });
    expect(mocks.from).toHaveBeenCalledWith('subscriptions');
    expect(mocks.eq).toHaveBeenCalledWith('id', 's1');
    expect(mocks.eq).toHaveBeenCalledWith('status', 'active');
    expect(mocks.update).toHaveBeenCalledWith({
      status: 'cancelled', expires_at: expect.any(String),
    });
    expect(Date.parse(mocks.update.mock.calls[0][0].expires_at)).toBeLessThanOrEqual(Date.now());
  });

  it('does not report success for RLS denial', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: 'RLS denied' } });
    expect(await adminCommerceApi.cancelSubscription('s1')).toEqual({
      success: false, error: 'RLS denied',
    });
  });

  it('does not report success when no active subscription row was updated', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await adminCommerceApi.cancelSubscription('missing')).success).toBe(false);
  });

  it('does not report success for an unexpected returned subscription', async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id: 'other', status: 'cancelled' }, error: null,
    });
    expect((await adminCommerceApi.cancelSubscription('s1')).success).toBe(false);
  });

  it('reports transport errors rather than success', async () => {
    mocks.maybeSingle.mockRejectedValue(new Error('Network error'));
    expect(await adminCommerceApi.cancelSubscription('s1')).toEqual({
      success: false, error: 'Network error',
    });
  });

  it('rejects missing IDs and an unconfigured backend', async () => {
    expect((await adminCommerceApi.cancelSubscription('')).success).toBe(false);
    mocks.configured = false;
    expect((await adminCommerceApi.cancelSubscription('s1')).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});