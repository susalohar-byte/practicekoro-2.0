-- 044_live_tests_and_popular_series.sql
-- Adds is_popular and icon_url to test_series.
-- Creates live_tests and live_test_participations tables with RLS and seed data.

-- 1. Extend test_series table
ALTER TABLE public.test_series ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.test_series ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- 2. CREATE LIVE_TESTS TABLE
CREATE TABLE IF NOT EXISTS public.live_tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    exam_id TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    test_series_id TEXT REFERENCES public.test_series(id) ON DELETE SET NULL,
    test_id TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 90,
    total_questions INT NOT NULL DEFAULT 100,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    negative_marking NUMERIC(4, 2) NOT NULL DEFAULT 0.25,
    instructions TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'live', 'completed', 'cancelled')),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    enrolled_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_live_tests_exam_id ON public.live_tests(exam_id);
CREATE INDEX IF NOT EXISTS idx_live_tests_status ON public.live_tests(status);
CREATE INDEX IF NOT EXISTS idx_live_tests_scheduled_start ON public.live_tests(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_live_tests_is_published ON public.live_tests(is_published);
CREATE INDEX IF NOT EXISTS idx_test_series_is_popular ON public.test_series(is_popular);

-- 3. CREATE LIVE_TEST_PARTICIPATIONS TABLE
CREATE TABLE IF NOT EXISTS public.live_test_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_test_id TEXT NOT NULL REFERENCES public.live_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'started', 'submitted', 'abandoned')),
    score NUMERIC(6, 2),
    accuracy NUMERIC(5, 2),
    rank INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(live_test_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_part_test ON public.live_test_participations(live_test_id);
CREATE INDEX IF NOT EXISTS idx_live_part_user ON public.live_test_participations(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.live_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_test_participations ENABLE ROW LEVEL SECURITY;

-- Policies for live_tests
DROP POLICY IF EXISTS "Public can view published live tests" ON public.live_tests;
CREATE POLICY "Public can view published live tests"
    ON public.live_tests FOR SELECT
    USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can manage live tests" ON public.live_tests;
CREATE POLICY "Admin can manage live tests"
    ON public.live_tests FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies for live_test_participations
DROP POLICY IF EXISTS "Students can view and manage their own participations" ON public.live_test_participations;
CREATE POLICY "Students can view and manage their own participations"
    ON public.live_test_participations FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
    WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. Seed initial live test matching Home UI design
INSERT INTO public.live_tests (
    id, title, exam_id, test_id, scheduled_start_time, scheduled_end_time,
    duration_minutes, total_questions, total_marks, negative_marking,
    instructions, status, is_published, enrolled_count
) VALUES (
    'live-wbp-weekly-01',
    'WBP Constable Weekly Test',
    'wbp-constable',
    'test-wbp-001',
    NOW() + INTERVAL '2 days 18 hours 30 minutes',
    NOW() + INTERVAL '2 days 20 hours',
    90,
    100,
    100.00,
    0.25,
    'Official West Bengal Police Constable pattern. 100 Questions, 90 Minutes, 0.25 Negative Marking. Statewide ranking and detailed analysis will be available immediately upon completion.',
    'scheduled',
    true,
    12450
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    scheduled_start_time = EXCLUDED.scheduled_start_time,
    scheduled_end_time = EXCLUDED.scheduled_end_time,
    status = EXCLUDED.status,
    is_published = EXCLUDED.is_published;

-- 6. Mark popular test series for Home screen display
UPDATE public.test_series
SET is_popular = true
WHERE id IN ('wbp-prelims-2025', 'wbp-mains-pro') OR exam_id IN ('wbp-constable', 'wbpsc-clerkship', 'railway-group-d');
