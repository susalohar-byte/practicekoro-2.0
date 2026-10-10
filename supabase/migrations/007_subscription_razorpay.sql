-- =============================================================
-- PRACTICEKORO: MIGRATION 007 - SUBSCRIPTION & RAZORPAY PRO PASS
-- =============================================================
-- Monetization Model:
-- One Active Pro Pass -> Universal Access to ALL Premium Mock Tests
-- No individual test purchase logic or separate piecemeal tiers.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------
-- 1. SUBSCRIPTION PLANS STANDARDIZATION
-- -------------------------------------------------------------
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR';

-- Standardize the default commercial 1-Year All-Access Pro Pass
INSERT INTO public.subscription_plans (
    id,
    name,
    title,
    description,
    duration_days,
    price,
    original_price,
    currency,
    features,
    is_active,
    order_index
)
VALUES (
    'pro_1_year',
    'PracticeKoro Pro Pass',
    '1-Year All-Access Pro Pass',
    'Complete universal access to ALL Premium Mock Tests and Test Series across all West Bengal exams for 365 days.',
    365,
    299.00,
    999.00,
    'INR',
    '["Universal access to ALL Premium Mock Tests", "Detailed Solutions & Bengali Explanations", "Automated Mistakes Notebook & Smart Revision", "State-Level Rank & Percentile Analytics", "All-Access Pass across WBP, KP SI, WBCS & WBPSC"]'::jsonb,
    TRUE,
    1
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration_days = EXCLUDED.duration_days,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    currency = EXCLUDED.currency,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active;

-- -------------------------------------------------------------
-- 2. SUBSCRIPTIONS TABLE ENHANCEMENTS
-- -------------------------------------------------------------
-- Support complete lifecycle states: pending, active, expired, cancelled, failed
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'failed'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- -------------------------------------------------------------
-- 3. PAYMENTS TABLE ENHANCEMENTS & SECURITY
-- -------------------------------------------------------------
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.subscription_plans(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
    ON public.payments(razorpay_payment_id)
    WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);

-- Internal gateway settings for signature verification
CREATE TABLE IF NOT EXISTS public.payment_gateways (
    gateway TEXT PRIMARY KEY,
    key_id TEXT,
    key_secret TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default gateway configuration (secrets must be configured via server environment)
INSERT INTO public.payment_gateways (gateway, key_id, is_active)
VALUES ('razorpay', NULL, TRUE)
ON CONFLICT (gateway) DO NOTHING;

-- Secure payment_gateways table (only superuser / security definer functions can read)
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view gateway config" ON public.payment_gateways;
CREATE POLICY "Admin view gateway config" ON public.payment_gateways FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------
-- 4. RLS SECURITY HARDENING
-- -------------------------------------------------------------
-- Revoke direct user mutations on payments to prevent client status tampering
DROP POLICY IF EXISTS "Users insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users manage own payments" ON public.payments;
DROP POLICY IF EXISTS "Users update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users read own payments" ON public.payments;

CREATE POLICY "Users read own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY "Admin manage payments"
    ON public.payments FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Revoke direct user mutations on subscriptions to prevent self-granting access
DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users read own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admin manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------
-- 5. AUTHORITATIVE SERVER-SIDE ACCESS FUNCTION
-- -------------------------------------------------------------
-- Checks whether a user possesses a genuinely active subscription.
-- Derives identity from auth.uid() to prevent client spoofing.
CREATE OR REPLACE FUNCTION public.has_active_subscription(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_target_user UUID;
BEGIN
    -- Determine target user: if caller is authenticated, enforce auth.uid() unless admin
    IF auth.uid() IS NOT NULL THEN
        IF p_user_id IS NOT NULL AND p_user_id != auth.uid() THEN
            IF public.has_role(auth.uid(), 'admin') THEN
                v_target_user := p_user_id;
            ELSE
                v_target_user := auth.uid();
            END IF;
        ELSE
            v_target_user := auth.uid();
        END IF;
    ELSE
        v_target_user := p_user_id;
    END IF;

    IF v_target_user IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.subscriptions s
        JOIN public.subscription_plans p ON s.plan_id = p.id
        WHERE s.user_id = v_target_user
          AND s.status = 'active'
          AND s.starts_at <= NOW()
          AND s.expires_at > NOW()
          AND p.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 6. ORDER CREATION RPC
-- -------------------------------------------------------------
-- Creates a pending order and payment record.
-- Price is strictly derived from database plan record. Client cannot tamper with amount.
CREATE OR REPLACE FUNCTION public.create_razorpay_order(
    p_plan_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_plan RECORD;
    v_order_id TEXT;
    v_payment_id UUID;
    v_key_id TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    -- Retrieve active plan from database
    SELECT * INTO v_plan
    FROM public.subscription_plans
    WHERE id = p_plan_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription plan not found or inactive' USING ERRCODE = '40400';
    END IF;

    -- Retrieve public key_id
    SELECT key_id INTO v_key_id
    FROM public.payment_gateways
    WHERE gateway = 'razorpay' AND is_active = TRUE;

    -- Generate unique server order reference
    v_order_id := 'order_' || substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 16);

    -- Insert pending payment record
    INSERT INTO public.payments (
        user_id,
        plan_id,
        amount,
        currency,
        gateway,
        order_id,
        razorpay_order_id,
        status
    )
    VALUES (
        v_user_id,
        v_plan.id,
        v_plan.price,
        v_plan.currency,
        'razorpay',
        v_order_id,
        v_order_id,
        'pending'
    )
    RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'payment_id', v_payment_id,
        'plan_id', v_plan.id,
        'plan_title', v_plan.title,
        'amount', v_plan.price,
        'currency', v_plan.currency,
        'duration_days', v_plan.duration_days,
        'key_id', v_key_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 7. PAYMENT VERIFICATION & SUBSCRIPTION ACTIVATION RPC
-- -------------------------------------------------------------
-- Verifies Razorpay HMAC-SHA256 signature, validates plan & order,
-- handles idempotency, and activates or extends the student's Pro Pass.
CREATE OR REPLACE FUNCTION public.verify_razorpay_payment(
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
    v_secret TEXT;
    v_expected_signature TEXT;
    v_active_sub RECORD;
    v_subscription_id UUID;
    v_starts_at TIMESTAMPTZ;
    v_new_expires_at TIMESTAMPTZ;
    v_is_renewal BOOLEAN := FALSE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    -- 1. Retrieve payment record for this user
    SELECT * INTO v_payment
    FROM public.payments
    WHERE (order_id = p_order_id OR razorpay_order_id = p_order_id)
      AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment order not found for current user' USING ERRCODE = '40401';
    END IF;

    -- 2. Validate plan matches
    IF v_payment.plan_id != p_plan_id THEN
        RAISE EXCEPTION 'Mismatched subscription plan' USING ERRCODE = '40002';
    END IF;

    -- 3. Verify HMAC-SHA256 signature
    SELECT key_secret INTO v_secret
    FROM public.payment_gateways
    WHERE gateway = 'razorpay' AND is_active = TRUE;

    IF v_secret IS NULL OR v_secret = '' THEN
        RAISE EXCEPTION 'Server configuration error: Payment gateway secret not configured' USING ERRCODE = '50001';
    END IF;

    v_expected_signature := encode(hmac((p_order_id || '|' || p_payment_id)::bytea, v_secret::bytea, 'sha256'), 'hex');

    IF p_signature != v_expected_signature THEN
        RAISE EXCEPTION 'Forbidden: Invalid payment signature' USING ERRCODE = '40001';
    END IF;

    -- 4. Idempotency Check: if payment is already completed
    IF v_payment.status = 'completed' THEN
        SELECT s.id, s.status, s.starts_at, s.expires_at INTO v_active_sub
        FROM public.subscriptions s
        WHERE s.payment_id = v_payment.id
           OR (s.user_id = v_user_id AND s.status = 'active')
        ORDER BY s.expires_at DESC
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Payment already verified and processed (idempotent)',
            'subscription_id', v_active_sub.id,
            'status', v_active_sub.status,
            'starts_at', v_active_sub.starts_at,
            'expires_at', v_active_sub.expires_at,
            'is_duplicate', true
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

    -- 6. Retrieve active subscription plan
    SELECT * INTO v_plan
    FROM public.subscription_plans
    WHERE id = p_plan_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription plan not found or inactive' USING ERRCODE = '40400';
    END IF;

    -- 7. Check for existing active subscription (Renewal / Extension handling)
    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = v_user_id
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1;

    IF v_active_sub.id IS NOT NULL THEN
        -- Renewal: extend from current expiry date without resetting remaining days
        v_starts_at := v_active_sub.starts_at;
        v_new_expires_at := v_active_sub.expires_at + (v_plan.duration_days || ' days')::INTERVAL;

        UPDATE public.subscriptions
        SET expires_at = v_new_expires_at,
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

    -- 8. Mark payment record as completed
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 8. STUDENT SUBSCRIPTION STATUS RPC
-- -------------------------------------------------------------
-- Returns the caller's authoritative subscription status, days remaining, and plan info.
CREATE OR REPLACE FUNCTION public.get_student_subscription_details()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_sub RECORD;
    v_plan RECORD;
    v_days_left INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '40100';
    END IF;

    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE user_id = v_user_id
    ORDER BY expires_at DESC
    LIMIT 1;

    IF v_sub.id IS NULL THEN
        RETURN jsonb_build_object(
            'has_subscription', false,
            'is_active', false,
            'status', 'none'
        );
    END IF;

    SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;

    IF v_sub.status = 'active' AND v_sub.expires_at > NOW() THEN
        v_days_left := GREATEST(0, EXTRACT(DAY FROM (v_sub.expires_at - NOW()))::INT);
        RETURN jsonb_build_object(
            'has_subscription', true,
            'is_active', true,
            'subscription_id', v_sub.id,
            'status', 'active',
            'plan_id', v_sub.plan_id,
            'plan_title', COALESCE(v_plan.title, 'Pro Pass'),
            'starts_at', v_sub.starts_at,
            'expires_at', v_sub.expires_at,
            'days_remaining', v_days_left
        );
    ELSE
        RETURN jsonb_build_object(
            'has_subscription', true,
            'is_active', false,
            'subscription_id', v_sub.id,
            'status', 'expired',
            'plan_id', v_sub.plan_id,
            'plan_title', COALESCE(v_plan.title, 'Pro Pass'),
            'starts_at', v_sub.starts_at,
            'expires_at', v_sub.expires_at,
            'days_remaining', 0
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- 9. ADMIN SUBSCRIPTIONS & PAYMENTS AUDITING RPCS
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_admin_subscriptions(
    p_status TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_agg(sub_row) INTO v_result
    FROM (
        SELECT 
            s.id,
            s.user_id,
            p.full_name as student_name,
            p.email as student_email,
            p.phone as student_phone,
            p.avatar_url as avatar_url,
            s.plan_id,
            pl.title as plan_title,
            s.status,
            s.starts_at,
            s.expires_at,
            s.payment_id,
            GREATEST(0, EXTRACT(DAY FROM (s.expires_at - NOW()))::INT) as days_remaining,
            s.created_at
        FROM public.subscriptions s
        LEFT JOIN public.profiles p ON s.user_id = p.id
        LEFT JOIN public.subscription_plans pl ON s.plan_id = pl.id
        WHERE (p_status IS NULL OR s.status = p_status)
          AND (p_search IS NULL OR p.full_name ILIKE '%' || p_search || '%' OR p.email ILIKE '%' || p_search || '%')
        ORDER BY s.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) sub_row;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_payments(
    p_status TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_agg(pay_row) INTO v_result
    FROM (
        SELECT 
            pm.id,
            pm.user_id,
            p.full_name as student_name,
            p.email as student_email,
            pm.plan_id,
            pl.title as plan_title,
            pm.amount,
            pm.currency,
            pm.gateway,
            pm.order_id,
            pm.razorpay_order_id,
            pm.transaction_id,
            pm.razorpay_payment_id,
            pm.status,
            pm.created_at
        FROM public.payments pm
        LEFT JOIN public.profiles p ON pm.user_id = p.id
        LEFT JOIN public.subscription_plans pl ON pm.plan_id = pl.id
        WHERE (p_status IS NULL OR pm.status = p_status)
          AND (p_search IS NULL OR pm.order_id ILIKE '%' || p_search || '%' OR pm.razorpay_payment_id ILIKE '%' || p_search || '%' OR p.full_name ILIKE '%' || p_search || '%')
        ORDER BY pm.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) pay_row;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant EXECUTE to authenticated users
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_razorpay_order(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_razorpay_payment(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_subscription_details() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_subscriptions(TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_payments(TEXT, TEXT, INT, INT) TO authenticated;

-- -------------------------------------------------------------
-- 7. USER TEST ACCESS VIEW & WEBHOOK RECONCILIATION ENGINE
-- -------------------------------------------------------------

-- Helper View: user_test_access
CREATE OR REPLACE VIEW public.user_test_access AS
SELECT 
    t.id AS test_id,
    t.title,
    t.slug,
    t.is_premium,
    t.status,
    public.has_test_access(auth.uid(), t.id) AS has_access
FROM public.tests t
WHERE t.status = 'published';

-- Enhance payment_gateways with webhook_secret
ALTER TABLE public.payment_gateways ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Webhook Reconciliation RPC
CREATE OR REPLACE FUNCTION public.reconcile_razorpay_webhook(
    p_order_id TEXT,
    p_payment_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_event_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_payment RECORD;
    v_plan RECORD;
    v_active_sub RECORD;
    v_user_id UUID;
    v_subscription_id UUID;
    v_starts_at TIMESTAMPTZ;
    v_new_expires_at TIMESTAMPTZ;
    v_is_renewal BOOLEAN := FALSE;
BEGIN
    -- 1. Locate payment record by order_id or razorpay_order_id
    SELECT * INTO v_payment
    FROM public.payments
    WHERE order_id = p_order_id OR razorpay_order_id = p_order_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record not found for webhook: %', p_order_id USING ERRCODE = '40401';
    END IF;

    v_user_id := v_payment.user_id;

    -- 2. Verify amount and currency
    IF v_payment.amount != p_amount THEN
        RAISE EXCEPTION 'Mismatched payment amount: expected %, received %', v_payment.amount, p_amount USING ERRCODE = '40003';
    END IF;

    IF p_currency IS NOT NULL AND p_currency != 'INR' THEN
        RAISE EXCEPTION 'Unsupported payment currency: %', p_currency USING ERRCODE = '40004';
    END IF;

    -- 3. Idempotency Check: if payment is already completed
    IF v_payment.status = 'completed' THEN
        SELECT s.id, s.status, s.starts_at, s.expires_at INTO v_active_sub
        FROM public.subscriptions s
        WHERE s.payment_id = v_payment.id
           OR (s.user_id = v_user_id AND s.status = 'active')
        ORDER BY s.expires_at DESC
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Payment already reconciled and completed (idempotent)',
            'subscription_id', v_active_sub.id,
            'status', v_active_sub.status,
            'starts_at', v_active_sub.starts_at,
            'expires_at', v_active_sub.expires_at,
            'is_duplicate', true
        );
    END IF;

    -- 4. Check if payment_id was already used for a different record
    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE razorpay_payment_id = p_payment_id
          AND id != v_payment.id
          AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Duplicate payment ID already processed: %', p_payment_id USING ERRCODE = '40901';
    END IF;

    -- 5. Retrieve active subscription plan
    SELECT * INTO v_plan
    FROM public.subscription_plans
    WHERE id = v_payment.plan_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription plan not found or inactive: %', v_payment.plan_id USING ERRCODE = '40400';
    END IF;

    -- 6. Active subscription check (renewal vs fresh)
    SELECT * INTO v_active_sub
    FROM public.subscriptions
    WHERE user_id = v_user_id
      AND status = 'active'
      AND expires_at > NOW()
    ORDER BY expires_at DESC
    LIMIT 1;

    IF v_active_sub.id IS NOT NULL THEN
        -- Renewal: extend from current expiry date
        v_starts_at := v_active_sub.starts_at;
        v_new_expires_at := v_active_sub.expires_at + (v_plan.duration_days || ' days')::INTERVAL;

        UPDATE public.subscriptions
        SET expires_at = v_new_expires_at,
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
    END IF;

    -- 7. Mark payment as completed
    UPDATE public.payments
    SET status = 'completed',
        razorpay_order_id = p_order_id,
        razorpay_payment_id = p_payment_id,
        raw_response = jsonb_build_object(
            'source', 'webhook',
            'event_id', p_event_id,
            'reconciled_at', NOW()
        ),
        updated_at = NOW()
    WHERE id = v_payment.id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Payment successfully reconciled via webhook',
        'subscription_id', v_subscription_id,
        'user_id', v_user_id,
        'is_renewal', v_is_renewal,
        'starts_at', v_starts_at,
        'expires_at', v_new_expires_at,
        'is_duplicate', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security: Restrict RPC execution
REVOKE EXECUTE ON FUNCTION public.reconcile_razorpay_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reconcile_razorpay_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reconcile_razorpay_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_razorpay_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_razorpay_webhook(TEXT, TEXT, NUMERIC, TEXT, TEXT) TO postgres;

