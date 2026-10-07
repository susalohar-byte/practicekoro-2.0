-- Migration: Add icon_url to tests table
-- Allows administrative customization of test badges and logos in PracticeKoro

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS icon_url TEXT;

COMMENT ON COLUMN public.tests.icon_url IS 'Public storage URL or path to the custom icon/badge image for this mock test.';
