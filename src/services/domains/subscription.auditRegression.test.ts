import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  response: { data: [] as unknown, error: null as unknown },
  invoke: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    from: () => ({ select: () => ({ order: async () => m.response }) }),
    functions: { invoke: m.invoke },
    rpc: m.rpc,
  },
}));
import { subscriptionApi } from './subscription';
describe('Payment integrity boundaries', () => {
  beforeEach(() => {
    m.response = { data: [], error: null };
    m.invoke.mockReset();
    m.rpc.mockReset();
    localStorage.clear();
    localStorage.setItem('practicekoro_payments', JSON.stringify([{ id: 'phantom' }]));
    localStorage.setItem('practicekoro_is_pro', 'true');
  });
  it('returns real empty data instead of local payment rows', async () => {
    expect(await subscriptionApi.getStudentPaymentHistory()).toEqual([]);
  });
  it.each([
    { data: null, error: null },
    { data: [], error: { message: 'denied' } },
    { data: {}, error: null },
  ])('throws on failed/incomplete production history %j', async (response) => {
    m.response = response;
    await expect(subscriptionApi.getStudentPaymentHistory()).rejects.toThrow();
  });
  it('does not call insecure legacy RPC when Edge verification fails', async () => {
    m.invoke.mockResolvedValue({ data: null, error: { message: 'offline' } });
    await expect(
      subscriptionApi.verifyRazorpayPayment({
        orderId: 'o',
        paymentId: 'p',
        signature: 's',
        planId: 'plan',
      })
    ).rejects.toThrow(/Do not pay again/);
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it('blocks checkout when the backend security version is not deployed', async () => {
    m.invoke.mockResolvedValue({ data: { order_id: 'order_1', amount: 100 }, error: null });
    await expect(subscriptionApi.createRazorpayOrder('plan')).rejects.toThrow(/security update/);
  });
  it('accepts orders from the coordinated security rollout', async () => {
    m.invoke.mockResolvedValue({
      data: { verification_version: 2, order_id: 'order_1', amount: 100, key_id: 'key' },
      error: null,
    });
    expect(await subscriptionApi.createRazorpayOrder('plan')).toMatchObject({
      orderId: 'order_1',
      amount: 100,
    });
  });
  it('accepts confirmed service verification', async () => {
    m.invoke.mockResolvedValue({
      data: {
        success: true,
        subscriptionId: 's',
        status: 'active',
        startsAt: '2026-10-01',
        expiresAt: '2027-10-01',
      },
      error: null,
    });
    expect(
      await subscriptionApi.verifyRazorpayPayment({
        orderId: 'o',
        paymentId: 'p',
        signature: 's',
        planId: 'plan',
      })
    ).toMatchObject({ success: true, subscriptionId: 's' });
    expect(m.rpc).not.toHaveBeenCalled();
  });
});
