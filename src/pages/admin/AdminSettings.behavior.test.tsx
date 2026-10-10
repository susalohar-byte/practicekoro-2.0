import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({
  settings: vi.fn(),
  gateway: vi.fn(),
  update: vi.fn(),
  pay: vi.fn(),
  log: vi.fn(),
  refresh: vi.fn(),
  upload: vi.fn(),
  avatarUpload: vi.fn(),
  profile: vi.fn(),
  profileAvailable: true,
  avatarUrl: '',
  role: 'super_admin',
}));
vi.mock('@/services/api', () => ({
  api: {
    getAppSettings: m.settings,
    getPaymentGatewayConfig: m.gateway,
    updateAppSettings: m.update,
    updatePaymentGatewayConfig: m.pay,
    logAdminActivity: m.log,
  },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'fixture-admin', role: 'admin', avatarUrl: m.avatarUrl },
    adminRole: m.role,
    updateProfile: m.profileAvailable ? m.profile : undefined,
  }),
}));
vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({ checkMaintenanceMode: m.refresh }),
}));
vi.mock('@/services/domains/admin.questions', () => ({
  uploadQuestionImage: m.upload,
  uploadUserAvatar: m.avatarUpload,
}));
import { AdminSettings } from './AdminSettings';
const initial = [
  { id: 'general_app_name', key: 'app_name', value: 'Saved Name' },
  { id: 'general_website_url', key: 'website_url', value: 'https://example.test' },
  { id: 'general_admin_email', key: 'admin_email', value: 'admin@example.test' },
  { id: 'general_support_email', key: 'support_email', value: 'support@example.test' },
  { id: 'platform_description', key: 'platform_description', value: 'Actual description' },
  {
    id: 'general_platform_logo',
    key: 'general_platform_logo',
    value: 'https://example.test/logo.png',
  },
  { id: 'general_favicon', key: 'general_favicon', value: 'https://example.test/icon.png' },
  { id: 'smtp_host', key: 'smtp_host', value: 'smtp.example.test' },
  { id: 'smtp_port', key: 'smtp_port', value: 2525 },
  { id: 'smtp_username', key: 'smtp_username', value: 'mail@example.test' },
];
const mount = async () => {
  const r = render(<AdminSettings />);
  await screen.findByDisplayValue('Saved Name');
  return r;
};
const tab = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp('^' + name) }));
beforeEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
  m.role = 'super_admin';
  m.profileAvailable = true;
  m.avatarUrl = '';
  m.settings.mockResolvedValue(structuredClone(initial));
  m.gateway.mockResolvedValue({ keyId: 'rzp_test_fixture', isActive: false });
  m.update.mockResolvedValue({ success: true });
  m.pay.mockResolvedValue({ success: true });
  m.refresh.mockResolvedValue(false);
  m.upload.mockResolvedValue('https://example.test/new.png');
  m.avatarUpload.mockResolvedValue('https://example.test/avatars/fixture-admin/new.png');
  localStorage.clear();
  sessionStorage.clear();
});
describe('Truthful Settings workflows', () => {
  it('uses the owned-avatar helper and requires the profile callback to confirm the saved avatar', async () => {
    const avatarUrl = 'https://example.test/avatars/fixture-admin/new.png';
    m.profile.mockResolvedValue({ error: null, user: { id: 'fixture-admin', avatarUrl } });
    await mount();
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload profile picture'), {
      target: { files: [file] },
    });
    expect(await screen.findByRole('status')).toHaveTextContent('profile picture updated');
    expect(m.avatarUpload).toHaveBeenCalledWith(file, 'fixture-admin');
    expect(m.profile).toHaveBeenCalledWith({ avatarUrl });
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });
  it('preserves the previous avatar and reports profile-save rejection without success', async () => {
    m.avatarUrl = 'https://example.test/avatars/fixture-admin/old.png';
    m.profile.mockResolvedValue({ error: new Error('Profile denied') });
    await mount();
    fireEvent.change(screen.getByLabelText('Upload profile picture'), {
      target: { files: [new File(['png'], 'avatar.png', { type: 'image/png' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Profile denied');
    expect(screen.getByAltText('Super Admin')).toHaveAttribute('src', m.avatarUrl);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('does not upload an avatar when profile persistence is unavailable', async () => {
    m.profileAvailable = false;
    await mount();
    fireEvent.change(screen.getByLabelText('Upload profile picture'), {
      target: { files: [new File(['png'], 'avatar.png', { type: 'image/png' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Profile update is unavailable');
    expect(m.avatarUpload).not.toHaveBeenCalled();
    expect(m.upload).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('does not claim avatar removal when profile persistence is unavailable', async () => {
    m.profileAvailable = false;
    m.avatarUrl = 'https://example.test/avatars/fixture-admin/old.png';
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Remove profile picture' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No removal was confirmed');
    expect(screen.getByAltText('Super Admin')).toHaveAttribute('src', m.avatarUrl);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('hydrates description, assets and SMTP references instead of overwriting them with examples', async () => {
    await mount();
    expect(screen.getByLabelText('Platform Description')).toHaveValue('Actual description');
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', 'https://example.test/logo.png');
    expect(screen.getByAltText('Favicon')).toHaveAttribute('src', 'https://example.test/icon.png');
    expect(screen.getByLabelText('SMTP Host')).toHaveValue('smtp.example.test');
    expect(screen.getByLabelText('SMTP Port')).toHaveValue('2525');
    expect(screen.queryByLabelText('SMTP Password')).not.toBeInTheDocument();
  });
  it('does not invent a live gateway key when the backend returns an empty configuration', async () => {
    m.gateway.mockResolvedValue({ keyId: '', isActive: false });
    await mount();
    tab('Payments');
    expect(screen.getByLabelText('Razorpay Key ID')).toHaveValue('');
  });
  it('rejects invalid general input before calling the backend and preserves it', async () => {
    await mount();
    fireEvent.change(screen.getByLabelText('Platform Name'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Platform name is required');
    expect(m.update).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Platform Name')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Platform Name'), { target: { value: 'Saved Name' } });
    fireEvent.change(screen.getByLabelText('Platform Description'), {
      target: { value: 'x'.repeat(301) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('may not exceed 300');
    expect(m.update).not.toHaveBeenCalled();
  });
  it('reports structured save failure as an accessible error rather than a success badge', async () => {
    m.update.mockResolvedValue({ success: false, error: 'Permission denied' });
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.queryByText(/Settings saved successfully/)).not.toBeInTheDocument();
  });
  it('saves only brand preview colors from the Branding tab', async () => {
    await mount();
    tab('Branding');
    fireEvent.click(screen.getByRole('button', { name: 'Save Branding Settings' }));
    await waitFor(() => expect(m.update).toHaveBeenCalled());
    expect(m.update.mock.calls[0][0].map((x: any) => x.id)).toEqual([
      'primary_color',
      'secondary_color',
      'accent_color',
      'theme_mode',
      'font_family',
    ]);
  });
  it('calls the real payment action and checks its structured failure without prewriting general settings', async () => {
    m.pay.mockResolvedValue({ success: false, error: 'Gateway permission denied' });
    await mount();
    tab('Payments');
    fireEvent.change(screen.getByLabelText('Razorpay Key ID'), {
      target: { value: 'rzp_live_updated' },
    });
    fireEvent.click(screen.getByRole('switch', { name: 'Gateway enabled' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Payment Settings' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Gateway permission denied');
    expect(m.pay).toHaveBeenCalledWith({
      gateway: 'razorpay',
      keyId: 'rzp_live_updated',
      isActive: true,
    });
    expect(m.update).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Razorpay Key ID')).toHaveValue('rzp_live_updated');
  });
  it('prevents repeated payment submissions while preserving the pending draft', async () => {
    let resolve!: (x: any) => void;
    m.pay.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    await mount();
    tab('Payments');
    const save = screen.getByRole('button', { name: 'Save Payment Settings' });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(m.pay).toHaveBeenCalledTimes(1);
    expect(save).toBeDisabled();
    await act(async () => resolve({ success: true }));
    expect(await screen.findByRole('status')).toHaveTextContent('confirmed by the backend');
  });
  it('removes an asset only after a confirmed backend save', async () => {
    m.update.mockResolvedValueOnce({ success: false, error: 'Asset denied' });
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Remove platform logo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Asset denied');
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove platform logo' }));
    await waitFor(() => expect(screen.queryByAltText('Logo')).not.toBeInTheDocument());
    expect(m.update).toHaveBeenLastCalledWith([{ id: 'general_platform_logo', value: null }]);
  });
  it('keeps the previous asset if durable upload metadata cannot be saved', async () => {
    m.update.mockResolvedValue({ success: false, error: 'Metadata denied' });
    await mount();
    fireEvent.change(screen.getByLabelText('Upload platform logo'), {
      target: { files: [new File(['png'], 'valid.png', { type: 'image/png' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Metadata denied');
    expect(m.upload).toHaveBeenCalledTimes(1);
    expect(m.update).toHaveBeenCalledWith([
      { id: 'general_platform_logo', value: 'https://example.test/new.png' },
    ]);
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', 'https://example.test/logo.png');
    expect(screen.getByAltText('Favicon')).toHaveAttribute('src', 'https://example.test/icon.png');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('rejects unsafe/unsupported image formats before upload', async () => {
    await mount();
    fireEvent.change(screen.getByLabelText('Upload platform logo'), {
      target: { files: [new File(['svg'], 'logo.svg', { type: 'image/svg+xml' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Logo must be PNG or JPEG');
    expect(m.upload).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', 'https://example.test/logo.png');
  });
  it('keeps read-only staff controls disabled without trusting client mutation permissions', async () => {
    m.role = 'content_writer';
    await mount();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    expect(screen.getByLabelText('Platform Name')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(m.update).not.toHaveBeenCalled();
  });
  it('enables connected editors while keeping unimplemented security and email delivery unavailable', async () => {
    await mount();
    tab('SEO & Meta');
    expect(screen.getByRole('button', { name: 'Save SEO Settings' })).toBeEnabled();
    tab('Security');
    expect(screen.getByRole('button', { name: 'Update Security Policies' })).toBeDisabled();
    tab('Integrations');
    expect(
      screen.getByRole('heading', { name: 'SMS & Push Notification Gateways' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Gateways' })).toBeEnabled();
    tab('Email & Notifications');
    expect(screen.getAllByText('Not managed here')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Send Sample Notification' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Send Sample Notification' }));
    expect(m.update).not.toHaveBeenCalled();
  });
  it('reports integration save rejection without claiming a successful database save', async () => {
    m.update.mockResolvedValue({ success: false, error: 'Gateway permission denied' });
    await mount();
    tab('Integrations');
    fireEvent.click(screen.getByRole('button', { name: 'Save Gateways' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Gateway permission denied');
    expect(m.update).toHaveBeenCalledTimes(1);
    expect(m.update.mock.calls[0][0].map((row: { id: string }) => row.id)).toEqual([
      'gateway_fast2sms_enabled',
      'gateway_fast2sms_route',
      'gateway_fast2sms_sender_id',
      'gateway_fcm_enabled',
      'gateway_fcm_project_id',
      'gateway_fcm_vapid_key',
    ]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(m.refresh).not.toHaveBeenCalled();
  });
  it('keeps integration save unavailable to read-only staff', async () => {
    m.role = 'content_writer';
    await mount();
    tab('Integrations');
    const save = screen.getByRole('button', { name: 'Save Gateways' });
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(m.update).not.toHaveBeenCalled();
  });
  it('clears only the named offline cache, preserving sign-in/session state', async () => {
    localStorage.setItem('practicekoro_offline_cache', 'cached');
    sessionStorage.setItem('auth-session', 'keep');
    sessionStorage.setItem('draft', 'keep');
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Cache' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Clear Cache' }));
    expect(localStorage.getItem('practicekoro_offline_cache')).toBeNull();
    expect(sessionStorage.getItem('auth-session')).toBe('keep');
    expect(sessionStorage.getItem('draft')).toBe('keep');
  });
  it('reports cache failure truthfully when browser storage is unavailable', async () => {
    await mount();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Cache' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Clear Cache' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be cleared');
    expect(screen.queryByText(/Local offline cache cleared/)).not.toBeInTheDocument();
  });
  it('distinguishes a successful save from a failed post-save refresh', async () => {
    m.refresh.mockRejectedValue(new Error('reload failed'));
    await mount();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Settings were saved, but the live settings refresh failed'
    );
    expect(m.update).toHaveBeenCalledTimes(1);
  });
});

it('General save does not validate or persist unrelated Branding drafts', async () => {
  await mount();
  tab('Branding');
  fireEvent.change(screen.getByLabelText('Primary Brand Color'), { target: { value: 'invalid' } });
  tab('General');
  fireEvent.change(screen.getByLabelText('Support WhatsApp'), {
    target: { value: ' +91 9999999999 ' },
  });
  fireEvent.change(screen.getByLabelText('Support Hours'), { target: { value: ' Mon–Fri 9–5 ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(m.update).toHaveBeenCalled());
  const rows = m.update.mock.calls[0][0];
  expect(rows.some((r: { id: string }) => r.id.includes('color'))).toBe(false);
  expect(rows).toEqual(
    expect.arrayContaining([
      { id: 'general_support_whatsapp', value: '+91 9999999999' },
      { id: 'general_support_hours', value: 'Mon–Fri 9–5' },
    ])
  );
});
it('preserves intentional quotes in saved text', async () => {
  m.settings.mockResolvedValue([
    ...initial.filter((r) => r.id !== 'general_app_name'),
    { id: 'general_app_name', key: 'app_name', value: '"Quoted Name"' },
  ]);
  render(<AdminSettings />);
  expect(await screen.findByDisplayValue('"Quoted Name"')).toBeInTheDocument();
});
it('makes the accent color editable in the Branding tab', async () => {
  await mount();
  tab('Branding');
  fireEvent.change(screen.getByLabelText('Accent Brand Color'), { target: { value: '#123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Branding Settings' }));
  await waitFor(() =>
    expect(m.update).toHaveBeenCalledWith(
      expect.arrayContaining([{ id: 'accent_color', value: '#123456' }])
    )
  );
});

it('saves SEO through a confirmed backend result and refreshes runtime settings', async () => {
  await mount();
  tab('SEO & Meta');
  fireEvent.change(screen.getByLabelText('Default Meta Title'), {
    target: { value: 'Updated SEO Title' },
  });
  fireEvent.change(screen.getByLabelText('Default Meta Description'), {
    target: { value: 'Updated description.' },
  });
  fireEvent.change(screen.getByLabelText('Google Search Console Verification Tag'), {
    target: { value: 'verified_token_fixture' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save SEO Settings' }));
  await waitFor(() =>
    expect(m.update).toHaveBeenCalledWith([
      { id: 'seo_meta_title', value: 'Updated SEO Title' },
      { id: 'seo_meta_description', value: 'Updated description.' },
      { id: 'seo_google_tag', value: 'verified_token_fixture' },
    ])
  );
  expect(m.refresh).toHaveBeenCalled();
});
it('does not acknowledge failed SEO saves or persist a pasted HTML verification tag', async () => {
  await mount();
  tab('SEO & Meta');
  fireEvent.change(screen.getByLabelText('Google Search Console Verification Tag'), {
    target: { value: '<script>alert(1)</script>' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save SEO Settings' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('not HTML');
  expect(m.update).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Google Search Console Verification Tag'), {
    target: { value: '' },
  });
  m.update.mockResolvedValueOnce({ success: false, error: 'SEO denied' });
  fireEvent.click(screen.getByRole('button', { name: 'Save SEO Settings' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('SEO denied');
});
it('saves connected theme/font defaults separately from General', async () => {
  await mount();
  tab('Branding');
  fireEvent.change(screen.getByLabelText('Platform Default Theme'), { target: { value: 'dark' } });
  fireEvent.change(screen.getByLabelText('Primary Font Family'), {
    target: { value: 'System UI' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save Branding Settings' }));
  await waitFor(() =>
    expect(m.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        { id: 'theme_mode', value: 'dark' },
        { id: 'font_family', value: 'System UI' },
      ])
    )
  );
});
