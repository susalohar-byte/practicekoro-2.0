-- Approved and applied to production; recorded migration version 20261007203958.
-- No existing subjects are rewritten.
-- The existing UNIQUE(exam_id,slug) does not prevent duplicates when exam_id is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS subjects_global_slug_unique
ON public.subjects ((lower(trim(slug)))) WHERE exam_id IS NULL;
