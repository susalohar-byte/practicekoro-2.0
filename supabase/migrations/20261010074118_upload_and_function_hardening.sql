BEGIN;
ALTER FUNCTION public.has_test_access(uuid,text) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.sync_question_topic_chapter() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.enforce_student_role_security() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.create_razorpay_order(text) SET search_path = pg_catalog, public, pg_temp;

-- Existing objects/public reads/ownership policies remain unchanged. New SVG uploads are rejected.
UPDATE storage.buckets SET file_size_limit=2097152,allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp'] WHERE id='avatars';
UPDATE storage.buckets SET file_size_limit=5242880,allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp'] WHERE id='question-images';
UPDATE storage.buckets SET file_size_limit=10485760,allowed_mime_types=ARRAY['image/png','image/jpeg','image/webp','image/gif'] WHERE id='banners';

CREATE TABLE IF NOT EXISTS public.image_upload_limits(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,window_start timestamptz NOT NULL,request_count integer NOT NULL CHECK(request_count BETWEEN 1 AND 10));
ALTER TABLE public.image_upload_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.image_upload_limits FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.image_upload_limits TO service_role;
CREATE OR REPLACE FUNCTION public.take_image_upload_slot(p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE claimed uuid; v_window timestamptz:=date_trunc('minute',now());
BEGIN
 IF coalesce(auth.role(),'')<>'service_role' OR p_user_id IS NULL THEN RAISE EXCEPTION 'Service access required' USING ERRCODE='42501'; END IF;
 INSERT INTO public.image_upload_limits(user_id,window_start,request_count) VALUES(p_user_id,v_window,1)
 ON CONFLICT(user_id) DO UPDATE SET window_start=EXCLUDED.window_start,
 request_count=CASE WHEN image_upload_limits.window_start<v_window THEN 1 ELSE image_upload_limits.request_count+1 END
 WHERE image_upload_limits.window_start<v_window OR image_upload_limits.request_count<10 RETURNING user_id INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.take_image_upload_slot(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.take_image_upload_slot(uuid) TO service_role;

COMMIT;
