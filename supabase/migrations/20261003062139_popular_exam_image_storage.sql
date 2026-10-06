-- Public delivery for card images, restricted uploads/deletes to administrators.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  TRUE,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins upload popular exam images" ON storage.objects;
CREATE POLICY "Admins upload popular exam images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = 'popular-exams'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins delete popular exam images" ON storage.objects;
CREATE POLICY "Admins delete popular exam images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'banners'
  AND (storage.foldername(name))[1] = 'popular-exams'
  AND public.has_role(auth.uid(), 'admin')
);
