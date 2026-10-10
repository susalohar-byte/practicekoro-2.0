import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useTheme } from '@/context/ThemeContext';
import { PLATFORM_FONTS, presentationSettings } from '@/utils/platformPresentation';
/** Defaults only: route-specific SEO and explicit user theme preferences retain precedence. */
export function PlatformRuntimeSettings() {
  const { appSettings, hasLoadedSettings, appName } = useMaintenance();
  const { setPlatformDefault } = useTheme();
  const values = presentationSettings(appSettings);
  useEffect(() => {
    if (!hasLoadedSettings) return;
    setPlatformDefault(values.theme);
  }, [hasLoadedSettings, values.theme, setPlatformDefault]);
  useEffect(() => {
    if (!hasLoadedSettings) return;
    const root = document.documentElement;
    const old = root.style.getPropertyValue('--font-sans');
    root.style.setProperty('--font-sans', PLATFORM_FONTS[values.font]);
    return () => {
      if (old) root.style.setProperty('--font-sans', old);
      else root.style.removeProperty('--font-sans');
    };
  }, [hasLoadedSettings, values.font]);
  useEffect(() => {
    if (!hasLoadedSettings) return;
    // Initial HTML metadata is not Helmet-owned. Remove duplicates once runtime tags take over.
    const originals = Array.from(
      document.head.querySelectorAll(
        'meta:not([data-rh])[name="description"],meta:not([data-rh])[name="google-site-verification"],meta:not([data-rh])[name="twitter:title"],meta:not([data-rh])[name="twitter:description"],meta:not([data-rh])[property="og:title"],meta:not([data-rh])[property="og:description"],meta:not([data-rh])[property="og:site_name"]'
      )
    );
    originals.forEach((node) => node.remove());
    return () => {
      originals.forEach((node) => document.head.appendChild(node));
    };
  }, [hasLoadedSettings]);
  if (!hasLoadedSettings) return null;
  const title = values.title || `${appName} | Mock Test & Practice Platform`;
  const description =
    values.description ||
    `${appName} - Bengal's Premier Competitive Exam Mock Test & Practice Platform`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta
        property="og:description"
        content={
          values.description ||
          "Smart practice for West Bengal's competitive exams — mock tests, PYQs & topic-wise practice in বাংলা ও English."
        }
      />
      <meta property="og:site_name" content={appName} />
      <meta name="twitter:title" content={title} />
      <meta
        name="twitter:description"
        content={
          values.description ||
          "Smart practice for West Bengal's competitive exams — mock tests, PYQs & topic-wise practice in বাংলা ও English."
        }
      />
      {/^[A-Za-z0-9_-]{10,200}$/.test(values.verification) && (
        <meta name="google-site-verification" content={values.verification} />
      )}
    </Helmet>
  );
}
