-- Issue #3 only: auth.users is the source of truth for account identity email.
-- No existing profiles or staff roles are changed by this migration.
BEGIN;

CREATE FUNCTION public.guard_profile_identity_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile requires an existing Auth identity' USING ERRCODE = '42501';
  END IF;
  IF lower(coalesce(btrim(NEW.email), '')) IS DISTINCT FROM lower(coalesce(btrim(v_email), '')) THEN
    RAISE EXCEPTION 'Profile email must match Auth identity; use the verified Auth email-change flow'
      USING ERRCODE = '42501';
  END IF;
  NEW.email := coalesce(v_email, '');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_identity_email() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_guard_profile_identity_email
  BEFORE INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_identity_email();

-- Pending email-change requests do not change auth.users.email. Only the actual
-- Auth identity change is mirrored; it never grants or changes administrative roles.
CREATE FUNCTION public.sync_profile_email_from_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.profiles SET email = coalesce(NEW.email, '')
  WHERE id = NEW.id AND email IS DISTINCT FROM coalesce(NEW.email, '');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_profile_email_from_auth() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_sync_profile_email_from_auth
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

CREATE OR REPLACE FUNCTION public.update_admin_staff_role(p_user_id uuid, p_admin_role text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_profile public.profiles; v_auth_email text;
BEGIN
  IF NOT public.is_management_super_admin() THEN
    RAISE EXCEPTION 'Only active super admins can manage staff' USING ERRCODE = '42501';
  END IF;
  IF p_admin_role IS NULL OR p_admin_role NOT IN ('super_admin', 'content_writer', 'support_agent') THEN
    RAISE EXCEPTION 'Invalid staff role' USING ERRCODE = '22023';
  END IF;
  -- Lock Auth before profiles, matching the Auth email-sync trigger's lock order.
  SELECT email INTO v_auth_email FROM auth.users
  WHERE id = p_user_id AND email IS NOT NULL AND email_confirmed_at IS NOT NULL
    AND (banned_until IS NULL OR banned_until <= now())
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'A verified, non-banned Auth email identity is required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registered account not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_profile.account_status IS DISTINCT FROM 'active'
      OR v_profile.email IS DISTINCT FROM v_auth_email THEN
    RAISE EXCEPTION 'An active profile matching the verified Auth identity is required'
      USING ERRCODE = '42501';
  END IF;
  IF p_admin_role = 'super_admin' AND lower(v_auth_email) <> 'admin@practicekoro.online' THEN
    RAISE EXCEPTION 'Only the primary platform account can be Super Admin' USING ERRCODE = '42501';
  END IF;
  IF lower(v_auth_email) = 'admin@practicekoro.online' AND p_admin_role <> 'super_admin' THEN
    RAISE EXCEPTION 'The primary Super Admin cannot be demoted' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES(p_user_id, 'admin')
    ON CONFLICT(user_id, role) DO NOTHING;
  UPDATE public.profiles SET role = 'admin', admin_role = p_admin_role, updated_at = now()
  WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'admin_role', p_admin_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_admin_staff_by_email(p_email text, p_admin_role text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid; v_profile public.profiles;
BEGIN
  IF NOT public.is_management_super_admin() THEN
    RAISE EXCEPTION 'Only active super admins can manage staff' USING ERRCODE = '42501';
  END IF;
  IF p_email IS NULL OR btrim(p_email) = '' OR length(p_email) > 254 THEN
    RAISE EXCEPTION 'Provide a verified registered account email' USING ERRCODE = '22023';
  END IF;
  BEGIN
    SELECT id INTO STRICT v_id FROM auth.users
    WHERE lower(email) = lower(btrim(p_email)) AND email_confirmed_at IS NOT NULL
      AND (banned_until IS NULL OR banned_until <= now())
    FOR UPDATE;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE EXCEPTION 'No verified registered account found for that email' USING ERRCODE = 'P0002';
    WHEN TOO_MANY_ROWS THEN
      RAISE EXCEPTION 'Ambiguous Auth email identity; staff assignment refused' USING ERRCODE = '42501';
  END;
  PERFORM public.update_admin_staff_role(v_id, p_admin_role);
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_id;
  RETURN jsonb_build_object('success', true, 'member', to_jsonb(v_profile));
END;
$$;

REVOKE ALL ON FUNCTION public.assign_admin_staff_by_email(text,text),
  public.update_admin_staff_role(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_admin_staff_by_email(text,text),
  public.update_admin_staff_role(uuid,text) TO authenticated;

COMMIT;