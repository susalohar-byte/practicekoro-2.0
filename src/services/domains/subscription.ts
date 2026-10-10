import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_SUBSCRIPTION_PLANS } from '@/services/mockData';
import type {
  SubscriptionPlan,
  Payment,
  RazorpayOrderResponse,
  RazorpayVerificationPayload,
  StudentSubscriptionDetails,
} from '@/types';
import type { PlanRow } from '@/services/domains/localStore';

/**
 * Student subscription plans, Razorpay checkout & payment history API.
 * Methods extracted verbatim from the original src/services/api.ts.
 */

export const subscriptionApi = {
  async getSubscriptionPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
    if (!isSupabaseConfigured) {
      return includeInactive
        ? MOCK_SUBSCRIPTION_PLANS
        : MOCK_SUBSCRIPTION_PLANS.filter((p) => p.isActive);
    }
    let query = supabase.from('subscription_plans').select('*');
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query.order('order_index', { ascending: true });

    // Never fall back to mock prices in production: surface DB errors and
    // return [] when no plans exist so the UI shows an empty/error state.
    if (error) {
      throw new Error(error.message || 'Failed to load subscription plans');
    }
    if (!data || data.length === 0) {
      return [];
    }
    return (data as PlanRow[]).map((d) => ({
      id: d.id,
      name: d.title ?? undefined,
      title: d.title,
      description: d.description ?? undefined,
      durationDays: d.duration_days,
      price: Number(d.price),
      originalPrice: d.original_price ? Number(d.original_price) : undefined,
      currency: 'INR',
      features: Array.isArray(d.features) ? (d.features as string[]) : [],
      isActive: d.is_active,
      orderIndex: d.order_index,
    }));
  },

  async createRazorpayOrder(planId: string): Promise<RazorpayOrderResponse> {
    if (isSupabaseConfigured) {
      // Authoritative order creation via Razorpay Orders API Edge Function.
      // Edge-returned errors are surfaced directly — there is intentionally
      // no silent database fallback that could hide a gateway outage.
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: { planId },
        }
      );

      if (edgeError) {
        let detail = edgeError.message || 'Payment gateway error';
        try {
          if (
            (edgeError as any)?.context &&
            typeof (edgeError as any).context.json === 'function'
          ) {
            const body = await (edgeError as any).context.json();
            if (body?.error) detail = body.error;
          }
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      // Fail before opening checkout if the security backend has not rolled out.
      // Deploy the new order function last, after SQL and verify-payment.
      if (edgeData?.verification_version !== 2) {
        throw new Error(
          'Checkout temporarily unavailable pending the payment security update. No payment was taken.'
        );
      }

      if (!edgeData || !edgeData.order_id) {
        throw new Error('Payment gateway did not return an order. Please try again.');
      }

      return {
        orderId: edgeData.order_id,
        paymentId: edgeData.payment_id,
        planId: edgeData.plan_id,
        planTitle: edgeData.plan_title,
        amount: Number(edgeData.amount),
        currency: edgeData.currency || 'INR',
        durationDays: Number(edgeData.duration_days),
        keyId: edgeData.key_id,
        isRealRazorpayOrder: true,
      };
    }

    // Fallback/Local mock mode
    const plan = MOCK_SUBSCRIPTION_PLANS.find((p) => p.id === planId) || MOCK_SUBSCRIPTION_PLANS[0];
    const mockOrderId = `order_${Math.random().toString(36).substring(2, 10)}`;
    const mockPaymentId = `pay_mock_${Date.now()}`;
    return {
      orderId: mockOrderId,
      paymentId: mockPaymentId,
      planId: plan.id,
      planTitle: plan.title,
      amount: plan.price,
      currency: 'INR',
      durationDays: plan.durationDays,
      keyId:
        (import.meta.env.VITE_RAZORPAY_KEY as string) ||
        (import.meta.env.VITE_RAZORPAY_KEY_ID as string) ||
        '',
      isRealRazorpayOrder: false,
    };
  },

  async verifyRazorpayPayment(payload: RazorpayVerificationPayload): Promise<{
    success: boolean;
    subscriptionId: string;
    status: string;
    startsAt: string;
    expiresAt: string;
    isRenewal: boolean;
    planTitle?: string;
  }> {
    if (isSupabaseConfigured) {
      let verificationResult: {
        success: boolean;
        subscriptionId: string;
        status: string;
        startsAt: string;
        expiresAt: string;
        isRenewal: boolean;
        planTitle?: string;
      } | null = null;

      // 1. First attempt verification via hardened Edge Function (HMAC SHA-256 with server-side secret)
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
          'verify-payment',
          {
            body: {
              orderId: payload.orderId,
              paymentId: payload.paymentId,
              signature: payload.signature,
              planId: payload.planId,
            },
          }
        );

        if (!edgeError && edgeData && edgeData.success) {
          verificationResult = {
            success: edgeData.success,
            subscriptionId: edgeData.subscriptionId || edgeData.subscription_id,
            status: edgeData.status || 'active',
            startsAt: edgeData.startsAt || edgeData.starts_at,
            expiresAt: edgeData.expiresAt || edgeData.expires_at,
            isRenewal: Boolean(edgeData.isRenewal ?? edgeData.is_renewal),
            planTitle: edgeData.planTitle || edgeData.plan_title,
          };
        } else if (edgeError) {
          console.warn(
            'Edge function payment verification issue, verification rejected:',
            edgeError
          );
        }
      } catch (invokeErr: any) {
        console.warn('Edge function invoke failed, no insecure fallback:', invokeErr);
      }

      if (!verificationResult) {
        throw new Error(
          'Payment verification unavailable. Do not pay again; retry status or contact support.'
        );
      }

      if (verificationResult && verificationResult.success) {
        try {
          localStorage.setItem('practicekoro_is_pro', 'true');
        } catch {
          /* optional cache */
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('practicekoro:subscription_updated'));
        }
      }

      return verificationResult;
    }

    // Fallback/Local mock mode
    const plan =
      MOCK_SUBSCRIPTION_PLANS.find((p) => p.id === payload.planId) || MOCK_SUBSCRIPTION_PLANS[0];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    localStorage.setItem('practicekoro_is_pro', 'true');
    localStorage.setItem(
      'practicekoro_sub_details',
      JSON.stringify({
        hasSubscription: true,
        isActive: true,
        status: 'active',
        planId: plan.id,
        planTitle: plan.title,
        startsAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        daysRemaining: plan.durationDays,
      })
    );

    // Save payment in local storage
    const localPayments = JSON.parse(localStorage.getItem('practicekoro_payments') || '[]');
    localPayments.unshift({
      id: `pm_${Date.now()}`,
      userId: 'mock-student-id',
      planId: plan.id,
      planTitle: plan.title,
      amount: plan.price,
      currency: 'INR',
      gateway: 'razorpay',
      orderId: payload.orderId,
      transactionId: payload.paymentId,
      status: 'completed',
      createdAt: now.toISOString(),
    });
    localStorage.setItem('practicekoro_payments', JSON.stringify(localPayments));

    return {
      success: true,
      subscriptionId: `sub_${Date.now()}`,
      status: 'active',
      startsAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isRenewal: false,
      planTitle: plan.title,
    };
  },

  async getStudentSubscriptionDetails(): Promise<StudentSubscriptionDetails> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_student_subscription_details');
        if (!error && data) {
          return {
            hasSubscription: !!data.has_subscription,
            isActive: !!data.is_active,
            status: data.status || 'none',
            subscriptionId: data.subscription_id,
            planId: data.plan_id,
            planTitle: data.plan_title,
            startsAt: data.starts_at,
            expiresAt: data.expires_at,
            daysRemaining:
              typeof data.days_remaining === 'number' ? data.days_remaining : undefined,
          };
        }
      } catch (err) {
        console.warn('Could not fetch student subscription details from RPC:', err);
      }
    }

    // Fallback/Local mock mode
    const isPro = localStorage.getItem('practicekoro_is_pro') === 'true';
    const saved = localStorage.getItem('practicekoro_sub_details');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignore malformed local demo data and continue with an empty fallback.
      }
    }

    if (isPro) {
      return {
        hasSubscription: true,
        isActive: true,
        status: 'active',
        planId: 'pro_1_year',
        planTitle: '1-Year All-Access Pro Pass',
        startsAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 348 * 24 * 60 * 60 * 1000).toISOString(),
        daysRemaining: 348,
      };
    }

    return {
      hasSubscription: false,
      isActive: false,
      status: 'none',
    };
  },

  async getStudentPaymentHistory(): Promise<Payment[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*, subscription_plans(title)')
          .order('created_at', { ascending: false });

        if (error || !Array.isArray(data)) {
          throw new Error(error?.message || 'Payment history was not returned');
        }
        {
          return data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            planId: d.plan_id,
            planTitle: d.subscription_plans?.title || 'Pro Pass',
            amount: Number(d.amount),
            currency: d.currency || 'INR',
            gateway: d.gateway || 'razorpay',
            orderId: d.order_id,
            razorpayOrderId: d.razorpay_order_id,
            transactionId: d.transaction_id,
            razorpayPaymentId: d.razorpay_payment_id,
            status: d.status,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Could not load payment history');
      }
    }

    // Fallback/Local mock mode
    const localPayments = JSON.parse(localStorage.getItem('practicekoro_payments') || '[]');
    if (localPayments.length > 0) return localPayments;

    const isPro = localStorage.getItem('practicekoro_is_pro') === 'true';
    if (isPro) {
      return [
        {
          id: 'pay_demo_01',
          userId: 'mock-student-id',
          planId: 'pro_1_year',
          planTitle: '1-Year All-Access Pro Pass',
          amount: 299,
          currency: 'INR',
          gateway: 'razorpay',
          orderId: 'order_demo_101',
          transactionId: 'pay_demo_202',
          status: 'completed',
          createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }

    return [];
  },
};
