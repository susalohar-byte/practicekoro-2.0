import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
vi.mock('@/services/api', () => ({ api: { getAppSettings: m.get, updateAppSettings: m.update } }));
import { MaintenanceProvider, useMaintenance, isSafeBrandAsset } from './MaintenanceContext';
import { BrandLogo } from '@/components/common/BrandLogo';
let context: ReturnType<typeof useMaintenance>;
function Probe() {
  context = useMaintenance();
  return (
    <>
      <output>
        {context.supportEmail}|{context.supportPhone}|{context.supportWhatsapp}|
        {context.supportHours}|{context.contentLanguageMode}
      </output>
      <BrandLogo />
    </>
  );
}
const setting = (id: string, value: unknown) => ({ id, key: id, value });
beforeEach(() => {
  vi.resetAllMocks();
  m.get.mockResolvedValue([]);
  m.update.mockResolvedValue({ success: true });
});
afterEach(cleanup);
describe('Confirmed runtime settings', () => {
  it('clears removed contacts instead of retaining stale helplines', async () => {
    m.get.mockResolvedValueOnce([
      setting('general_support_email', 'help@test.invalid'),
      setting('general_support_phone', '123'),
      setting('general_support_whatsapp', '456'),
      setting('general_support_hours', '9–5'),
    ]);
    render(
      <MaintenanceProvider>
        <Probe />
      </MaintenanceProvider>
    );
    await screen.findByText('help@test.invalid|123|456|9–5|bengali_only');
    await act(async () => {
      await context.checkMaintenanceMode();
    });
    expect(screen.getByText('||||bengali_only')).toBeInTheDocument();
  });
  it('propagates refresh failure and preserves last confirmed maintenance state', async () => {
    m.get.mockResolvedValueOnce([setting('sys_maintenance_mode', true)]);
    render(
      <MaintenanceProvider>
        <Probe />
      </MaintenanceProvider>
    );
    await waitFor(() => expect(context.isMaintenanceMode).toBe(true));
    m.get.mockRejectedValueOnce(new Error('Offline'));
    await act(async () => {
      await expect(context.checkMaintenanceMode()).rejects.toThrow('Offline');
    });
    expect(context.isMaintenanceMode).toBe(true);
    expect(context.settingsError).toBe('Offline');
  });
  it('does not acknowledge a rejected language write', async () => {
    render(
      <MaintenanceProvider>
        <Probe />
      </MaintenanceProvider>
    );
    await waitFor(() => expect(context.loading).toBe(false));
    m.update.mockResolvedValueOnce({ success: false, error: 'Denied' });
    await act(async () => {
      await expect(context.updateContentLanguageMode('bilingual')).rejects.toThrow('Denied');
    });
    expect(context.contentLanguageMode).toBe('bengali_only');
  });
  it('ignores stale responses that resolve after newer refreshes', async () => {
    render(
      <MaintenanceProvider>
        <Probe />
      </MaintenanceProvider>
    );
    await waitFor(() => expect(context.loading).toBe(false));
    let resolve!: (x: unknown) => void;
    m.get
      .mockReturnValueOnce(
        new Promise((r) => {
          resolve = r;
        })
      )
      .mockResolvedValueOnce([setting('general_support_email', 'new@test.invalid')]);
    let old!: Promise<boolean>;
    await act(async () => {
      old = context.checkMaintenanceMode();
      await context.checkMaintenanceMode();
    });
    await act(async () => {
      resolve([setting('general_support_email', 'old@test.invalid')]);
      await old;
    });
    expect(context.supportEmail).toBe('new@test.invalid');
  });
  it('uses saved logo and favicon and restores deployed favicon when removed', async () => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = '/default.png';
    document.head.appendChild(link);
    m.get.mockResolvedValueOnce([
      setting('general_platform_logo', 'https://assets.test/logo.png'),
      setting('general_favicon', 'https://assets.test/favicon.png'),
    ]);
    render(
      <MaintenanceProvider>
        <Probe />
      </MaintenanceProvider>
    );
    await waitFor(() =>
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://assets.test/logo.png')
    );
    expect(link.getAttribute('href')).toBe('https://assets.test/favicon.png');
    await act(async () => {
      await context.checkMaintenanceMode();
    });
    expect(link.getAttribute('href')).toBe('/default.png');
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/logo.png');
    link.remove();
  });
  it.each([
    'javascript:alert(1)',
    'data:image/svg+xml,x',
    '//bad.test/a',
    'https://user:pass@bad.test/a',
    '/\\bad.test/a',
  ])('rejects unsafe brand URL %s', (value) => expect(isSafeBrandAsset(value)).toBe(false));
});
