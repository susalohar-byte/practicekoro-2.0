import React, { useState, useMemo, useEffect } from 'react';
import {
  Ticket,
  CheckCircle2,
  Tag,
  BarChart2,
  Download,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Check,
  Filter,
  Copy,
  Trash2,
  Percent,
  IndianRupee,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface CouponRowItem {
  id: number | string;
  code: string;
  title: string;
  subtitle: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  applicablePlans: string;
  planBadgeClass: string;
  usedCount: number;
  totalLimit: number;
  validFrom: string;
  validUntil: string;
  status: 'Active' | 'Scheduled' | 'Expired';
  statusBadgeClass: string;
  description?: string;
  isFirstTimeOnly?: boolean;
}

// Initial dataset strictly matching screenshot media_1791200584260.jpg
const INITIAL_COUPONS: CouponRowItem[] = [
  {
    id: 1,
    code: 'WELCOME50',
    title: 'Welcome Offer',
    subtitle: 'For new users',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 100,
    applicablePlans: 'All Plans',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 320,
    totalLimit: 500,
    validFrom: '01 Sep 2026',
    validUntil: '30 Sep 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: 'Get 50% off on your first subscription.',
    isFirstTimeOnly: true,
  },
  {
    id: 2,
    code: 'FREEDOM25',
    title: 'Independence Offer',
    subtitle: 'Special discount',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 50,
    applicablePlans: 'All Plans',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 184,
    totalLimit: 300,
    validFrom: '10 Aug 2026',
    validUntil: '20 Aug 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: 'Independence day special savings across all test passes.',
  },
  {
    id: 3,
    code: 'BASIC20',
    title: 'Basic Plan Discount',
    subtitle: 'For Basic Plan',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 40,
    applicablePlans: 'Basic Plan',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 210,
    totalLimit: 1000,
    validFrom: '01 Sep 2026',
    validUntil: '30 Sep 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: '20% discount dedicated for Basic 6-month tier.',
  },
  {
    id: 4,
    code: 'PRO30',
    title: 'Pro Plan Offer',
    subtitle: 'Upgrade and save',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 100,
    applicablePlans: 'Pro Plan',
    planBadgeClass: 'bg-[#FEF3C7] text-[#B45309]',
    usedCount: 142,
    totalLimit: 500,
    validFrom: '05 Sep 2026',
    validUntil: '30 Sep 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: '30% savings for Pro tier learners.',
  },
  {
    id: 5,
    code: 'ULTIMATE40',
    title: 'Ultimate Plan Offer',
    subtitle: 'Best value deal',
    discountType: 'percentage',
    discountValue: 40,
    maxDiscount: 200,
    applicablePlans: 'Ultimate Plan',
    planBadgeClass: 'bg-[#EDE9FE] text-[#6D28D9]',
    usedCount: 66,
    totalLimit: 200,
    validFrom: '01 Sep 2026',
    validUntil: '30 Sep 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: 'Best value 40% rebate on 12-month Ultimate subscription.',
  },
  {
    id: 6,
    code: 'FIRST10',
    title: 'First Purchase',
    subtitle: 'New user discount',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 30,
    applicablePlans: 'All Plans',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 420,
    totalLimit: 1000,
    validFrom: '01 Sep 2026',
    validUntil: '31 Dec 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: '10% instant checkout deduction for newcomers.',
  },
  {
    id: 7,
    code: 'DIWALI50',
    title: 'Diwali Special',
    subtitle: 'Limited time offer',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 200,
    applicablePlans: 'All Plans',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 0,
    totalLimit: 500,
    validFrom: '15 Oct 2026',
    validUntil: '31 Oct 2026',
    status: 'Scheduled',
    statusBadgeClass: 'bg-[#FEF3C7] text-[#D97706]',
    description: 'Festive festive festival mega discount.',
  },
  {
    id: 8,
    code: 'EXPIRED25',
    title: 'Monthly Offer',
    subtitle: 'September campaign',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 50,
    applicablePlans: 'All Plans',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 500,
    totalLimit: 500,
    validFrom: '01 Aug 2026',
    validUntil: '31 Aug 2026',
    status: 'Expired',
    statusBadgeClass: 'bg-slate-100 text-slate-500',
    description: 'Campaign period ended.',
  },
  {
    id: 9,
    code: 'STUDENT15',
    title: 'Student Discount',
    subtitle: 'For students',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 50,
    applicablePlans: 'All Plans',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 312,
    totalLimit: 1000,
    validFrom: '01 Sep 2026',
    validUntil: '30 Nov 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: 'Verified student academic scholarship concession.',
  },
  {
    id: 10,
    code: 'REFER100',
    title: 'Refer & Save',
    subtitle: 'Referral offer',
    discountType: 'fixed',
    discountValue: 100,
    applicablePlans: 'All Plans',
    planBadgeClass: 'bg-[#DBEAFE] text-[#1E40AF]',
    usedCount: 86,
    totalLimit: 300,
    validFrom: '01 Sep 2026',
    validUntil: '30 Sep 2026',
    status: 'Active',
    statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
    description: 'Flat ₹100 deduction on peer referral.',
  },
];

// ============================================================================
// MAIN COMPONENT: ADMIN COUPONS
// ============================================================================

export const AdminCoupons: React.FC = () => {
  const [couponsList, setCouponsList] = useState<CouponRowItem[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_coupons_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_COUPONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_coupons_v2', JSON.stringify(couponsList));
    } catch {
      // ignore
    }
  }, [couponsList]);

  const [availablePlans, setAvailablePlans] = useState<{ id: string; title: string; price: number }[]>([]);

  // Load backend active plans
  useEffect(() => {
    let isMounted = true;
    api.getSubscriptionPlans(true).then((plans) => {
      if (!isMounted || !plans) return;
      setAvailablePlans(plans.map((p) => ({ id: p.id, title: p.title, price: p.price })));
    }).catch((err) => {
      console.warn('Failed to load subscription plans for coupons:', err);
    });
    return () => { isMounted = false; };
  }, []);

  const loadCoupons = async () => {
    try {
      const remote = await api.getAdminCoupons();
      if (!remote || remote.length === 0) {
        if (isSupabaseConfigured) setCouponsList([]);
        return;
      }
      const mapped: CouponRowItem[] = remote.map((c) => {
        const isPct = c.discountType === 'percentage';
        const validFromStr = c.validFrom
          ? new Date(c.validFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Immediate';
        const validUntilStr = c.validUntil
          ? new Date(c.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'No Expiry';
        const isAct = c.isActive;

        let planName = 'All Plans';
        let planBadge = 'bg-[#DBEAFE] text-[#1E40AF]';
        if (c.applicablePlanId) {
          const matched = availablePlans.find((p) => p.id === c.applicablePlanId);
          planName = matched ? matched.title : 'Specific Plan';
          planBadge = 'bg-[#EDE9FE] text-[#6D28D9]';
        }

        return {
          id: c.id,
          code: c.code,
          title: c.code.replace(/_/g, ' '),
          subtitle: c.description || 'Special Discount',
          discountType: isPct ? 'percentage' : 'fixed',
          discountValue: c.discountValue,
          maxDiscount: c.maxDiscountAmount,
          applicablePlans: planName,
          planBadgeClass: planBadge,
          usedCount: c.usedCount,
          totalLimit: c.maxUses || 500,
          validFrom: validFromStr,
          validUntil: validUntilStr,
          status: isAct ? 'Active' : 'Expired',
          statusBadgeClass: isAct ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#DC2626]',
          description: c.description,
          isFirstTimeOnly: c.maxUsesPerUser === 1,
        };
      });
      setCouponsList(mapped);
    } catch (err) {
      console.warn('Failed to load coupons from database:', err);
      if (isSupabaseConfigured) setCouponsList([]);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [availablePlans]);

  // Checkbox selection
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<(number | string)[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [filterType, setFilterType] = useState('All Types');
  const [filterAdmin, setFilterAdmin] = useState('All Admins');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Active Row Action menu
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for "Create New Coupon" panel
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [formCode, setFormCode] = useState('WELCOME50');
  const [formTitle, setFormTitle] = useState('Welcome Offer');
  const [formDescription, setFormDescription] = useState('Get 50% off on your first subscription.');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('50');
  const [formMaxDiscount, setFormMaxDiscount] = useState('100');
  const [formApplicablePlanId, setFormApplicablePlanId] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('500');
  const [formValidFrom, setFormValidFrom] = useState(todayDateStr);
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formActiveImmediately, setFormActiveImmediately] = useState(true);
  const [formFirstTimeOnly, setFormFirstTimeOnly] = useState(false);
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [isDeletingCouponId, setIsDeletingCouponId] = useState<string | number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  // Generate random coupon code
  const handleGenerateCode = () => {
    const prefixes = ['SAVE', 'FESTIVE', 'EXAM', 'SUPER', 'OFFER', 'TOPPER'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(Math.random() * 8 + 2) * 10;
    const generated = `${p}${num}`;
    setFormCode(generated);
    showToast(`Generated promo code: ${generated}`);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return couponsList.filter((item) => {
      if (filterStatus !== 'All Status' && item.status !== filterStatus) return false;
      if (filterPlan !== 'All Plans' && !item.applicablePlans.includes(filterPlan)) return false;
      if (filterType !== 'All Types') {
        if (filterType === 'Percentage' && item.discountType !== 'percentage') return false;
        if (filterType === 'Fixed Amount' && item.discountType !== 'fixed') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.code.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [couponsList, filterStatus, filterPlan, filterType, searchQuery]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCheckboxes(filteredRows.map((r) => r.id));
    } else {
      setSelectedCheckboxes([]);
    }
  };

  const handleToggleRow = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Create Coupon Submit
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingCoupon) return;

    if (!formCode.trim()) {
      showToast('Coupon code is required.');
      return;
    }

    const discountNum = Number(formDiscountValue);
    if (isNaN(discountNum) || discountNum <= 0) {
      showToast('Discount value must be greater than 0.');
      return;
    }
    if (formDiscountType === 'percentage' && discountNum > 100) {
      showToast('Percentage discount cannot exceed 100%.');
      return;
    }

    if (formValidFrom && formValidUntil) {
      const fromTime = new Date(formValidFrom).getTime();
      const untilTime = new Date(formValidUntil).getTime();
      if (fromTime > untilTime) {
        showToast('Valid From date cannot be after Valid Until date.');
        return;
      }
    }

    const maxDiscountNum = formMaxDiscount.trim() ? Number(formMaxDiscount) : undefined;
    if (maxDiscountNum !== undefined && (isNaN(maxDiscountNum) || maxDiscountNum <= 0)) {
      showToast('Maximum discount must be a positive number if provided.');
      return;
    }

    const maxUsesNum = formUsageLimit.trim() ? Number(formUsageLimit) : undefined;
    if (maxUsesNum !== undefined && (isNaN(maxUsesNum) || maxUsesNum < 0)) {
      showToast('Usage limit must be a valid non-negative number.');
      return;
    }

    setIsSubmittingCoupon(true);

    try {
      const res = await api.createAdminCoupon({
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: discountNum,
        maxDiscountAmount: maxDiscountNum,
        minOrderAmount: 0,
        maxUses: maxUsesNum,
        maxUsesPerUser: formFirstTimeOnly ? 1 : 5,
        applicablePlanId: formApplicablePlanId || undefined,
        validFrom: formValidFrom ? new Date(formValidFrom).toISOString() : new Date().toISOString(),
        validUntil: formValidUntil ? new Date(formValidUntil).toISOString() : undefined,
        isActive: formActiveImmediately,
      });

      if (!res.success || !res.coupon) {
        showToast(res.error || 'Failed to create coupon on backend.');
        setIsSubmittingCoupon(false);
        return;
      }

      await loadCoupons();
      showToast(`Coupon "${res.coupon.code}" created successfully!`);
      setFormCode('');
      setFormTitle('');
      setFormDescription('');
      setFormDiscountValue('20');
      setFormMaxDiscount('');
      setFormApplicablePlanId('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error creating coupon.');
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  // Export CSV
  const handleExportCoupons = () => {
    const headers = [
      'Coupon Code',
      'Title',
      'Discount Type',
      'Discount Value',
      'Applicable Plans',
      'Usage',
      'Validity',
      'Status',
    ];
    const rows = filteredRows.map((c) => [
      c.code,
      c.title,
      c.discountType,
      c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`,
      c.applicablePlans,
      `${c.usedCount}/${c.totalLimit}`,
      `${c.validFrom} - ${c.validUntil}`,
      c.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_coupons_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Coupons data exported successfully.');
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: number | string) => {
    if (isDeletingCouponId === id) return;
    setIsDeletingCouponId(id);
    setActiveMenuId(null);

    try {
      const res = await api.deleteAdminCoupon(String(id));
      if (!res.success) {
        showToast(res.error || 'Failed to delete coupon on backend.');
        setIsDeletingCouponId(null);
        return;
      }
      setCouponsList((prev) => prev.filter((c) => c.id !== id));
      showToast('Coupon removed successfully.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error deleting coupon.');
    } finally {
      setIsDeletingCouponId(null);
    }
  };

  // Copy Code
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon code ${code} copied to clipboard!`);
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupons</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Create and manage discount coupons for subscription plans. Use coupons to attract new users and run special offers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <button
            onClick={handleExportCoupons}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Coupons</span>
          </button>
          <button
            onClick={() => {
              setFormCode('');
              handleGenerateCode();
            }}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Coupons */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Coupons</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">{couponsList.length}</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">in system</span>
          </div>
        </div>

        {/* Card 2: Active Coupons */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Active Coupons</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {couponsList.filter((c) => c.status === 'Active').length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">currently active</span>
          </div>
        </div>

        {/* Card 3: Used Coupons */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Used Coupons</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {couponsList.reduce((sum, c) => sum + (c.usedCount || 0), 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Redeemed
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">total redemptions</span>
          </div>
        </div>

        {/* Card 4: Total Discount Given */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Discount Given</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                ₹{couponsList
                  .reduce((sum, c) => sum + (c.usedCount || 0) * (c.discountType === 'fixed' ? c.discountValue : 50), 0)
                  .toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Saved
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">lifetime value</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name or description..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Status</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Expired">Expired</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Plan Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Plan</label>
          <div className="relative">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Plans">All Plans</option>
              <option value="Basic Plan">Basic Plan</option>
              <option value="Pro Plan">Pro Plan</option>
              <option value="Ultimate Plan">Ultimate Plan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Discount Type Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Discount Type</label>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Types">All Types</option>
              <option value="Percentage">Percentage</option>
              <option value="Fixed Amount">Fixed Amount</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Created By Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Created By</label>
          <div className="relative">
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Admins">All Admins</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Academic Admin">Academic Admin</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => showToast('Coupon filters applied.')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('All Status');
              setFilterPlan('All Plans');
              setFilterType('All Types');
              setFilterAdmin('All Admins');
              showToast('Filters reset to default view.');
            }}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2.5 py-2 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. SPLIT GRID (TABLE 8 COLS, CREATE FORM 4 COLS)                    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: COUPONS TABLE (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedCheckboxes.length > 0 &&
                          selectedCheckboxes.length === filteredRows.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-2 w-7 text-center">#</th>
                    <th className="py-3 px-3">Coupon Code</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Applicable Plans</th>
                    <th className="py-3 px-3">Usage</th>
                    <th className="py-3 px-3">Validity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 text-xs">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                        No coupons found
                      </td>
                    </tr>
                  ) : (
                    filteredRows
                      .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                      .map((row, idx) => {
                        const isChecked = selectedCheckboxes.includes(row.id);
                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                            onClick={() => {
                          setFormCode(row.code);
                          setFormTitle(row.title);
                          setFormDescription(row.description || row.subtitle);
                          setFormDiscountType(row.discountType);
                          setFormDiscountValue(String(row.discountValue));
                          if (row.maxDiscount) setFormMaxDiscount(String(row.maxDiscount));
                          setFormUsageLimit(String(row.totalLimit));
                        }}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => handleToggleRow(row.id, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* # */}
                        <td className="py-3 px-2 text-center text-slate-500 font-normal">
                          {idx + 1}
                        </td>

                        {/* Coupon Code */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-xs bg-[#DBEAFE] text-[#1E40AF] px-2.5 py-1 rounded-md tracking-wider">
                            {row.code}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block truncate">
                            {row.title}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {row.subtitle}
                          </span>
                        </td>

                        {/* Discount */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-600 block">
                            {row.discountType === 'percentage'
                              ? `${row.discountValue}%`
                              : `₹${row.discountValue}`}
                          </span>
                          <span className="text-[10px] text-emerald-700/80 block">
                            {row.maxDiscount ? `Max ₹${row.maxDiscount}` : 'Flat Off'}
                          </span>
                        </td>

                        {/* Applicable Plans */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap',
                              row.planBadgeClass
                            )}
                          >
                            {row.applicablePlans}
                          </span>
                        </td>

                        {/* Usage */}
                        <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {row.usedCount} <span className="text-slate-400 font-normal">/ {row.totalLimit}</span>
                        </td>

                        {/* Validity */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-slate-700 block font-normal">{row.validFrom}</span>
                          <span className="text-[11px] text-slate-400 block">– {row.validUntil}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium',
                              row.statusBadgeClass
                            )}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === row.id ? null : row.id);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === row.id && (
                              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => handleCopy(row.code)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copy Code</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setFormCode(row.code);
                                    setFormTitle(row.title);
                                    setFormDescription(row.description || row.subtitle);
                                    setActiveMenuId(null);
                                    showToast(`Editing coupon ${row.code} in side panel.`);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                >
                                  <span>Edit Coupon</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => handleDeleteCoupon(row.id)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <div>
                Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
                {Math.min(filteredRows.length, currentPage * rowsPerPage)} of {filteredRows.length} coupons
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setCurrentPage(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2563EB] text-white font-medium shadow-2xs"
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  3
                </button>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="relative ml-2">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="appearance-none border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 bg-white pr-6 cursor-pointer focus:outline-none"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CREATE NEW COUPON FORM PANEL (4 COLS) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Create New Coupon
          </h2>

          <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
            {/* Coupon Code with Generate button */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                Coupon Code <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME50"
                  className="flex-1 font-mono uppercase font-bold border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-3 py-2 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Welcome Offer"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-700">Description</label>
                <span className="text-[10px] text-slate-400">
                  {formDescription.length}/200
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Get 50% off on your first subscription."
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Discount Type segmented pills */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1.5 block">
                Discount Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormDiscountType('percentage')}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all',
                    formDiscountType === 'percentage'
                      ? 'bg-blue-50 border-blue-300 text-[#2563EB] shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Percentage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormDiscountType('fixed')}
                  className={cn(
                    'py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all',
                    formDiscountType === 'fixed'
                      ? 'bg-blue-50 border-blue-300 text-[#2563EB] shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Fixed Amount</span>
                </button>
              </div>
            </div>

            {/* Discount Value & Maximum Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Discount Value <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                    {formDiscountType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block truncate">
                  Maximum Discount (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="100"
                    className="w-full border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                    ₹
                  </span>
                </div>
              </div>
            </div>

            {/* Applicable Plan Dropdown */}
            <div>
              <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                Applicable Plan <span className="text-rose-500">*</span>
              </label>
              <select
                value={formApplicablePlanId}
                onChange={(e) => setFormApplicablePlanId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="">All Plans</option>
                {availablePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (₹{p.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Usage Limit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Usage Limit (Optional)
                </label>
                <span className="text-[10px] text-slate-400">0 = unlimited</span>
              </div>
              <input
                type="number"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value)}
                placeholder="500"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Validity Period (Real Date Inputs) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Valid From <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formValidFrom}
                  onChange={(e) => setFormValidFrom(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-700 mb-1 block">
                  Valid Until (Optional)
                </label>
                <input
                  type="date"
                  value={formValidUntil}
                  onChange={(e) => setFormValidUntil(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    Active immediately
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Enable this coupon right after creation
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActiveImmediately(!formActiveImmediately)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative cursor-pointer',
                    formActiveImmediately ? 'bg-[#2563EB]' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs',
                      formActiveImmediately ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    First-time users only
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Only applicable for new users
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormFirstTimeOnly(!formFirstTimeOnly)}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative cursor-pointer',
                    formFirstTimeOnly ? 'bg-[#2563EB]' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs',
                      formFirstTimeOnly ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Panel Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setFormCode('WELCOME50');
                  setFormTitle('Welcome Offer');
                  setFormDescription('Get 50% off on your first subscription.');
                  setFormDiscountValue('50');
                  setFormMaxDiscount('100');
                  setFormApplicablePlanId('');
                  setFormValidFrom(todayDateStr);
                  setFormValidUntil('');
                  showToast('Form reset.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCoupon}
                className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingCoupon ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
