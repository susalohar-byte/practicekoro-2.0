import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [supportEmail, setSupportEmail] = useState<string>('support@practicekoro.online');
  const [supportPhone, setSupportPhone] = useState<string>('+91 9547771118');
  const [supportWhatsapp, setSupportWhatsapp] = useState<string>('+91 9547771118');
  const [appName, setAppName] = useState<string>('PracticeKoro');
  // Global feature flag: Default is 'bengali_only' (Bilingual = OFF)
  const [contentLanguageMode, setContentLanguageMode] = useState<ContentLanguageMode>('bengali_only');

  const checkMaintenanceMode = useCallback(async (): Promise<boolean> => {
    try {
      const settings = await api.getAppSettings();
      setAppSettings(settings);

      const maintSetting = settings.find(
        (s) => s.id === 'sys_maintenance_mode' || s.key === 'maintenance_mode'
      );
      const isMaint = maintSetting?.value === true || maintSetting?.value === 'true';
      setIsMaintenanceMode(isMaint);

      // Check global content language mode (default: bengali_only)
      const langSetting = settings.find(
        (s) =>
          s.id === 'content_language_mode' ||
          s.key === 'content_language_mode' ||
          s.id === 'general_content_language_mode'
      );
      if (langSetting?.value) {
        const raw = String(langSetting.value).replace(/^"|"$/g, '').trim().toLowerCase();
        setContentLanguageMode(raw === 'bilingual' ? 'bilingual' : 'bengali_only');
      } else {
        setContentLanguageMode('bengali_only');
      }

      const emailSetting = settings.find(
        (s) => s.id === 'general_support_email' || s.key === 'support_email'
      );
      if (emailSetting?.value) setSupportEmail(String(emailSetting.value));

      const phoneSetting = settings.find(
        (s) => s.id === 'general_support_phone' || s.key === 'support_phone'
      );
      if (phoneSetting?.value) setSupportPhone(String(phoneSetting.value));

      const whatsappSetting = settings.find(
        (s) => s.id === 'general_support_whatsapp' || s.key === 'support_whatsapp'
      );
      if (whatsappSetting?.value) setSupportWhatsapp(String(whatsappSetting.value));

      const nameSetting = settings.find((s) => s.id === 'general_app_name' || s.key === 'app_name');
      if (nameSetting?.value) setAppName(String(nameSetting.value));

      return isMaint;
    } catch (err) {
      console.warn('Failed to load maintenance mode status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContentLanguageMode = useCallback(
    async (mode: ContentLanguageMode) => {
      setContentLanguageMode(mode);
      try {
        await api.updateAppSettings([{ id: 'content_language_mode', value: mode }]);
      } catch (err) {
        console.warn('Failed to persist content_language_mode:', err);
      }
    },
    []
  );

  const isBilingualEnabled = contentLanguageMode === 'bilingual';
  const isBengaliOnly = !isBilingualEnabled;

  useEffect(() => {
    checkMaintenanceMode();

    // Periodic check every 60 seconds
    const interval = setInterval(() => {
      checkMaintenanceMode();
    }, 60000);

    // Re-check when window gains focus
    const handleFocus = () => {
      checkMaintenanceMode();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkMaintenanceMode]);

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
