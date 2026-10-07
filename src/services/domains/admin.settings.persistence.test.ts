import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ rpc: vi.fn(), rows: [] as any }));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    rpc: m.rpc,
    from: () => ({ select: async () => ({ data: m.rows, error: null }) }),
  },
}));
import { getAppSettings, updateAppSettings, updatePaymentGatewayConfig } from './admin.settings';
import { localPaymentGateways } from './localStore';
import {
  validateGeneralSettings,
  validateBrandColors,
  validateSmtpReference,
  validateSettingsImage,
} from './admin.settingsForm';
const payload = { gateway: 'razorpay', keyId: 'rzp_test_fixture', isActive: true };
beforeEach(() => {
  vi.resetAllMocks();
  m.rows = [];
  m.rpc.mockResolvedValue({
    data: { success: true, gateway: 'razorpay', key_id: 'rzp_test_fixture', is_active: true },
    error: null,
  });
});
describe('Confirmed Settings persistence', () => {
  it('uses one atomic payment RPC without prewriting public settings or local caches', async () => {
    const before = structuredClone(localPaymentGateways);
    expect(await updatePaymentGatewayConfig(payload)).toEqual({ success: true });
    expect(m.rpc).toHaveBeenCalledTimes(1);
    expect(m.rpc).toHaveBeenCalledWith('admin_update_payment_gateway', {
      p_gateway: 'razorpay',
      p_key_id: 'rzp_test_fixture',
      p_key_secret: null,
      p_webhook_secret: null,
      p_is_active: true,
    });
    expect(localPaymentGateways).toEqual(before);
  });
  it.each([
    'Unauthorized',
    'Could not find RPC in schema cache',
    'Failed to fetch',
    'Network unavailable',
  ])('never reports production failure %s as a local success', async (message) => {
    const before = structuredClone(localPaymentGateways);
    m.rpc.mockResolvedValue({ data: null, error: { message } });
    expect((await updatePaymentGatewayConfig(payload)).success).toBe(false);
    expect(localPaymentGateways).toEqual(before);
    expect(m.rpc).toHaveBeenCalledTimes(1);
  });
  it.each([
    null,
    { success: true },
    { success: false },
    { success: true, gateway: 'razorpay', key_id: 'wrong', is_active: true },
    { success: true, gateway: 'razorpay', key_id: 'rzp_test_fixture', is_active: false },
  ])('requires the actual returned key and active flag: %j', async (data) => {
    m.rpc.mockResolvedValue({ data, error: null });
    expect((await updatePaymentGatewayConfig(payload)).success).toBe(false);
  });
  it('rejects unsupported/invalid gateway input and secret writes before requesting persistence', async () => {
    expect((await updatePaymentGatewayConfig({ ...payload, keyId: 'fake' })).success).toBe(false);
    expect((await updatePaymentGatewayConfig({ ...payload, keyId: '' })).success).toBe(false);
    expect(
      (await updatePaymentGatewayConfig({ ...payload, keySecret: 'fixture-secret' })).success
    ).toBe(false);
    expect((await updatePaymentGatewayConfig({ ...payload, gateway: 'unsupported' })).success).toBe(
      false
    );
    expect(m.rpc).not.toHaveBeenCalled();
  });
  it('rejects invalid settings batches and requires a confirmed batch count', async () => {
    expect((await updateAppSettings([])).success).toBe(false);
    expect((await updateAppSettings([{ id: 'smtp_password', value: 'fixture' }])).success).toBe(
      false
    );
    expect(
      (
        await updateAppSettings([
          { id: 'x', value: 1 },
          { id: 'x', value: 2 },
        ])
      ).success
    ).toBe(false);
    expect(m.rpc).not.toHaveBeenCalled();
    m.rpc.mockResolvedValue({ data: { success: true, updated_count: 0 }, error: null });
    expect((await updateAppSettings([{ id: 'general_app_name', value: 'Fixture' }])).success).toBe(
      false
    );
  });
  it('does not present an unconfirmed load response as editable defaults', async () => {
    m.rows = null;
    await expect(getAppSettings()).rejects.toThrow('not confirmed');
    m.rows = [];
    expect(await getAppSettings()).toEqual([]);
  });
  it('validates real general, SMTP, brand color and image form values', () => {
    expect(() =>
      validateGeneralSettings({
        name: ' ',
        website: 'https://example.test',
        adminEmail: '',
        supportEmail: '',
      })
    ).toThrow('Platform name');
    expect(() =>
      validateGeneralSettings({
        name: 'Fixture',
        website: 'javascript:alert(1)',
        adminEmail: '',
        supportEmail: '',
      })
    ).toThrow('HTTPS');
    expect(() =>
      validateGeneralSettings({
        name: 'Fixture',
        website: 'https://example.test',
        adminEmail: 'bad',
        supportEmail: '',
      })
    ).toThrow('email');
    expect(() => validateBrandColors(['invalid'])).toThrow('hexadecimal');
    expect(() => validateBrandColors(['#112233'])).not.toThrow();
    expect(() => validateSmtpReference('smtp.example.test', '0')).toThrow('port');
    expect(() => validateSmtpReference('smtp.example.test', '587')).not.toThrow();
    expect(() =>
      validateSettingsImage(new File(['svg'], 'x.svg', { type: 'image/svg+xml' }), 'logo')
    ).toThrow('PNG or JPEG');
    expect(() =>
      validateSettingsImage(
        new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' }),
        'logo'
      )
    ).toThrow('2 MB');
    expect(() =>
      validateSettingsImage(new File(['ico'], 'x.ico', { type: 'image/x-icon' }), 'favicon')
    ).toThrow('PNG');
  });
});
