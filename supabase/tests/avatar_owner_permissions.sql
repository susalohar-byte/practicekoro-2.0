-- Read-only ownership verification; no storage objects are uploaded or changed.
SELECT jsonb_build_object(
  'owner_insert_policy', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can upload their own avatar' AND cmd='INSERT'
      AND with_check LIKE '%owner_id%' AND with_check LIKE '%auth.uid()%'
      AND with_check LIKE '%name ~~%'
  ),
  'owner_update_existing_and_replacement', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can update their own avatar' AND cmd='UPDATE'
      AND qual LIKE '%owner_id%' AND qual LIKE '%name ~~%'
      AND with_check LIKE '%owner_id%' AND with_check LIKE '%name ~~%'
  ),
  'restrictive_insert_guard', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='avatar_owner_insert_guard' AND permissive='RESTRICTIVE'
      AND cmd='INSERT' AND with_check LIKE '%owner_id%' AND roles @> ARRAY['anon','authenticated']::name[]
  ),
  'restrictive_update_guard', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='avatar_owner_update_guard' AND permissive='RESTRICTIVE'
      AND cmd='UPDATE' AND qual LIKE '%owner_id%' AND with_check LIKE '%owner_id%'
  ),
  'restrictive_delete_guard', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='avatar_owner_delete_guard' AND permissive='RESTRICTIVE'
      AND cmd='DELETE' AND qual LIKE '%owner_id%'
  ),
  'legacy_upload_path_supported', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can upload their own avatar' AND with_check LIKE '%avatars/%'
  ),
  'public_avatar_reads_preserved', EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Public avatars are viewable by everyone' AND cmd='SELECT'
  ),
  'avatar_bucket_remains_public', (SELECT public FROM storage.buckets WHERE id='avatars')
) AS avatar_ownership_security;