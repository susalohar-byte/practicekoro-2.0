BEGIN;
DROP POLICY IF EXISTS upload_limits_service_only ON public.image_upload_limits;
CREATE POLICY upload_limits_service_only ON public.image_upload_limits
FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMIT;
