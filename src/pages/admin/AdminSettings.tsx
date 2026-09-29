import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useMaintenance } from '@/context/MaintenanceContext';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Languages,
  Sliders,
  CreditCard,
  Server,
  Key,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  User,
  Users,
  History,
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Sparkles,
  Shield,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Admin1&backgroundColor=6366f1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ProAdmin&backgroundColor=4f46e5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/personas/svg?seed=Felix&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/personas/svg?seed=Jack&backgroundColor=c0aede',
];

export const AdminSettings: React.FC = () => {
  const { user: currentAdmin, updateProfile } = useAuth();
  const { checkMaintenanceMode } = useMaintenance();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --------------------------------------------------------------------------
  // Admin Identity & Profile State
  // --------------------------------------------------------------------------
  const [adminFullName, setAdminFullName] = useState(currentAdmin?.fullName || '');
  const [adminPhone, setAdminPhone] = useState(currentAdmin?.phone || '');
  const [adminAvatarUrl, setAdminAvatarUrl] = useState(currentAdmin?.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentAdmin changes
  useEffect(() => {
    if (currentAdmin) {
      setAdminFullName(currentAdmin.fullName || '');
      setAdminPhone(currentAdmin.phone || '');
      setAdminAvatarUrl(currentAdmin.avatarUrl || '');
    }
  }, [currentAdmin]);

  // --------------------------------------------------------------------------
  // General Platform & Contact State
  // --------------------------------------------------------------------------
  const [appName, setAppName] = useState('PracticeKoro');
  const [websiteUrl, setWebsiteUrl] = useState('https://practicekoro.online');
  const [supportEmail, setSupportEmail] = useState('support@practicekoro.online');
  const [supportPhone, setSupportPhone] = useState('+91 9547771118');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+91 9547771118');
  const [supportHours, setSupportHours] = useState('Mon - Sat: 10:00 AM - 7:00 PM (IST)');
  const [supportAddress, setSupportAddress] = useState('West Bengal, India');

  // --------------------------------------------------------------------------
  // Content Language Mode State (Bengali Only vs Bilingual)
  // --------------------------------------------------------------------------
  const [contentLanguageMode, setContentLanguageMode] = useState<'bengali_only' | 'bilingual'>('bengali_only');
  const [isSavingLanguageMode, setIsSavingLanguageMode] = useState(false);
  const [langModeSuccess, setLangModeSuccess] = useState(false);

  // --------------------------------------------------------------------------
  // Exam Defaults
  // --------------------------------------------------------------------------
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [defaultMarks, setDefaultMarks] = useState(1.0);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState(0.25);
  const [defaultPassingPercent, setDefaultPassingPercent] = useState(35);

  // --------------------------------------------------------------------------
  // Monetization & Subscription State
  // --------------------------------------------------------------------------
  const [currency, setCurrency] = useState('INR');
  const [expiryWarningDays, setExpiryWarningDays] = useState(7);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [appVersion, setAppVersion] = useState('2.0.0');

  // --------------------------------------------------------------------------
  // Razorpay Gateway State
  // --------------------------------------------------------------------------
  const [rzpKeyId, setRzpKeyId] = useState('');
  // NOTE: Key Secret / Webhook Secret are NEVER entered or stored here.
  // They live only in Supabase Edge Function Secrets. This panel manages
  // the publishable Key ID + active flag; secrets are set server-side.
  const [rzpIsActive, setRzpIsActive] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);

  // --------------------------------------------------------------------------
  // Load Settings
  // --------------------------------------------------------------------------
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, gatewayConfig] = await Promise.all([
        api.getAppSettings(),
        api.getPaymentGatewayConfig('razorpay').catch((err) => {
          console.warn('Failed to load gateway config:', err);
          return null;
        }),
      ]);

      data.forEach((s) => {
        const val = typeof s.value === 'string' ? s.value.replace(/^"|"$/g, '') : s.value;
        if (s.key === 'app_name' || s.id === 'general_app_name') setAppName(String(val));
        if (s.key === 'website_url' || s.id === 'general_website_url') setWebsiteUrl(String(val));
        if (s.key === 'support_email' || s.id === 'general_support_email')
          setSupportEmail(String(val));
        if (s.key === 'support_phone' || s.id === 'general_support_phone')
          setSupportPhone(String(val));
        if (s.key === 'support_whatsapp' || s.id === 'general_support_whatsapp')
          setSupportWhatsapp(String(val));
        if (s.key === 'support_hours' || s.id === 'general_support_hours')
          setSupportHours(String(val));
        if (s.key === 'support_address' || s.id === 'general_support_address')
          setSupportAddress(String(val));
        if (
          s.key === 'content_language_mode' ||
          s.id === 'content_language_mode' ||
          s.id === 'general_content_language_mode'
        ) {
          const modeVal = String(val).replace(/^"|"$/g, '').trim().toLowerCase();
          setContentLanguageMode(modeVal === 'bilingual' ? 'bilingual' : 'bengali_only');
        }

        if (s.key === 'default_duration_minutes' || s.id === 'exam_default_duration')
          setDefaultDuration(Number(val));
        if (s.key === 'default_marks_per_q' || s.id === 'exam_default_marks')
          setDefaultMarks(Number(val));
        if (s.key === 'default_negative_marks' || s.id === 'exam_default_negative_marks')
          setDefaultNegativeMarks(Number(val));
        if (s.key === 'default_passing_percentage' || s.id === 'exam_passing_percentage')
          setDefaultPassingPercent(Number(val));

        if (s.key === 'currency' || s.id === 'sub_currency') setCurrency(String(val));
        if (s.key === 'expiry_warning_days' || s.id === 'sub_expiry_warning_days')
          setExpiryWarningDays(Number(val));
        if (s.key === 'maintenance_mode' || s.id === 'sys_maintenance_mode') {
          setMaintenanceMode(val === true || val === 'true');
        }
        if (s.key === 'app_version' || s.id === 'sys_app_version') setAppVersion(String(val));

        if (s.id === 'payment_gateway_razorpay_key_id' || s.key === 'razorpay_key_id') {
          if (val) {
            setRzpKeyId((prev) => prev || String(val));
          }
        }
        if (s.id === 'payment_gateway_razorpay_active' || s.key === 'razorpay_active') {
          if (!gatewayConfig) {
            setRzpIsActive(val === true || val === 'true');
          }
        }
      });

      if (gatewayConfig) {
        if (gatewayConfig.keyId) {
          setRzpKeyId(gatewayConfig.keyId);
        }
        setRzpIsActive(gatewayConfig.isActive);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // --------------------------------------------------------------------------
  // Handle Admin Profile Picture & Profile Save
  // --------------------------------------------------------------------------
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentAdmin) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setErrorMessage('');
      const uploadedUrl = await api.uploadUserAvatar(file, currentAdmin.id);
      setAdminAvatarUrl(uploadedUrl);

      // Save directly to profile
      const res = await updateProfile({
        fullName: adminFullName,
        phone: adminPhone,
        avatarUrl: uploadedUrl,
      });

      if (res.error) {
        throw res.error;
      }

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to upload and update profile picture'
      );
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    if (!currentAdmin) return;
    try {
      setIsSavingProfile(true);
      setErrorMessage('');
      setAdminAvatarUrl(url);

      const res = await updateProfile({
        fullName: adminFullName,
        phone: adminPhone,
        avatarUrl: url,
      });

      if (res.error) throw res.error;
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save preset avatar');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleApplyCustomUrl = async () => {
    const trimmed = customUrlInput.trim();
    if (!trimmed || !currentAdmin) return;
    try {
      setIsSavingProfile(true);
      setErrorMessage('');
      setAdminAvatarUrl(trimmed);
      setShowUrlModal(false);
      setCustomUrlInput('');

      const res = await updateProfile({
        fullName: adminFullName,
        phone: adminPhone,
        avatarUrl: trimmed,
      });

      if (res.error) throw res.error;
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save avatar URL');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAdmin) return;
    try {
      setIsSavingProfile(true);
      setErrorMessage('');
      setAdminAvatarUrl('');

      const res = await updateProfile({
        fullName: adminFullName,
        phone: adminPhone,
        avatarUrl: '',
      });

      if (res.error) throw res.error;
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to remove avatar');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveProfileOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;
    try {
      setIsSavingProfile(true);
      setErrorMessage('');
      const res = await updateProfile({
        fullName: adminFullName,
        phone: adminPhone,
        avatarUrl: adminAvatarUrl,
      });

      if (res.error) throw res.error;
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update admin profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --------------------------------------------------------------------------
  // Dedicated Save for Razorpay Payment Gateway
  // --------------------------------------------------------------------------
  const handleSaveRazorpayGateway = async () => {
    const cleanKey = rzpKeyId.trim();
    if (!cleanKey) {
      setErrorMessage('Please enter a valid Razorpay Key ID (e.g. rzp_live_... or rzp_test_...)');
      return;
    }

    try {
      setIsSavingGateway(true);
      setErrorMessage('');

      // 1. Direct sync to app_settings (ensures client apps immediately receive the key)
      const appSettingsRes = await api.updateAppSettings([
        { id: 'payment_gateway_razorpay_key_id', value: cleanKey },
        { id: 'payment_gateway_razorpay_active', value: rzpIsActive },
        { id: 'sub_currency', value: currency },
        { id: 'sub_expiry_warning_days', value: expiryWarningDays },
      ]);

      // 2. Authoritative database RPC (Key ID + active flag only — secrets
      // are never sent here; they live in Supabase Edge Function Secrets)
      const gwRes = await api.updatePaymentGatewayConfig({
        gateway: 'razorpay',
        keyId: cleanKey,
        isActive: rzpIsActive,
      });

      if (!gwRes.success && !appSettingsRes.success) {
        throw new Error(gwRes.error || appSettingsRes.error || 'Failed to update payment gateway');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Failed to save payment gateway:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save Razorpay configuration');
    } finally {
      setIsSavingGateway(false);
    }
  };

  // --------------------------------------------------------------------------
  // Dedicated Save for Content Language Mode
  // --------------------------------------------------------------------------
  const handleSaveLanguageModeDirectly = async (mode: 'bengali_only' | 'bilingual') => {
    try {
      setIsSavingLanguageMode(true);
      setErrorMessage('');
      setContentLanguageMode(mode);
      await api.updateAppSettings([{ id: 'content_language_mode', value: mode }]);
      await checkMaintenanceMode();
      setLangModeSuccess(true);
      setTimeout(() => setLangModeSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Failed to update language mode:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update content language mode'
      );
    } finally {
      setIsSavingLanguageMode(false);
    }
  };

  // --------------------------------------------------------------------------
  // Save All Settings
  // --------------------------------------------------------------------------
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSaveSuccess(false);

      const updates: Array<{ id: string; value: unknown }> = [
        { id: 'general_app_name', value: appName },
        { id: 'general_website_url', value: websiteUrl },
        { id: 'general_support_email', value: supportEmail },
        { id: 'general_support_phone', value: supportPhone },
        { id: 'general_support_whatsapp', value: supportWhatsapp },
        { id: 'general_support_hours', value: supportHours },
        { id: 'general_support_address', value: supportAddress },
        { id: 'content_language_mode', value: contentLanguageMode },

        { id: 'exam_default_duration', value: defaultDuration },
        { id: 'exam_default_marks', value: defaultMarks },
        { id: 'exam_default_negative_marks', value: defaultNegativeMarks },
        { id: 'exam_passing_percentage', value: defaultPassingPercent },

        { id: 'sub_currency', value: currency },
        { id: 'sub_expiry_warning_days', value: expiryWarningDays },
        { id: 'sys_maintenance_mode', value: maintenanceMode },
        { id: 'sys_app_version', value: appVersion },

        { id: 'payment_gateway_razorpay_key_id', value: rzpKeyId.trim() },
        { id: 'payment_gateway_razorpay_active', value: rzpIsActive },
      ];

      const [res, gwRes] = await Promise.all([
        api.updateAppSettings(updates),
        api.updatePaymentGatewayConfig({
          gateway: 'razorpay',
          keyId: rzpKeyId,
          isActive: rzpIsActive,
        }),
        currentAdmin
          ? updateProfile({
              fullName: adminFullName,
              phone: adminPhone,
              avatarUrl: adminAvatarUrl,
            })
          : Promise.resolve({ error: null }),
      ]);

      if (!res.success) {
        throw new Error(res.error || 'Failed to save platform settings');
      }

      if (!gwRes.success) {
        throw new Error(gwRes.error || 'Failed to save Razorpay payment gateway settings');
      }

      await api.logAdminActivity({
        action: 'SETTINGS_UPDATE',
        entityType: 'settings',
        entityId: 'global_platform_settings',
        entityName: 'Global Platform Settings',
        details: {
          maintenanceMode,
          appName,
          supportEmail,
          supportPhone,
          supportWhatsapp,
          defaultDuration,
          defaultMarks,
          defaultNegativeMarks,
          defaultPassingPercent,
          appVersion,
          razorpayKeyId: rzpKeyId,
          razorpayActive: rzpIsActive,
        },
        adminUser: currentAdmin,
      });

      await checkMaintenanceMode();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Global Platform Settings
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-pk-primary/10 text-pk-primary border border-pk-primary/20">
                v{appVersion} Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Admin identity, support channels, exam marking defaults, and Razorpay gateway.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadSettings}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/80 dark:border-slate-700/80"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-pk-primary' : ''}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            aria-label="Save Settings (Top)"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pk-primary hover:bg-pk-primary/90 text-white text-xs font-bold transition-all shadow-md shadow-pk-primary/25 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs across Settings, Banners, Staff, Audit Logs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Link
          to="/admin/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-pk-primary text-white shadow-xs"
        >
          <SettingsIcon className="w-4 h-4" />
          <span>General & Gateway</span>
        </Link>
        <Link
          to="/admin/banners"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Hero Banners</span>
        </Link>
        <Link
          to="/admin/staff"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Team & Staff</span>
        </Link>
        <Link
          to="/admin/audit-logs"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <History className="w-4 h-4 text-emerald-500" />
          <span>Audit Logs</span>
        </Link>
      </div>

      {/* Global Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Settings updated and saved successfully! Changes are active immediately.</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
            PERSISTED
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 1: ADMIN IDENTITY & PROFILE PICTURE                          */}
      {/* ==================================================================== */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Admin Profile & Avatar (অ্যাডমিন প্রোফাইল ছবি ও তথ্য)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your administrator profile photo, display name, and contact information.
              </p>
            </div>
          </div>

          {profileSuccess && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Profile Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Avatar Preview & Actions */}
          <div className="lg:col-span-4 flex flex-col items-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-center">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-pk-primary/20 dark:ring-pk-primary/30 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                {adminAvatarUrl ? (
                  <img
                    src={adminAvatarUrl}
                    alt={adminFullName || 'Admin'}
                    className="w-full h-full object-cover"
                    onError={() => {
                      setAdminAvatarUrl('');
                    }}
                  />
                ) : (
                  <span className="text-3xl font-black">{adminFullName?.charAt(0) || 'A'}</span>
                )}
              </div>

              {/* Status indicator */}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center shadow-xs"
                title="Super Administrator Online"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div className="mt-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {adminFullName || 'Administrator'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {currentAdmin?.email || 'admin@practicekoro.online'}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                <Shield className="w-3 h-3" />
                <span>Super Admin</span>
              </div>
            </div>

            {/* Avatar Upload Buttons */}
            <div className="w-full mt-5 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleAvatarFileUpload}
                className="hidden"
                id="adminAvatarFileInput"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-pk-primary hover:bg-pk-primary/90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingAvatar ? 'Uploading Picture...' : 'Upload Photo'}</span>
              </button>

              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(!showUrlModal)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                  <span>Image URL</span>
                </button>

                {adminAvatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isSavingProfile}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors"
                    title="Remove Avatar"
                    aria-label="Remove Avatar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* URL Input Dropdown */}
              {showUrlModal && (
                <div className="p-3 mt-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Paste Image Link (Web URL)
                  </label>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowUrlModal(false)}
                      className="px-2 py-1 rounded text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      disabled={!customUrlInput.trim()}
                      className="px-2.5 py-1 rounded bg-pk-primary text-white text-[11px] font-bold disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Preset Avatars */}
            <div className="w-full mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-left">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Preset Avatars (দ্রুত বাছাই করুন):</span>
              </p>
              <div className="flex items-center justify-between gap-1.5">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(preset)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 ${
                      adminAvatarUrl === preset
                        ? 'border-pk-primary ring-2 ring-pk-primary/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                    title={`Select preset ${idx + 1}`}
                  >
                    <img
                      src={preset}
                      alt={`Preset ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Profile Details Form */}
          <form
            onSubmit={handleSaveProfileOnly}
            className="lg:col-span-8 space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-pk-primary" />
              <span>Admin Personal Credentials & Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Admin Full Name (পূর্ণ নাম)
                </label>
                <input
                  type="text"
                  required
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="e.g. Susanta Lohar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Admin Email Address (অপরিবর্তনীয়)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentAdmin?.email || 'admin@practicekoro.online'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Personal Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Active Role Privileges
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                  <span>Super Administrator (Full System Access)</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pk-primary hover:bg-pk-primary/90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 2: CONTENT LANGUAGE MODE (BENGALI ONLY vs BILINGUAL)         */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Content Language Mode (কনটেন্ট ভাষা মোড)</span>
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      contentLanguageMode === 'bengali_only'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    }`}
                  >
                    {contentLanguageMode === 'bengali_only' ? 'Bengali Only (Active)' : 'Bilingual (Active)'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Global language setting for students, question upload, and question creation.
                </p>
              </div>
            </div>

            {langModeSuccess && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Language Mode Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode 1: Bengali Only */}
            <div
              onClick={() => handleSaveLanguageModeDirectly('bengali_only')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                contentLanguageMode === 'bengali_only'
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      Bengali Only (ডিফল্ট - শুধুমাত্র বাংলা)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      Bilingual OFF
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    শিক্ষার্থীদের জন্য ওয়েব ও মোবাইল অ্যাপে শুধুমাত্র বাংলায় প্রশ্ন, অপশন ও শর্ট নোটস প্রদর্শিত হবে। প্রশ্ন তৈরিতে ইংরেজি ফিল্ডের কোনো বাধ্যবাধকতা নেই।
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <input
                    type="radio"
                    name="content_language_mode"
                    checked={contentLanguageMode === 'bengali_only'}
                    onChange={() => handleSaveLanguageModeDirectly('bengali_only')}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Mode 2: Bilingual */}
            <div
              onClick={() => handleSaveLanguageModeDirectly('bilingual')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                contentLanguageMode === 'bilingual'
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      Bilingual (বাংলা ও ইংরেজি)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                      Bilingual ON
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    বাংলা ও ইংরেজি উভয় মাধ্যমে প্রশ্ন ও অপশন সাপোর্ট করবে। শিক্ষার্থীদের টেস্ট রানার ও সলিউশনে ভাষা পরিবর্তন করার টগল সক্রিয় থাকবে।
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <input
                    type="radio"
                    name="content_language_mode"
                    checked={contentLanguageMode === 'bilingual'}
                    onChange={() => handleSaveLanguageModeDirectly('bilingual')}
                    className="w-4 h-4 text-blue-600 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Data Safe:</strong> পূর্বের সমস্ত ইংরেজি তথ্য ও ডাটাবেস রেকর্ড সম্পূর্ণ সুরক্ষিত আছে। Bilingual মোড বন্ধ থাকা অবস্থায় কোনো ইংরেজি ডেটা মুছে ফেলা হয় না।
              </span>
            </div>
            <button
              type="button"
              disabled={isSavingLanguageMode}
              onClick={() => handleSaveLanguageModeDirectly(contentLanguageMode)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shrink-0 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSavingLanguageMode ? 'Saving...' : 'Apply Mode'}
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 3: BRAND & OFFICIAL CONTACT DETAILS                          */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Identity & Public Support Details (যোগাযোগ ও ব্র্যান্ড তথ্য)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These contact lines appear on the student portal, receipts, invoice emails, and
                Contact Us pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-pk-primary" />
                <span>Platform Name (প্ল্যাটফর্মের নাম)</span>
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="PracticeKoro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-pk-primary" />
                <span>Website Public URL (ওয়েবসাইট লিংক)</span>
              </label>
              <input
                type="url"
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://practicekoro.online"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Official Support Email (সাপোর্ট ইমেল)</span>
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@practicekoro.online"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used for automated transaction receipts and ticket notifications.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Support Phone Helpline (হেল্পলাইন নম্বর)</span>
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+91 98765 43210 (Helpline)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Direct phone assistance line displayed on invoice footers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official WhatsApp Support (হোয়াটসঅ্যাপ হেল্পলাইন)</span>
              </label>
              <input
                type="text"
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                placeholder="+91 98765 43210 (WhatsApp)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Direct WhatsApp query resolution link on candidate portal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Support Operating Hours (কার্যদিবস ও সময়)</span>
              </label>
              <input
                type="text"
                value={supportHours}
                onChange={(e) => setSupportHours(e.target.value)}
                placeholder="Mon - Sat: 10:00 AM - 7:00 PM (IST)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Candidate helpline business hours and holiday notices.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Registered Operating Address & Jurisdiction (ঠিকানা ও আইনি অধিক্ষেত্র)</span>
              </label>
              <input
                type="text"
                value={supportAddress}
                onChange={(e) => setSupportAddress(e.target.value)}
                placeholder="West Bengal, India"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 3: EXAM DEFAULTS & MARKING SCHEME                            */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Exam Defaults & Marking Scheme (পরীক্ষা ও মূল্যায়নের মূল মান)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Applied automatically when creating new mock tests, subjects, or PYQ papers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Duration (mins)
              </label>
              <input
                type="number"
                min={1}
                required
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Marks / Question
              </label>
              <input
                type="number"
                step="0.25"
                min={0.25}
                required
                value={defaultMarks}
                onChange={(e) => setDefaultMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Negative Penalty (marks) — suggested default for new Full Mock / PYQ tests
              </label>
              <input
                type="number"
                step="0.05"
                min={0}
                required
                value={defaultNegativeMarks}
                onChange={(e) => setDefaultNegativeMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs sm:text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pass Threshold (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={defaultPassingPercent}
                onChange={(e) => setDefaultPassingPercent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 4: MONETIZATION & RAZORPAY PAYMENT GATEWAY                   */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Razorpay Payment Gateway
                  </h2>
                  <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 font-normal">
                    (পেমেন্ট গেটওয়ে কনফিগারেশন)
                  </span>
                  {rzpKeyId.trim().startsWith('rzp_live_') ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      LIVE MODE
                    </span>
                  ) : rzpKeyId.trim().startsWith('rzp_test_') ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      TEST / SANDBOX
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      NOT CONFIGURED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Secure checkout & signature verification credentials (Zero-Leak Architecture)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-pk-primary" />
                <span>কীভাবে Key পাবেন?</span>
                {showSetupGuide ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {rzpIsActive ? 'Gateway Active' : 'Gateway Disabled'}
                </span>
                <input
                  type="checkbox"
                  id="razorpayActiveToggle"
                  aria-label="Toggle Razorpay Active"
                  checked={rzpIsActive}
                  onChange={(e) => setRzpIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-pk-primary focus:ring-pk-primary bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Setup Guide Box */}
          {showSetupGuide && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-300">
                <span className="flex items-center gap-1.5 text-sm">
                  <Key className="w-4 h-4 text-pk-primary" />
                  Razorpay Dashboard থেকে Credentials পাওয়ার নিয়ম:
                </span>
                <a
                  href="https://dashboard.razorpay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-pk-primary hover:underline"
                >
                  Razorpay Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 text-xs pl-1">
                <li>
                  <strong className="text-slate-900 dark:text-white">dashboard.razorpay.com</strong>{' '}
                  এ লগইন করুন।
                </li>
                <li>
                  উপরে টগল করে <strong>Test Mode</strong> (পরীক্ষার জন্য) বা{' '}
                  <strong>Live Mode</strong> (লাইভ পেমেন্ট চালুর জন্য) নির্বাচন করুন।
                </li>
                <li>
                  বামদিকের মেনু থেকে <strong>Account & Settings</strong> ➔ <strong>API Keys</strong>{' '}
                  অপশনে যান।
                </li>
                <li>
                  <strong>Generate Key</strong> বাটনে ক্লিক করে <strong>Key ID</strong> কপি করুন।
                  (Key Secret এই প্যানেলে নয় — নিচে দেখুন।)
                </li>
                <li>
                  নিচে Key ID পেস্ট করে <strong>Save All Settings</strong> বাটনে ক্লিক করুন।
                </li>
              </ol>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 pt-1 font-medium">
                ⚠️ Key Secret / Webhook Secret কখনো এখানে বা ডাটাবেসে রাখবেন না — এগুলো শুধু
                Supabase Dashboard ➔ Edge Functions ➔ Secrets-এ সেট করুন।
              </p>
            </div>
          )}

          {/* Security Notice Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                জিরো-লিক সিকিউরিটি এনফোর্সড:{' '}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                Key Secret / Webhook Secret শুধু Supabase Edge Function Secrets-এ থাকে — ডাটাবেসে
                কখনো সংরক্ষিত হয় না। ক্লায়েন্ট ব্রাউজারে এগুলো কখনোই উন্মুক্ত হয় না।
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key ID Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Razorpay Key ID
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  rzp_test_... বা rzp_live_...
                </span>
              </div>
              <input
                type="text"
                value={rzpKeyId}
                onChange={(e) => setRzpKeyId(e.target.value)}
                placeholder="e.g. rzp_test_xxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                পাবলিক আইডেন্টিফায়ার, যা ব্রাউজারে Razorpay Checkout পপআপ খোলার জন্য ব্যবহৃত হয়।
              </p>
            </div>

            {/* Secrets live in Supabase — never entered or stored here */}
            <div className="md:col-span-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <span className="font-bold">Secrets are managed server-side. </span>
                <span>
                  <strong>Key Secret</strong> ও <strong>Webhook Secret</strong> এখানে পেস্ট করবেন
                  না — এগুলো শুধু Supabase Dashboard ➔ Edge Functions ➔ Secrets-এ (
                  <span className="font-mono">RAZORPAY_KEY_SECRET</span>,{' '}
                  <span className="font-mono">RAZORPAY_WEBHOOK_SECRET</span>) সেট করুন, তারপর
                  ফাংশনগুলো Redeploy করুন।
                </span>
              </div>
            </div>

            {/* Currency & Renewal Notice */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Currency Code (কারেন্সি)
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="INR"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs sm:text-sm uppercase font-bold focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Expiry Notice Threshold (মেয়াদ শেষ হওয়ার কতদিন আগে ওয়ার্নিং দেখাবে)
              </label>
              <input
                type="number"
                min={1}
                value={expiryWarningDays}
                onChange={(e) => setExpiryWarningDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pk-primary/20 focus:border-pk-primary text-xs sm:text-sm font-medium transition-all"
              />
            </div>

            {/* Dedicated Action for Gateway */}
            <div className="md:col-span-2 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {rzpKeyId.trim().startsWith('rzp_live_')
                    ? 'লাইভ মোড কনফিগারেশন অবিলম্বে সমস্ত স্টুডেন্ট ডিভাইসে সক্রিয় হবে।'
                    : 'সেভ করার পর স্টুডেন্ট প্যানেলে অনলাইন পেমেন্ট সক্রিয় হবে।'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveRazorpayGateway}
                disabled={isSavingGateway}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
              >
                {isSavingGateway ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Razorpay Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 5: SYSTEM ENVIRONMENT & MAINTENANCE CONTROLS                 */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-xs">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                System Environment & Maintenance Controls (প্ল্যাটফর্ম নিয়ন্ত্রণ)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Global emergency maintenance switches and platform release meta.
              </p>
            </div>
          </div>

          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
              maintenanceMode
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="mb-3 sm:mb-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Maintenance Mode (প্ল্যাটফর্ম রক্ষণাবেক্ষণ মোড)
                </p>
                {maintenanceMode ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    সক্রিয় (Active)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    লাইভ (Live Production)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {maintenanceMode
                  ? '⚠️ সতর্কতা: মেইনটেন্যান্স মোড সক্রিয় রয়েছে। পরীক্ষার্থীদের জন্য পরীক্ষা ও পোর্টাল সাময়িক বন্ধ থাকবে এবং রক্ষণাবেক্ষণ বার্তা প্রদর্শিত হবে।'
                  : 'সক্রিয় করলে স্টুডেন্ট অ্যাপে মেইনটেন্যান্স স্ক্রিন প্রদর্শিত হবে এবং পরীক্ষা গ্রহণ সাময়িকভাবে বন্ধ থাকবে। শুধুমাত্র অ্যাডমিনরা অ্যাক্সেস করতে পারবেন।'}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                id="maintenanceToggle"
                aria-label="Toggle Maintenance Mode"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
            </label>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Production Release Version:</span>
            <span className="font-mono text-pk-primary font-bold">
              v{appVersion} (V2 Architecture)
            </span>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click <strong>Save All Settings</strong> to persist all updates across the platform.
          </p>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pk-primary hover:bg-pk-primary/90 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-pk-primary/25 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
