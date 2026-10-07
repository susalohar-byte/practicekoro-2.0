import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useMaintenance } from '@/context/MaintenanceContext';
import { cn } from '@/lib/utils';
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
  Eye,
  EyeOff,
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
  const { user: currentAdmin } = useAuth();
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
  const [adminEmail, setAdminEmail] = useState('support@practicekoro.online');
  const [supportEmail, setSupportEmail] = useState('help@practicekoro.online');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Kolkata, West Bengal, India');
  const [timezone, setTimezone] = useState('Asia/Kolkata (GMT +5:30)');
  const [language, setLanguage] = useState('English');
  const [platformDescription, setPlatformDescription] = useState(
    'PracticeKoro is a mock test platform for West Bengal and other Government exams. Practice smart, prepare better and achieve your goal.'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // Feature Toggles State (Exact match to reference image)
  // --------------------------------------------------------------------------
  const [featureToggles, setFeatureToggles] = useState({
    studentRegistration: true,
    mockTests: true,
    topicTests: true,
    leaderboards: true,
    blogStudyNotes: false,
    paidSubscriptions: true,
    couponsOffers: true,
    notifications: true,
    referralProgram: false,
    appDownloadLinks: false,
  });

  const toggleFeature = (key: keyof typeof featureToggles) => {
    setFeatureToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast(`${key} toggle ${next[key] ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  // --------------------------------------------------------------------------
  // Theme & Branding State
  // --------------------------------------------------------------------------
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [fontFamily, setFontFamily] = useState('Inter (Default)');

  // --------------------------------------------------------------------------
  // Email SMTP Configuration
  // --------------------------------------------------------------------------
  const [smtpProvider, setSmtpProvider] = useState('Custom SMTP');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpEncryption, setSmtpEncryption] = useState('TLS');
  const [smtpUsername, setSmtpUsername] = useState('your-email@gmail.com');
  const [smtpPassword, setSmtpPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  // --------------------------------------------------------------------------
  // Payments State (Razorpay Gateway)
  // --------------------------------------------------------------------------
  const [rzpKeyId, setRzpKeyId] = useState('rzp_live_8Fh9102Xkd91k');
  const [rzpIsActive, setRzpIsActive] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [taxPercent, setTaxPercent] = useState('18');
  const [invoicePrefix, setInvoicePrefix] = useState('PK-INV-');

  // --------------------------------------------------------------------------
  // Clear Cache Dialog Modal
  // --------------------------------------------------------------------------
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Helper toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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
          if (s.id === 'primary_color' || s.key === 'primary_color') setPrimaryColor(String(val));
          if (s.id === 'secondary_color' || s.key === 'secondary_color')
            setSecondaryColor(String(val));
          if (s.id === 'accent_color' || s.key === 'accent_color') setAccentColor(String(val));
        });
      }

      if (gatewayConfig) {
        if (gatewayConfig.keyId) setRzpKeyId(gatewayConfig.keyId);
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
    try {
      setIsSaving(true);
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

      await checkMaintenanceMode();

      if (currentAdmin) {
        await api.logAdminActivity({
          action: 'SETTINGS_UPDATE',
          entityType: 'settings',
          entityId: 'general_settings',
          entityName: 'General Platform Settings',
          details: { platformName, websiteUrl, adminEmail, maintenanceMode },
          adminUser: currentAdmin,
        });
      }

      showToast('Settings saved successfully! Configuration saved in the database.');
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Save SMTP Settings
  // --------------------------------------------------------------------------
  const handleSaveSMTP = async () => {
    try {
      setIsSaving(true);
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

      showToast('SMTP Configuration saved successfully!');
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to save SMTP configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Send Test Email Simulation
  // --------------------------------------------------------------------------
  const handleSendTestEmail = () => {
    setIsSendingTestEmail(true);
    showToast(
      'Live test email sending requires a configured server-side mail provider (e.g. Resend / SendGrid Edge Function).'
    );
    setTimeout(() => {
      setIsSendingTestEmail(false);
    }, 1500);
  };

  // --------------------------------------------------------------------------
  // Clear System Cache Action
  // --------------------------------------------------------------------------
  const handleConfirmClearCache = () => {
    setIsClearingCache(true);
    setTimeout(() => {
      try {
        localStorage.removeItem('practicekoro_offline_cache');
        sessionStorage.clear();
      } catch {
        // ignore
      }
      setIsClearingCache(false);
      setShowClearCacheModal(false);
      showToast('Local admin browser cache and temporary session data cleared successfully.');
    }, 600);
  };

  // --------------------------------------------------------------------------
  // Image Upload Handlers for Logo & Favicon (Durable Backend Storage)
  // --------------------------------------------------------------------------
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const durableUrl = await uploadQuestionImage(file);
      const res = await api.updateAppSettings([{ id: 'general_platform_logo', value: durableUrl }]);
      if (res.success) {
        setPlatformLogo(durableUrl);
        showToast('Platform logo uploaded to durable storage and saved successfully!');
      } else {
        showToast(res.error || 'Failed to save uploaded logo to database.');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to upload logo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const durableUrl = await uploadQuestionImage(file);
      const res = await api.updateAppSettings([{ id: 'general_favicon', value: durableUrl }]);
      if (res.success) {
        setFavicon(durableUrl);
        showToast('Favicon uploaded to durable storage and saved successfully!');
      } else {
        showToast(res.error || 'Failed to save uploaded favicon to database.');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to upload favicon.');
    } finally {
      setIsSaving(false);
    }
  };

  // Do not expose editable defaults when the authoritative load failed or is pending.
  if (isLoadingSettings) return <div role="status">Loading saved settings…</div>;
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={handleLogoUpload}
      />
      <input
        ref={faviconInputRef}
        type="file"
        accept="image/png,image/x-icon,image/vnd.microsoft.icon"
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
          {/* LEFT COLUMN: General Settings & Feature Toggles                  */}
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
                    Basic platform information and configuration.
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
                          onChange={(e) => setTimezone(e.target.value)}
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
                          onChange={(e) => setLanguage(e.target.value)}
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
                          PNG, JPG or SVG (Max 2MB)
                        </p>
                        <div className="flex items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            Change Logo
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPlatformLogo(null);
                              showToast('Logo removed');
                            }}
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
                            type="button"
                            onClick={() => faviconInputRef.current?.click()}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            Change Favicon
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFavicon(null);
                              showToast('Favicon removed');
                            }}
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
                      type="button"
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
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Feature Toggles */}
            <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Feature Toggles
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
                        onClick={() => setThemeMode('light')}
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
                        onClick={() => setThemeMode('dark')}
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
                        onClick={() => setThemeMode('system')}
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
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full appearance-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                      >
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
                    Configure SMTP for sending emails to students.
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
                      type="text"
                      value={smtpUsername}
                      onChange={(e) => setSmtpUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SMTP Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions: Send Test Email & Save SMTP Settings */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSendingTestEmail ? 'Sending...' : 'Send Test Email'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSMTP}
                    disabled={isSaving}
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
                      Clear system cache and temporary files
                    </p>
                  </div>
                </div>

                <button
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
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
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
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                  />
                  <input
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
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                >
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
                  Upload Vector SVG Logo
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  High resolution for retina displays
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleSaveGeneral()}
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
                Optimize search rankings, Open Graph metadata, and indexing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Title
              </label>
              <input
                type="text"
                defaultValue="PracticeKoro - West Bengal & Govt Exam Mock Test Platform"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Search Console Verification Tag
              </label>
              <input
                type="text"
                placeholder="google-site-verification=..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Meta Description
              </label>
              <textarea
                rows={3}
                defaultValue="Practice smart, prepare better and achieve your goal with West Bengal government exam mock tests, previous year papers, and performance analytics."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => showToast('SEO settings saved successfully!')}
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
                Configure automated student emails, receipt triggers, and push delivery.
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
              { title: 'Subscription Receipt', desc: 'Sent upon successful payment', active: true },
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
                  Active
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
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
                  type="button"
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
                  {rzpIsActive ? 'Gateway Active (Live Mode)' : 'Gateway Inactive'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
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
                type="text"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => showToast('Payment gateway settings saved successfully!')}
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
                Connect external APIs, analytics suites, and messaging webhooks.
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
                  onClick={() => showToast(`${integ.name} status updated`)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    integ.connected
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {integ.connected ? 'Configured' : 'Connect'}
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
                Session durations, password policies, and brute-force defenses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Timeout (Minutes)
              </label>
              <input
                type="number"
                defaultValue={120}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Failed Login Attempts
              </label>
              <input
                type="number"
                defaultValue={5}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => showToast('Security policies updated successfully!')}
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
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">v2.0.0 Pro</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Database Engine</p>
              <p className="text-lg font-black text-blue-600 mt-1">Supabase PG15</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Server Status</p>
              <p className="text-lg font-black text-emerald-600 mt-1">Healthy (100%)</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
              <p className="text-[11px] font-semibold text-slate-400">Storage Buckets</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1">2.4 GB Used</p>
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
              This action clears your local administrator browser cache and temporary session data
              only. It does not delete or modify database records or affect student data on the
              server.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCache}
                disabled={isClearingCache}
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
