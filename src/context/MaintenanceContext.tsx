import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import type { AppSettingItem } from '@/types';

export type ContentLanguageMode = 'bengali_only' | 'bilingual';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  loading: boolean;
  checkMaintenanceMode: () => Promise<boolean>;
  appSettings: AppSettingItem[];
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportHours: string;
  settingsError: string;
  hasLoadedSettings: boolean;
  appName: string;
  contentLanguageMode: ContentLanguageMode;
  isBilingualEnabled: boolean;
  isBengaliOnly: boolean;
  updateContentLanguageMode: (mode: ContentLanguageMode) => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [appSettings, setAppSettings] = useState<AppSettingItem[]>([]);
  const [supportEmail, setSupportEmail] = useState<string>('');
  const [supportPhone, setSupportPhone] = useState<string>('');
  const [supportWhatsapp, setSupportWhatsapp] = useState<string>('');
  const [supportHours, setSupportHours] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const requestVersion = useRef(0);
  const languageWrite = useRef(false);
  const [appName, setAppName] = useState<string>('PracticeKoro');
  // Global feature flag: Default is 'bengali_only' (Bilingual = OFF)
  const [contentLanguageMode, setContentLanguageMode] =
    useState<ContentLanguageMode>('bengali_only');

  const checkMaintenanceMode = useCallback(async (): Promise<boolean> => {
    const version = ++requestVersion.current;
    try {
      const settings = await api.getAppSettings();
      if (!Array.isArray(settings))
        throw new Error('Platform settings response was not confirmed.');
      const read = (id: string, key: string) =>
        (settings.find((s) => s.id === id) || settings.find((s) => s.key === key))?.value;
      const text = (id: string, key: string) => {
        const value = read(id, key);
        return typeof value === 'string' ? value.trim() : '';
      };
      const value = read('sys_maintenance_mode', 'maintenance_mode');
      const isMaint = value === true || value === 'true';
      if (version === requestVersion.current) {
        setAppSettings(settings);
        setIsMaintenanceMode(isMaint);
        setContentLanguageMode(
          text('content_language_mode', 'content_language_mode') === 'bilingual'
            ? 'bilingual'
            : 'bengali_only'
        );
        // Empty or deleted contacts intentionally clear previous/default values.
        setSupportEmail(text('general_support_email', 'support_email'));
        setSupportPhone(text('general_support_phone', 'support_phone'));
        setSupportWhatsapp(text('general_support_whatsapp', 'support_whatsapp'));
        setSupportHours(text('general_support_hours', 'support_hours'));
        setAppName(text('general_app_name', 'app_name') || 'PracticeKoro');
        setHasLoadedSettings(true);
        setSettingsError('');
      }
      return isMaint;
    } catch (err) {
      if (version === requestVersion.current)
        setSettingsError(
          err instanceof Error ? err.message : 'Platform settings could not be loaded.'
        );
      // Callers must know refresh failed. Keep the last confirmed maintenance state.
      throw err;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  const updateContentLanguageMode = useCallback(async (mode: ContentLanguageMode) => {
    if (languageWrite.current) throw new Error('A language update is already in progress.');
    languageWrite.current = true;
    try {
      const result = await api.updateAppSettings([{ id: 'content_language_mode', value: mode }]);
      if (result?.success !== true)
        throw new Error(result?.error || 'Language mode was not saved.');
      requestVersion.current++; // Older reads cannot undo this confirmed mutation.
      setContentLanguageMode(mode);
    } finally {
      languageWrite.current = false;
    }
  }, []);

  const isBilingualEnabled = contentLanguageMode === 'bilingual';
  const isBengaliOnly = !isBilingualEnabled;

  useEffect(() => {
    const refresh = () => {
      void checkMaintenanceMode().catch((err) =>
        console.warn('Platform settings refresh failed:', err)
      );
    };
    refresh();

    // Periodic check every 60 seconds
    const interval = setInterval(() => {
      refresh();
    }, 60000);

    // Re-check when window gains focus
    const handleFocus = () => {
      refresh();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      // Request generation, not a DOM ref: deliberately invalidate the latest request.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestVersion.current++;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkMaintenanceMode]);

  const faviconValue = appSettings.find((item) => item.id === 'general_favicon')?.value;
  useEffect(() => {
    if (typeof faviconValue !== 'string' || !isSafeBrandAsset(faviconValue)) return;
    let links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
    );
    let created = false;
    if (!links.length) {
      const link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
      links = [link];
      created = true;
    }
    const previous = links.map((link) => ({
      link,
      href: link.getAttribute('href'),
      type: link.getAttribute('type'),
    }));
    links.forEach((link) => {
      link.href = faviconValue;
      link.type = 'image/png';
    });
    return () => {
      if (created) links.forEach((link) => link.remove());
      else
        previous.forEach(({ link, href, type }) => {
          if (href === null) link.removeAttribute('href');
          else link.setAttribute('href', href);
          if (type === null) link.removeAttribute('type');
          else link.setAttribute('type', type);
        });
    };
  }, [faviconValue]);

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenanceMode,
        loading,
        checkMaintenanceMode,
        appSettings,
        supportEmail,
        supportPhone,
        supportWhatsapp,
        supportHours,
        settingsError,
        hasLoadedSettings,
        appName,
        contentLanguageMode,
        isBilingualEnabled,
        isBengaliOnly,
        updateContentLanguageMode,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = (): MaintenanceContextType => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};

/**
 * Universal hook for reading the global content language mode across Web and APK.
 * Defaults strictly to Bengali Only (Bilingual = OFF) if unconfigured or outside provider.
 */
export function useContentLanguage() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    return {
      contentLanguageMode: 'bengali_only' as ContentLanguageMode,
      isBilingualEnabled: false,
      isBengaliOnly: true,
      updateContentLanguageMode: async () => {},
    };
  }
  return {
    contentLanguageMode: context.contentLanguageMode,
    isBilingualEnabled: context.isBilingualEnabled,
    isBengaliOnly: context.isBengaliOnly,
    updateContentLanguageMode: context.updateContentLanguageMode,
  };
}

export function isSafeBrandAsset(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
/** Optional brand access also works in isolated components outside the provider. */
export function usePlatformBrand() {
  const context = useContext(MaintenanceContext);
  const value = context?.appSettings.find((item) => item.id === 'general_platform_logo')?.value;
  return {
    appName: context?.appName || 'PracticeKoro',
    logoUrl: typeof value === 'string' && isSafeBrandAsset(value) ? value : null,
  };
}
