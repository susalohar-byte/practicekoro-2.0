-- Read-only issue #2 verification. Never invokes the grant RPC or reads student data.
SELECT jsonb_build_object(
  'authenticated_rpc_available',
    has_function_privilege('authenticated','public.bulk_grant_student_subscription(uuid[],text,integer)','EXECUTE'),
  'anonymous_rpc_blocked',
    NOT has_function_privilege('anon','public.bulk_grant_student_subscription(uuid[],text,integer)','EXECUTE'),
  'service_rpc_blocked',
    NOT has_function_privilege('service_role','public.bulk_grant_student_subscription(uuid[],text,integer)','EXECUTE'),
  'security_definer_preserved', (
    SELECT prosecdef FROM pg_proc WHERE oid='public.bulk_grant_student_subscription(uuid[],text,integer)'::regprocedure
  ),
  'search_path_pinned', (
    SELECT proconfig @> ARRAY['search_path=public, pg_temp'] FROM pg_proc
    WHERE oid='public.bulk_grant_student_subscription(uuid[],text,integer)'::regprocedure
  ),
  'live_super_admin_guard_present', (
    SELECT prosrc LIKE '%NOT public.is_management_super_admin()%'
      AND prosrc NOT LIKE '%public.has_role(%'
    FROM pg_proc WHERE oid='public.bulk_grant_student_subscription(uuid[],text,integer)'::regprocedure
  ),
  'roster_bounds_present', (
    SELECT prosrc LIKE '%v_requested NOT BETWEEN 1 AND 100%'
      AND prosrc LIKE '%count(DISTINCT id)%'
    FROM pg_proc WHERE oid='public.bulk_grant_student_subscription(uuid[],text,integer)'::regprocedure
  ),
  'active_plan_duration_guard_present', (
    SELECT prosrc LIKE '%is_active = true AND duration_days > 0%'
      AND prosrc LIKE '%p_duration_days > v_plan_days%'
    FROM pg_proc WHERE oid='public.bulk_grant_student_subscription(uuid[],text,integer)'::regprocedure
  ),
  'active_student_roster_guard_present', (
    SELECT prosrc LIKE '%role = ''student'' AND account_status = ''active''%'
      AND prosrc LIKE '%v_count <> v_requested%'
      AND prosrc LIKE '%ORDER BY id FOR SHARE%'
    FROM pg_proc WHERE oid='public.bulk_grant_student_subscription(uuid[],text,integer)'::regprocedure
  ),
  'super_admin_helper_still_checks_active_profile', (
    SELECT prosrc LIKE '%role = ''admin''%' AND prosrc LIKE '%admin_role = ''super_admin''%'
      AND prosrc LIKE '%account_status = ''active''%'
    FROM pg_proc WHERE oid='public.is_management_super_admin()'::regprocedure
  )
) AS bulk_grant_security;