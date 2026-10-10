-- Read-only post-rollout checks for issue #1; no financial records are accessed.
SELECT jsonb_build_object(
  'client_table_writes_blocked', NOT EXISTS (
    SELECT 1 FROM unnest(ARRAY['anon','authenticated']) AS r(role_name)
    CROSS JOIN unnest(ARRAY['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) AS p(privilege_name)
    WHERE has_table_privilege(r.role_name, 'public.payments', p.privilege_name)
  ),
  'client_column_writes_blocked', NOT EXISTS (
    SELECT 1 FROM pg_attribute a
    CROSS JOIN unnest(ARRAY['anon','authenticated']) AS r(role_name)
    CROSS JOIN unnest(ARRAY['INSERT','UPDATE','REFERENCES']) AS p(privilege_name)
    WHERE a.attrelid='public.payments'::regclass AND a.attnum>0 AND NOT a.attisdropped
      AND has_column_privilege(r.role_name, 'public.payments', a.attname, p.privilege_name)
  ),
  'authenticated_reporting_preserved', has_table_privilege('authenticated','public.payments','SELECT'),
  'owner_admin_read_policy_preserved', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payments'
      AND cmd='SELECT' AND qual LIKE '%auth.uid()%' AND qual LIKE '%has_role%'
  ),
  'service_table_writes_preserved',
    has_table_privilege('service_role','public.payments','INSERT')
    AND has_table_privilege('service_role','public.payments','UPDATE')
    AND has_table_privilege('service_role','public.payments','DELETE'),
  'client_legacy_rpcs_blocked', NOT EXISTS (
    SELECT 1 FROM unnest(ARRAY['anon','authenticated']) AS r(role_name)
    CROSS JOIN unnest(ARRAY[
      'public.create_razorpay_order(text)',
      'public.mark_payment_refunded(uuid,numeric,text,text)'
    ]) AS f(function_name)
    WHERE has_function_privilege(r.role_name, f.function_name, 'EXECUTE')
  ),
  'verified_activation_service_access',
    has_function_privilege('service_role','public.activate_verified_razorpay_payment(uuid,text,text,text,text)','EXECUTE'),
  'webhook_service_access',
    has_function_privilege('service_role','public.reconcile_razorpay_webhook(text,text,numeric,text,text)','EXECUTE')
    AND has_function_privilege('service_role','public.reconcile_razorpay_refund(text,text,numeric,text)','EXECUTE'),
  'service_trigger_enabled', EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgrelid='public.payments'::regclass
      AND tgname='payments_service_write_guard' AND tgenabled='O'
  ),
  'restrictive_write_guards_present', (
    SELECT count(*)=3 FROM pg_policies WHERE schemaname='public' AND tablename='payments'
      AND permissive='RESTRICTIVE'
      AND policyname IN ('payment_client_insert_denied','payment_client_update_denied','payment_client_delete_denied')
  )
) AS payment_write_security;