-- Read-only production checks. No promotion, demotion or identity update is invoked.
SELECT jsonb_build_object(
  'staff_lookup_uses_verified_auth', (
    SELECT prosrc LIKE '%FROM auth.users%' AND prosrc LIKE '%email_confirmed_at IS NOT NULL%'
      AND prosrc LIKE '%INTO STRICT v_id%' AND prosrc NOT LIKE '%FROM public.profiles WHERE LOWER(email)%'
    FROM pg_proc WHERE oid='public.assign_admin_staff_by_email(text,text)'::regprocedure
  ),
  'uuid_role_update_uses_verified_auth', (
    SELECT prosrc LIKE '%FROM auth.users%' AND prosrc LIKE '%email_confirmed_at IS NOT NULL%'
      AND prosrc LIKE '%v_profile.email IS DISTINCT FROM v_auth_email%'
      AND prosrc LIKE '%lower(v_auth_email)%'
    FROM pg_proc WHERE oid='public.update_admin_staff_role(uuid,text)'::regprocedure
  ),
  'both_staff_rpcs_require_super_admin', (
    SELECT bool_and(prosrc LIKE '%NOT public.is_management_super_admin()%')
    FROM pg_proc WHERE oid IN ('public.assign_admin_staff_by_email(text,text)'::regprocedure,
      'public.update_admin_staff_role(uuid,text)'::regprocedure)
  ),
  'authenticated_staff_rpc_access', (
    SELECT bool_and(has_function_privilege('authenticated',f,'EXECUTE'))
    FROM unnest(ARRAY['public.assign_admin_staff_by_email(text,text)',
      'public.update_admin_staff_role(uuid,text)']) AS functions(f)
  ),
  'anonymous_staff_rpcs_blocked', (
    SELECT bool_and(NOT has_function_privilege('anon',f,'EXECUTE'))
    FROM unnest(ARRAY['public.assign_admin_staff_by_email(text,text)',
      'public.update_admin_staff_role(uuid,text)']) AS functions(f)
  ),
  'identity_trigger_enabled', EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgrelid='public.profiles'::regclass
      AND tgname='trg_guard_profile_identity_email' AND tgenabled='O'
  ),
  'auth_email_sync_trigger_enabled', EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgrelid='auth.users'::regclass
      AND tgname='trg_sync_profile_email_from_auth' AND tgenabled='O'
  ),
  'trigger_functions_not_client_callable', (
    SELECT bool_and(NOT has_function_privilege(r,f,'EXECUTE'))
    FROM unnest(ARRAY['anon','authenticated']) AS roles(r)
    CROSS JOIN unnest(ARRAY['public.guard_profile_identity_email()',
      'public.sync_profile_email_from_auth()']) AS functions(f)
  ),
  'changed_functions_search_path_pinned', (
    SELECT bool_and(proconfig @> ARRAY['search_path=public, pg_temp'])
    FROM pg_proc WHERE oid IN ('public.assign_admin_staff_by_email(text,text)'::regprocedure,
      'public.update_admin_staff_role(uuid,text)'::regprocedure,
      'public.guard_profile_identity_email()'::regprocedure,
      'public.sync_profile_email_from_auth()'::regprocedure)
  )
) AS verified_staff_identity_security;