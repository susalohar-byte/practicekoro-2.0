-- Pending production approval. Public gateway metadata only; never return secret fragments.
CREATE OR REPLACE FUNCTION public.admin_get_payment_gateway(p_gateway text DEFAULT 'razorpay')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_target text := lower(trim(coalesce(p_gateway,'razorpay')));
        v_key text; v_active boolean; v_updated timestamptz;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid()
                 AND role='admin' AND account_status='active') THEN
    RAISE EXCEPTION 'Active Admin privileges required' USING ERRCODE='42501';
  END IF;
  IF v_target <> 'razorpay' THEN RAISE EXCEPTION 'Only Razorpay is supported'; END IF;
  SELECT key_id,is_active,updated_at INTO v_key,v_active,v_updated
  FROM public.payment_gateways WHERE gateway=v_target;
  IF coalesce(trim(v_key),'')='' THEN
    SELECT value #>> '{}' INTO v_key FROM public.app_settings
    WHERE id='payment_gateway_razorpay_key_id';
  END IF;
  RETURN jsonb_build_object('gateway',v_target,'key_id',coalesce(v_key,''),
    'is_active',coalesce(v_active,false),'updated_at',v_updated,
    'has_secret',NULL,'secret_preview',NULL,'has_webhook_secret',NULL,'webhook_preview',NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_payment_gateway(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_get_payment_gateway(text) TO authenticated;
NOTIFY pgrst, 'reload schema';
