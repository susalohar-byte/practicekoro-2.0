-- Issue 5: restrictive sub-role authorization; existing permissive policies cannot bypass it.
BEGIN;
CREATE OR REPLACE FUNCTION public.admin_scope_allowed(p_scope text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid()
   AND p.role='admin' AND p.account_status='active'
   AND EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=p.id AND ur.role='admin')
   AND (p.admin_role='super_admin' AND p_scope IN ('super','content','support')
     OR p.admin_role='content_writer' AND p_scope='content'
     OR p.admin_role='support_agent' AND p_scope='support'));
$$;
REVOKE ALL ON FUNCTION public.admin_scope_allowed(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_scope_allowed(text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.archive_test(p_test_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id UUID;
BEGIN
  IF NOT public.admin_scope_allowed('super') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

    v_user_id := auth.uid();
    IF v_user_id IS NULL OR NOT public.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '40300';
    END IF;

    UPDATE public.tests
    SET status = 'archived',
        updated_at = NOW()
    WHERE id = p_test_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test not found' USING ERRCODE = '40400';
    END IF;

    RETURN jsonb_build_object(
        'test_id', p_test_id,
        'status', 'archived',
        'message', 'Test archived successfully'
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_admin_payments(p_status text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_result JSONB;
BEGIN
  IF NOT public.admin_scope_allowed('super') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_agg(pay_row) INTO v_result
    FROM (
        SELECT pm.id, pm.user_id, p.full_name AS student_name, p.email AS student_email,
            pm.plan_id, pl.title AS plan_title, pm.amount, pm.currency, pm.gateway,
            pm.order_id, pm.razorpay_order_id, pm.transaction_id, pm.razorpay_payment_id,
            pm.status, pm.refund_id, pm.refund_amount, pm.refund_reason, pm.refunded_at,
            pm.created_at
        FROM public.payments pm
        LEFT JOIN public.profiles p ON pm.user_id = p.id
        LEFT JOIN public.subscription_plans pl ON pm.plan_id = pl.id
        WHERE (p_status IS NULL OR pm.status = p_status)
          AND (
              p_search IS NULL
              OR pm.order_id ILIKE '%' || p_search || '%'
              OR pm.razorpay_payment_id ILIKE '%' || p_search || '%'
              OR p.full_name ILIKE '%' || p_search || '%'
              OR p.email ILIKE '%' || p_search || '%'
          )
        ORDER BY pm.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) pay_row;

    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_admin_subscriptions(p_status text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_result JSONB;
BEGIN
  IF NOT public.admin_scope_allowed('super') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

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
$function$
;
CREATE OR REPLACE FUNCTION public.get_admin_students(p_search text DEFAULT NULL::text, p_plan text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, email text, phone text, avatar_url text, created_at timestamp with time zone, plan_title text, plan_id text, subscription_status text, is_pro boolean, expires_at timestamp with time zone, total_attempts bigint, last_active timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.admin_scope_allowed('super') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '40300';
    END IF;

    RETURN QUERY
    WITH student_active_sub AS (
        SELECT DISTINCT ON (s.user_id)
            s.user_id,
            s.plan_id,
            p.title AS plan_title,
            s.status,
            s.expires_at,
            (s.status = 'active' AND s.expires_at > NOW()) AS is_active_pro
        FROM public.subscriptions s
        JOIN public.subscription_plans p ON s.plan_id = p.id
        ORDER BY s.user_id, s.created_at DESC
    ),
    student_attempt_stats AS (
        SELECT
            ta.user_id,
            COUNT(ta.id) AS attempts_count,
            MAX(ta.created_at) AS last_attempt_time
        FROM public.test_attempts ta
        GROUP BY ta.user_id
    )
    SELECT
        pr.id,
        pr.full_name,
        pr.email,
        pr.phone,
        pr.avatar_url,
        pr.created_at,
        COALESCE(sub.plan_title, 'Free Plan') AS plan_title,
        COALESCE(sub.plan_id, 'plan_free') AS plan_id,
        CASE
            WHEN sub.is_active_pro THEN 'active'
            WHEN sub.status IS NOT NULL THEN sub.status
            ELSE 'none'
        END AS subscription_status,
        COALESCE(sub.is_active_pro, false) AS is_pro,
        sub.expires_at,
        COALESCE(att.attempts_count, 0) AS total_attempts,
        COALESCE(att.last_attempt_time, pr.updated_at, pr.created_at) AS last_active
    FROM public.profiles pr
    LEFT JOIN student_active_sub sub ON sub.user_id = pr.id
    LEFT JOIN student_attempt_stats att ON att.user_id = pr.id
    WHERE pr.role = 'student'
      AND (
          p_search IS NULL OR
          pr.full_name ILIKE '%' || p_search || '%' OR
          pr.email ILIKE '%' || p_search || '%' OR
          pr.phone ILIKE '%' || p_search || '%'
      )
      AND (
          p_plan IS NULL OR
          (p_plan = 'free' AND COALESCE(sub.is_active_pro, false) = false) OR
          (p_plan = 'pro' AND COALESCE(sub.is_active_pro, false) = true) OR
          sub.plan_id = p_plan
      )
      AND (
          p_status IS NULL OR
          (p_status = 'active' AND COALESCE(sub.is_active_pro, false) = true) OR
          (p_status = 'expired' AND sub.status = 'expired') OR
          (p_status = 'none' AND sub.status IS NULL)
      )
    ORDER BY pr.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.bulk_assign_students_to_batch(p_batch_id uuid, p_user_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_count INT;
BEGIN
  IF NOT public.admin_scope_allowed('super') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

    IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.student_batches WHERE id = p_batch_id AND is_active) THEN
        RAISE EXCEPTION 'Student batch not found or inactive';
    END IF;

    INSERT INTO public.student_batch_members (batch_id, user_id, assigned_by)
    SELECT p_batch_id, user_id, auth.uid()
    FROM unnest(p_user_ids) AS selected(user_id)
    ON CONFLICT (batch_id, user_id) DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.admin_get_payment_gateway(p_gateway text DEFAULT 'razorpay'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_target text := lower(trim(coalesce(p_gateway,'razorpay')));
        v_key text; v_active boolean; v_updated timestamptz;
BEGIN
  IF NOT public.admin_scope_allowed('super') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

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
$function$
;
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_counts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id UUID;
    v_counts JSONB;
BEGIN
  IF NOT public.admin_scope_allowed('content') THEN RAISE EXCEPTION 'Insufficient active staff permissions' USING ERRCODE='42501'; END IF;

    v_user_id := auth.uid();
    IF v_user_id IS NULL OR NOT public.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '40300';
    END IF;

    SELECT jsonb_build_object(
        'total_exams', (SELECT COUNT(*) FROM public.exams),
        'active_exams', (SELECT COUNT(*) FROM public.exams WHERE is_active = true),
        'total_subjects', (SELECT COUNT(*) FROM public.subjects),
        'total_chapters', (SELECT COUNT(*) FROM public.chapters),
        'total_test_series', (SELECT COUNT(*) FROM public.test_series),
        'total_tests', (SELECT COUNT(*) FROM public.tests),
        'published_tests', (SELECT COUNT(*) FROM public.tests WHERE status = 'published' AND is_active = true),
        'draft_tests', (SELECT COUNT(*) FROM public.tests WHERE status = 'draft'),
        'archived_tests', (SELECT COUNT(*) FROM public.tests WHERE status = 'archived' OR is_active = false),
        'total_questions', (SELECT COUNT(*) FROM public.questions),
        'active_questions', (SELECT COUNT(*) FROM public.questions WHERE is_active = true),
        'total_attempts', (SELECT COUNT(*) FROM public.test_attempts),
        'completed_attempts', (SELECT COUNT(*) FROM public.test_attempts WHERE status = 'completed'),
        'total_students', (SELECT COUNT(*) FROM public.profiles WHERE role = 'student')
    ) INTO v_counts;

    RETURN v_counts;
END;
$function$
;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname=ANY(ARRAY['archive_test','get_admin_payments','get_admin_subscriptions','get_admin_students','bulk_assign_students_to_batch','admin_get_payment_gateway','get_admin_dashboard_counts'])
 LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f.signature);
 EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END LOOP;
END $$;
DROP POLICY IF EXISTS staff_read_scope ON public.profiles;
CREATE POLICY staff_read_scope ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated USING (id=auth.uid() OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_read_scope ON public.payments;
CREATE POLICY staff_read_scope ON public.payments AS RESTRICTIVE FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_read_scope ON public.subscriptions;
CREATE POLICY staff_read_scope ON public.subscriptions AS RESTRICTIVE FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_read_scope ON public.user_roles;
CREATE POLICY staff_read_scope ON public.user_roles AS RESTRICTIVE FOR SELECT TO authenticated USING (user_id=auth.uid() OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_management_scope ON public.student_batches;
CREATE POLICY staff_management_scope ON public.student_batches AS RESTRICTIVE FOR ALL TO authenticated USING (public.admin_scope_allowed('super')) WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_management_scope ON public.student_batch_members;
CREATE POLICY staff_management_scope ON public.student_batch_members AS RESTRICTIVE FOR ALL TO authenticated USING (public.admin_scope_allowed('super')) WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_management_scope ON public.payment_gateways;
CREATE POLICY staff_management_scope ON public.payment_gateways AS RESTRICTIVE FOR ALL TO authenticated USING (public.admin_scope_allowed('super')) WITH CHECK (public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_content_insert ON public.test_questions;
CREATE POLICY staff_content_insert ON public.test_questions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_update ON public.test_questions;
CREATE POLICY staff_content_update ON public.test_questions AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.admin_scope_allowed('content')) WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_delete ON public.test_questions;
CREATE POLICY staff_content_delete ON public.test_questions AS RESTRICTIVE FOR DELETE TO authenticated USING (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_insert ON public.test_exams;
CREATE POLICY staff_content_insert ON public.test_exams AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_update ON public.test_exams;
CREATE POLICY staff_content_update ON public.test_exams AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.admin_scope_allowed('content')) WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_delete ON public.test_exams;
CREATE POLICY staff_content_delete ON public.test_exams AS RESTRICTIVE FOR DELETE TO authenticated USING (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_insert ON public.exam_topics;
CREATE POLICY staff_content_insert ON public.exam_topics AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_update ON public.exam_topics;
CREATE POLICY staff_content_update ON public.exam_topics AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.admin_scope_allowed('content')) WITH CHECK (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_delete ON public.exam_topics;
CREATE POLICY staff_content_delete ON public.exam_topics AS RESTRICTIVE FOR DELETE TO authenticated USING (public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_attempt_read ON public.test_attempts;
CREATE POLICY staff_attempt_read ON public.test_attempts AS RESTRICTIVE FOR SELECT TO authenticated USING ((user_id=auth.uid()) OR public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_attempt_insert ON public.test_attempts;
CREATE POLICY staff_attempt_insert ON public.test_attempts AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ((user_id=auth.uid()) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_update ON public.test_attempts;
CREATE POLICY staff_attempt_update ON public.test_attempts AS RESTRICTIVE FOR UPDATE TO authenticated USING ((user_id=auth.uid()) OR public.admin_scope_allowed('super')) WITH CHECK ((user_id=auth.uid()) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_delete ON public.test_attempts;
CREATE POLICY staff_attempt_delete ON public.test_attempts AS RESTRICTIVE FOR DELETE TO authenticated USING ((user_id=auth.uid()) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_read ON public.test_results;
CREATE POLICY staff_attempt_read ON public.test_results AS RESTRICTIVE FOR SELECT TO authenticated USING ((user_id=auth.uid()) OR public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_attempt_insert ON public.test_results;
CREATE POLICY staff_attempt_insert ON public.test_results AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ((user_id=auth.uid()) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_update ON public.test_results;
CREATE POLICY staff_attempt_update ON public.test_results AS RESTRICTIVE FOR UPDATE TO authenticated USING ((user_id=auth.uid()) OR public.admin_scope_allowed('super')) WITH CHECK ((user_id=auth.uid()) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_delete ON public.test_results;
CREATE POLICY staff_attempt_delete ON public.test_results AS RESTRICTIVE FOR DELETE TO authenticated USING ((user_id=auth.uid()) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_read ON public.attempt_answers;
CREATE POLICY staff_attempt_read ON public.attempt_answers AS RESTRICTIVE FOR SELECT TO authenticated USING ((EXISTS(SELECT 1 FROM public.test_attempts a WHERE a.id=attempt_answers.attempt_id AND a.user_id=auth.uid())) OR public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_attempt_insert ON public.attempt_answers;
CREATE POLICY staff_attempt_insert ON public.attempt_answers AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS(SELECT 1 FROM public.test_attempts a WHERE a.id=attempt_answers.attempt_id AND a.user_id=auth.uid())) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_update ON public.attempt_answers;
CREATE POLICY staff_attempt_update ON public.attempt_answers AS RESTRICTIVE FOR UPDATE TO authenticated USING ((EXISTS(SELECT 1 FROM public.test_attempts a WHERE a.id=attempt_answers.attempt_id AND a.user_id=auth.uid())) OR public.admin_scope_allowed('super')) WITH CHECK ((EXISTS(SELECT 1 FROM public.test_attempts a WHERE a.id=attempt_answers.attempt_id AND a.user_id=auth.uid())) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_attempt_delete ON public.attempt_answers;
CREATE POLICY staff_attempt_delete ON public.attempt_answers AS RESTRICTIVE FOR DELETE TO authenticated USING ((EXISTS(SELECT 1 FROM public.test_attempts a WHERE a.id=attempt_answers.attempt_id AND a.user_id=auth.uid())) OR public.admin_scope_allowed('super'));
DROP POLICY IF EXISTS staff_live_scope ON public.live_test_participants;
CREATE POLICY staff_live_scope ON public.live_test_participants AS RESTRICTIVE FOR ALL TO authenticated USING (user_id=auth.uid() OR public.admin_scope_allowed('content')) WITH CHECK (user_id=auth.uid() OR public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_insert ON storage.objects;
CREATE POLICY staff_content_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (bucket_id NOT IN ('question-images','banners','popular-exams') OR public.admin_scope_allowed('content'));
DROP POLICY IF EXISTS staff_content_delete ON storage.objects;
CREATE POLICY staff_content_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING (bucket_id NOT IN ('question-images','banners','popular-exams') OR public.admin_scope_allowed('content'));
COMMIT;
