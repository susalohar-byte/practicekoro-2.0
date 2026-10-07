-- Persistent support conversations and fail-closed account/staff management.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'inactive'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_exam_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT;

CREATE OR REPLACE FUNCTION public.account_is_active(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND account_status = 'active');
$$;
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT public.account_is_active(p_user_id) AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = p_role)
    OR (p_role = 'admin' AND EXISTS (SELECT 1 FROM public.profiles
      WHERE id = p_user_id AND role = 'admin' AND admin_role IS NOT NULL))
  );
$$;
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_target_user UUID;
BEGIN
  -- Preserve the live API's default argument and caller scoping.
  IF auth.uid() IS NOT NULL THEN
    IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() AND public.has_role(auth.uid(), 'admin') THEN
      v_target_user := p_user_id;
    ELSE
      v_target_user := auth.uid();
    END IF;
  ELSE
    v_target_user := p_user_id;
  END IF;
  RETURN public.account_is_active(v_target_user) AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    JOIN public.subscription_plans p ON p.id = s.plan_id
    WHERE s.user_id = v_target_user AND s.status = 'active'
      AND s.starts_at <= NOW() AND s.expires_at > NOW() AND p.is_active = TRUE
  );
END;
$$;
CREATE OR REPLACE FUNCTION public.is_management_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
    AND role = 'admin' AND admin_role = 'super_admin' AND account_status = 'active');
$$;
CREATE OR REPLACE FUNCTION public.can_manage_support()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    AND admin_role IN ('super_admin', 'support_agent') AND account_status = 'active');
$$;
CREATE OR REPLACE FUNCTION public.guard_profile_management_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF OLD.account_status IS DISTINCT FROM NEW.account_status
      AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Account status must be changed through the secure management function' USING ERRCODE = '42501';
  END IF;
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.admin_role IS DISTINCT FROM NEW.admin_role)
      AND COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_management_super_admin() THEN
    RAISE EXCEPTION 'Only active super admins can change roles' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_guard_profile_management_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_management_fields BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_management_fields();

CREATE OR REPLACE FUNCTION public.update_admin_staff_role(p_user_id UUID, p_admin_role TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_profile public.profiles;
BEGIN
  IF NOT public.is_management_super_admin() THEN RAISE EXCEPTION 'Only active super admins can manage staff' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registered account not found' USING ERRCODE = 'P0002'; END IF;
  IF p_admin_role NOT IN ('super_admin', 'content_writer', 'support_agent') THEN RAISE EXCEPTION 'Invalid staff role'; END IF;
  IF p_admin_role = 'super_admin' AND LOWER(v_profile.email) <> 'admin@practicekoro.online' THEN
    RAISE EXCEPTION 'Only the primary platform account can be Super Admin' USING ERRCODE = '42501';
  END IF;
  IF LOWER(v_profile.email) = 'admin@practicekoro.online' AND p_admin_role <> 'super_admin' THEN
    RAISE EXCEPTION 'The primary Super Admin cannot be demoted' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES(p_user_id, 'admin') ON CONFLICT(user_id, role) DO NOTHING;
  UPDATE public.profiles SET role = 'admin', admin_role = p_admin_role, updated_at = NOW() WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'admin_role', p_admin_role);
END;
$$;
CREATE OR REPLACE FUNCTION public.assign_admin_staff_by_email(p_email TEXT, p_admin_role TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id UUID; v_profile public.profiles;
BEGIN
  IF NOT public.is_management_super_admin() THEN RAISE EXCEPTION 'Only active super admins can manage staff' USING ERRCODE = '42501'; END IF;
  SELECT id INTO v_id FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(p_email));
  IF v_id IS NULL THEN RAISE EXCEPTION 'No registered account found for that email' USING ERRCODE = 'P0002'; END IF;
  PERFORM public.update_admin_staff_role(v_id, p_admin_role);
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_id;
  RETURN jsonb_build_object('success', true, 'member', to_jsonb(v_profile));
END;
$$;
CREATE OR REPLACE FUNCTION public.remove_admin_staff_member(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_profile public.profiles;
BEGIN
  IF NOT public.is_management_super_admin() THEN RAISE EXCEPTION 'Only active super admins can manage staff' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id AND role = 'admin' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Staff account not found' USING ERRCODE = 'P0002'; END IF;
  IF p_user_id = auth.uid() OR LOWER(v_profile.email) = 'admin@practicekoro.online' THEN
    RAISE EXCEPTION 'Cannot remove yourself or the primary Super Admin' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES(p_user_id, 'student') ON CONFLICT(user_id, role) DO NOTHING;
  DELETE FROM public.user_roles WHERE user_id = p_user_id AND role <> 'student';
  UPDATE public.profiles SET role = 'student', admin_role = NULL, updated_at = NOW() WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
END;
$$;

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_kind TEXT NOT NULL CHECK(author_kind IN ('student', 'support', 'internal_note')),
  body TEXT NOT NULL CHECK(length(TRIM(body)) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Support staff can read messages" ON public.support_ticket_messages;
CREATE POLICY "Support staff can read messages" ON public.support_ticket_messages FOR SELECT TO authenticated USING(public.can_manage_support());
DROP POLICY IF EXISTS "Students read public ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Students read public ticket messages" ON public.support_ticket_messages FOR SELECT TO authenticated
  USING(author_kind <> 'internal_note' AND public.account_is_active(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid()));
GRANT SELECT ON public.support_ticket_messages TO authenticated;
GRANT UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;
DROP POLICY IF EXISTS "Admins can manage all support tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage all support tickets" ON public.support_tickets FOR ALL TO authenticated
  USING(public.can_manage_support()) WITH CHECK(public.can_manage_support());
DROP POLICY IF EXISTS "Students can view and create their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Students read their tickets" ON public.support_tickets;
CREATE POLICY "Students read their tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING(user_id = auth.uid() AND public.account_is_active(auth.uid()));

DROP POLICY IF EXISTS "Students insert their tickets" ON public.support_tickets;
CREATE POLICY "Students insert their tickets" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK(user_id = auth.uid() AND public.account_is_active(auth.uid())
    AND status = 'open' AND resolution_notes IS NULL AND assigned_to IS NULL);

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_student_name TEXT, p_student_email TEXT, p_subject TEXT, p_issue TEXT,
  p_category TEXT DEFAULT 'Other', p_priority TEXT DEFAULT 'medium', p_user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_owner UUID; v_name TEXT; v_email TEXT; v_ticket public.support_tickets;
BEGIN
  IF NOT public.account_is_active(auth.uid()) THEN RAISE EXCEPTION 'An active signed-in account is required' USING ERRCODE = '42501'; END IF;
  IF length(TRIM(p_subject)) = 0 OR length(TRIM(p_issue)) = 0 THEN RAISE EXCEPTION 'Subject and issue are required'; END IF;
  IF public.can_manage_support() THEN
    SELECT id, full_name, email INTO v_owner, v_name, v_email FROM public.profiles
      WHERE role = 'student' AND ((p_user_id IS NOT NULL AND id = p_user_id)
        OR (p_user_id IS NULL AND LOWER(email) = LOWER(TRIM(p_student_email)))) LIMIT 1;
    IF p_user_id IS NOT NULL AND v_owner IS NULL THEN RAISE EXCEPTION 'Student account not found'; END IF;
    v_name := COALESCE(v_name, NULLIF(TRIM(p_student_name), ''), 'Student');
    v_email := COALESCE(v_email, NULLIF(TRIM(p_student_email), ''));
  ELSE
    SELECT id, full_name, email INTO v_owner, v_name, v_email FROM public.profiles WHERE id = auth.uid() AND role = 'student';
    IF v_owner IS NULL OR (p_user_id IS NOT NULL AND p_user_id <> v_owner) THEN RAISE EXCEPTION 'Cannot create a ticket for another account' USING ERRCODE = '42501'; END IF;
  END IF;
  INSERT INTO public.support_tickets(user_id, student_name, student_email, subject, issue, category, priority, status)
    VALUES(v_owner, v_name, v_email, TRIM(p_subject), TRIM(p_issue), p_category, p_priority, 'open') RETURNING * INTO v_ticket;
  RETURN jsonb_build_object('success', true, 'ticket', to_jsonb(v_ticket));
END;
$$;
CREATE OR REPLACE FUNCTION public.send_support_ticket_message(p_ticket_id UUID, p_body TEXT, p_internal BOOLEAN DEFAULT FALSE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_ticket public.support_tickets; v_message public.support_ticket_messages; v_name TEXT;
BEGIN
  IF NOT public.can_manage_support() THEN RAISE EXCEPTION 'Only active support staff can reply' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_ticket FROM public.support_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found' USING ERRCODE = 'P0002'; END IF;
  IF NOT COALESCE(p_internal, FALSE) AND v_ticket.user_id IS NULL THEN RAISE EXCEPTION 'No student account is linked. A portal reply cannot be delivered.'; END IF;
  SELECT full_name INTO v_name FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.support_ticket_messages(ticket_id, author_id, author_name, author_kind, body)
    VALUES(p_ticket_id, auth.uid(), COALESCE(v_name, 'Support Team'), CASE WHEN p_internal THEN 'internal_note' ELSE 'support' END, TRIM(p_body)) RETURNING * INTO v_message;
  UPDATE public.support_tickets SET updated_at = NOW() WHERE id = p_ticket_id;
  RETURN jsonb_build_object('success', true, 'message', to_jsonb(v_message));
END;
$$;
REVOKE ALL ON FUNCTION public.assign_admin_staff_by_email(TEXT,TEXT), public.update_admin_staff_role(UUID,TEXT),
  public.remove_admin_staff_member(UUID), public.create_support_ticket(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,UUID),
  public.send_support_ticket_message(UUID,TEXT,BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_admin_staff_by_email(TEXT,TEXT), public.update_admin_staff_role(UUID,TEXT),
  public.remove_admin_staff_member(UUID), public.create_support_ticket(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,UUID),
  public.send_support_ticket_message(UUID,TEXT,BOOLEAN) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
