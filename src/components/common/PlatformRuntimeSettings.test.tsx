import { cleanup, render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ settings: [] as { id: string; value: unknown }[], apply: vi.fn() }));
vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({
    appSettings: m.settings,
    hasLoadedSettings: true,
    appName: 'Fixture Platform',
  }),
}));
vi.mock('@/context/ThemeContext', () => ({ useTheme: () => ({ setPlatformDefault: m.apply }) }));
import { PlatformRuntimeSettings } from './PlatformRuntimeSettings';
import { SEOHead } from '@/components/seo/SEOHead';
beforeEach(() => {
  m.settings = [];
  m.apply.mockReset();
});
afterEach(cleanup);
it('renders saved defaults, verification token, theme and an allowlisted font', async () => {
  m.settings = [
    { id: 'seo_meta_title', value: 'Saved Title' },
    { id: 'seo_meta_description', value: 'Saved description' },
    { id: 'seo_google_tag', value: 'safe_token_fixture' },
    { id: 'theme_mode', value: 'dark' },
    { id: 'font_family', value: 'System UI' },
  ];
  const old = document.createElement('meta');
  old.name = 'description';
  old.content = 'Stale static description';
  document.head.appendChild(old);
  const r = render(
    <HelmetProvider>
      <PlatformRuntimeSettings />
    </HelmetProvider>
  );
  await waitFor(() => expect(document.title).toBe('Saved Title'));
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
    'content',
    'Saved description'
  );
  expect(document.head.querySelector('meta[name="google-site-verification"]')).toHaveAttribute(
    'content',
    'safe_token_fixture'
  );
  expect(m.apply).toHaveBeenCalledWith('dark');
  expect(document.documentElement.style.getPropertyValue('--font-sans')).toContain('system-ui');
  r.unmount();
  expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe('');
  old.remove();
});
it('keeps page-specific SEO authoritative and removes cleared verification', async () => {
  m.settings = [
    { id: 'seo_meta_title', value: 'Default Title' },
    { id: 'seo_google_tag', value: 'safe_token_fixture' },
  ];
  const r = render(
    <HelmetProvider>
      <PlatformRuntimeSettings />
      <SEOHead title="Question-specific Title" description="Question-specific description" />
    </HelmetProvider>
  );
  await waitFor(() => expect(document.title).toBe('Question-specific Title'));
  m.settings = [];
  r.rerender(
    <HelmetProvider>
      <PlatformRuntimeSettings />
      <SEOHead title="Question-specific Title" description="Question-specific description" />
    </HelmetProvider>
  );
  await waitFor(() =>
    expect(document.querySelector('meta[name="google-site-verification"]')).toBeNull()
  );
});
it('never treats raw HTML or arbitrary CSS font values as executable settings', async () => {
  m.settings = [
    { id: 'seo_google_tag', value: '<script>alert(1)</script>' },
    { id: 'font_family', value: 'url(https://evil.invalid/x)' },
  ];
  render(
    <HelmetProvider>
      <PlatformRuntimeSettings />
    </HelmetProvider>
  );
  await waitFor(() => expect(document.title).toContain('Fixture Platform'));
  expect(document.querySelector('meta[name="google-site-verification"]')).toBeNull();
  expect(document.documentElement.style.getPropertyValue('--font-sans')).not.toContain('evil');
});
