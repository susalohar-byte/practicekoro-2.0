import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import { isSupabaseConfigured } from '@/lib/supabase';
import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Gift,
  Plus,
  Check,
  X,
  GraduationCap,
  Crown,
  Gem,
  Sprout,
  Smartphone,
  FileText,
  BookOpen,
  BarChart2,
  Headphones,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  badge?: string;
  badgeColor?: string;
  buttonText: string;
  buttonClass: string;
  themeColor: string;
  borderClass: string;
  bgClass: string;
  iconType: 'free' | 'basic' | 'pro' | 'ultimate';
  features: PlanFeature[];
}

export interface RecentSubscriptionItem {
  id: number;
  studentName: string;
  studentAvatar: string;
  plan: string;
  planBadgeClass: string;
  amount: number;
  date: string;
  status: string;
}

// Initial 4 Plans matching schema
const INITIAL_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'free',
    name: 'Free Plan',
    subtitle: 'Start your preparation',
    price: 0,
    originalPrice: 0,
    durationDays: 365,
    buttonText: 'Current Plan',
    buttonClass: 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-default',
    themeColor: '#16A34A',
    borderClass: 'border-slate-200/80',
    bgClass: 'bg-white',
    iconType: 'free',
    features: [
      { text: 'Limited mock tests', included: true },
      { text: 'Topic-wise tests (limited)', included: true },
      { text: 'Basic performance analysis', included: true },
      { text: 'Access to free study notes', included: true },
      { text: 'Full mock tests (locked)', included: false },
      { text: 'Previous year papers (locked)', included: false },
      { text: 'Detailed solutions (locked)', included: false },
      { text: 'No ads (locked)', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    subtitle: 'For serious learners',
    price: 99,
    originalPrice: 179,
    durationDays: 180,
    badge: 'Most Popular',
    badgeColor: 'bg-[#F43F5E] text-white',
    buttonText: 'Get Basic Plan',
    buttonClass: 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-2xs',
    themeColor: '#0284C7',
    borderClass: 'border-2 border-blue-400/90 ring-4 ring-blue-50/50',
    bgClass: 'bg-white',
    iconType: 'basic',
    features: [
      { text: 'Unlimited mock tests', included: true },
      { text: 'All topic-wise tests', included: true },
      { text: 'Previous year papers', included: true },
      { text: 'Detailed solutions & short notes', included: true },
      { text: 'Performance analysis', included: true },
      { text: 'Mobile & web access', included: true },
      { text: 'Ad-free experience', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    subtitle: 'Complete preparation',
    price: 199,
    originalPrice: 349,
    durationDays: 180,
    buttonText: 'Get Pro Plan',
    buttonClass: 'bg-[#F59E0B] hover:bg-amber-600 text-white shadow-2xs',
    themeColor: '#D97706',
    borderClass: 'border border-amber-200',
    bgClass: 'bg-[#FFFDF7]',
    iconType: 'pro',
    features: [
      { text: 'Everything in Basic plan', included: true },
      { text: 'Advanced performance analytics', included: true },
      { text: 'Subject-wise weak area analysis', included: true },
      { text: 'AI-generated personalized tests', included: true },
      { text: 'Priority new test access', included: true },
      { text: 'Study notes & quick revision', included: true },
      { text: 'Scheduled practice plan', included: true },
      { text: 'Access to premium content', included: true },
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate Plan',
    subtitle: 'For top rankers',
    price: 399,
    originalPrice: 699,
    durationDays: 365,
    badge: 'Best Value',
    badgeColor: 'bg-[#10B981] text-white',
    buttonText: 'Get Ultimate Plan',
    buttonClass: 'bg-[#7C3AED] hover:bg-purple-700 text-white shadow-2xs',
    themeColor: '#7C3AED',
    borderClass: 'border border-purple-200',
    bgClass: 'bg-[#FAF5FF]',
    iconType: 'ultimate',
    features: [
      { text: 'Everything in Pro plan', included: true },
      { text: 'All upcoming test series free', included: true },
      { text: 'Detailed analytics & AI insights', included: true },
      { text: 'Question explanation with video', included: true },
      { text: 'Personalized study plan (AI)', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Special rank tracking', included: true },
    ],
  },
];

// Recent Subscriptions dataset strictly matching screenshot media_1791200578097.jpg
const RECENT_SUBSCRIPTIONS: RecentSubscriptionItem[] = [
  {
    id: 1,
    studentName: 'Rohit Kumar',
    studentAvatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    plan: 'Basic',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 99,
    date: '12 Aug 2026',
    status: 'Success',
  },
  {
    id: 2,
    studentName: 'Sneha Khatun',
    studentAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    plan: 'Pro',
    planBadgeClass: 'bg-[#FEF3C7] text-[#B45309]',
    amount: 199,
    date: '11 Aug 2026',
    status: 'Success',
  },
  {
    id: 3,
    studentName: 'Subhankar Pal',
    studentAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    plan: 'Basic',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 99,
    date: '10 Aug 2026',
    status: 'Success',
  },
  {
    id: 4,
    studentName: 'Moumita Sarkar',
    studentAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    plan: 'Ultimate',
    planBadgeClass: 'bg-[#EDE9FE] text-[#6D28D9]',
    amount: 399,
    date: '09 Aug 2026',
    status: 'Success',
  },
  {
    id: 5,
    studentName: 'Arijit Mondal',
    studentAvatar:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    plan: 'Basic',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    amount: 99,
    date: '08 Aug 2026',
    status: 'Success',
  },
];

// Feature Comparison Rows
const COMPARISON_ROWS = [
  {
    feature: 'Mock Tests',
    free: '5/month',
    basic: 'Unlimited',
    pro: 'Unlimited',
    ultimate: 'Unlimited',
  },
  {
    feature: 'Topic Tests',
    free: 'Limited',
    basic: 'Unlimited',
    pro: 'Unlimited',
    ultimate: 'Unlimited',
  },
  {
    feature: 'Previous Year Papers',
    free: false,
    basic: true,
    pro: true,
    ultimate: true,
  },
  {
    feature: 'Detailed Solutions',
    free: false,
    basic: true,
    pro: true,
    ultimate: true,
  },
  {
    feature: 'Study Notes',
    free: 'Limited',
    basic: true,
    pro: true,
    ultimate: true,
  },
  {
    feature: 'Performance Analysis',
    free: 'Basic',
    basic: 'Standard',
    pro: 'Advanced',
    ultimate: 'AI Insights',
  },
  {
    feature: 'Ad-free Experience',
    free: false,
    basic: true,
    pro: true,
    ultimate: true,
  },
  {
    feature: 'AI Generated Tests',
    free: false,
    basic: false,
    pro: true,
    ultimate: true,
  },
  {
    feature: 'Priority Support',
    free: false,
    basic: false,
    pro: false,
    ultimate: true,
  },
];

// ============================================================================
// MAIN COMPONENT: ADMIN SUBSCRIPTION PLANS
// ============================================================================

export const AdminSubscriptionPlans: React.FC = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_plans_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_PLANS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_plans_v2', JSON.stringify(plans));
    } catch {
      // ignore
    }
  }, [plans]);

  const loadPlans = async () => {
    setPageLoading(true);
    try {
      const remote = await api.getSubscriptionPlans(true);
      if (isSupabaseConfigured && (!remote || !remote.length)) setPlans([]);
      if (remote && remote.length > 0) {
        const mapped: SubscriptionPlanItem[] = remote.map((p) => {
          let icon: 'free' | 'basic' | 'pro' | 'ultimate' = 'basic';
          const titleLower = (p.title || '').toLowerCase();
          if (titleLower.includes('free')) icon = 'free';
          else if (titleLower.includes('ultimate')) icon = 'ultimate';
          else if (titleLower.includes('pro')) icon = 'pro';

          return {
            id: p.id,
            name: p.title,
            subtitle: p.description || 'Complete PracticeKoro test preparation access',
            price: p.price,
            originalPrice: p.originalPrice ?? p.price,
            durationDays: p.durationDays || 30,
            badge: p.id === 'pro_1_year' ? 'Best Value' : undefined,
            badgeColor: 'bg-[#F43F5E] text-white',
            buttonText: p.price === 0 ? 'Current Plan' : `Get ${p.title}`,
            buttonClass:
              p.price === 0
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-default'
                : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-2xs',
            themeColor: p.price === 0 ? '#16A34A' : '#0284C7',
            borderClass: 'border-slate-200/80',
            bgClass: 'bg-white',
            iconType: icon,
            features:
              Array.isArray(p.features) && p.features.length > 0
                ? p.features.map((f) => ({ text: f, included: true }))
                : [
                    { text: 'Full mock tests', included: true },
                    { text: 'Topic tests', included: true },
                    { text: 'Detailed solutions', included: true },
                  ],
          };
        });
        setPlans(mapped);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription plans could not be loaded.');
    } finally {
      setPageLoading(false);
    }
  };

  // Load live subscription plans from database on mount
  useEffect(() => {
    loadPlans();
  }, []);

  // Billing Cycle Toggle (Monthly vs Yearly)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Modals state
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isViewActiveModalOpen, setIsViewActiveModalOpen] = useState(false);
  const [isViewAllRecentOpen, setIsViewAllRecentOpen] = useState(false);
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] =
    useState<SubscriptionPlanItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Add Plan
  const [formPlanName, setFormPlanName] = useState('');
  const [formPlanSubtitle, setFormPlanSubtitle] = useState('');
  const [formPlanPrice, setFormPlanPrice] = useState('149');
  const [formPlanOriginalPrice, setFormPlanOriginalPrice] = useState('299');
  const [formPlanDurationDays, setFormPlanDurationDays] = useState('180');
  const [formPlanBadge, setFormPlanBadge] = useState('');
  const [formPlanFeatures, setFormPlanFeatures] = useState(
    'All topic tests, Unlimited mocks, Statewide rank, PDF notes'
  );
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Form states for Edit Plan
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanSubtitle, setEditPlanSubtitle] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState('99');
  const [editPlanOriginalPrice, setEditPlanOriginalPrice] = useState('179');
  const [editPlanDurationDays, setEditPlanDurationDays] = useState('180');
  const [editPlanBadge, setEditPlanBadge] = useState('');
  const [editPlanFeatures, setEditPlanFeatures] = useState('');
  const [editButtonText, setEditButtonText] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper render for Plan Header Icon
  const renderPlanIcon = (type: string) => {
    switch (type) {
      case 'free':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
        );
      case 'basic':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
        );
      case 'pro':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
        );
      case 'ultimate':
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Gem className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
        );
    }
  };

  // Handle Add Plan Submit
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;

    if (!formPlanName.trim()) {
      showToast('Plan name is required.');
      return;
    }

    const priceTrimmed = formPlanPrice.trim();
    const priceNum = Number(priceTrimmed);
    if (priceTrimmed === '' || isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price (₹0 or greater).');
      return;
    }

    const durationTrimmed = formPlanDurationDays.trim();
    const durationNum = parseInt(durationTrimmed, 10);
    if (durationTrimmed === '' || isNaN(durationNum) || durationNum <= 0) {
      showToast('Please enter a valid duration in days (greater than 0).');
      return;
    }

    const origPriceTrimmed = formPlanOriginalPrice.trim();
    let origPriceNum = priceNum;
    if (origPriceTrimmed !== '') {
      origPriceNum = Number(origPriceTrimmed);
      if (isNaN(origPriceNum) || origPriceNum < 0) {
        showToast('Original price must be a valid non-negative number.');
        return;
      }
    }

    const featureItems: PlanFeature[] = formPlanFeatures
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((text) => ({ text, included: true }));

    const planId = `plan_${Date.now()}`;
    setIsSubmittingAdd(true);

    try {
      const res = await api.createSubscriptionPlan({
        id: planId,
        title: formPlanName.trim(),
        name: formPlanName.trim(),
        description: formPlanSubtitle.trim() || 'Customized plan package',
        durationDays: durationNum,
        price: priceNum,
        originalPrice: origPriceNum,
        currency: 'INR',
        features: featureItems.map((f) => f.text),
        isActive: true,
        orderIndex: 99,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to create plan on backend.');
        setIsSubmittingAdd(false);
        return;
      }

      await loadPlans();
      setIsAddPlanModalOpen(false);
      showToast(`Subscription plan "${formPlanName.trim()}" created successfully.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error creating subscription plan.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEditModal = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setEditPlanName(plan.name);
    setEditPlanSubtitle(plan.subtitle);
    setEditPlanPrice(String(plan.price));
    setEditPlanOriginalPrice(String(plan.originalPrice || plan.price));
    setEditPlanDurationDays(String(plan.durationDays || 30));
    setEditPlanBadge(plan.badge || '');
    setEditPlanFeatures(plan.features.map((f) => f.text).join(', '));
    setEditButtonText(plan.buttonText);
    setIsEditPlanModalOpen(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || isSubmittingEdit) return;

    if (!editPlanName.trim()) {
      showToast('Plan name is required.');
      return;
    }

    const priceTrimmed = editPlanPrice.trim();
    const priceNum = Number(priceTrimmed);
    if (priceTrimmed === '' || isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price (₹0 or greater).');
      return;
    }

    const durationTrimmed = editPlanDurationDays.trim();
    const durationNum = parseInt(durationTrimmed, 10);
    if (durationTrimmed === '' || isNaN(durationNum) || durationNum <= 0) {
      showToast('Please enter a valid duration in days (greater than 0).');
      return;
    }

    const origPriceTrimmed = editPlanOriginalPrice.trim();
    let origPriceNum = priceNum;
    if (origPriceTrimmed !== '') {
      origPriceNum = Number(origPriceTrimmed);
      if (isNaN(origPriceNum) || origPriceNum < 0) {
        showToast('Original price must be a valid non-negative number.');
        return;
      }
    }

    const featureItems: PlanFeature[] = editPlanFeatures
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((text) => ({ text, included: true }));

    setIsSubmittingEdit(true);

    try {
      const res = await api.updateSubscriptionPlan(editingPlan.id, {
        title: editPlanName.trim(),
        name: editPlanName.trim(),
        description: editPlanSubtitle.trim(),
        price: priceNum,
        originalPrice: origPriceNum,
        durationDays: durationNum,
        features: featureItems.map((f) => f.text),
      });

      if (!res.success) {
        showToast(res.error || 'Failed to update plan on backend.');
        setIsSubmittingEdit(false);
        return;
      }

      await loadPlans();
      setIsEditPlanModalOpen(false);
      showToast(`Subscription plan "${editPlanName.trim()}" updated successfully.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error updating subscription plan.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HEADER & TOP ACTIONS                                              */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Manage subscription plans for PracticeKoro. Create, edit and control features for each
            plan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <button
            onClick={() => setIsViewActiveModalOpen(true)}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            View Active Subscriptions
          </button>
          <button
            onClick={() => {
              setFormPlanName('');
              setFormPlanSubtitle('');
              setFormPlanPrice('149');
              setFormPlanOriginalPrice('299');
              setFormPlanDurationDays('180');
              setFormPlanBadge('');
              setFormPlanFeatures(
                'Full mock tests, Unlimited topic practice, Detailed solutions, No ads'
              );
              setIsAddPlanModalOpen(true);
            }}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscribers */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Subscribers</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">5,480</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 26%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              from last month
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center font-bold text-xl shrink-0">
            ₹
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Monthly Revenue</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">₹86,420</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 18%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              from last month
            </span>
          </div>
        </div>

        {/* Card 3: Active Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Active Subscriptions
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">4,920</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 32%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              currently active
            </span>
          </div>
        </div>

        {/* Card 4: Converted from Free */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              Converted from Free
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">1,120</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                ↑ 24%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">this month</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. AVAILABLE PLANS SECTION HEADER & BILLING TOGGLE                   */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-base font-bold text-slate-900">Available Plans</h2>

        {/* Billing Switcher Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => {
                setBillingCycle('monthly');
                showToast('Switched to monthly pricing view.');
              }}
              className={cn(
                'px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                billingCycle === 'monthly'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setBillingCycle('yearly');
                showToast('Switched to yearly pricing with up to 50% discount.');
              }}
              className={cn(
                'px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                billingCycle === 'yearly'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Yearly
            </button>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            Save up to 50%
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. THE SUBSCRIPTION PLAN CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {plans.map((plan) => {
          return (
            <div
              key={plan.id}
              className={cn(
                'rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs relative',
                plan.bgClass,
                plan.borderClass
              )}
            >
              <div>
                {/* Icon & Top Actions Row */}
                <div className="flex items-start justify-between mb-4">
                  {renderPlanIcon(plan.iconType)}
                  <div className="flex items-center gap-1.5">
                    {plan.badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          plan.badgeColor || 'bg-blue-600 text-white'
                        )}
                      >
                        {plan.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(plan);
                      }}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-colors shadow-2xs flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                      title={`Edit ${plan.name}`}
                    >
                      <Pencil className="w-3 h-3 text-slate-500 hover:text-blue-600" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* Plan Title & Subtitle */}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 font-normal">{plan.subtitle}</p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 mb-4 flex-wrap">
                  <span className="text-2xl font-bold text-slate-900">₹{plan.price}</span>
                  {plan.originalPrice > plan.price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{plan.originalPrice}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-normal">
                    / {plan.durationDays} days
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-2 text-xs mb-6">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      {feat.included ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>
                      )}
                      <span
                        className={cn(
                          'leading-tight',
                          feat.included ? 'text-slate-700' : 'text-slate-400'
                        )}
                      >
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100/60 mt-auto">
                <button
                  onClick={() => {
                    if (plan.id === 'free') {
                      showToast('Free plan is active by default for all registered students.');
                    } else {
                      setSelectedPlanForPurchase(plan);
                    }
                  }}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center',
                    plan.buttonClass
                  )}
                >
                  {plan.buttonText}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(plan)}
                  className="w-full py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#2563EB] hover:bg-blue-50/70 border border-slate-200/90 bg-white/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Plan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 5. BOTTOM SECTION: 3 COLUMNS LAYOUT                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* COL 1 (5 COLS): FEATURE COMPARISON TABLE */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Feature Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 pr-2">Feature</th>
                    <th className="py-2.5 px-2 text-center">Free</th>
                    <th className="py-2.5 px-2 text-center">Basic</th>
                    <th className="py-2.5 px-2 text-center">Pro</th>
                    <th className="py-2.5 pl-2 text-center">Ultimate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pr-2 font-medium text-slate-800">{row.feature}</td>

                      {/* Free */}
                      <td className="py-2.5 px-2 text-center text-slate-500">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                          )
                        ) : (
                          row.free
                        )}
                      </td>

                      {/* Basic */}
                      <td className="py-2.5 px-2 text-center text-slate-600">
                        {typeof row.basic === 'boolean' ? (
                          row.basic ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                          )
                        ) : (
                          row.basic
                        )}
                      </td>

                      {/* Pro */}
                      <td className="py-2.5 px-2 text-center text-slate-600">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                          )
                        ) : (
                          row.pro
                        )}
                      </td>

                      {/* Ultimate */}
                      <td className="py-2.5 pl-2 text-center font-medium text-slate-800">
                        {typeof row.ultimate === 'boolean' ? (
                          row.ultimate ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                          )
                        ) : (
                          row.ultimate
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COL 2 (3 COLS): PLAN HIGHLIGHTS */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Plan Highlights</h3>

          <div className="space-y-3.5 text-xs">
            {/* Highlight 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 text-sm mt-0.5">
                ₹
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Affordable Plans</h4>
                <p className="text-[11px] text-slate-500">Quality education at low cost</p>
              </div>
            </div>

            {/* Highlight 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Access Everywhere</h4>
                <p className="text-[11px] text-slate-500">Study on web & mobile</p>
              </div>
            </div>

            {/* Highlight 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Real Exam Pattern</h4>
                <p className="text-[11px] text-slate-500">Updated content regularly</p>
              </div>
            </div>

            {/* Highlight 4 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Detailed Explanations</h4>
                <p className="text-[11px] text-slate-500">Short notes for every question</p>
              </div>
            </div>

            {/* Highlight 5 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Rank Tracking</h4>
                <p className="text-[11px] text-slate-500">Compare with other students</p>
              </div>
            </div>

            {/* Highlight 6 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">24/7 Support</h4>
                <p className="text-[11px] text-slate-500">Get help anytime</p>
              </div>
            </div>
          </div>
        </div>

        {/* COL 3 (4 COLS): RECENT SUBSCRIPTIONS TABLE */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Subscriptions</h3>
              <button
                onClick={() => setIsViewAllRecentOpen(true)}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 px-2 w-6 text-center">#</th>
                    <th className="py-2.5 px-2">Student</th>
                    <th className="py-2.5 px-2">Plan</th>
                    <th className="py-2.5 px-2">Amount</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70">
                  {RECENT_SUBSCRIPTIONS.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-2 text-center text-slate-400 font-normal">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={sub.studentAvatar}
                            alt={sub.studentName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                          <span className="font-semibold text-slate-800 truncate">
                            {sub.studentName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                            sub.planBadgeClass
                          )}
                        >
                          {sub.plan}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-800">₹{sub.amount}</td>
                      <td className="py-2.5 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                        {sub.date}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#DCFCE7] text-[#15803D]">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. ADD PLAN MODAL                                                    */}
      {/* ==================================================================== */}
      {isAddPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Subscription Plan</h3>
                  <p className="text-[11px] text-slate-500">
                    Configure new student subscription tier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPlanModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    placeholder="e.g. Master Pass"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formPlanSubtitle}
                    onChange={(e) => setFormPlanSubtitle(e.target.value)}
                    placeholder="e.g. For competitive toppers"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPlanPrice}
                    onChange={(e) => setFormPlanPrice(e.target.value)}
                    placeholder="0 or more"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Original / MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPlanOriginalPrice}
                    onChange={(e) => setFormPlanOriginalPrice(e.target.value)}
                    placeholder="e.g. 299"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPlanDurationDays}
                    onChange={(e) => setFormPlanDurationDays(e.target.value)}
                    placeholder="e.g. 180"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Badge Tag (optional)
                </label>
                <input
                  type="text"
                  value={formPlanBadge}
                  onChange={(e) => setFormPlanBadge(e.target.value)}
                  placeholder="e.g. New Launch, Most Popular"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Features (comma separated)
                </label>
                <textarea
                  rows={3}
                  value={formPlanFeatures}
                  onChange={(e) => setFormPlanFeatures(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Unlimited mock tests, Statewide rank analysis, Video explanations..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingAdd ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6.1. EDIT PLAN MODAL                                                 */}
      {/* ==================================================================== */}
      {isEditPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Subscription Plan</h3>
                  <p className="text-[11px] text-slate-500">
                    Update pricing, duration, and features for {editingPlan.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPlanModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editPlanName}
                    onChange={(e) => setEditPlanName(e.target.value)}
                    placeholder="e.g. Pro Plan"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={editPlanSubtitle}
                    onChange={(e) => setEditPlanSubtitle(e.target.value)}
                    placeholder="e.g. Complete preparation"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Pricing & Duration Block */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Pricing & Duration
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editPlanPrice}
                      onChange={(e) => setEditPlanPrice(e.target.value)}
                      placeholder="0 or more"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">
                      Original / MRP (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editPlanOriginalPrice}
                      onChange={(e) => setEditPlanOriginalPrice(e.target.value)}
                      placeholder="e.g. 299"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 mb-1 block">
                      Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={editPlanDurationDays}
                      onChange={(e) => setEditPlanDurationDays(e.target.value)}
                      placeholder="e.g. 180"
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Badge Tag (optional)
                  </label>
                  <input
                    type="text"
                    value={editPlanBadge}
                    onChange={(e) => setEditPlanBadge(e.target.value)}
                    placeholder="e.g. Most Popular, Best Value"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                    Button CTA Text
                  </label>
                  <input
                    type="text"
                    value={editButtonText}
                    onChange={(e) => setEditButtonText(e.target.value)}
                    placeholder="e.g. Get Pro Plan"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 mb-1 block">
                  Features List (comma separated)
                </label>
                <textarea
                  rows={4}
                  value={editPlanFeatures}
                  onChange={(e) => setEditPlanFeatures(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Unlimited mock tests, Statewide rank analysis, Video explanations..."
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Separate each feature with a comma to list them on the plan card.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmittingEdit ? 'Updating...' : 'Update Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. VIEW ACTIVE SUBSCRIPTIONS MODAL                                    */}
      {/* ==================================================================== */}
      {isViewActiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Subscriptions Overview</h3>
                <p className="text-[11px] text-slate-500">
                  4,920 currently active learners across West Bengal
                </p>
              </div>
              <button
                onClick={() => setIsViewActiveModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Free Tier</span>
                  <span className="text-lg font-bold text-slate-900">12,450</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-600 block font-medium">Basic Plan</span>
                  <span className="text-lg font-bold text-blue-900">2,840</span>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-600 block font-medium">Pro Plan</span>
                  <span className="text-lg font-bold text-amber-900">1,460</span>
                </div>
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-600 block font-medium">Ultimate</span>
                  <span className="text-lg font-bold text-purple-900">620</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Renewal automated collection rate is 94.2% via Razorpay & UPI Autopay.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsViewActiveModalOpen(false)}
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. VIEW ALL RECENT SUBSCRIPTIONS MODAL                                */}
      {/* ==================================================================== */}
      {isViewAllRecentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">All Recent Subscriptions</h3>
              <button
                onClick={() => setIsViewAllRecentOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="divide-y divide-slate-100 text-xs">
                {RECENT_SUBSCRIPTIONS.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.studentAvatar}
                        alt={item.studentName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-slate-400">{item.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          item.planBadgeClass
                        )}
                      >
                        {item.plan}
                      </span>
                      <span className="font-bold text-slate-900">₹{item.amount}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. PLAN DETAILS / ORDER MODAL                                        */}
      {/* ==================================================================== */}
      {selectedPlanForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{selectedPlanForPurchase.name}</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedPlanForPurchase.subtitle}</p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-5">
              <span className="text-3xl font-bold text-slate-900">
                ₹{selectedPlanForPurchase.price}
              </span>
              <span className="text-xs text-slate-500 ml-1">
                / {selectedPlanForPurchase.durationDays} days
              </span>
            </div>

            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setSelectedPlanForPurchase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast(`Selected ${selectedPlanForPurchase.name} tier.`);
                  setSelectedPlanForPurchase(null);
                }}
                className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                Assign to Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    { label: 'Loading subscription plans…', variant: 'cards' }
  );
};
