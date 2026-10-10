import { beforeEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), invoke: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { ...mocks, functions: { invoke: mocks.invoke } },
}));
import { getAppSettings, getPaymentGatewayConfig, sendTestEmail } from './admin.settings';
beforeEach(() => vi.clearAllMocks());
it('rejects production settings permission failures instead of returning local defaults', async () => {
  mocks.from.mockReturnValue({
    select: async () => ({ data: null, error: { message: 'permission denied' } }),
  });
  await expect(getAppSettings()).rejects.toThrow('permission denied');
});
it('propagates network failures', async () => {
  mocks.from.mockReturnValue({
    select: async () => {
      throw new Error('network disconnected');
    },
  });
  await expect(getAppSettings()).rejects.toThrow('network disconnected');
});
it('keeps a genuine empty backend result empty', async () => {
  mocks.from.mockReturnValue({ select: async () => ({ data: [], error: null }) });
  await expect(getAppSettings()).resolves.toEqual([]);
});
it('returns only authoritative records, with no demo defaults merged in', async () => {
  mocks.from.mockReturnValue({
    select: async () => ({
      data: [{ id: 'real', category: 'general', key: 'app_name', value: 'Saved Name' }],
      error: null,
    }),
  });
  const result = await getAppSettings();
  expect(result).toHaveLength(1);
  expect(result[0].value).toBe('Saved Name');
});
it('rejects payment gateway permission failures without local fallback', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'gateway access denied' } });
  await expect(getPaymentGatewayConfig()).rejects.toThrow('gateway access denied');
  expect(mocks.from).not.toHaveBeenCalled();
});
it('rejects unconfirmed empty gateway responses', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  await expect(getPaymentGatewayConfig()).rejects.toThrow('could not be loaded');
});
it('returns real gateway state without inventing an active gateway', async () => {
  mocks.rpc.mockResolvedValue({
    data: { gateway: 'razorpay', key_id: 'public_test_key', is_active: false, has_secret: false },
    error: null,
  });
  const result = await getPaymentGatewayConfig();
  expect(result.isActive).toBe(false);
  expect(result.keyId).toBe('public_test_key');
});
it.each([
  {},
  [],
  { gateway: 'stripe', key_id: 'key', is_active: true },
  { gateway: 'razorpay', key_id: 'key', is_active: 'false' },
  { gateway: 'razorpay', key_id: 42, is_active: true },
])('rejects malformed gateway configuration %j', async (data) => {
  mocks.rpc.mockResolvedValue({ data, error: null });
  await expect(getPaymentGatewayConfig()).rejects.toThrow('malformed');
});

it('does not fabricate email success after an Edge invocation error', async () => {
  mocks.invoke.mockResolvedValue({ data: null, error: { message: 'Delivery unavailable' } });
  expect((await sendTestEmail('help@test.invalid')).success).toBe(false);
});
it('does not fabricate email success after a thrown network failure', async () => {
  mocks.invoke.mockRejectedValueOnce(new Error('Offline'));
  expect((await sendTestEmail('help@test.invalid')).success).toBe(false);
});
it.each([null, {}, { success: false, error: 'Denied' }, { success: true }])(
  'requires an explicit email dispatch acknowledgement %j',
  async (data) => {
    mocks.invoke.mockResolvedValue({ data, error: null });
    expect((await sendTestEmail('help@test.invalid')).success).toBe(false);
  }
);
it('returns only a confirmed server message ID, not an invented probe ID', async () => {
  mocks.invoke.mockResolvedValue({
    data: { success: true, messageId: 'confirmed-fixture' },
    error: null,
  });
  expect(await sendTestEmail(' HELP@test.invalid ')).toEqual({
    success: true,
    messageId: 'confirmed-fixture',
  });
  expect(mocks.invoke).toHaveBeenCalledWith('send-test-email', {
    body: { recipient: 'help@test.invalid' },
  });
});
