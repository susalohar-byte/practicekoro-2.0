-- Apply only after review/staging. Never cascade-delete linked learning/history data.
BEGIN;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subtopic text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_link text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS short_name text;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS icon_name text;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS parent_id text;
ALTER TABLE public.test_series ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.test_series ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.test_series ADD COLUMN IF NOT EXISTS banner_url text;
CREATE TABLE IF NOT EXISTS public.exam_cutoff_configs (
    exam_id TEXT PRIMARY KEY REFERENCES public.exams(id) ON DELETE CASCADE,
    category_enabled BOOLEAN DEFAULT true,
    gender_enabled BOOLEAN DEFAULT false,
    district_enabled BOOLEAN DEFAULT false,
    stage_enabled BOOLEAN DEFAULT true,
    allowed_stages JSONB DEFAULT '["Preliminary", "Written Examination", "Final Merit"]'::jsonb,
    default_score_type TEXT DEFAULT 'raw_marks',
    default_max_marks NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on exam_cutoff_configs
ALTER TABLE public.exam_cutoff_configs ENABLE ROW LEVEL SECURITY;



-- 5. Create Structured Cutoff Records Table
CREATE TABLE IF NOT EXISTS public.cutoff_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    exam_title TEXT NOT NULL,
    year INT NOT NULL,
    stage TEXT NOT NULL,
    cutoff_type TEXT NOT NULL CHECK (cutoff_type IN ('OFFICIAL', 'EXPECTED')),
    category TEXT NOT NULL CHECK (category IN ('GEN', 'OBC_A', 'OBC_B', 'SC', 'ST', 'EWS', 'PWD', 'OTHER', 'NOT_SPECIFIED')),
    gender TEXT NOT NULL DEFAULT 'ALL' CHECK (gender IN ('ALL', 'MALE', 'FEMALE')),
    district TEXT DEFAULT 'ALL',
    score_type TEXT NOT NULL DEFAULT 'raw_marks',
    max_marks NUMERIC NOT NULL DEFAULT 100,
    cutoff_marks NUMERIC NOT NULL,
    percentage NUMERIC,
    negative_marking NUMERIC DEFAULT 0.25,
    source_type TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'Pending Verification' CHECK (verification_status IN ('Verified', 'Pending Verification')),
    verified_by TEXT,
    verified_date TIMESTAMPTZ,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE public.cutoff_records ADD COLUMN IF NOT EXISTS total_posts text;
ALTER TABLE public.cutoff_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.cutoff_records,public.exam_cutoff_configs TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.cutoff_records,public.exam_cutoff_configs TO authenticated;
DROP POLICY IF EXISTS cutoff_crud_read ON public.cutoff_records;
CREATE POLICY cutoff_crud_read ON public.cutoff_records FOR SELECT USING(status='active' OR public.is_management_super_admin());
DROP POLICY IF EXISTS cutoff_crud_manage ON public.cutoff_records;
CREATE POLICY cutoff_crud_manage ON public.cutoff_records FOR ALL TO authenticated USING(public.is_management_super_admin()) WITH CHECK(public.is_management_super_admin());
DROP POLICY IF EXISTS cutoff_config_read ON public.exam_cutoff_configs;
CREATE POLICY cutoff_config_read ON public.exam_cutoff_configs FOR SELECT USING(true);
DROP POLICY IF EXISTS cutoff_config_manage ON public.exam_cutoff_configs;
CREATE POLICY cutoff_config_manage ON public.exam_cutoff_configs FOR ALL TO authenticated USING(public.is_management_super_admin()) WITH CHECK(public.is_management_super_admin());

CREATE OR REPLACE FUNCTION public.admin_delete_record(p_table text, p_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_role text; v_table regclass; v_found text; v_fk record; v_join text; v_blocked boolean;
BEGIN
  SELECT admin_role INTO v_role FROM public.profiles WHERE id=auth.uid() AND role='admin' AND account_status='active';
  IF v_role IS NULL THEN RAISE EXCEPTION 'Active administrator privileges required' USING ERRCODE='42501'; END IF;
  IF p_table NOT IN ('exams','subjects','chapters','questions','tests','test_series','notifications','blog_posts','hero_banners','cutoff_records','coupons','subscription_plans','live_tests','test_attempts','exam_categories','student_notes') THEN
    RAISE EXCEPTION 'Unsupported deletion target' USING ERRCODE='42501';
  END IF;
  IF v_role <> 'super_admin' AND NOT (
    v_role='content_writer' AND p_table IN ('exams','subjects','chapters','questions','blog_posts')
    OR v_role='support_agent' AND p_table IN ('notifications','student_notes')) THEN
    RAISE EXCEPTION 'Your role cannot permanently delete this record' USING ERRCODE='42501';
  END IF;
  IF p_table='exam_categories' AND EXISTS(SELECT 1 FROM public.exams WHERE category=(SELECT name FROM public.exam_categories WHERE id=p_id)) THEN RAISE EXCEPTION 'This category is used by exams. Reassign them before deletion'; END IF;
  IF p_table='subscription_plans' AND p_id='plan_free' THEN RAISE EXCEPTION 'The required Free plan cannot be deleted'; END IF;
  v_table := to_regclass(format('public.%I',p_table));
  IF v_table IS NULL THEN RAISE EXCEPTION 'This feature requires its database migration'; END IF;
  EXECUTE format('SELECT id::text FROM %s WHERE id::text=$1 FOR UPDATE',v_table) INTO v_found USING p_id;
  IF v_found IS NULL THEN RAISE EXCEPTION 'Record not found; nothing was deleted' USING ERRCODE='P0002'; END IF;
  -- Lock prevents new FK references racing the dependency check. Existing child rows
  -- block deletion, regardless of CASCADE/SET NULL, preserving history/shared content.
  FOR v_fk IN SELECT oid,conrelid,conkey,confkey FROM pg_constraint WHERE contype='f' AND confrelid=v_table LOOP
    SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ' ORDER BY i.n) INTO v_join
    FROM generate_subscripts(v_fk.conkey,1) i(n)
    JOIN pg_attribute ca ON ca.attrelid=v_fk.conrelid AND ca.attnum=v_fk.conkey[i.n]
    JOIN pg_attribute pa ON pa.attrelid=v_table AND pa.attnum=v_fk.confkey[i.n];
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s c JOIN %s p ON %s WHERE p.id::text=$1)',v_fk.conrelid::regclass,v_table,v_join)
      INTO v_blocked USING p_id;
    IF v_blocked THEN RAISE EXCEPTION 'Cannot delete: linked records exist in %. Archive this item or explicitly unlink safe associations first.',v_fk.conrelid::regclass USING ERRCODE='23503'; END IF;
  END LOOP;
  EXECUTE format('DELETE FROM %s WHERE id::text=$1 RETURNING id::text',v_table) INTO v_found USING p_id;
  IF v_found IS NULL THEN RAISE EXCEPTION 'Deletion was not confirmed'; END IF;
  RETURN jsonb_build_object('success',true,'deleted_id',v_found);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_delete_record(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_record(text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_mutate_collection(p_collection text,p_action text,p_id text DEFAULT NULL,p_item jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_key text;v_list jsonb;v_row jsonb;v_next jsonb;v_id text;v_now text:=now()::text;v_role text;
BEGIN
 SELECT admin_role INTO v_role FROM public.profiles WHERE id=auth.uid() AND role='admin' AND account_status='active';
 IF v_role IS NULL OR v_role NOT IN ('super_admin','content_writer') THEN RAISE EXCEPTION 'Content-management privileges required' USING ERRCODE='42501'; END IF;
 v_key:=CASE p_collection WHEN 'banners' THEN 'banners_hero_list' WHEN 'blog' THEN 'blog_posts_list' END;
 IF v_key IS NULL THEN RAISE EXCEPTION 'Unsupported collection'; END IF;
 INSERT INTO public.app_settings(id,category,key,value,description) VALUES(v_key,'content',v_key,'[]'::jsonb,'Managed content collection') ON CONFLICT(id) DO NOTHING;
 SELECT value INTO v_list FROM public.app_settings WHERE id=v_key FOR UPDATE;
 IF jsonb_typeof(v_list)='string' THEN v_list:=(v_list#>>'{}')::jsonb; END IF;
 IF jsonb_typeof(v_list)<>'array' THEN RAISE EXCEPTION 'Content storage is invalid; restore it before editing'; END IF;
 IF p_action='create' THEN
   IF coalesce(length(trim(p_item->>'title')),0)=0 THEN RAISE EXCEPTION 'Title is required'; END IF;
   IF p_collection='blog' AND EXISTS(SELECT 1 FROM jsonb_array_elements(v_list) x WHERE x->>'slug'=p_item->>'slug') THEN RAISE EXCEPTION 'Blog slug already exists'; END IF;
   v_id:=gen_random_uuid()::text;v_row:=p_item||jsonb_build_object('id',v_id,'createdAt',v_now,'updatedAt',v_now);v_next:=v_list||jsonb_build_array(v_row);
 ELSIF p_action IN ('update','delete') THEN
   SELECT x INTO v_row FROM jsonb_array_elements(v_list) x WHERE x->>'id'=p_id;
   IF v_row IS NULL THEN RAISE EXCEPTION 'Record not found; nothing was changed' USING ERRCODE='P0002'; END IF;
   v_row:=v_row||p_item||jsonb_build_object('id',p_id,'updatedAt',v_now,'createdAt',v_row->>'createdAt');
   IF p_action='update' AND coalesce(length(trim(v_row->>'title')),0)=0 THEN RAISE EXCEPTION 'Title is required'; END IF;
   IF p_collection='blog' AND p_action='update' AND EXISTS(SELECT 1 FROM jsonb_array_elements(v_list) x WHERE x->>'slug'=v_row->>'slug' AND x->>'id'<>p_id) THEN RAISE EXCEPTION 'Blog slug already exists'; END IF;
   SELECT coalesce(jsonb_agg(CASE WHEN x->>'id'=p_id THEN v_row ELSE x END ORDER BY n),'[]'::jsonb) INTO v_next FROM jsonb_array_elements(v_list) WITH ORDINALITY a(x,n) WHERE p_action<>'delete' OR x->>'id'<>p_id;
 ELSIF p_action='reorder' AND p_collection='banners' THEN
   IF p_item->'ids' IS NULL OR jsonb_typeof(p_item->'ids')<>'array' OR jsonb_array_length(p_item->'ids')<>jsonb_array_length(v_list) OR (SELECT count(DISTINCT x) FROM jsonb_array_elements_text(p_item->'ids') x)<>jsonb_array_length(v_list) THEN RAISE EXCEPTION 'Refresh the list before reordering'; END IF;
   SELECT jsonb_agg(v||jsonb_build_object('displayOrder',n,'updatedAt',v_now) ORDER BY n) INTO v_next FROM jsonb_array_elements_text(p_item->'ids') WITH ORDINALITY a(id,n) JOIN LATERAL jsonb_array_elements(v_list) v ON v->>'id'=a.id;
   IF jsonb_array_length(coalesce(v_next,'[]'::jsonb))<>jsonb_array_length(v_list) THEN RAISE EXCEPTION 'Unknown reorder ID'; END IF;
 ELSE RAISE EXCEPTION 'Unsupported collection action'; END IF;
 v_next:=coalesce(v_next,'[]'::jsonb);
 UPDATE public.app_settings SET value=v_next,updated_at=now() WHERE id=v_key;
 RETURN jsonb_build_object('success',true,'record',v_row,'deleted_id',CASE WHEN p_action='delete' THEN p_id END,'records',v_next);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_mutate_collection(text,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_mutate_collection(text,text,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_mutate_admin_record(p_table text,p_delete boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin' AND account_status='active' AND (
 admin_role='super_admin' OR admin_role='content_writer' AND p_table IN ('exams','subjects','chapters','questions','exam_categories','test_series','tests','live_tests') AND (NOT p_delete OR p_table NOT IN ('tests','test_series','live_tests'))
 OR admin_role='support_agent' AND p_table IN ('notifications','support_tickets')));
$$;
DO $$ DECLARE v_table text; BEGIN
 FOREACH v_table IN ARRAY ARRAY['exams','subjects','chapters','questions','exam_categories','test_series','tests','live_tests','notifications','subscriptions','subscription_plans','coupons','app_settings','cutoff_records'] LOOP
 IF to_regclass(format('public.%I',v_table)) IS NOT NULL THEN
 EXECUTE format('DROP POLICY IF EXISTS admin_crud_insert_guard ON public.%I',v_table);
 EXECUTE format('CREATE POLICY admin_crud_insert_guard ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.can_mutate_admin_record(%L,false))',v_table,v_table);
 EXECUTE format('DROP POLICY IF EXISTS admin_crud_update_guard ON public.%I',v_table);
 EXECUTE format('CREATE POLICY admin_crud_update_guard ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.can_mutate_admin_record(%L,false)) WITH CHECK(public.can_mutate_admin_record(%L,false))',v_table,v_table,v_table);
 EXECUTE format('DROP POLICY IF EXISTS admin_crud_delete_guard ON public.%I',v_table);
 EXECUTE format('CREATE POLICY admin_crud_delete_guard ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING(public.can_mutate_admin_record(%L,true))',v_table,v_table);
 END IF;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.admin_save_exam_topics(p_exam_id text,p_topic_ids text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_mutate_admin_record('exams') THEN RAISE EXCEPTION 'Exam-management privileges required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.exams WHERE id=p_exam_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Exam not found'; END IF;
 IF p_topic_ids IS NULL OR cardinality(p_topic_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_topic_ids)x) OR EXISTS(SELECT 1 FROM unnest(p_topic_ids)x WHERE NOT EXISTS(SELECT 1 FROM public.chapters WHERE id=x)) THEN RAISE EXCEPTION 'Invalid topic IDs'; END IF;
 DELETE FROM public.exam_topics WHERE exam_id=p_exam_id;
 INSERT INTO public.exam_topics(exam_id,topic_id,order_index) SELECT p_exam_id,x,n FROM unnest(p_topic_ids) WITH ORDINALITY a(x,n);
 RETURN jsonb_build_object('success',true,'saved_count',coalesce(cardinality(p_topic_ids),0));
END;$$;
REVOKE ALL ON FUNCTION public.admin_save_exam_topics(text,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_save_exam_topics(text,text[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_update_app_settings(p_settings jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_item jsonb;v_count integer:=0;
BEGIN
 IF NOT public.is_management_super_admin() THEN RAISE EXCEPTION 'Active Super Admin privileges required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_settings)<>'array' THEN RAISE EXCEPTION 'Settings must be an array'; END IF;
 FOR v_item IN SELECT * FROM jsonb_array_elements(p_settings) LOOP
 IF coalesce(length(trim(v_item->>'id')),0)=0 THEN RAISE EXCEPTION 'Setting ID required'; END IF;
 IF (v_item->>'id') ~* '(secret|password|service.role|private.key)' THEN RAISE EXCEPTION 'Credentials must be configured server-side, not in app_settings'; END IF;
 INSERT INTO public.app_settings(id,category,key,value,description,updated_at) VALUES(v_item->>'id',coalesce(v_item->>'category','general'),coalesce(v_item->>'key',v_item->>'id'),v_item->'value',v_item->>'description',now())
 ON CONFLICT(id) DO UPDATE SET value=excluded.value,category=excluded.category,key=excluded.key,description=excluded.description,updated_at=now();v_count:=v_count+1;
 END LOOP;
 RETURN jsonb_build_object('success',true,'updated_count',v_count);
END;$$;
REVOKE ALL ON FUNCTION public.admin_update_app_settings(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_update_app_settings(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_modify_subscription(p_id text,p_action text,p_days integer DEFAULT NULL,p_plan_id text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE v_id text;v_exp timestamptz; BEGIN
IF NOT public.is_management_super_admin() THEN RAISE EXCEPTION 'Active Super Admin privileges required' USING ERRCODE='42501'; END IF;
SELECT id::text,expires_at INTO v_id,v_exp FROM public.subscriptions WHERE id::text=p_id FOR UPDATE;
IF v_id IS NULL THEN RAISE EXCEPTION 'Subscription not found';END IF;
IF p_action='extend' THEN IF p_days IS NULL OR p_days<=0 THEN RAISE EXCEPTION 'Positive extension days required';END IF;v_exp:=greatest(coalesce(v_exp,now()),now())+p_days*interval '1 day';UPDATE public.subscriptions SET expires_at=v_exp,status='active' WHERE id::text=p_id;
ELSIF p_action='plan' THEN IF NOT EXISTS(SELECT 1 FROM public.subscription_plans WHERE id=p_plan_id AND is_active AND duration_days>0) THEN RAISE EXCEPTION 'Active plan required'; END IF;UPDATE public.subscriptions SET plan_id=p_plan_id WHERE id::text=p_id;
ELSE RAISE EXCEPTION 'Unsupported subscription action';END IF;RETURN jsonb_build_object('success',true,'id',v_id,'expires_at',v_exp);END;$$;
REVOKE ALL ON FUNCTION public.admin_modify_subscription(text,text,integer,text) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.admin_modify_subscription(text,text,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_save_test_exams(p_test_id text,p_exam_ids text[]) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
IF NOT public.can_mutate_admin_record('tests') THEN RAISE EXCEPTION 'Test-management privileges required' USING ERRCODE='42501';END IF;
PERFORM 1 FROM public.tests WHERE id=p_test_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Test not found';END IF;
IF p_exam_ids IS NULL OR cardinality(p_exam_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_exam_ids)x) OR EXISTS(SELECT 1 FROM unnest(p_exam_ids)x WHERE NOT EXISTS(SELECT 1 FROM public.exams WHERE id=x)) THEN RAISE EXCEPTION 'Invalid exam IDs';END IF;
DELETE FROM public.test_exams WHERE test_id=p_test_id;INSERT INTO public.test_exams(test_id,exam_id) SELECT p_test_id,x FROM unnest(p_exam_ids)x;RETURN jsonb_build_object('success',true,'saved_count',cardinality(p_exam_ids));END;$$;
REVOKE ALL ON FUNCTION public.admin_save_test_exams(text,text[]) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.admin_save_test_exams(text,text[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.save_test_questions(p_test_id text,p_questions jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE v_item jsonb;v_id uuid;v_count integer:=0;v_marks numeric;v_total numeric:=0; BEGIN
IF NOT public.can_mutate_admin_record('tests') THEN RAISE EXCEPTION 'Test-management privileges required' USING ERRCODE='42501';END IF;
PERFORM 1 FROM public.tests WHERE id=p_test_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Test not found';END IF;
IF p_questions IS NULL OR jsonb_typeof(p_questions)<>'array' THEN RAISE EXCEPTION 'Questions must be an array';END IF;
IF jsonb_array_length(p_questions)<>(SELECT count(DISTINCT x->>'question_id') FROM jsonb_array_elements(p_questions)x) THEN RAISE EXCEPTION 'Unique valid question IDs required';END IF;
DELETE FROM public.test_questions WHERE test_id=p_test_id;
FOR v_item IN SELECT * FROM jsonb_array_elements(p_questions) LOOP
v_id:=(v_item->>'question_id')::uuid;IF NOT EXISTS(SELECT 1 FROM public.questions WHERE id=v_id) THEN RAISE EXCEPTION 'Question not found';END IF;
v_marks:=coalesce((v_item->>'marks')::numeric,1);IF v_marks<0 THEN RAISE EXCEPTION 'Marks cannot be negative';END IF;
v_count:=v_count+1;INSERT INTO public.test_questions(test_id,question_id,question_order,marks,negative_marks) VALUES(p_test_id,v_id,v_count,v_marks,0);v_total:=v_total+v_marks;
END LOOP;
UPDATE public.tests SET total_questions=v_count,total_marks=v_total,updated_at=now() WHERE id=p_test_id;
RETURN jsonb_build_object('success',true,'test_id',p_test_id,'total_questions',v_count,'total_marks',v_total);END;$$;
REVOKE ALL ON FUNCTION public.save_test_questions(text,jsonb) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.save_test_questions(text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_assign_series_tests(p_ids text[],p_series_id text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE v_count integer; BEGIN
IF NOT public.can_mutate_admin_record('tests') THEN RAISE EXCEPTION 'Test-management privileges required' USING ERRCODE='42501';END IF;
IF p_ids IS NULL OR cardinality(p_ids)<>(SELECT count(DISTINCT x) FROM unnest(p_ids)x) THEN RAISE EXCEPTION 'Unique test IDs required';END IF;
IF p_series_id IS NOT NULL THEN PERFORM 1 FROM public.test_series WHERE id=p_series_id FOR KEY SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Series not found';END IF;END IF;
PERFORM 1 FROM public.tests WHERE id=ANY(p_ids) ORDER BY id FOR UPDATE;
SELECT count(*) INTO v_count FROM public.tests WHERE id=ANY(p_ids);IF v_count<>cardinality(p_ids) THEN RAISE EXCEPTION 'One or more tests no longer exist';END IF;
UPDATE public.tests SET test_series_id=p_series_id,updated_at=now() WHERE id=ANY(p_ids);
RETURN jsonb_build_object('success',true,'saved_ids',to_jsonb(p_ids));END;$$;
REVOKE ALL ON FUNCTION public.admin_assign_series_tests(text[],text) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.admin_assign_series_tests(text[],text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_targeted_notification(p_title text,p_message text,p_channel text,p_user_ids uuid[]) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE v_id uuid; BEGIN
IF NOT public.can_mutate_admin_record('notifications') THEN RAISE EXCEPTION 'Notification-management privileges required' USING ERRCODE='42501';END IF;
IF p_channel<>'in_app' OR p_channel IS NULL THEN RAISE EXCEPTION 'External email/push delivery is not configured';END IF;
IF coalesce(length(trim(p_title)),0)=0 OR coalesce(length(trim(p_message)),0)=0 OR p_user_ids IS NULL OR cardinality(p_user_ids)=0 THEN RAISE EXCEPTION 'Title, message and recipients required';END IF;
IF EXISTS(SELECT 1 FROM unnest(p_user_ids)x WHERE NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=x AND role='student' AND account_status='active')) THEN RAISE EXCEPTION 'Active student recipients required';END IF;
INSERT INTO public.notifications(title,message,target_audience,channel,status,sent_at,created_by,recipient_ids) VALUES(p_title,p_message,'selected','in_app','sent',now(),auth.uid(),p_user_ids) RETURNING id INTO v_id;RETURN v_id;END;$$;
REVOKE ALL ON FUNCTION public.create_targeted_notification(text,text,text,uuid[]) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.create_targeted_notification(text,text,text,uuid[]) TO authenticated;

DO $$ BEGIN IF to_regclass('public.student_notes') IS NOT NULL THEN
DROP POLICY IF EXISTS student_notes_role_guard ON public.student_notes;
CREATE POLICY student_notes_role_guard ON public.student_notes AS RESTRICTIVE FOR ALL TO authenticated USING(public.can_mutate_admin_record('support_tickets')) WITH CHECK(public.can_mutate_admin_record('support_tickets'));
DROP POLICY IF EXISTS student_notes_author_guard ON public.student_notes;
CREATE POLICY student_notes_author_guard ON public.student_notes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(author_id=auth.uid());
END IF;END;$$;

NOTIFY pgrst,'reload schema';
COMMIT;
