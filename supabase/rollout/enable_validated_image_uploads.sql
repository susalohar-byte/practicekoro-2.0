-- Apply ONLY after the matching frontend deployment is verified.
-- Old clients uploading directly to Storage will then be rejected intentionally.
BEGIN;
DROP POLICY IF EXISTS validated_raster_insert_only ON storage.objects;
CREATE POLICY validated_raster_insert_only ON storage.objects AS RESTRICTIVE FOR INSERT TO anon,authenticated
WITH CHECK(bucket_id NOT IN ('avatars','question-images','banners'));
DROP POLICY IF EXISTS validated_raster_update_only ON storage.objects;
CREATE POLICY validated_raster_update_only ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon,authenticated
USING(bucket_id NOT IN ('avatars','question-images','banners')) WITH CHECK(bucket_id NOT IN ('avatars','question-images','banners'));
COMMIT;
