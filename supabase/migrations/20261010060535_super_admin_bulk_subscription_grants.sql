-- Security issue #2 only. Replaces the bulk-grant RPC, without modifying history.
BEGIN;

CREATE OR REPLACE FUNCTION public.bulk_grant_student_subscription(
  p_user_ids uuid[], p_plan_id text, p_duration_days integer
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_count integer;
  v_requested integer;
  v_plan_days integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_management_super_admin() THEN
    RAISE EXCEPTION 'Active Super Admin privileges are required'
      USING ERRCODE = '42501';
  END IF;

  v_requested := cardinality(p_user_ids);
  IF p_user_ids IS NULL OR array_ndims(p_user_ids) IS DISTINCT FROM 1
      OR v_requested NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Provide a one-dimensional roster of 1–100 student IDs'
      USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_user_ids) AS selected(id) WHERE id IS NULL)
      OR (SELECT count(DISTINCT id) FROM unnest(p_user_ids) AS selected(id)) <> v_requested THEN
    RAISE EXCEPTION 'Student IDs must be non-null and unique'
      USING ERRCODE = '22023';
  END IF;

  SELECT duration_days INTO v_plan_days
  FROM public.subscription_plans
  WHERE id = p_plan_id AND is_active = true AND duration_days > 0
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'An active plan with a positive duration is required'
      USING ERRCODE = '22023';
  END IF;
  IF p_duration_days IS NULL OR p_duration_days < 1 OR p_duration_days > v_plan_days THEN
    RAISE EXCEPTION 'Grant duration must be between 1 and the configured plan duration'
      USING ERRCODE = '22023';
  END IF;

  -- Lock in stable order, keeping recipients active students until the grant commits.
  -- Validate the entire roster before inserting anything: mixed invalid batches fail.
  PERFORM id FROM public.profiles
  WHERE id = ANY(p_user_ids) AND role = 'student' AND account_status = 'active'
  ORDER BY id FOR SHARE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> v_requested THEN
    RAISE EXCEPTION 'Every recipient must be an existing active student'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.subscriptions(user_id, plan_id, status, starts_at, expires_at)
  SELECT id, p_plan_id, 'active', now(), now() + make_interval(days => p_duration_days)
  FROM unnest(p_user_ids) AS selected(id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Role membership alone is not sufficient; the function checks the live profile.
-- Service payment activation uses separate RPCs and does not need this admin endpoint.
REVOKE ALL ON FUNCTION public.bulk_grant_student_subscription(uuid[], text, integer)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_grant_student_subscription(uuid[], text, integer)
  TO authenticated;

COMMIT;