-- Issue #4 only. Does not move, delete or modify existing storage objects.
BEGIN;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  AND coalesce(owner_id, owner::text) = auth.uid()::text
  AND (name LIKE auth.uid()::text || '/%'
    OR name LIKE 'avatars/' || auth.uid()::text || '-%')
);
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  AND coalesce(owner_id, owner::text) = auth.uid()::text
  AND (name LIKE auth.uid()::text || '/%'
    OR name LIKE 'avatars/' || auth.uid()::text || '-%')
) WITH CHECK (
  bucket_id = 'avatars' AND auth.uid() IS NOT NULL
  AND coalesce(owner_id, owner::text) = auth.uid()::text
  AND (name LIKE auth.uid()::text || '/%'
    OR name LIKE 'avatars/' || auth.uid()::text || '-%')
);

-- Restrictive guards prevent any other permissive policy from opening this bucket.
CREATE POLICY avatar_owner_insert_guard ON storage.objects AS RESTRICTIVE
FOR INSERT TO anon, authenticated WITH CHECK (
  bucket_id <> 'avatars' OR (
    auth.uid() IS NOT NULL AND coalesce(owner_id, owner::text) = auth.uid()::text
    AND (name LIKE auth.uid()::text || '/%'
      OR name LIKE 'avatars/' || auth.uid()::text || '-%')
  )
);
CREATE POLICY avatar_owner_update_guard ON storage.objects AS RESTRICTIVE
FOR UPDATE TO anon, authenticated USING (
  bucket_id <> 'avatars' OR (
    auth.uid() IS NOT NULL AND coalesce(owner_id, owner::text) = auth.uid()::text
    AND (name LIKE auth.uid()::text || '/%'
      OR name LIKE 'avatars/' || auth.uid()::text || '-%')
  )
) WITH CHECK (
  bucket_id <> 'avatars' OR (
    auth.uid() IS NOT NULL AND coalesce(owner_id, owner::text) = auth.uid()::text
    AND (name LIKE auth.uid()::text || '/%'
      OR name LIKE 'avatars/' || auth.uid()::text || '-%')
  )
);
CREATE POLICY avatar_owner_delete_guard ON storage.objects AS RESTRICTIVE
FOR DELETE TO anon, authenticated USING (
  bucket_id <> 'avatars' OR (
    auth.uid() IS NOT NULL AND coalesce(owner_id, owner::text) = auth.uid()::text
    AND (name LIKE auth.uid()::text || '/%'
      OR name LIKE 'avatars/' || auth.uid()::text || '-%')
  )
);
COMMIT;