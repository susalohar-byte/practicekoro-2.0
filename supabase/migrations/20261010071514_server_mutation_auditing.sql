-- Issue 6: append-only, transactionally generated mutation audit, without sensitive row values.
BEGIN;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.admin_audit_logs FROM anon,authenticated;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_logs'
 LOOP EXECUTE format('REVOKE INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.admin_audit_logs FROM anon,authenticated',c.column_name,c.column_name,c.column_name); END LOOP;
END $$;
DROP POLICY IF EXISTS server_audit_read ON public.admin_audit_logs;
CREATE POLICY server_audit_read ON public.admin_audit_logs AS RESTRICTIVE FOR SELECT TO authenticated USING(public.admin_scope_allowed('super'));
CREATE OR REPLACE FUNCTION public.audit_privileged_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); actor_email text; actor_name text; actor_role text;
 row_data jsonb; old_data jsonb; fields jsonb; service_actor boolean:=coalesce(auth.role(),'')='service_role';
BEGIN
 IF service_actor THEN
   actor:=NULL; actor_email:='service_role'; actor_name:='Trusted backend'; actor_role:='service_role';
 ELSE
   SELECT p.email,p.full_name,p.admin_role INTO actor_email,actor_name,actor_role
   FROM public.profiles p WHERE p.id=actor AND p.role='admin' AND p.account_status='active'
     AND p.admin_role IN ('super_admin','content_writer','support_agent')
     AND EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id=p.id AND ur.role='admin');
   IF NOT FOUND THEN RETURN COALESCE(NEW,OLD); END IF;
 END IF;
 row_data:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 old_data:=CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
 IF TG_OP='UPDATE' AND row_data=old_data THEN RETURN NEW; END IF;
 SELECT coalesce(jsonb_agg(key ORDER BY key),'[]'::jsonb) INTO fields
 FROM jsonb_each(row_data) WHERE TG_OP<>'UPDATE' OR value IS DISTINCT FROM old_data->key;
 INSERT INTO public.admin_audit_logs(admin_id,admin_email,admin_name,admin_role,action,entity_type,entity_id,details)
 VALUES(actor,coalesce(actor_email,'unknown'),actor_name,actor_role,lower(TG_OP),TG_TABLE_NAME,
   coalesce(row_data->>'id',row_data->>'user_id',row_data->>'test_id'),
   jsonb_build_object('source','database_trigger','schema',TG_TABLE_SCHEMA,'version',1,'changed_fields',fields,'actor_kind',CASE WHEN service_actor THEN 'service' ELSE 'staff' END));
 RETURN COALESCE(NEW,OLD);
END $$;
REVOKE ALL ON FUNCTION public.audit_privileged_mutation() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','user_roles','payments','subscriptions','subscription_plans','coupons',
 'blog_posts','hero_banners','cutoff_records','exam_cutoff_configs','student_notes','student_batches','student_batch_members','payment_gateways','app_settings','exams','subjects','chapters','questions',
 'test_attempts','test_results','attempt_answers','live_test_participants','exam_categories','test_series','tests','live_tests','test_questions','test_exams','exam_topics','notifications','support_tickets']
 LOOP
   IF to_regclass('public.'||t) IS NOT NULL THEN
     EXECUTE format('DROP TRIGGER IF EXISTS audit_privileged_mutation ON public.%I',t);
     EXECUTE format('CREATE TRIGGER audit_privileged_mutation BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_privileged_mutation()',t);
   END IF;
 END LOOP;
END $$;
DROP TRIGGER IF EXISTS audit_privileged_mutation ON storage.objects;
CREATE TRIGGER audit_privileged_mutation BEFORE INSERT OR UPDATE OR DELETE ON storage.objects
FOR EACH ROW EXECUTE FUNCTION public.audit_privileged_mutation();
COMMIT;
