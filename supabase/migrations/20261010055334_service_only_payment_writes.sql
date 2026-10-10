-- Issue #1: payment records are written only by trusted server payment workflows.
-- Preserves existing SELECT policies, reporting RPCs, records and service-role grants.
-- No payment, refund or subscription is created/modified by this migration.
BEGIN;

-- ALL also removes maintenance privileges introduced in newer PostgreSQL versions.
REVOKE ALL PRIVILEGES ON TABLE public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.payments TO anon, authenticated;

-- Remove possible explicit column grants as well as the table-level grants above.
DO $$
DECLARE v_columns text;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
  INTO v_columns
  FROM pg_attribute
  WHERE attrelid = 'public.payments'::regclass AND attnum > 0 AND NOT attisdropped;
  EXECUTE format(
    'REVOKE INSERT (%1$s), UPDATE (%1$s), REFERENCES (%1$s) ON TABLE public.payments FROM PUBLIC, anon, authenticated',
    v_columns
  );
END;
$$;

-- Existing owner/admin SELECT policy already retains administrator reporting.
DROP POLICY IF EXISTS "Admin manage payments" ON public.payments;
CREATE POLICY payment_client_insert_denied ON public.payments
  AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY payment_client_update_denied ON public.payments
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY payment_client_delete_denied ON public.payments
  AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- These legacy SECURITY DEFINER RPCs bypass table ACL/RLS and are not verified
-- gateway workflows: one fabricates local orders, the other trusts refund input.
-- Checkout uses create-razorpay-order; settlement uses the service-only RPCs.
REVOKE EXECUTE ON FUNCTION public.create_razorpay_order(text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_payment_refunded(uuid, numeric, text, text)
  FROM PUBLIC, anon, authenticated;

-- Fail closed even if a legacy definer RPC is accidentally exposed again later.
-- Supabase supplies this role from the verified JWT, never client request JSON.
CREATE FUNCTION public.guard_service_payment_writes()
RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Payment changes require a trusted server payment workflow'
      USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_service_payment_writes()
  FROM PUBLIC, anon, authenticated;
CREATE TRIGGER payments_service_write_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.guard_service_payment_writes();

COMMIT;