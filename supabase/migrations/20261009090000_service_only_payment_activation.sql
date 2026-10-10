-- Apply only after explicit production approval. No history/data deletion.
-- Checkout activation is service-only, after Edge HMAC + captured-payment verification.
-- Disable the legacy client-callable endpoint regardless of inherited grants.
BEGIN;
CREATE OR REPLACE FUNCTION public.verify_razorpay_payment(
    p_order_id TEXT, p_payment_id TEXT, p_signature TEXT, p_plan_id TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
    RAISE EXCEPTION 'Use the authenticated verify-payment endpoint' USING ERRCODE = '42501';
END;
$$;
REVOKE ALL ON FUNCTION public.verify_razorpay_payment(TEXT,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.activate_verified_razorpay_payment(
    p_user_id UUID,
    p_order_id TEXT,
    p_payment_id TEXT,
    p_signature TEXT,
    p_plan_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_payment RECORD;
    v_plan RECORD;
    v_active_sub RECORD;
    v_subscription_id UUID;
    v_starts_at TIMESTAMPTZ;
    v_new_expires_at TIMESTAMPTZ;
    v_is_renewal BOOLEAN := FALSE;
BEGIN
    IF COALESCE(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
    END IF;
    v_user_id := p_user_id;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    -- Signature presence is defense in depth, not a cryptographic check here.
    -- The service caller must verify HMAC and captured payment before invocation.
    IF p_signature IS NULL OR TRIM(p_signature) = '' THEN
        RAISE EXCEPTION 'Forbidden: Payment signature is required' USING ERRCODE = '40001';
    END IF;

    -- Serialize renewals for the same user and lock the exact order row.
    PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
    -- 1. Retrieve payment record for this user
    SELECT * INTO v_payment
    FROM public.payments
    WHERE (order_id = p_order_id OR razorpay_order_id = p_order_id )
      AND user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1 FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment order not found for current user' USING ERRCODE = '40401';
    END IF;

    -- 2. Validate plan matches
    IF v_payment.plan_id IS DISTINCT FROM p_plan_id THEN
        RAISE EXCEPTION 'Mismatched subscription plan' USING ERRCODE = '40002';
    END IF;

    -- Retrieve active plan duration
    SELECT * INTO v_plan
    FROM public.subscription_plans
    WHERE id = p_plan_id;

    IF NOT FOUND OR v_plan.duration_days IS NULL OR v_plan.duration_days <= 0 THEN
        RAISE EXCEPTION 'Invalid subscription plan' USING ERRCODE = '40002';
    END IF;
    IF v_payment.status NOT IN ('pending', 'completed') OR v_payment.status IS NULL THEN
        RAISE EXCEPTION 'Payment is not eligible for activation' USING ERRCODE = '40002';
    END IF;
    IF v_payment.amount IS DISTINCT FROM v_plan.price OR
       v_payment.currency IS DISTINCT FROM 'INR' THEN
        RAISE EXCEPTION 'Invalid payment amount or currency' USING ERRCODE = '40003';
    END IF;
    IF p_payment_id IS NULL OR trim(p_payment_id) = '' THEN
        RAISE EXCEPTION 'Payment ID required' USING ERRCODE = '40002';
    END IF;

    -- 4. Idempotency Check: if payment is already completed
    IF v_payment.status = 'completed' THEN
        IF v_payment.razorpay_payment_id IS DISTINCT FROM p_payment_id THEN
            RAISE EXCEPTION 'Completed payment ID mismatch' USING ERRCODE = '40901';
        END IF;
        SELECT s.id, s.status, s.starts_at, s.expires_at INTO v_active_sub
        FROM public.subscriptions s
        WHERE s.user_id = v_user_id AND (s.payment_id = v_payment.id
          OR s.id::text = v_payment.raw_response->>'subscription_id')
        ORDER BY s.expires_at DESC
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Payment already verified and processed (idempotent)',
            'subscription_id', v_active_sub.id,
            'status', v_active_sub.status,
            'starts_at', v_active_sub.starts_at,
            'expires_at', v_active_sub.expires_at,
            'is_duplicate', true,
            'is_renewal', false
        );
    END IF;

    -- 5. Reject duplicate razorpay_payment_id on different payment records
    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE razorpay_payment_id = p_payment_id
          AND id != v_payment.id
          AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Duplicate payment ID already processed' USING ERRCODE = '40901';
    END IF;

    -- 6. Check existing active subscription to handle renewal vs fresh purchase
    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = v_user_id
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1;

    IF v_active_sub.id IS NOT NULL THEN
        -- Renewal: extend expiry from current active expiration
        v_starts_at := v_active_sub.starts_at;
        v_new_expires_at := v_active_sub.expires_at + (v_plan.duration_days || ' days')::INTERVAL;

        UPDATE public.subscriptions
        SET expires_at = v_new_expires_at,
            plan_id = v_plan.id,
            payment_id = v_payment.id,
            updated_at = NOW()
        WHERE id = v_active_sub.id;

        v_subscription_id := v_active_sub.id;
        v_is_renewal := TRUE;
    ELSE
        -- Fresh purchase: starts immediately
        v_starts_at := NOW();
        v_new_expires_at := NOW() + (v_plan.duration_days || ' days')::INTERVAL;

        INSERT INTO public.subscriptions (
            user_id,
            plan_id,
            payment_id,
            status,
            starts_at,
            expires_at
        )
        VALUES (
            v_user_id,
            v_plan.id,
            v_payment.id,
            'active',
            v_starts_at,
            v_new_expires_at
        )
        RETURNING id INTO v_subscription_id;

        v_is_renewal := FALSE;
    END IF;

    -- 7. Mark payment record as completed
    UPDATE public.payments
    SET status = 'completed',
        transaction_id = p_payment_id,
        razorpay_payment_id = p_payment_id,
        razorpay_signature = p_signature,
        raw_response = jsonb_build_object(
            'verified_at', NOW(),
            'subscription_id', v_subscription_id,
            'is_renewal', v_is_renewal
        )
    WHERE id = v_payment.id;

    RETURN jsonb_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'status', 'active',
        'starts_at', v_starts_at,
        'expires_at', v_new_expires_at,
        'is_renewal', v_is_renewal,
        'plan_title', v_plan.title
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.activate_verified_razorpay_payment(UUID,TEXT,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_verified_razorpay_payment(UUID,TEXT,TEXT,TEXT,TEXT) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
