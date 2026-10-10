import { beforeEach, it, expect, vi } from 'vitest';
const m = vi.hoisted(() => ({ invoke: vi.fn(), configured: true }));
vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return m.configured;
  },
  supabaseRuntime: { functions: { invoke: m.invoke } },
}));
import { sendFast2Sms, checkFast2SmsBalance } from './smsGateway';
import { sendFcmPush, sendTestPushNotification } from './fcmGateway';
beforeEach(() => {
  m.invoke.mockReset();
  m.configured = true;
});
it('never sends browser provider secrets and requires backend acceptance', async () => {
  m.invoke.mockResolvedValue({
    data: {
      success: true,
      message: 'Accepted; delivery unverified',
      recipientCount: 1,
      requestId: 'fixture',
    },
    error: null,
  });
  expect(
    (
      await sendFast2Sms({
        apiKey: 'must-not-leave-browser',
        numbers: ['9876543210'],
        message: 'fixture',
      })
    ).success
  ).toBe(true);
  const [name, options] = m.invoke.mock.calls[0];
  expect(name).toBe('notification-gateway');
  expect(JSON.stringify(options)).not.toContain('must-not-leave-browser');
  expect(options.body).toMatchObject({
    action: 'sms',
    numbers: ['9876543210'],
    message: 'fixture',
  });
  expect(options.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
});
it('fails closed on network failure without simulated delivery or fabricated balance', async () => {
  m.invoke.mockRejectedValue(new TypeError('Failed to fetch'));
  const sms = await sendFast2Sms({ numbers: ['9876543210'], message: 'fixture' });
  expect(sms.success).toBe(false);
  expect(sms.recipientCount).toBe(0);
  expect(sms.isSimulated).toBeUndefined();
  const balance = await checkFast2SmsBalance('ignored-key');
  expect(balance.success).toBe(false);
  expect(balance.walletBalance).toBeUndefined();
});
it('rejects no recipients or bulk recipients without a fallback number', async () => {
  for (const numbers of [[], ['bad'], ['9876543210', '9876543211']])
    expect((await sendFast2Sms({ numbers, message: 'fixture' })).success).toBe(false);
  expect(m.invoke).not.toHaveBeenCalled();
});
it('does not convert structured backend rejection to success', async () => {
  m.invoke.mockResolvedValue({ data: { success: false, message: 'Not configured' }, error: null });
  expect((await sendFcmPush({ title: 'Fixture', body: 'Fixture' })).success).toBe(false);
});
it('never broadcasts a test to all students or broadens a paid audience', async () => {
  expect((await sendTestPushNotification('ignored-secret')).success).toBe(false);
  expect(
    (await sendFcmPush({ title: 'Fixture', body: 'Fixture', topic: 'pro_students' })).success
  ).toBe(false);
  expect(m.invoke).not.toHaveBeenCalled();
});
it('keeps demo/offline mode non-delivering', async () => {
  m.configured = false;
  expect((await checkFast2SmsBalance()).success).toBe(false);
  expect(m.invoke).not.toHaveBeenCalled();
});
