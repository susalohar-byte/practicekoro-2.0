// supabase/functions/create-razorpay-order/index.ts
// PracticeKoro 2.0 - Server-Side Razorpay Order Creation via Orders API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

import { isOrderPayload, isRecord } from '../_shared/payment-validation.ts';

Deno.serve(async (req: Request) => {
  // 1. CORS headers — restricted to ALLOWED_ORIGINS; when unset, defaults
  // to the production domains (never the permissive '*' fallback).
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const effectiveOrigins =
    allowedOrigins.length > 0
      ? allowedOrigins
      : ['https://practicekoro.online', 'https://www.practicekoro.online'];
  const requestOrigin = req.headers.get('Origin');
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
  if (requestOrigin && effectiveOrigins.includes(requestOrigin)) {
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Validate user auth token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Authentication required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Server misconfiguration: Supabase environment keys missing');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify caller user identity
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // 3. Parse request payload
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!isOrderPayload(payload)) {
    return new Response(JSON.stringify({ error: 'Missing planId parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // No coupon redemption exists in this service. Never silently accept a
  // requested discount and charge full price, even from an older client.
  if (isRecord(payload) && (payload.couponCode != null || payload.couponId != null)) {
    return new Response(
      JSON.stringify({ error: 'Coupon checkout is unavailable. Remove the coupon before paying.' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // 4. Retrieve authoritative plan details from database
  const { data: plan, error: planError } = await serviceClient
    .from('subscription_plans')
    .select('id, title, price, currency, duration_days, is_active')
    .eq('id', payload.planId)
    .single();

  if (planError || !plan) {
    return new Response(JSON.stringify({ error: 'Subscription plan not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!plan.is_active) {
    return new Response(JSON.stringify({ error: 'This subscription plan is currently inactive' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const priceNum = Number(plan.price);
  if (
    !Number.isFinite(priceNum) ||
    priceNum <= 0 ||
    !Number.isSafeInteger(Math.round(priceNum * 100))
  ) {
    return new Response(JSON.stringify({ error: 'Free plans do not require payment processing' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // New checkout must honor the saved gateway switch even when credentials exist in env.
  // Existing payment verification/webhooks remain available when checkout is disabled.
  const keyId = Deno.env.get('RAZORPAY_KEY_ID')?.trim();
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  let resolvedKeyId: string | undefined;
  try {
    const { data: gateway, error } = await serviceClient
      .from('payment_gateways')
      .select('key_id,is_active')
      .eq('gateway', 'razorpay')
      .maybeSingle();
    if (error || !gateway || gateway.is_active !== true || typeof gateway.key_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Payment checkout is unavailable or disabled.' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    resolvedKeyId = gateway.key_id.trim();
    // Rotating a public key in Settings cannot rotate its paired server secret.
    if (keyId && keyId !== resolvedKeyId) {
      return new Response(
        JSON.stringify({ error: 'Payment credentials need coordinated server configuration.' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Payment configuration could not be confirmed.' }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (
    !resolvedKeyId ||
    !keySecret ||
    resolvedKeyId === 'rzp_test_practicekoro_key' ||
    !keySecret.trim()
  ) {
    console.error('Razorpay gateway credentials not properly configured');
    return new Response(
      JSON.stringify({
        error:
          'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Supabase Edge Function secrets.',
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // 6. Call Razorpay Orders API to create an authoritative order
  const amountInPaise = Math.round(priceNum * 100);
  const authHeaderBasic = 'Basic ' + btoa(`${resolvedKeyId.trim()}:${keySecret.trim()}`);
  const receiptId = `pk_${user.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);

  let rzpOrder: { id: string; amount: number; currency: string };
  try {
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeaderBasic,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: plan.currency || 'INR',
        receipt: receiptId,
        notes: {
          user_id: user.id,
          plan_id: plan.id,
          platform: 'PracticeKoro',
        },
      }),
    });

    const rzpData = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error('Razorpay API error response:', rzpData);
      const desc = rzpData?.error?.description || 'Could not initiate order with payment gateway';
      return new Response(JSON.stringify({ error: `Razorpay: ${desc}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (
      !isRecord(rzpData) ||
      typeof rzpData.id !== 'string' ||
      rzpData.amount !== amountInPaise ||
      rzpData.currency !== (plan.currency || 'INR')
    ) {
      throw new Error('Invalid provider order response');
    }
    rzpOrder = { id: rzpData.id, amount: amountInPaise, currency: rzpData.currency as string };
  } catch (apiErr) {
    console.error('Failed to communicate with Razorpay API:', apiErr);
    return new Response(
      JSON.stringify({ error: 'Network error communicating with payment gateway' }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // 7. Persist pending order in public.payments table
  const { data: paymentRow, error: paymentInsertError } = await serviceClient
    .from('payments')
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      amount: plan.price,
      currency: plan.currency || 'INR',
      gateway: 'razorpay',
      verification_version: 2,
      order_id: rzpOrder.id,
      razorpay_order_id: rzpOrder.id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (paymentInsertError || !paymentRow?.id) {
    console.error('Failed to record pending payment in database:', paymentInsertError);
    return new Response(
      JSON.stringify({
        error: 'Could not record payment order. Checkout was not opened; please retry.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({
      verification_version: 2,
      order_id: rzpOrder.id,
      payment_id: paymentRow?.id || rzpOrder.id,
      plan_id: plan.id,
      plan_title: plan.title,
      amount: plan.price,
      currency: plan.currency || 'INR',
      duration_days: plan.duration_days,
      key_id: resolvedKeyId.trim(),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
