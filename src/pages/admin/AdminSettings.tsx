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
} from 'lucide-react';

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
  const { user: currentAdmin, adminRole } = useAuth();
  const canManageSettings = adminRole === 'super_admin' && currentAdmin?.role === 'admin';
  const operationRef = useRef(false);
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
  const [address, setAddress] = useState('');
  const [timezone] = useState('Asia/Kolkata (GMT +5:30)');
  const [language] = useState('English');
  const [platformDescription, setPlatformDescription] = useState(
    'PracticeKoro is a mock test platform for West Bengal and other Government exams. Practice smart, prepare better and achieve your goal.'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);

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
  const [themeMode] = useState<'light' | 'dark' | 'system'>('light');
  const fontFamily = 'Managed by deployed theme';

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
    setIsLoadingSettings(true);
    setSettingsLoadError('');
    try {
      const [data, gatewayConfig] = await Promise.all([
        api.getAppSettings(),
        api.getPaymentGatewayConfig('razorpay'),
      ]);

      if (data && Array.isArray(data)) {
        data.forEach((s) => {
          const val = typeof s.value === 'string' ? s.value.replace(/^"|"$/g, '') : s.value;
          if (s.key === 'app_name' || s.id === 'general_app_name') setPlatformName(String(val));
          if (s.key === 'website_url' || s.id === 'general_website_url') setWebsiteUrl(String(val));
          if (s.key === 'support_email' || s.id === 'general_support_email')
            setSupportEmail(String(val));
          if (s.key === 'admin_email' || s.id === 'general_admin_email') setAdminEmail(String(val));
          if (s.key === 'support_phone' || s.id === 'general_support_phone')
            setContactPhone(String(val));
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
        });
      }

      if (gatewayConfig) {
        setRzpKeyId(gatewayConfig.keyId || '');
        setRzpIsActive(gatewayConfig.isActive);
      }
    } catch (err) {
      setSettingsLoadError(err instanceof Error ? err.message : 'Settings could not be loaded.');
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
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
      validateBrandColors([primaryColor, secondaryColor, accentColor]);
      if (platformDescription.length > 300)
        throw new Error('Platform description may not exceed 300 characters.');
      const res = await api.updateAppSettings([
        { id: 'general_app_name', value: platformName },
        { id: 'general_website_url', value: websiteUrl },
        { id: 'general_support_email', value: supportEmail },
        { id: 'general_admin_email', value: adminEmail },
        { id: 'general_support_phone', value: contactPhone },
        { id: 'general_support_address', value: address },
        { id: 'sys_maintenance_mode', value: maintenanceMode },
        { id: 'platform_description', value: platformDescription },
        { id: 'primary_color', value: primaryColor },
        { id: 'secondary_color', value: secondaryColor },
        { id: 'accent_color', value: accentColor },
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
      validateBrandColors([primaryColor, secondaryColor, accentColor]);
      const result = await api.updateAppSettings([
        { id: 'primary_color', value: primaryColor },
        { id: 'secondary_color', value: secondaryColor },
        { id: 'accent_color', value: accentColor },
      ]);
      if (!result.success) throw new Error(result.error || 'Brand colors were not saved.');
      showToast(
        'Brand preview colors saved. Global site styling is controlled by the deployed theme.',
        'success'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Branding save failed.');
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
  const handleSendTestEmail = () =>
    showToast('Email delivery is not configured through this page. No message was sent.', 'info');
  const handleConfirmClearCache = () => {
    if (!beginOperation()) return;
    setIsClearingCache(true);
    try {
      localStorage.removeItem('practicekoro_offline_cache');
      sessionStorage.removeItem('practicekoro_offline_cache');
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
        'Asset uploaded and saved. Site-wide asset rendering is controlled by the deployed layout.',
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
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleLogoUpload}
      />
      <input
        disabled={!canManageSettings || isSaving}
        ref={faviconInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={handleFaviconUpload}
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
                      Admin Email <span className="text-rose-500">*</span>
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
                      <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden">
                        {platformLogo ? (
                          <img
                            src={platformLogo}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg border-2 border-white/80 flex items-center justify-center">
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
                      disabled={!canManageSettings || isSaving || isSaving}
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
                    Customize the look and feel of your platform.
                  </p>
                </div>
              </div>

              {/* Card Body: Controls (Left) & Preview (Right) */}
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
                      Theme Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                      <button
                        type="button"
                        disabled
                        title="Global theme switching is not implemented here"
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
                        disabled
                        title="Global theme switching is not implemented here"
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
                        disabled
                        title="Global theme switching is not implemented here"
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
                        value={fontFamily}
                        disabled
                        title="Not wired to runtime settings"
                        className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                      >
                        <option value="Managed by deployed theme">Managed by deployed theme</option>
                        <option value="Inter (Default)">Inter (Default)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Noto Sans Bengali">Noto Sans Bengali</option>
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
                    disabled={!canManageSettings || isSaving || isSaving}
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
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    disabled={!canManageSettings || isSaving}
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
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
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
                    disabled={!canManageSettings || isSaving}
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Typography
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Font Family
                </label>
                <select
                  aria-label="Primary Font Family"
                  value={fontFamily}
                  disabled
                  title="Not wired to runtime settings"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="Managed by deployed theme">Managed by deployed theme</option>
                  <option value="Inter (Default)">Inter (Default)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Logo Assets
              </h3>
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  PNG / JPEG assets are managed in General settings
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  SVG uploads are not supported here.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => void handleSaveBranding()}
              disabled={!canManageSettings || isSaving || isSaving}
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
                SEO is managed by page-level metadata and deployment. This editor is not connected.
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
                disabled
                placeholder="Managed by page-level SEO metadata"
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
                disabled
                placeholder="Managed during deployment"
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
                disabled
                placeholder="Managed by page-level SEO metadata"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled
              title="SEO metadata is managed by page components and deployment, not this placeholder"
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
            ].map((tmpl, idx) => (
              <div
                key={idx}
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
                Razorpay payment processing, tax configurations, and currency.
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
              disabled={!canManageSettings || isSaving || isSaving}
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
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Third-Party Integrations
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Connection status is not verified here. Configure integrations server-side.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'Google Analytics 4',
                desc: 'Track visitor traffic and student exam funnels',
                connected: true,
              },
              {
                name: 'Firebase Cloud Messaging',
                desc: 'Deliver real-time mobile push notifications',
                connected: true,
              },
              {
                name: 'WhatsApp Business API',
                desc: 'Send test alerts and login OTPs via WhatsApp',
                connected: false,
              },
              {
                name: 'Telegram Bot Alerts',
                desc: 'Receive instant admin error and purchase logs',
                connected: true,
              },
            ].map((integ, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{integ.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{integ.desc}</p>
                </div>
                <button
                  type="button"
                  disabled
                  title="Integration connectivity is not verified or managed by this page"
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    integ.connected
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Not managed here
                </button>
              </div>
            ))}
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
