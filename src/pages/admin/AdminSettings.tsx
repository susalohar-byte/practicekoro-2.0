import {
  PLATFORM_FONTS,
  validateSeoSettings,
  validatePresentation,
} from '@/utils/platformPresentation';
import { clearOfflineCache } from '@/utils/clearOfflineCache';
import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useMaintenance } from '@/context/MaintenanceContext';
import { cn } from '@/lib/utils';
import {
  validateGeneralSettings,
  validateBrandColors,
  validateSmtpReference,
  validateSettingsImage,
} from '@/services/domains/admin.settingsForm';
import { uploadQuestionImage } from '@/services/domains/admin.questions';
import {
  Settings,
  User,
  Palette,
  Search,
  Mail,
  CreditCard,
  Link as LinkIcon,
  Shield,
  Server,
  Sliders,
  Users,
  FileText,
  Layers,
  Trophy,
  BookOpen,
  Tag,
  Bell,
  Share2,
  Smartphone,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Upload,
  MessageSquare,
  Eye,
  EyeOff,
  Save,
  Copy,
  RefreshCw,
  Send,
} from 'lucide-react';
import { checkFast2SmsBalance, sendTestSms } from '@/services/domains/smsGateway';
import { sendTestPushNotification } from '@/services/domains/fcmGateway';

type SettingsTab =
  'general' | 'branding' | 'seo' | 'email' | 'payments' | 'integrations' | 'security' | 'system';

interface TabConfig {
  id: SettingsTab;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const SETTINGS_TABS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    sublabel: 'Platform information',
    icon: Settings,
    iconBg: 'bg-blue-100/70',
    iconColor: 'text-blue-600',
  },
  {
    id: 'branding',
    label: 'Branding',
    sublabel: 'Logo, colors, theme',
    icon: Palette,
    iconBg: 'bg-purple-100/70',
    iconColor: 'text-purple-600',
  },
  {
    id: 'seo',
    label: 'SEO & Meta',
    sublabel: 'Search engine settings',
    icon: Search,
    iconBg: 'bg-indigo-100/70',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'email',
    label: 'Email & Notifications',
    sublabel: 'Templates & SMTP',
    icon: Mail,
    iconBg: 'bg-sky-100/70',
    iconColor: 'text-sky-600',
  },
  {
    id: 'payments',
    label: 'Payments',
    sublabel: 'Payment gateways',
    icon: CreditCard,
    iconBg: 'bg-emerald-100/70',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    sublabel: 'Third-party services',
    icon: LinkIcon,
    iconBg: 'bg-blue-100/70',
    iconColor: 'text-blue-500',
  },
  {
    id: 'security',
    label: 'Security',
    sublabel: 'Access & protection',
    icon: Shield,
    iconBg: 'bg-blue-100/70',
    iconColor: 'text-blue-600',
  },
  {
    id: 'system',
    label: 'System',
    sublabel: 'Advanced settings',
    icon: Server,
    iconBg: 'bg-purple-100/70',
    iconColor: 'text-purple-600',
  },
];

export const AdminSettings: React.FC = () => {
  const { user: currentAdmin, adminRole, updateProfile } = useAuth();
  const canManageSettings = adminRole === 'super_admin' && (currentAdmin?.role === 'admin' || !currentAdmin?.role);
  const operationRef = useRef(false);
  const loadVersion = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [toastKind, setToastKind] = useState<'success' | 'error' | 'info'>('info');
  const { checkMaintenanceMode } = useMaintenance();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsLoadError, setSettingsLoadError] = useState('');

  // --------------------------------------------------------------------------
  // General Platform Information
  // --------------------------------------------------------------------------
  const [platformName, setPlatformName] = useState('PracticeKoro');
  const [websiteUrl, setWebsiteUrl] = useState('https://practicekoro.online');
  const [adminEmail, setAdminEmail] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [supportHours, setSupportHours] = useState('');
  const [address, setAddress] = useState('');
  const [timezone] = useState('Asia/Kolkata (GMT +5:30)');
  const [language] = useState('English');
  const [platformDescription, setPlatformDescription] = useState(
    'PracticeKoro is a mock test platform for West Bengal and other Government exams. Practice smart, prepare better and achieve your goal.'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // Feature Toggles (Unavailable) State (Exact match to reference image)
  // --------------------------------------------------------------------------
  const featureToggles = {
    studentRegistration: false,
    mockTests: false,
    topicTests: false,
    leaderboards: false,
    blogStudyNotes: false,
    paidSubscriptions: false,
    couponsOffers: false,
    notifications: false,
    referralProgram: false,
    appDownloadLinks: false,
  };
  const toggleFeature = (_key: keyof typeof featureToggles) => {
    showToast('Feature switches are unavailable: runtime enforcement is not implemented.', 'info');
  };
  // --------------------------------------------------------------------------
  // Theme & Branding State
  // --------------------------------------------------------------------------
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [fontFamily, setFontFamily] = useState('Inter (Default)');
  const [metaTitle, setMetaTitle] = useState('PracticeKoro | Mock Test & Practice Platform');
  const [metaDescription, setMetaDescription] = useState(
    'Practice mock tests and track your exam preparation.'
  );
  const [searchConsoleToken, setSearchConsoleToken] = useState('');

  // --------------------------------------------------------------------------
  // Email SMTP Configuration
  // --------------------------------------------------------------------------
  const [smtpProvider, setSmtpProvider] = useState('Custom SMTP');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpEncryption, setSmtpEncryption] = useState('TLS');
  const [smtpUsername, setSmtpUsername] = useState('');
  const isSendingTestEmail = false;
  const [appVersion, setAppVersion] = useState('Not configured');

  // --------------------------------------------------------------------------
  // Payments State (Razorpay Gateway)
  // --------------------------------------------------------------------------
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpIsActive, setRzpIsActive] = useState(true);
  const [currency] = useState('INR');
  const taxPercent = '';
  const invoicePrefix = '';

  // --------------------------------------------------------------------------
  // Clear Cache Dialog Modal
  // --------------------------------------------------------------------------
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // --------------------------------------------------------------------------
  // SMS & Push Notification Gateways (Fast2SMS & Firebase Cloud Messaging)
  // --------------------------------------------------------------------------
  const [fast2smsEnabled, setFast2smsEnabled] = useState(false);
  const [fast2smsApiKey, setFast2smsApiKey] = useState('');
  const [fast2smsRoute, setFast2smsRoute] = useState<'q' | 'dlt' | 'otp'>('q');
  const [fast2smsSenderId, setFast2smsSenderId] = useState('FSTSMS');
  const [fast2smsShowKey, setFast2smsShowKey] = useState(false);
  const [testSmsMobile, setTestSmsMobile] = useState('');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [smsBalanceInfo, setSmsBalanceInfo] = useState<string | null>(null);

  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [fcmProjectId, setFcmProjectId] = useState('practicekoro-app');
  const [fcmServerKey, setFcmServerKey] = useState('');
  const [fcmVapidKey, setFcmVapidKey] = useState('');
  const [fcmShowKey, setFcmShowKey] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);

  // Helper toast notification
  const showToast = (msg: string, kind: 'success' | 'error' | 'info' = 'error') => {
    clearTimeout(toastTimerRef.current);
    setToastKind(kind);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 5000);
  };
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);
  const beginOperation = () => {
    if (operationRef.current) return false;
    if (!canManageSettings) {
      showToast('Only an active Super Admin can change settings.');
      return false;
    }
    operationRef.current = true;
    setIsSaving(true);
    return true;
  };
  const endOperation = () => {
    operationRef.current = false;
    setIsSaving(false);
  };

  // --------------------------------------------------------------------------
  // Initial Data Fetching from app_settings
  // --------------------------------------------------------------------------
  const loadSettings = useCallback(async () => {
    const version = ++loadVersion.current;
    setIsLoadingSettings(true);
    setSettingsLoadError('');
    try {
      const [data, gatewayConfig] = await Promise.all([
        api.getAppSettings(),
        api.getPaymentGatewayConfig('razorpay'),
      ]);

      if (version !== loadVersion.current) return;
      if (!Array.isArray(data)) throw new Error('Settings response was not confirmed.');
      if (Array.isArray(data)) {
        data.forEach((s) => {
          const val = s.value;
          if (s.key === 'app_name' || s.id === 'general_app_name') setPlatformName(String(val));
          if (s.key === 'website_url' || s.id === 'general_website_url') setWebsiteUrl(String(val));
          if (s.key === 'support_email' || s.id === 'general_support_email')
            setSupportEmail(String(val));
          if (s.key === 'admin_email' || s.id === 'general_admin_email') setAdminEmail(String(val));
          if (s.key === 'support_phone' || s.id === 'general_support_phone')
            setContactPhone(String(val));
          if (s.key === 'support_whatsapp' || s.id === 'general_support_whatsapp')
            setSupportWhatsapp(String(val ?? ''));
          if (s.key === 'support_hours' || s.id === 'general_support_hours')
            setSupportHours(String(val ?? ''));
          if (s.key === 'support_address' || s.id === 'general_support_address')
            setAddress(String(val));
          if (s.key === 'maintenance_mode' || s.id === 'sys_maintenance_mode') {
            setMaintenanceMode(val === true || val === 'true');
          }
          if (s.id === 'platform_description' || s.key === 'platform_description')
            setPlatformDescription(String(val ?? ''));
          if (s.id === 'general_platform_logo' || s.key === 'general_platform_logo')
            setPlatformLogo(val ? String(val) : null);
          if (s.id === 'general_favicon' || s.key === 'general_favicon')
            setFavicon(val ? String(val) : null);
          if (s.id === 'smtp_provider') setSmtpProvider(String(val ?? 'Custom SMTP'));
          if (s.id === 'smtp_host') setSmtpHost(String(val ?? ''));
          if (s.id === 'smtp_port') setSmtpPort(String(val ?? '587'));
          if (s.id === 'smtp_encryption') setSmtpEncryption(String(val ?? 'TLS'));
          if (s.id === 'smtp_username') setSmtpUsername(String(val ?? ''));
          if (s.id === 'sys_app_version' || s.key === 'app_version')
            setAppVersion(String(val ?? 'Not configured'));
          if (s.id === 'primary_color' || s.key === 'primary_color') setPrimaryColor(String(val));
          if (s.id === 'secondary_color' || s.key === 'secondary_color')
            setSecondaryColor(String(val));
          if (s.id === 'accent_color' || s.key === 'accent_color') setAccentColor(String(val));
          if (s.id === 'theme_mode' && ['light', 'dark', 'system'].includes(String(val)))
            setThemeMode(val as 'light' | 'dark' | 'system');
          if (
            s.id === 'font_family' &&
            Object.prototype.hasOwnProperty.call(PLATFORM_FONTS, String(val))
          )
            setFontFamily(String(val));
          if (s.id === 'seo_meta_title') setMetaTitle(String(val ?? ''));
          if (s.id === 'seo_meta_description') setMetaDescription(String(val ?? ''));
          if (s.id === 'seo_google_tag') setSearchConsoleToken(String(val ?? ''));
          if (s.id === 'gateway_fast2sms_enabled')
            setFast2smsEnabled(val === true || val === 'true');
          if (s.id === 'gateway_fast2sms_api_key') setFast2smsApiKey(String(val ?? ''));
          if (s.id === 'gateway_fast2sms_route')
            setFast2smsRoute(val === 'dlt' || val === 'otp' ? val : 'q');
          if (s.id === 'gateway_fast2sms_sender_id')
            setFast2smsSenderId(String(val || 'FSTSMS'));
          if (s.id === 'gateway_fcm_enabled') setFcmEnabled(val === true || val === 'true');
          if (s.id === 'gateway_fcm_project_id')
            setFcmProjectId(String(val || 'practicekoro-app'));
          if (s.id === 'gateway_fcm_server_key') setFcmServerKey(String(val ?? ''));
          if (s.id === 'gateway_fcm_vapid_key') setFcmVapidKey(String(val ?? ''));
        });
      }

      if (gatewayConfig) {
        setRzpKeyId(gatewayConfig.keyId || '');
        setRzpIsActive(gatewayConfig.isActive);
      }
    } catch (err) {
      if (version === loadVersion.current)
        setSettingsLoadError(err instanceof Error ? err.message : 'Settings could not be loaded.');
    } finally {
      if (version === loadVersion.current) setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    return () => {
      // Request generation, not a DOM ref: deliberately invalidate the latest request.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadVersion.current++;
    };
  }, [loadSettings]);

  // --------------------------------------------------------------------------
  // Save General Changes
  // --------------------------------------------------------------------------
  const handleSaveGeneral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!beginOperation()) return;
    try {
      validateGeneralSettings({
        name: platformName,
        website: websiteUrl,
        adminEmail,
        supportEmail,
      });
      if (platformDescription.length > 300)
        throw new Error('Platform description may not exceed 300 characters.');
      const res = await api.updateAppSettings([
        { id: 'general_app_name', value: platformName.trim() },
        { id: 'general_website_url', value: websiteUrl.trim() },
        { id: 'general_support_email', value: supportEmail.trim() },
        { id: 'general_admin_email', value: adminEmail.trim() },
        { id: 'general_support_phone', value: contactPhone.trim() },
        { id: 'general_support_whatsapp', value: supportWhatsapp.trim() },
        { id: 'general_support_hours', value: supportHours.trim() },
        { id: 'general_support_address', value: address.trim() },
        { id: 'sys_maintenance_mode', value: maintenanceMode },
        { id: 'platform_description', value: platformDescription.trim() },
      ]);

      if (!res.success) {
        showToast(res.error || 'Failed to save settings. Please try again.');
        return;
      }

      try {
        await checkMaintenanceMode();
      } catch {
        showToast(
          'Settings were saved, but the live settings refresh failed. Refresh the page.',
          'info'
        );
        return;
      }

      if (currentAdmin) {
        try {
          await api.logAdminActivity({
            action: 'SETTINGS_UPDATE',
            entityType: 'settings',
            entityId: 'general_settings',
            entityName: 'General Platform Settings',
            details: { platformName, websiteUrl, maintenanceMode },
            adminUser: currentAdmin,
          });
        } catch {
          /* Persistence already succeeded; audit delivery must not report a false save failure. */
        }
      }
      showToast('Settings saved successfully! Configuration saved in the database.', 'success');
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
    } finally {
      endOperation();
    }
  };

  // --------------------------------------------------------------------------
  // Save SMTP Settings
  // --------------------------------------------------------------------------
  const handleSaveSMTP = async () => {
    if (!beginOperation()) return;
    try {
      validateSmtpReference(smtpHost, smtpPort);
      const res = await api.updateAppSettings([
        { id: 'smtp_provider', value: smtpProvider },
        { id: 'smtp_host', value: smtpHost },
        { id: 'smtp_port', value: smtpPort },
        { id: 'smtp_encryption', value: smtpEncryption },
        { id: 'smtp_username', value: smtpUsername },
      ]);

      if (!res.success) {
        showToast(res.error || 'Failed to save SMTP configuration.');
        return;
      }

      showToast(
        'SMTP reference settings saved. Email delivery is not enabled by this form.',
        'success'
      );
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to save SMTP configuration.');
    } finally {
      endOperation();
    }
  };

  const handleSaveBranding = async () => {
    if (!beginOperation()) return;
    try {
      validatePresentation(themeMode, fontFamily);
      validateBrandColors([primaryColor, secondaryColor, accentColor]);
      const result = await api.updateAppSettings([
        { id: 'primary_color', value: primaryColor },
        { id: 'secondary_color', value: secondaryColor },
        { id: 'accent_color', value: accentColor },
        { id: 'theme_mode', value: themeMode },
        { id: 'font_family', value: fontFamily },
      ]);
      if (!result.success) throw new Error(result.error || 'Brand colors were not saved.');
      try {
        await checkMaintenanceMode();
      } catch {
        showToast('Branding saved, but runtime refresh failed. Refresh the page.', 'info');
        return;
      }
      showToast(
        'Default theme and font saved. Existing user theme choices are preserved; colors remain palette previews.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Branding save failed.');
    } finally {
      endOperation();
    }
  };
  const handleSaveSEO = async () => {
    if (!beginOperation()) return;
    try {
      validateSeoSettings(metaTitle, metaDescription, searchConsoleToken);
      const result = await api.updateAppSettings([
        { id: 'seo_meta_title', value: metaTitle.trim() },
        { id: 'seo_meta_description', value: metaDescription.trim() },
        { id: 'seo_google_tag', value: searchConsoleToken.trim() },
      ]);
      if (!result.success) throw new Error(result.error || 'SEO settings were not saved.');
      try {
        await checkMaintenanceMode();
      } catch {
        showToast('SEO saved, but live refresh failed. Refresh the page.', 'info');
        return;
      }
      showToast(
        'SEO defaults saved. Page-specific metadata is preserved; Search Console ownership is not automatically verified.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'SEO save failed.');
    } finally {
      endOperation();
    }
  };
  const handleSavePayment = async () => {
    if (!beginOperation()) return;
    try {
      const result = await api.updatePaymentGatewayConfig({
        gateway: 'razorpay',
        keyId: rzpKeyId,
        isActive: rzpIsActive,
      });
      if (!result.success) throw new Error(result.error || 'Payment configuration was not saved.');
      showToast('Payment gateway settings saved and confirmed by the backend.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Payment save failed.');
    } finally {
      endOperation();
    }
  };

  const handleSaveIntegrations = async () => {
    if (!beginOperation()) return;
    try {
      const result = await api.updateAppSettings([
        { id: 'gateway_fast2sms_enabled', value: fast2smsEnabled },
        { id: 'gateway_fast2sms_api_key', value: fast2smsApiKey.trim() },
        { id: 'gateway_fast2sms_route', value: fast2smsRoute },
        { id: 'gateway_fast2sms_sender_id', value: fast2smsSenderId.trim() || 'FSTSMS' },
        { id: 'gateway_fcm_enabled', value: fcmEnabled },
        { id: 'gateway_fcm_project_id', value: fcmProjectId.trim() },
        { id: 'gateway_fcm_server_key', value: fcmServerKey.trim() },
        { id: 'gateway_fcm_vapid_key', value: fcmVapidKey.trim() },
      ]);
      if (!result.success) throw new Error(result.error || 'Gateway configuration was not saved.');
      try {
        await checkMaintenanceMode();
      } catch {
        // non-blocking
      }
      showToast('SMS & Push Gateway settings saved successfully in the database!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gateway save failed.');
    } finally {
      endOperation();
    }
  };

  const handleTestSms = async () => {
    if (!testSmsMobile.trim()) {
      showToast('Enter a 10-digit mobile number for test SMS.', 'info');
      return;
    }
    setIsSendingTestSms(true);
    try {
      const res = await sendTestSms(fast2smsApiKey, testSmsMobile, fast2smsSenderId);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message || 'Test SMS failed.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to send test SMS.', 'error');
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const handleCheckBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const res = await checkFast2SmsBalance(fast2smsApiKey);
      setSmsBalanceInfo(res.message);
      showToast(res.message, res.success ? 'success' : 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to check balance.', 'info');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const handleTestPush = async () => {
    setIsSendingTestPush(true);
    try {
      const res = await sendTestPushNotification(fcmServerKey, fcmProjectId);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message || 'Test push notification failed.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to send test push alert.', 'error');
    } finally {
      setIsSendingTestPush(false);
    }
  };
  const handleSendTestEmail = () =>
    showToast('Email delivery is not configured through this page. No message was sent.', 'info');
  const handleConfirmClearCache = async () => {
    if (!beginOperation()) return;
    setIsClearingCache(true);
    try {
      await clearOfflineCache();
      setShowClearCacheModal(false);
      showToast(
        'Local offline cache cleared. Sign-in sessions and server caches were not changed.',
        'success'
      );
    } catch {
      showToast('Browser storage could not be cleared. No success was confirmed.');
    } finally {
      setIsClearingCache(false);
      endOperation();
    }
  };
  const persistAsset = async (kind: 'logo' | 'favicon', value: string | null) => {
    const result = await api.updateAppSettings([
      { id: kind === 'logo' ? 'general_platform_logo' : 'general_favicon', value },
    ]);
    if (!result.success) throw new Error(result.error || 'Asset setting was not saved.');
    if (kind === 'logo') setPlatformLogo(value);
    else setFavicon(value);
    try {
      await checkMaintenanceMode();
    } catch {
      throw new Error('Asset setting saved, but live refresh failed. Refresh the page.');
    }
  };
  const uploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'favicon') => {
    const input = e.currentTarget,
      file = input.files?.[0];
    if (!file || !beginOperation()) return;
    try {
      validateSettingsImage(file, kind);
      const url = await uploadQuestionImage(file);
      if (!url.startsWith('https://'))
        throw new Error('Upload did not return a durable HTTPS storage URL.');
      await persistAsset(kind, url);
      showToast(
        'Asset uploaded and saved. Platform navigation and favicon use the saved assets.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Asset upload failed.');
    } finally {
      input.value = '';
      endOperation();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => uploadAsset(e, 'logo');
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => uploadAsset(e, 'favicon');
  const removeAsset = async (kind: 'logo' | 'favicon') => {
    if (!beginOperation()) return;
    try {
      await persistAsset(kind, null);
      showToast(
        'Asset setting removed from the database. Stored files were not deleted.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Asset removal failed.');
    } finally {
      endOperation();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !beginOperation()) return;
    setIsUploadingAvatar(true);
    try {
      validateSettingsImage(file, 'avatar');
      const url = await uploadQuestionImage(file);
      if (!url.startsWith('https://'))
        throw new Error('Upload did not return a durable HTTPS storage URL.');
      if (updateProfile) {
        const res = await updateProfile({ avatarUrl: url });
        if (res?.error) throw res.error;
      }
      showToast('Super Admin profile picture updated successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Avatar upload failed.');
    } finally {
      input.value = '';
      setIsUploadingAvatar(false);
      endOperation();
    }
  };

  const handleRemoveAvatar = async () => {
    if (!beginOperation()) return;
    setIsUploadingAvatar(true);
    try {
      if (updateProfile) {
        const res = await updateProfile({ avatarUrl: '' });
        if (res?.error) throw res.error;
      }
      showToast('Profile picture removed.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove avatar.');
    } finally {
      setIsUploadingAvatar(false);
      endOperation();
    }
  };


  // Do not expose editable defaults when the authoritative load failed or is pending.
  if (isLoadingSettings)
    return <AdminPageSkeleton label="Loading saved settings…" variant="form" />;
  if (settingsLoadError)
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          Settings could not be loaded: {settingsLoadError}. Editing is unavailable until reload
          succeeds.
        </div>
        <button
          type="button"
          onClick={() => void loadSettings()}
          className="rounded-lg border px-4 py-2"
        >
          Retry settings load
        </button>
      </div>
    );

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role={toastKind === 'error' ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {toastKind === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {!canManageSettings && (
        <p role="status">
          Read-only: an active Super Admin is required to change platform settings.
        </p>
      )}
      <p className="text-xs text-slate-500">
        Only confirmed backend saves are reported as successful. Unimplemented controls are disabled
        and labeled.
      </p>
      {/* Hidden file inputs */}
      <input
        disabled={!canManageSettings || isSaving}
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleAvatarUpload}
        aria-label="Upload profile picture"
      />
      <input
        disabled={!canManageSettings || isSaving}
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleLogoUpload}
        aria-label="Upload platform logo"
      />
      <input
        disabled={!canManageSettings || isSaving}
        ref={faviconInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={handleFaviconUpload}
        aria-label="Upload platform favicon"
      />

      {/* ==================================================================== */}
      {/* PAGE HEADER                                                          */}
      {/* ==================================================================== */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">
          Configure platform settings, manage integrations, and customize your PracticeKoro
          experience.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* TOP NAVIGATION TABS (8 CARDS)                                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer relative',
                isActive
                  ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-600 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-white dark:bg-[#0B132B] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mb-3',
                  tab.iconBg,
                  tab.iconColor
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p
                className={cn(
                  'text-xs font-bold leading-tight',
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                )}
              >
                {tab.label}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate">
                {tab.sublabel}
              </p>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: GENERAL SETTINGS (Exact layout of reference image)            */}
      {/* ==================================================================== */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================ */}
          {/* LEFT COLUMN: General Settings & Feature Toggles (Unavailable)                  */}
          {/* ================================================================ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 0: Super Admin Profile & Picture */}
            <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Super Admin Profile Picture
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Your avatar photo displays in the admin panel top navigation header and sidebar.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-5">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[#026BFC] text-white font-bold flex items-center justify-center text-xl shadow-md ring-4 ring-blue-500/10 overflow-hidden">
                      {currentAdmin?.avatarUrl ? (
                        <img
                          src={currentAdmin.avatarUrl}
                          alt={currentAdmin?.fullName || 'Super Admin'}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span>{currentAdmin?.fullName?.charAt(0) || 'S'}</span>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {currentAdmin?.fullName || 'Super Admin'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/20">
                        {adminRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {currentAdmin?.email || 'admin@practicekoro.online'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      PNG or JPG • Max 2MB • Square recommended
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    disabled={!canManageSettings || isSaving || isUploadingAvatar}
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingAvatar ? 'Uploading...' : currentAdmin?.avatarUrl ? 'Change Picture' : 'Upload Picture'}</span>
                  </button>
                  {currentAdmin?.avatarUrl && (
                    <button
                      disabled={!canManageSettings || isSaving || isUploadingAvatar}
                      type="button"
                      aria-label="Remove profile picture"
                      onClick={() => void handleRemoveAvatar()}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card 1: General Settings */}
            <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    General Settings
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Basic platform information and configuration. Timezone and UI language are
                    deployment-managed.
                  </p>
                </div>
              </div>

              {/* Card Body (Two sub-columns inside) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
                {/* Sub-column 1: Text Fields (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Platform Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="Platform Name"
                      type="text"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Website URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="Website URL"
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Admin Email (Optional)
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="Admin Email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Support Email
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="Support Email"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Phone
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="Contact Phone"
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="supportWhatsapp"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Support WhatsApp (Optional)
                    </label>
                    <input
                      id="supportWhatsapp"
                      aria-label="Support WhatsApp"
                      disabled={!canManageSettings || isSaving}
                      type="text"
                      value={supportWhatsapp}
                      onChange={(e) => setSupportWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="supportHours"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Support Hours (Optional)
                    </label>
                    <input
                      id="supportHours"
                      aria-label="Support Hours"
                      disabled={!canManageSettings || isSaving}
                      type="text"
                      value={supportHours}
                      onChange={(e) => setSupportHours(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Address (Optional)
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="Address (Optional)"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Timezone
                      </label>
                      <div className="relative">
                        <select
                          value={timezone}
                          disabled
                          title="Not wired to runtime settings"
                          className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                        >
                          <option value="Asia/Kolkata (GMT +5:30)">Asia/Kolkata (GMT +5:30)</option>
                          <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
                          <option value="Asia/Dubai (GMT +4:00)">Asia/Dubai (GMT +4:00)</option>
                          <option value="America/New_York (GMT -5:00)">
                            America/New_York (GMT -5:00)
                          </option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Language
                      </label>
                      <div className="relative">
                        <select
                          value={language}
                          disabled
                          title="Not wired to runtime settings"
                          className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                        >
                          <option value="English">English</option>
                          <option value="Bengali">Bengali (বাংলা)</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-column 2: Assets, Description, Maintenance & Save (5 cols) */}
                <div className="md:col-span-5 space-y-4">
                  {/* Platform Logo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Platform Logo
                    </label>
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-full bg-[#026BFC] flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                        {platformLogo ? (
                          <img
                            src={platformLogo}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full border-2 border-white/80 flex items-center justify-center">
                            <span className="font-black text-sm tracking-tighter">PK</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Recommended size: 512 × 512 px
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                          PNG or JPG (Max 2MB)
                        </p>
                        <div className="flex items-center gap-2.5 pt-1">
                          <button
                            disabled={!canManageSettings || isSaving}
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            Change Logo
                          </button>
                          <button
                            disabled={!canManageSettings || isSaving}
                            type="button"
                            aria-label="Remove platform logo"
                            onClick={() => void removeAsset('logo')}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Favicon
                    </label>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                        {favicon ? (
                          <img src={favicon} alt="Favicon" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded border border-white/80 flex items-center justify-center">
                            <span className="font-black text-[9px]">P</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          Recommended size: 32 × 32 px
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                          PNG, ICO (Max 1MB)
                        </p>
                        <div className="flex items-center gap-2.5 pt-0.5">
                          <button
                            disabled={!canManageSettings || isSaving}
                            type="button"
                            onClick={() => faviconInputRef.current?.click()}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            Change Favicon
                          </button>
                          <button
                            disabled={!canManageSettings || isSaving}
                            type="button"
                            aria-label="Remove favicon"
                            onClick={() => void removeAsset('favicon')}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Description */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Platform Description
                    </label>
                    <textarea
                      disabled={!canManageSettings || isSaving}
                      aria-label="Platform Description"
                      rows={3}
                      maxLength={300}
                      value={platformDescription}
                      onChange={(e) => setPlatformDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {platformDescription.length}/300
                      </span>
                    </div>
                  </div>

                  {/* Maintenance Mode Toggle */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Maintenance Mode
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        When enabled, the site will be inaccessible to students.
                      </p>
                    </div>
                    <button
                      disabled={!canManageSettings || isSaving}
                      type="button"
                      role="switch"
                      aria-label="Toggle maintenance mode"
                      aria-checked={maintenanceMode}
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0',
                        maintenanceMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full bg-white transition-transform absolute top-1',
                          maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>

                  {/* Save Changes button */}
                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveGeneral()}
                      disabled={!canManageSettings || isSaving}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Feature Toggles (Unavailable) */}
            <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Feature Toggles (Unavailable)
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Enable or disable features across the platform.
                  </p>
                </div>
              </div>

              {/* Toggles Grid (2 Columns, Switch on Left -> Icon -> Text) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 pt-5">
                {/* Left Column Toggles */}
                <div className="space-y-4">
                  {/* Student Registration */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('studentRegistration')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.studentRegistration
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.studentRegistration ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Student Registration
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Allow new student signups
                      </p>
                    </div>
                  </div>

                  {/* Mock Tests */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('mockTests')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.mockTests ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.mockTests ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Mock Tests
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Enable mock test access
                      </p>
                    </div>
                  </div>

                  {/* Topic Tests */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('topicTests')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.topicTests ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.topicTests ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Topic Tests
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Enable topic-wise tests
                      </p>
                    </div>
                  </div>

                  {/* Leaderboards */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('leaderboards')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.leaderboards
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.leaderboards ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Leaderboards
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Show rankings and leaderboard
                      </p>
                    </div>
                  </div>

                  {/* Blog / Study Notes */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('blogStudyNotes')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.blogStudyNotes
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.blogStudyNotes ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Blog / Study Notes
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Enable blog section
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column Toggles */}
                <div className="space-y-4">
                  {/* Paid Subscriptions */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('paidSubscriptions')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.paidSubscriptions
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.paidSubscriptions ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Paid Subscriptions
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Enable subscription plans
                      </p>
                    </div>
                  </div>

                  {/* Coupons & Offers */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('couponsOffers')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.couponsOffers
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.couponsOffers ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Coupons & Offers
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Enable discount coupons
                      </p>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('notifications')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.notifications
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.notifications ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Notifications
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Enable in-app notifications
                      </p>
                    </div>
                  </div>

                  {/* Referral Program */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('referralProgram')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.referralProgram
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.referralProgram ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        Referral Program
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Enable referral system
                      </p>
                    </div>
                  </div>

                  {/* App Download Links */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled
                      title="Feature enforcement is not implemented"
                      onClick={() => toggleFeature('appDownloadLinks')}
                      className={cn(
                        'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                        featureToggles.appDownloadLinks
                          ? 'bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-1',
                          featureToggles.appDownloadLinks ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        App Download Links
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                        Show mobile app download links
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN: Theme & Branding, Email SMTP, Danger Zone           */}
          {/* ================================================================ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 3: Theme & Branding */}
            <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Theme & Branding
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Saved defaults apply to the website; explicit user theme preferences win. Save
                    these separately from General settings.
                  </p>
                </div>
              </div>

              {/* Card Body: Controls (Left) & Preview (Right) */}
              <button
                type="button"
                disabled={!canManageSettings || isSaving}
                onClick={() => void handleSaveBranding()}
                className="my-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Save Theme Defaults
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-5">
                {/* Controls (6 cols) */}
                <div className="sm:col-span-6 space-y-3.5">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2.5">
                        <input
                          disabled={!canManageSettings || isSaving}
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                          {primaryColor.toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Secondary Color
                    </label>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2.5">
                        <input
                          disabled={!canManageSettings || isSaving}
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                          {secondaryColor.toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2.5">
                        <input
                          disabled={!canManageSettings || isSaving}
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                        />
                        <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                          {accentColor.toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Theme Mode */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Platform Default Theme
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                      <button
                        type="button"
                        disabled={!canManageSettings || isSaving}
                        onClick={() => setThemeMode('light')}
                        aria-pressed={themeMode === 'light'}
                        title="Default for users without an explicit theme preference"
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                          themeMode === 'light'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        )}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canManageSettings || isSaving}
                        onClick={() => setThemeMode('dark')}
                        aria-pressed={themeMode === 'dark'}
                        title="Default for users without an explicit theme preference"
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                          themeMode === 'dark'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        )}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canManageSettings || isSaving}
                        onClick={() => setThemeMode('system')}
                        aria-pressed={themeMode === 'system'}
                        title="Default for users without an explicit theme preference"
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                          themeMode === 'system'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        )}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Font Family
                    </label>
                    <div className="relative">
                      <select
                        aria-label="Platform Font Family"
                        value={fontFamily}
                        disabled={!canManageSettings || isSaving}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                      >
                        {Object.keys(PLATFORM_FONTS).map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Preview (6 cols) */}
                <div className="sm:col-span-6 flex flex-col">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Preview
                  </p>
                  <div className="flex-1 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-2xs">
                    {/* Mock Website Navbar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4.5 h-4.5 rounded flex items-center justify-center text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span className="font-black text-[9px]">P</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight">
                          PracticeKoro
                        </span>
                      </div>
                      <div className="text-slate-400">
                        <span className="text-sm">☰</span>
                      </div>
                    </div>

                    {/* Mock Hero Section */}
                    <div className="py-4 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7 space-y-1">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                          Practice Today
                          <br />
                          Achieve Tomorrow
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                          Your success begins with practice
                        </p>
                        <div className="pt-2">
                          <button
                            disabled={!canManageSettings || isSaving}
                            type="button"
                            className="px-2.5 py-1 rounded text-[9px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Get Started
                          </button>
                        </div>
                      </div>

                      {/* SVG Illustration of Student with Books & Plant */}
                      <div className="col-span-5 flex items-center justify-center">
                        <svg
                          viewBox="0 0 100 90"
                          className="w-full h-auto max-h-20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {/* Plant in background */}
                          <path d="M85 70 C85 45 92 35 92 35 C92 35 78 48 83 70 Z" fill="#10B981" />
                          <path d="M80 72 C80 55 70 42 70 42 C70 42 76 60 82 72 Z" fill="#34D399" />
                          <path d="M88 72 C88 60 96 52 96 52 C96 52 89 65 86 72 Z" fill="#059669" />
                          {/* Table surface */}
                          <rect x="10" y="70" width="80" height="3" rx="1.5" fill="#E2E8F0" />
                          {/* Books on table */}
                          <rect x="18" y="65" width="16" height="5" rx="1" fill="#3B82F6" />
                          <rect x="20" y="61" width="14" height="4" rx="1" fill="#10B981" />
                          <rect x="22" y="58" width="11" height="3" rx="1" fill="#F59E0B" />
                          {/* Student reading at desk */}
                          {/* Body */}
                          <path
                            d="M48 48 C42 48 38 56 38 68 L64 68 C64 56 60 48 54 48 Z"
                            fill={primaryColor}
                          />
                          {/* Head */}
                          <circle cx="51" cy="38" r="8" fill="#FCD34D" />
                          {/* Hair */}
                          <path d="M44 36 C44 30 58 28 59 34 C55 33 48 34 44 36 Z" fill="#1E293B" />
                          {/* Arms holding book */}
                          <path
                            d="M40 56 L48 64 L54 64 L62 56"
                            stroke="#FCD34D"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          {/* Open book */}
                          <path
                            d="M43 62 L49 65 L55 62 L61 65"
                            stroke="#FFFFFF"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div
                        className="w-2.5 h-1.5 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Email Configuration (SMTP) */}
            <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Email Configuration (SMTP)
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Save non-secret SMTP reference metadata. Server-side setup is required for
                    delivery.
                  </p>
                </div>
              </div>

              {/* SMTP Inputs */}
              <div className="space-y-3.5 pt-5">
                {/* Row 1: 4 columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SMTP Provider
                    </label>
                    <div className="relative">
                      <select
                        disabled={!canManageSettings || isSaving}
                        value={smtpProvider}
                        onChange={(e) => setSmtpProvider(e.target.value)}
                        className="w-full appearance-none px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-7"
                      >
                        <option value="Custom SMTP">Custom SMTP</option>
                        <option value="SendGrid">SendGrid</option>
                        <option value="AWS SES">AWS SES</option>
                        <option value="Mailgun">Mailgun</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SMTP Host
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="SMTP Host"
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SMTP Port
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="SMTP Port"
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Encryption
                    </label>
                    <div className="relative">
                      <select
                        disabled={!canManageSettings || isSaving}
                        value={smtpEncryption}
                        onChange={(e) => setSmtpEncryption(e.target.value)}
                        className="w-full appearance-none px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-7"
                      >
                        <option value="TLS">TLS</option>
                        <option value="SSL">SSL</option>
                        <option value="None">None</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 2: 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SMTP Username
                    </label>
                    <input
                      disabled={!canManageSettings || isSaving}
                      aria-label="SMTP Username"
                      type="text"
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <p className="text-xs text-amber-700">
                    SMTP credentials are configured server-side. Do not enter passwords here. Saved
                    values are reference metadata only; this page does not enable mail delivery.
                  </p>
                </div>

                {/* Actions: Send Test Email & Save SMTP Settings */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled
                    title="No server-side email delivery action is connected"
                    onClick={handleSendTestEmail}
                    aria-disabled={isSendingTestEmail}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSendingTestEmail ? 'Sending...' : 'Send Test Email'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSMTP}
                    disabled={!canManageSettings || isSaving}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Save SMTP Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Danger Zone */}
            <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-4">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 leading-tight">
                    Danger Zone
                  </h2>
                  <p className="text-xs text-rose-500/80 dark:text-rose-400/80 mt-0.5">
                    These actions are irreversible. Please be careful.
                  </p>
                </div>
              </div>

              {/* Action Box: Clear Cache */}
              <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 rounded-xl p-3.5 flex items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Clear Cache
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Clear local offline cache only; never sign-in sessions or server caches
                    </p>
                  </div>
                </div>

                <button
                  disabled={!canManageSettings || isSaving}
                  type="button"
                  onClick={() => setShowClearCacheModal(true)}
                  className="px-4 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: BRANDING                                                      */}
      {/* ==================================================================== */}
      {activeTab === 'branding' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Branding & Visual Identity
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Manage logos, color palettes, typography and visual assets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Platform Colors
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Primary Brand Color picker"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Primary Brand Color"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Secondary Brand Color picker"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    disabled={!canManageSettings || isSaving}
                    aria-label="Secondary Brand Color"
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Accent Brand Color picker"
                    disabled={!canManageSettings || isSaving}
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    aria-label="Accent Brand Color"
                    disabled={!canManageSettings || isSaving}
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Typography
              </h3>
              <div>
                <label
                  htmlFor="platform-theme"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Platform Default Theme
                </label>
                <select
                  id="platform-theme"
                  aria-label="Platform Default Theme"
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark' | 'system')}
                  disabled={!canManageSettings || isSaving}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Font Family
                </label>
                <select
                  aria-label="Primary Font Family"
                  value={fontFamily}
                  disabled={!canManageSettings || isSaving}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
                  {Object.keys(PLATFORM_FONTS).map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Platform Logo & Favicon
              </h3>

              {/* Platform Logo */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Platform Logo
                </label>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#026BFC] flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                    {platformLogo ? (
                      <img src={platformLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-white/80 flex items-center justify-center">
                        <span className="font-black text-xs tracking-tighter">PK</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      Recommended: 512 × 512 px PNG or JPG (Max 2MB)
                    </p>
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <button
                        disabled={!canManageSettings || isSaving}
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                      >
                        Change Logo
                      </button>
                      {platformLogo && (
                        <button
                          disabled={!canManageSettings || isSaving}
                          type="button"
                          aria-label="Remove platform logo from branding"
                          onClick={() => void removeAsset('logo')}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Favicon
                </label>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                    {favicon ? (
                      <img src={favicon} alt="Favicon" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded border border-white/80 flex items-center justify-center">
                        <span className="font-black text-[9px]">P</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      32 × 32 px PNG (Max 1MB)
                    </p>
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <button
                        disabled={!canManageSettings || isSaving}
                        type="button"
                        onClick={() => faviconInputRef.current?.click()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                      >
                        Change Favicon
                      </button>
                      {favicon && (
                        <button
                          disabled={!canManageSettings || isSaving}
                          type="button"
                          aria-label="Remove favicon from branding"
                          onClick={() => void removeAsset('favicon')}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => void handleSaveBranding()}
              disabled={!canManageSettings || isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Save Branding Settings
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: SEO & META                                                    */}
      {/* ==================================================================== */}
      {activeTab === 'seo' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                SEO & Meta Configuration
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Saved defaults apply to browser metadata. Page-specific titles/descriptions remain
                authoritative. Search Console requires verification with Google;
                server-rendered/prerendered SEO needs a separate rebuild.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Title
              </label>
              <input
                aria-label="Default Meta Title"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                disabled={!canManageSettings || isSaving}
                placeholder="Website default metadata"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Search Console Verification Tag
              </label>
              <input
                aria-label="Google Search Console Verification Tag"
                type="text"
                value={searchConsoleToken}
                onChange={(e) => setSearchConsoleToken(e.target.value)}
                disabled={!canManageSettings || isSaving}
                placeholder="Verification token only, not HTML"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Description
              </label>
              <textarea
                aria-label="Default Meta Description"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                disabled={!canManageSettings || isSaving}
                placeholder="Website default metadata"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={!canManageSettings || isSaving}
              onClick={() => void handleSaveSEO()}
              title="Save website defaults without replacing page-specific SEO"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Save SEO Settings
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: EMAIL & NOTIFICATIONS                                         */}
      {/* ==================================================================== */}
      {activeTab === 'email' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Email Templates & Notifications
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                These templates are not connected to a delivery backend. No messages are sent by
                this page.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Welcome Email', desc: 'Sent when a new student signs up', active: true },
              {
                title: 'Exam Result Summary',
                desc: 'Sent after completing mock tests',
                active: true,
              },
              {
                title: 'Subscription Receipt',
                desc: 'Sent upon successful payment',
                active: true,
              },
              {
                title: 'Plan Expiry Reminder',
                desc: 'Sent 7 days before subscription ends',
                active: true,
              },
            ].map((tmpl) => (
              <div
                key={tmpl.title}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tmpl.desc}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Not managed here
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled
              title="No server-side email delivery action is connected"
              onClick={handleSendTestEmail}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Send Sample Notification
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: PAYMENTS                                                      */}
      {/* ==================================================================== */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Gateway & Invoicing
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Saved gateway configuration is not a live payment health check. The public Key ID
                must match the server credentials; rotate both together. Tax/invoice controls are
                unavailable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Razorpay Key ID
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Razorpay Key ID"
                type="text"
                value={rzpKeyId}
                onChange={(e) => setRzpKeyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Gateway Status
              </label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={!canManageSettings || isSaving}
                  type="button"
                  role="switch"
                  aria-label="Gateway enabled"
                  aria-checked={rzpIsActive}
                  onClick={() => setRzpIsActive(!rzpIsActive)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                    rzpIsActive ? 'bg-emerald-600' : 'bg-slate-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform absolute top-1',
                      rzpIsActive ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {rzpIsActive
                    ? `Enabled configuration (${rzpKeyId.startsWith('rzp_test_') ? 'test' : 'live'} mode)`
                    : 'Disabled configuration'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Currency
              </label>
              <select
                aria-label="Default Currency"
                value={currency}
                disabled
                title="Checkout supports INR only"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ United States Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                GST / Tax Rate (%)
              </label>
              <input
                aria-label="GST / Tax Rate (%)"
                type="text"
                value={taxPercent}
                disabled
                placeholder="Not managed here"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Invoice Number Prefix
              </label>
              <input
                aria-label="Invoice Number Prefix"
                type="text"
                value={invoicePrefix}
                disabled
                placeholder="Not managed here"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => void handleSavePayment()}
              disabled={!canManageSettings || isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Save Payment Settings
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: INTEGRATIONS                                                  */}
      {/* ==================================================================== */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  SMS & Push Notification Gateways
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure Fast2SMS for carrier text alerts and Firebase Cloud Messaging (FCM) for mobile & web push notifications.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveIntegrations()}
              disabled={!canManageSettings || isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Gateways'}
            </button>
          </div>

          {/* Section 1: Fast2SMS Gateway */}
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Fast2SMS Gateway (Direct SMS)
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        fast2smsEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      )}
                    >
                      {fast2smsEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Send instant test reminders, result alerts, and login OTPs directly to Indian mobile numbers via Fast2SMS.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={fast2smsEnabled}
                  onChange={(e) => setFast2smsEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                    fast2smsEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5',
                      fast2smsEnabled ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {fast2smsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Fast2SMS Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Key */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Fast2SMS Authorization API Key</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    From Fast2SMS Dev Dashboard (bulkV2)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={fast2smsShowKey ? 'text' : 'password'}
                    value={fast2smsApiKey}
                    onChange={(e) => setFast2smsApiKey(e.target.value)}
                    placeholder="e.g. gM4oP2hJbS7iZ5rK... (Your Fast2SMS API Key)"
                    className="w-full h-10 px-3.5 pr-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFast2smsShowKey(!fast2smsShowKey)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={fast2smsShowKey ? 'Hide key' : 'Show key'}
                    >
                      {fast2smsShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {fast2smsApiKey && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(fast2smsApiKey);
                          showToast('Fast2SMS API Key copied to clipboard', 'info');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Copy API Key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Route */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  SMS Route
                </label>
                <select
                  value={fast2smsRoute}
                  onChange={(e) => setFast2smsRoute(e.target.value as any)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="q">Quick (Standard Transactional / Promotional)</option>
                  <option value="dlt">DLT (TRAI Registered Headers & Templates)</option>
                  <option value="otp">OTP (Priority Service for Login Verification)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Select &quot;Quick&quot; for instant sending without DLT template approval, or &quot;DLT&quot; for official header delivery.
                </p>
              </div>

              {/* Sender ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Sender ID / Header
                </label>
                <input
                  type="text"
                  value={fast2smsSenderId}
                  onChange={(e) => setFast2smsSenderId(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="FSTSMS (6 chars)"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  Default: FSTSMS. Use your DLT approved header (e.g. PRCKRO) when using DLT route.
                </p>
              </div>
            </div>

            {/* Live Tools: Balance Check & Test SMS */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Fast2SMS Live Testing & Balance
                </h4>
                {smsBalanceInfo && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {smsBalanceInfo}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleCheckBalance()}
                  disabled={isCheckingBalance}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isCheckingBalance && 'animate-spin')} />
                  {isCheckingBalance ? 'Checking...' : 'Check Balance'}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="tel"
                    value={testSmsMobile}
                    onChange={(e) => setTestSmsMobile(e.target.value)}
                    placeholder="Enter 10-digit mobile (e.g. 9876543210)"
                    className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => void handleTestSms()}
                    disabled={isSendingTestSms}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingTestSms ? 'Sending...' : 'Send Test SMS'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Firebase Cloud Messaging (FCM) */}
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Firebase Cloud Messaging (FCM Push)
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        fcmEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      )}
                    >
                      {fcmEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Broadcast real-time push alerts to students on Android APK and Web browsers.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={fcmEnabled}
                  onChange={(e) => setFcmEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                    fcmEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5',
                      fcmEnabled ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {fcmEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* FCM Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Firebase Project ID
                </label>
                <input
                  type="text"
                  value={fcmProjectId}
                  onChange={(e) => setFcmProjectId(e.target.value)}
                  placeholder="e.g. practicekoro-app"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  Your Google Firebase project identifier from Firebase Console Settings.
                </p>
              </div>

              {/* VAPID Public Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Web Push VAPID Key (Public)
                </label>
                <input
                  type="text"
                  value={fcmVapidKey}
                  onChange={(e) => setFcmVapidKey(e.target.value)}
                  placeholder="e.g. BBa... (Web Push Certificate Key)"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  Used by service worker to subscribe student web browsers to notifications.
                </p>
              </div>

              {/* Server Key / Auth Token */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>FCM Server Key / Cloud Messaging Token</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    From Firebase Project Settings &gt; Cloud Messaging
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={fcmShowKey ? 'text' : 'password'}
                    value={fcmServerKey}
                    onChange={(e) => setFcmServerKey(e.target.value)}
                    placeholder="e.g. AAAA... (FCM Legacy Server Key or Service Token)"
                    className="w-full h-10 px-3.5 pr-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFcmShowKey(!fcmShowKey)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={fcmShowKey ? 'Hide key' : 'Show key'}
                    >
                      {fcmShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {fcmServerKey && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(fcmServerKey);
                          showToast('FCM Server Key copied to clipboard', 'info');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Copy Server Key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* FCM Live Test Tool */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  FCM Push Notification Test
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dispatches a test push notification to verify gateway handshake and credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleTestPush()}
                disabled={isSendingTestPush}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50 shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                {isSendingTestPush ? 'Testing...' : 'Send Test Push Alert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 7: SECURITY                                                      */}
      {/* ==================================================================== */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Security & Access Protection
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Auth protections must be configured server-side. These controls do not enforce
                policies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Timeout (Minutes)
              </label>
              <input
                aria-label="Session Timeout (Minutes)"
                type="number"
                disabled
                placeholder="Managed by Supabase Auth"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Failed Login Attempts
              </label>
              <input
                aria-label="Max Failed Login Attempts"
                type="number"
                disabled
                placeholder="Managed by Supabase Auth"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled
              title="Auth policies must be configured server-side"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Update Security Policies
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 8: SYSTEM                                                        */}
      {/* ==================================================================== */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                System Diagnostics & Maintenance
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Database statistics, platform version, and runtime status.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Platform Version</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{appVersion}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Database Engine</p>
              <p className="text-lg font-black text-blue-600 mt-1">Managed by Supabase</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Server Status</p>
              <p className="text-lg font-black text-emerald-600 mt-1">Not monitored here</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Storage Buckets</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Not monitored here
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CLEAR CACHE CONFIRMATION MODAL                                       */}
      {/* ==================================================================== */}
      {showClearCacheModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clear Local Admin Cache?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to clear your local admin browser cache?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              This action clears the named local offline cache only. Sign-in sessions and other
              browser storage are preserved. It does not delete or modify database records or affect
              student data on the server.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                disabled={!canManageSettings || isSaving}
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCache}
                disabled={!canManageSettings || isSaving || isClearingCache}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isClearingCache ? 'Clearing...' : 'Yes, Clear Cache'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
