import { getErrorMessage } from '@/lib/errors';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { api } from '@/services/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Crown,
  CheckCircle2,
  Shield,
  Zap,
  ArrowRight,
  Calendar,
  AlertCircle,
  Receipt,
  RotateCcw,
  Sparkles,
  Lock,
  RefreshCw,
  Tag,
  LifeBuoy,
} from 'lucide-react';
import { openRazorpayCheckout } from '@/utils/razorpay';
import type { Payment, SubscriptionPlan, CouponValidationResult } from '@/types';
import { StudentSupportModal } from '@/components/student/StudentSupportModal';

export const Subscription: React.FC = () => {
  const { user, refreshProStatus } = useAuth();
  const { plans, subscriptionDetails, refreshSubscription } = useSubscription();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRetry, setHistoryRetry] = useState(0);

  // Payment states: idle | preparing | processing | success | failed | cancelled | delayed
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'preparing' | 'processing' | 'success' | 'failed' | 'cancelled' | 'delayed'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    planTitle: string;
    expiresAt: string;
    isRenewal: boolean;
  } | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const isValidatingCoupon = false;
  const [couponError, setCouponError] = useState('');

  // Support intake modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState<'Payment Issue' | 'Subscription Issue'>(
    'Payment Issue'
  );
  const [supportSubject, setSupportSubject] = useState('');
  const [supportIssue, setSupportIssue] = useState('');

  const handleApplyCoupon = async () => {
    // Coupon redemption is not implemented in the authoritative order service.
    // Fail closed rather than advertising a discount and charging full price.
    setCouponError('Coupon checkout is currently unavailable. No discount has been applied.');
  };

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Only show purchasable plans (price > 0) — free plan is automatic for all users
      const paidPlans = plans.filter((p) => p.price > 0);
      const defaultPlan = paidPlans.find((p) => p.id === 'pro_1_year') || paidPlans[0] || plans[0];
      setSelectedPlan(defaultPlan);
    }
  }, [plans, selectedPlan]);

  useEffect(() => {
    let cancelled = false;
    setPayments([]);
    setHistoryError('');
    if (!user) {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    api
      .getStudentPaymentHistory()
      .then((rows) => {
        if (!cancelled) setPayments(rows);
      })
      .catch((err) => {
        if (!cancelled) setHistoryError(getErrorMessage(err, 'Could not load payment history'));
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, paymentStatus, historyRetry]);

  const activeSub = subscriptionDetails?.isActive;
  const isExpired =
    subscriptionDetails?.status === 'expired' ||
    (!activeSub && subscriptionDetails?.hasSubscription);
  const daysLeft = subscriptionDetails?.daysRemaining ?? 0;

  const handleInitiateCheckout = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/subscription' } } });
      return;
    }

    // Prevent duplicate clicks
    if (paymentStatus === 'preparing' || paymentStatus === 'processing') {
      return;
    }

    setPaymentStatus('preparing');
    setErrorMessage(null);

    try {
      if (appliedCoupon)
        throw new Error('Coupon checkout is unavailable. Remove the coupon before continuing.');
      // 1. Create order on server (authoritative database pricing enforced)
      const order = await api.createRazorpayOrder(plan.id);

      if (
        !order ||
        !order.keyId ||
        !order.keyId.trim() ||
        order.keyId === 'rzp_test_testkey123' ||
        order.keyId === 'rzp_test_practicekoro_key'
      ) {
        throw new Error(
          'Payment Gateway (Razorpay) Key is not configured with your real account. Please configure your Live Razorpay Key in Admin Settings.'
        );
      }

      setPaymentStatus('processing');

      // 2. Build Razorpay checkout options
      const checkoutOptions: Parameters<typeof openRazorpayCheckout>[0] = {
        key: order.keyId.trim(),
        amount: Math.round(order.amount * 100), // in paise
        currency: order.currency || 'INR',
        name: 'PracticeKoro',
        description: `${plan.title} (All-Access Pro Pass)`,
        prefill: {
          name: user.fullName || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        theme: {
          color: '#0158FC', // Brand Royal Blue
        },
        handler: async (response) => {
          // 3. Verify Razorpay response server-side (HMAC signature, idempotency, renewal)
          setPaymentStatus('processing');
          try {
            const verification = await api.verifyRazorpayPayment({
              orderId: response.razorpay_order_id || order.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature || '',
              planId: plan.id,
            });

            if (verification.success) {
              setSuccessInfo({
                planTitle: verification.planTitle || plan.title,
                expiresAt: verification.expiresAt,
                isRenewal: verification.isRenewal,
              });
              setPaymentStatus('success');
              await Promise.all([
                refreshSubscription(),
                refreshProStatus ? refreshProStatus() : Promise.resolve(),
              ]);
            } else {
              setPaymentStatus('delayed');
            }
          } catch (verifErr) {
            console.error('Payment verification failed:', verifErr);
            setErrorMessage(getErrorMessage(verifErr, 'Verification could not be completed.'));
            setPaymentStatus('failed');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus((prev) =>
              prev === 'processing' || prev === 'preparing' ? 'cancelled' : prev
            );
          },
        },
      };

      // Only attach order_id if verified real Razorpay order
      if (order.isRealRazorpayOrder && order.orderId && !order.orderId.startsWith('pk_local_')) {
        checkoutOptions.order_id = order.orderId;
      }

      // Launch Razorpay Checkout Modal
      const checkoutResult = await openRazorpayCheckout(checkoutOptions);

      if (checkoutResult.error) {
        setErrorMessage(checkoutResult.error);
        setPaymentStatus('failed');
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      setErrorMessage(getErrorMessage(err, 'Failed to initiate payment. Please try again.'));
      setPaymentStatus('failed');
    }
  };

  const handleManualStatusCheck = async () => {
    setCheckingStatus(true);
    try {
      await Promise.all([
        refreshSubscription(),
        refreshProStatus ? refreshProStatus() : Promise.resolve(),
      ]);
      if (subscriptionDetails?.isActive) {
        setPaymentStatus('success');
      }
    } catch (err) {
      console.error('Error refreshing subscription status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Primary plan reference
  const activePlan = selectedPlan ||
    plans.find((p) => p.id === 'pro_1_year') ||
    plans[0] || {
      id: 'pro_1_year',
      title: '1-Year All-Access Pro Pass',
      price: 299,
      durationDays: 365,
      description: 'Universal mock test access across all West Bengal competitive exams.',
      features: [
        'Unlock all premium mock tests',
        'Access every premium test series',
        'Practice across supported exams',
        'Re-attempt tests whenever available',
        'Review detailed solutions and analysis',
        'Mistakes Notebook integration for focused revision',
      ],
    };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pk-student-page">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/25 dark:border-amber-400/20 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wider uppercase shadow-2xs"
        >
          <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>ONE PRO PASS • ALL PREMIUM MOCK TESTS</span>
        </motion.div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Practice More. <span className="text-[#0158FC] dark:text-blue-400">Rank Higher.</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Unlock every official-pattern mock test, chapter drill, and PYQ paper with detailed
          step-by-step solutions and instant All-Bengal rank prediction.
        </p>
      </div>

      {/* =========================================================================
          ACTIVE SUBSCRIPTION STATUS CARD (ROYAL NAVY & GOLD AESTHETIC)
          ========================================================================= */}
      {activeSub && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-[#0a193b] to-[#0158FC]/90 text-white shadow-2xl border border-white/10 p-6 sm:p-8 overflow-hidden"
        >
          {/* Decorative ambient lighting */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black tracking-wider uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  PRO PASS ACTIVE
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-400/15 text-amber-200 border border-amber-400/25 text-xs font-bold">
                  ⚡ {daysLeft} Days Remaining
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <span>
                    {subscriptionDetails?.planTitle || 'PracticeKoro All-Access Pro Pass'}
                  </span>
                  <Crown className="w-6 h-6 fill-amber-400 text-amber-400 shrink-0" />
                </h2>
                <p className="text-xs sm:text-sm text-blue-100/90 flex items-center gap-1.5 mt-1 font-medium">
                  <Calendar className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>
                    Valid until:{' '}
                    <strong className="text-white font-black">
                      {subscriptionDetails?.expiresAt
                        ? new Date(subscriptionDetails.expiresAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Active'}
                    </strong>
                  </span>
                </p>
              </div>

              <p className="text-xs text-blue-200/80 leading-relaxed">
                Universal all-exam access is active. All premium full mocks, topic tests, PYQs, and
                solutions are unlocked on web and mobile.
              </p>

              {/* 3 Quick Benefit Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-blue-100">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> All WB & Central Exams
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Re-attempts
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Statewide AIR Rank
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-slate-950 hover:bg-blue-50 font-black text-sm shadow-xl shadow-black/25 hover:scale-[1.02] active:scale-[0.98] transition-all px-6"
                onClick={() => navigate('/test-series')}
                rightIcon={<ArrowRight className="w-4 h-4 text-[#0158FC]" />}
              >
                Start Practicing
              </Button>

              <Button
                variant="outline"
                size="md"
                className="bg-white/10 text-white hover:bg-white/20 border-white/25 font-bold text-xs shadow-xs"
                disabled={paymentStatus === 'preparing' || paymentStatus === 'processing'}
                onClick={() => handleInitiateCheckout(activePlan as SubscriptionPlan)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-300" />}
              >
                {paymentStatus === 'preparing'
                  ? 'Preparing checkout…'
                  : `Extend Pass (+365 Days) — ₹${activePlan.price}`}
              </Button>
              <span className="text-[11px] text-blue-200/70 text-center lg:text-right">
                Seamless renewal: adds 365 days to your existing expiry date.
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          EXPIRED SUBSCRIPTION STATUS CARD
          ========================================================================= */}
      {isExpired && !activeSub && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-slate-900 dark:text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="gap-1 font-bold">
                <Lock className="w-3 h-3" />
                PRO PASS EXPIRED
              </Badge>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Renew your Pro Pass to unlock premium mock tests.
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Your previous Pro Pass has expired. Re-activate your 365-day universal access to all
              premium tests.
            </p>
          </div>
          <Button
            variant="pro"
            size="md"
            className="font-bold text-xs shrink-0 self-stretch sm:self-auto shadow-sm"
            disabled={paymentStatus === 'preparing' || paymentStatus === 'processing'}
            onClick={() => handleInitiateCheckout(activePlan as SubscriptionPlan)}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {paymentStatus === 'preparing'
              ? 'Preparing secure checkout…'
              : `Renew Pro Pass — ₹${activePlan.price}`}
          </Button>
        </motion.div>
      )}

      {/* =========================================================================
          FEEDBACK ALERTS: CANCELLED & DELAYED STATES
          ========================================================================= */}
      {paymentStatus === 'cancelled' && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Payment cancelled. Your Pro Pass has not been activated. You can try again whenever
              you are ready.
            </span>
          </div>
          <button
            onClick={() => setPaymentStatus('idle')}
            className="font-bold text-[#0158FC] hover:underline text-xs shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {paymentStatus === 'delayed' && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 animate-spin" />
            <span>
              Payment received. We're confirming your Pro Pass with the server. This usually takes
              just a few seconds.
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            isLoading={checkingStatus}
            onClick={handleManualStatusCheck}
            className="shrink-0 text-xs font-bold"
          >
            Check Status
          </Button>
        </div>
      )}

      {/* =========================================================================
          PRIMARY PRO PASS PRICING & BENEFIT SHOWCASE (REDESIGNED CARD)
          ========================================================================= */}
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl relative overflow-hidden"
        >
          {/* Top accent gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0158FC] via-indigo-500 to-amber-500" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header / Badge */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0158FC] to-blue-700 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/25">
                  <Crown className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activePlan.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Validity: {activePlan.durationDays} Days (1 Full Year of Complete Access)
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 font-black text-xs uppercase tracking-wider shrink-0 shadow-2xs">
                ALL-ACCESS PASS
              </span>
            </div>

            {/* Pricing Showcase */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    ₹{appliedCoupon ? appliedCoupon.finalPrice : activePlan.price}
                  </span>
                  {appliedCoupon && (
                    <span className="text-base line-through text-slate-400 font-bold">
                      ₹{activePlan.price}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    / 365 Days
                  </span>
                </div>

                {appliedCoupon ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Coupon {appliedCoupon.code} applied: ₹{appliedCoupon.discountAmount} saved!
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    ⚡ Equivalent to just ₹0.81 / day • Single One-Time Payment
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-[#0158FC] dark:text-blue-400 border border-blue-500/20 text-xs font-black uppercase tracking-wider self-start sm:self-auto">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Universal Access</span>
              </div>
            </div>

            {/* Value Proposition Callout */}
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-800 dark:text-slate-200 space-y-1">
              <p className="font-extrabold text-[#0158FC] dark:text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0158FC] dark:text-blue-400" />
                One Pass. Everything Premium.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] sm:text-xs">
                Instead of selling individual tests or separate exam packages, one ₹299 Pro Pass
                unlocks the entire mock-test library, chapter drills, and PYQs for 365 days.
              </p>
            </div>

            {/* Included Benefits List */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Included in Your Pro Pass:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlock all premium mock tests</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">Access every premium test series</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">All West Bengal &amp; Central exams</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">Unlimited test re-attempts</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">Detailed step-by-step solutions</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">Automated Mistakes Notebook</span>
                </div>
              </div>
            </div>

            {/* Coupon Code Redemption Box */}
            <div className="pt-2">
              {appliedCoupon ? (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="font-mono font-black">{appliedCoupon.code}</span> applied:
                      <span className="font-bold ml-1 text-emerald-700 dark:text-emerald-300">
                        ₹{appliedCoupon.discountAmount} Off
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="relative grow">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        disabled
                        placeholder="Coupon checkout unavailable"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold uppercase placeholder:normal-case placeholder:font-normal text-slate-900 dark:text-white focus:outline-none focus:border-[#0158FC]"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled
                      className="text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isValidatingCoupon ? 'Checking…' : 'Apply'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Coupon checkout is unavailable. Purchases use the listed plan price.
                  </p>
                  {couponError && (
                    <p className="text-[11px] font-semibold text-rose-600 pl-1">{couponError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Primary CTA Button */}
            <div className="pt-2 space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-black text-sm shadow-lg shadow-blue-500/25 py-3.5 rounded-2xl bg-[#0158FC] hover:bg-[#0047cc] text-white hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                disabled={paymentStatus === 'preparing' || paymentStatus === 'processing'}
                isLoading={paymentStatus === 'preparing' || paymentStatus === 'processing'}
                onClick={() => handleInitiateCheckout(activePlan as SubscriptionPlan)}
                leftIcon={
                  activeSub ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                  )
                }
              >
                {paymentStatus === 'preparing'
                  ? 'Preparing secure checkout…'
                  : activeSub
                    ? `Extend Pass (+365 Days) — ₹${appliedCoupon ? appliedCoupon.finalPrice : activePlan.price}`
                    : `Get All-Access Pro Pass — ₹${appliedCoupon ? appliedCoupon.finalPrice : activePlan.price}`}
              </Button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" /> Razorpay 256-Bit SSL
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Activation
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          LIGHTWEIGHT TRUST SECTION
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Secure Payment</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              256-bit encrypted checkout via Razorpay.
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0158FC] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-[#0158FC] dark:text-blue-400 fill-[#0158FC] dark:fill-blue-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Instant Access</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Immediate server-side verification and activation.
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">365-Day Access</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Full 1-year coverage from purchase date.
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">No Per-Test Fees</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Zero individual test purchases required.
            </p>
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          PAYMENT RESULT MODALS: SUCCESS & FAILURE
          ========================================================================= */}
      {paymentStatus === 'success' && successInfo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {successInfo.isRenewal ? 'Pass Extended Successfully!' : 'Pro Pass Activated 🎉'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your payment was verified by the server. All premium tests are now fully unlocked.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plan:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {successInfo.planTitle}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Access Period:</span>
                <span className="font-bold text-slate-900 dark:text-white">365 Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">New Expiry:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {new Date(successInfo.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                className="w-full font-bold bg-[#0158FC] hover:bg-[#0047cc] text-white py-2.5 rounded-xl cursor-pointer"
                onClick={() => {
                  setPaymentStatus('idle');
                  navigate('/test-series');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Practicing
              </Button>
            </div>
          </div>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm shadow-rose-500/20">
              <AlertCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Payment Not Completed
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {errorMessage || 'Your subscription was not activated. You can try again.'}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                className="w-full font-bold bg-[#0158FC] hover:bg-[#0047cc] text-white py-2.5 rounded-xl cursor-pointer"
                onClick={() => setPaymentStatus('idle')}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                onClick={() => {
                  setSupportCategory('Payment Issue');
                  setSupportSubject(`Payment Failed: ${selectedPlan?.title || 'Pro Pass'}`);
                  setSupportIssue(
                    `My payment for ${selectedPlan?.title || 'Pro Pass'} (₹${selectedPlan?.price || 0}) encountered an error.\nError message: "${errorMessage || 'Payment was not completed'}"\n\nPlease verify whether the amount was debited from my account.`
                  );
                  setIsSupportModalOpen(true);
                }}
                leftIcon={<LifeBuoy className="w-3.5 h-3.5 text-blue-600" />}
              >
                পেমেন্ট হেল্প টিকেট সাবমিট করুন (Report to Support)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-500 cursor-pointer"
                onClick={() => setPaymentStatus('idle')}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Support & Billing Assistance Card */}
      <div className="rounded-3xl p-5 sm:p-6 border border-blue-200/80 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-[#0158FC] dark:text-blue-400 shadow-xs shrink-0">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                পেমেন্ট বা সাবস্ক্রিপশন সংক্রান্ত সহায়তা দরকার? (Need Billing Assistance?)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl">
                টাকা কেটে নেওয়া কিন্তু প্রো পাস চালু না হওয়া, ইউপিআই বিলম্ব বা কুপন সংক্রান্ত যেকোনো
                বিষয়ে আমাদের সাপোর্ট ডেস্কে সরাসরি টিকেট তৈরি করুন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSupportCategory('Payment Issue');
                setSupportSubject('Payment / Subscription Inquiry');
                setSupportIssue(
                  `I have a question or request regarding my Pro Pass subscription:\n\nSelected Plan: ${selectedPlan?.title || 'Pro Pass'} (₹${selectedPlan?.price || 0})\nInquiry Details: `
                );
                setIsSupportModalOpen(true);
              }}
              leftIcon={<LifeBuoy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              className="w-full sm:w-auto text-xs font-bold border-blue-300 dark:border-blue-800 text-[#0158FC] dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 cursor-pointer"
            >
              সাপোর্ট টিকেট সাবমিট করুন
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAYMENT HISTORY SECTION
          ========================================================================= */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0158FC]" />
              Payment & Transaction History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Receipts and authoritative records for all your Pro Pass purchases
            </p>
          </div>
        </div>

        {historyError ? (
          <Card className="p-6" role="alert">
            <p>{historyError}</p>
            <Button onClick={() => setHistoryRetry((value) => value + 1)}>
              Retry payment history
            </Button>
          </Card>
        ) : historyLoading ? (
          <Card className="p-6" role="status">
            Loading payment history…
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border-dashed">
            No payment records found. Your completed transactions will appear here.
          </Card>
        ) : (
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Order / Txn ID</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {p.planTitle || 'Pro Pass'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        ₹{p.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                        {p.transactionId || p.orderId || p.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p.status === 'completed'
                              ? 'success'
                              : p.status === 'pending'
                                ? 'warning'
                                : 'outline'
                          }
                          className={
                            p.status === 'failed'
                              ? 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/40'
                              : ''
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Student Support Modal */}
      <StudentSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        defaultCategory={supportCategory}
        defaultSubject={supportSubject}
        defaultIssue={supportIssue}
      />
    </div>
  );
};
