// supabase/functions/razorpay-webhook/index.ts
// PracticeKoro 2.0 - Razorpay Webhook & Payment Reconciliation Edge Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { isRecord, isCompletedRefund } from '../_shared/payment-validation.ts';
import { paiseToRupees, verifyHmacSha256 } from '../_shared/razorpay-signature.ts';

interface RazorpayWebhookPayload {
  entity: string;
  account_id?: string;
  event: string;
  contains?: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number; // in paise
        currency: string;
        status: string;
        method?: string;
        email?: string;
        contact?: string;
        created_at?: number;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        receipt?: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id?: string;
        amount?: number; // in paise
        currency?: string;
        status?: string;
        notes?: Record<string, any>;
      };
    };
  };
  created_at?: number;
}

Deno.serve(async (req: Request) => {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Extract Razorpay signature header
  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing x-razorpay-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Read raw body text for HMAC signature verification
  const rawBody = await req.text();
  if (!rawBody) {
    return new Response(JSON.stringify({ error: 'Empty request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Resolve webhook secret — Supabase secrets ONLY. There is
  // intentionally no database fallback: payment secrets must never live
  // in app tables.
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase environment configuration missing in Edge Function');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

  if (!webhookSecret) {
    console.error(
      'Server misconfiguration: RAZORPAY_WEBHOOK_SECRET is not set in Supabase secrets'
    );
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Cryptographic signature check
  const isValid = await verifyHmacSha256(rawBody, signature, webhookSecret);
  if (!isValid) {
    console.warn('Invalid Razorpay webhook signature attempt rejected');
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 6. Parse validated JSON payload
  let data: RazorpayWebhookPayload;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isRecord(parsed) || typeof parsed.event !== 'string' || !isRecord(parsed.payload)) {
      throw new Error('Invalid webhook body');
    }
    data = parsed as unknown as RazorpayWebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const event = data.event;
  console.log(`Processing valid Razorpay webhook event: ${event}`);

  // 7. Filter relevant payment events (capture) vs refund events
  const isPaymentCapture = event === 'payment.captured' || event === 'order.paid';
  const isRefundEvent =
    event === 'payment.refunded' ||
    event === 'refund.processed' ||
    event === 'refund.created' ||
    event === 'refund.speed_changed';

  if (!isPaymentCapture && !isRefundEvent) {
    return new Response(
      JSON.stringify({
        status: 'ignored',
        message: `Event ${event} does not require reconciliation`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 7b. Handle Refund Webhook Events -> Automatically revoke Pro subscription
  if (isRefundEvent) {
    const refundEntity = data.payload?.refund?.entity;
    if (!isCompletedRefund(event, refundEntity?.status)) {
      return new Response(
        JSON.stringify({ status: 'ignored', message: 'Refund is not completed; access unchanged' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    const paymentEntity = data.payload?.payment?.entity;
    const paymentId = refundEntity?.payment_id || paymentEntity?.id;
    const refundId = refundEntity?.id || `rfnd_${Date.now()}`;
    const refundAmountPaise = refundEntity?.amount || (paymentEntity as any)?.amount_refunded || 0;
    const refundAmountInr = refundAmountPaise > 0 ? paiseToRupees(refundAmountPaise) : null;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id in refund webhook payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing refund for payment ${paymentId}, refund amount: ${refundAmountInr}`);

    const { data: refundResult, error: refundError } = await supabase.rpc(
      'reconcile_razorpay_refund',
      {
        p_payment_id: paymentId,
        p_refund_id: refundId,
        p_refund_amount: refundAmountInr,
        p_refund_reason: `Razorpay webhook event: ${event}`,
      }
    );

    if (refundError) {
      console.error('Refund reconciliation RPC failed:', refundError);
      return new Response(JSON.stringify({ error: refundError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        event,
        reconciliation: refundResult,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const paymentEntity = data.payload?.payment?.entity;
  const orderEntity = data.payload?.order?.entity;

  const paymentId = paymentEntity?.id;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  const amountPaise = paymentEntity?.amount || orderEntity?.amount;
  const currency = paymentEntity?.currency || orderEntity?.currency || 'INR';

  if (!orderId || !paymentId || !amountPaise) {
    return new Response(
      JSON.stringify({
        error: 'Missing required order_id, payment_id, or amount in webhook payload',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Never guess payment amount; reject invalid events so Razorpay can retry.
  if (!amountPaise || amountPaise <= 0) {
    return new Response(JSON.stringify({ error: 'Missing payment amount in webhook payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const amountInr = paiseToRupees(amountPaise);

  // 8. Reconcile with authoritative PostgreSQL database

  // Stable event identifier: uses payment ID and account/event identity rather than Date.now()
  const stableEventId = data.account_id
    ? `${data.account_id}_${event}_${paymentId}`
    : `evt_${event}_${paymentId}`;

  const { data: rpcResult, error: rpcError } = await supabase.rpc('reconcile_razorpay_webhook', {
    p_order_id: orderId,
    p_payment_id: paymentId,
    p_amount: amountInr,
    p_currency: currency,
    p_event_id: stableEventId,
  });

  if (rpcError) {
    console.error('Reconciliation RPC rejected transaction. Error code:', rpcError.code);
    return new Response(
      JSON.stringify({
        error: 'Reconciliation rejected',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log('Reconciliation result:', rpcResult);

  return new Response(
    JSON.stringify({
      status: 'success',
      event,
      reconciliation: rpcResult,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
