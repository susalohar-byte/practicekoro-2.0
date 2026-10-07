-- Pending explicit production approval. No settings values are changed by this migration.
-- Align the gateway mutation with the existing active-super-admin settings policy.
CREATE OR REPLACE FUNCTION public.admin_update_payment_gateway(
  p_gateway text, p_key_id text, p_key_secret text DEFAULT NULL,
  p_webhook_secret text DEFAULT NULL, p_is_active boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_gateway text := lower(trim(coalesce(p_gateway,'razorpay')));
        v_key text := trim(coalesce(p_key_id,''));
BEGIN
  IF NOT public.is_management_super_admin() THEN
    RAISE EXCEPTION 'Active Super Admin privileges required' USING ERRCODE='42501';
  END IF;
  IF v_gateway <> 'razorpay' THEN RAISE EXCEPTION 'Only Razorpay is supported'; END IF;
  IF length(trim(coalesce(p_key_secret,'')))>0 OR length(trim(coalesce(p_webhook_secret,'')))>0 THEN
    RAISE EXCEPTION 'Payment secrets must be configured server-side';
  END IF;
  IF p_is_active IS NULL OR (v_key<>'' AND v_key !~ '^rzp_(test|live)_[A-Za-z0-9]+$') OR (p_is_active AND v_key='') THEN
    RAISE EXCEPTION 'Valid Razorpay public Key ID required';
  END IF;
  INSERT INTO public.payment_gateways(gateway,key_id,key_secret,webhook_secret,is_active,updated_at)
  VALUES(v_gateway,v_key,NULL,NULL,p_is_active,now())
  ON CONFLICT(gateway) DO UPDATE SET key_id=excluded.key_id,is_active=excluded.is_active,updated_at=excluded.updated_at;
  -- Secrets of an existing record are deliberately neither changed nor returned.
  INSERT INTO public.app_settings(id,category,key,value,description,updated_at)
  VALUES('payment_gateway_razorpay_key_id','monetization','razorpay_key_id',to_jsonb(v_key),'Public Razorpay Key ID for client checkout',now()),
        ('payment_gateway_razorpay_active','monetization','razorpay_active',to_jsonb(p_is_active),'Razorpay payment gateway active status',now())
  ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  RETURN jsonb_build_object('success',true,'gateway',v_gateway,'key_id',v_key,'is_active',p_is_active,'updated_at',now());
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_payment_gateway(text,text,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_update_payment_gateway(text,text,text,text,boolean) TO authenticated;
NOTIFY pgrst, 'reload schema';
