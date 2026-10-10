BEGIN;
-- No existing provider credentials were found in these two legacy rows.
ALTER TABLE public.app_settings ADD CONSTRAINT no_browser_provider_credentials CHECK (id NOT IN ('gateway_fast2sms_api_key','gateway_fcm_server_key'));
CREATE TABLE public.notification_gateway_requests(id uuid PRIMARY KEY,actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,action text NOT NULL CHECK(action IN ('balance','sms','push')),created_at timestamptz NOT NULL DEFAULT now(),outcome text NOT NULL DEFAULT 'started' CHECK(outcome IN ('started','accepted','unconfirmed')),provider_reference text);
CREATE INDEX notification_gateway_actor_time ON public.notification_gateway_requests(actor_id,created_at);
ALTER TABLE public.notification_gateway_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_gateway_requests FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.notification_gateway_requests TO service_role;
CREATE POLICY notification_gateway_service_only ON public.notification_gateway_requests FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE FUNCTION public.start_notification_gateway_request(p_actor uuid,p_request_id uuid,p_action text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service access required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text,4109));
 IF (SELECT count(*) FROM public.notification_gateway_requests WHERE actor_id=p_actor AND created_at>now()-interval '1 minute')>=5 THEN RETURN false;END IF;
 INSERT INTO public.notification_gateway_requests(id,actor_id,action) VALUES(p_request_id,p_actor,p_action) ON CONFLICT(id) DO NOTHING;
 RETURN FOUND;
END;$$;
REVOKE ALL ON FUNCTION public.start_notification_gateway_request(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.start_notification_gateway_request(uuid,uuid,text) TO service_role;
COMMIT;
