-- 044_live_tests_and_popular_series.sql
-- PracticeKoro Live Test Architecture: Thin Event Layer on top of existing Tests
-- LIVE TEST = EXISTING TEST + SCHEDULED EVENT + OPTIONAL RANKING

-- 1. Extend test_series table
ALTER TABLE public.test_series ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.test_series ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- 2. CREATE LIVE_TESTS TABLE (Thin scheduled event referencing public.tests)
CREATE TABLE IF NOT EXISTS public.live_tests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    test_id TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended', 'cancelled')),
    ranking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    subscription_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Compatibility columns for legacy queries & denormalized snapshots
    title TEXT,
    exam_id TEXT REFERENCES public.exams(id) ON DELETE SET NULL,
    test_series_id TEXT REFERENCES public.test_series(id) ON DELETE SET NULL,
    scheduled_start_time TIMESTAMPTZ,
    scheduled_end_time TIMESTAMPTZ,
    duration_minutes INT DEFAULT 90,
    total_questions INT DEFAULT 100,
    total_marks NUMERIC(6, 2) DEFAULT 100.00,
    negative_marking NUMERIC(4, 2) DEFAULT 0.25,
    instructions TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    enrolled_count INT NOT NULL DEFAULT 0
);

-- Backwards-compatible / safety column migrations if table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_tests' AND column_name = 'start_at') THEN
        ALTER TABLE public.live_tests ADD COLUMN start_at TIMESTAMPTZ;
        UPDATE public.live_tests SET start_at = coalesce(scheduled_start_time, created_at);
        ALTER TABLE public.live_tests ALTER COLUMN start_at SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_tests' AND column_name = 'registration_deadline') THEN
        ALTER TABLE public.live_tests ADD COLUMN registration_deadline TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_tests' AND column_name = 'ranking_enabled') THEN
        ALTER TABLE public.live_tests ADD COLUMN ranking_enabled BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_tests' AND column_name = 'subscription_required') THEN
        ALTER TABLE public.live_tests ADD COLUMN subscription_required BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_live_tests_test_id ON public.live_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_live_tests_status ON public.live_tests(status);
CREATE INDEX IF NOT EXISTS idx_live_tests_start_at ON public.live_tests(start_at);
CREATE INDEX IF NOT EXISTS idx_test_series_is_popular ON public.test_series(is_popular);

-- 3. CREATE LIVE_TEST_PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.live_test_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_test_id TEXT NOT NULL REFERENCES public.live_tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'started', 'completed', 'abandoned')),
    attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
    score NUMERIC(6, 2),
    accuracy NUMERIC(5, 2),
    time_taken INT,
    rank INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(live_test_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_part_test ON public.live_test_participants(live_test_id);
CREATE INDEX IF NOT EXISTS idx_live_part_user ON public.live_test_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_live_part_attempt ON public.live_test_participants(attempt_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.live_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_test_participants ENABLE ROW LEVEL SECURITY;

-- Policies for live_tests
DROP POLICY IF EXISTS "Public can view published live tests" ON public.live_tests;
DROP POLICY IF EXISTS "Everyone can view live tests" ON public.live_tests;
CREATE POLICY "Everyone can view live tests"
    ON public.live_tests FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin can manage live tests" ON public.live_tests;
CREATE POLICY "Admin can manage live tests"
    ON public.live_tests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND coalesce(p.role::text, '') IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND coalesce(p.role::text, '') IN ('admin', 'super_admin')
        )
    );

-- Policies for live_test_participants
DROP POLICY IF EXISTS "Students can view and manage their own participations" ON public.live_test_participants;
DROP POLICY IF EXISTS "Students can view participants for ranked live tests" ON public.live_test_participants;
DROP POLICY IF EXISTS "Students can register themselves" ON public.live_test_participants;
DROP POLICY IF EXISTS "Students can update their own participation" ON public.live_test_participants;
DROP POLICY IF EXISTS "Admin can manage all live test participations" ON public.live_test_participants;

CREATE POLICY "Students can view participants for ranked live tests"
    ON public.live_test_participants FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.live_tests lt
            WHERE lt.id = live_test_participants.live_test_id AND lt.ranking_enabled = true
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND coalesce(p.role::text, '') IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Students can register themselves"
    ON public.live_test_participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own participation"
    ON public.live_test_participants FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all live test participations"
    ON public.live_test_participants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND coalesce(p.role::text, '') IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND coalesce(p.role::text, '') IN ('admin', 'super_admin')
        )
    );

-- 5. Deterministic Ranking RPC function
CREATE OR REPLACE FUNCTION public.get_live_test_leaderboard(p_live_test_id TEXT)
RETURNS TABLE (
    participant_id UUID,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    district TEXT,
    score NUMERIC(6, 2),
    accuracy NUMERIC(5, 2),
    time_taken INT,
    completed_at TIMESTAMPTZ,
    rank BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        p.id AS participant_id,
        p.user_id,
        coalesce(prof.full_name, 'Candidate') AS full_name,
        prof.avatar_url,
        prof.district,
        coalesce(p.score, 0.00) AS score,
        coalesce(p.accuracy, 0.00) AS accuracy,
        coalesce(p.time_taken, 0) AS time_taken,
        p.completed_at,
        DENSE_RANK() OVER (
            ORDER BY
                coalesce(p.score, 0.00) DESC,
                coalesce(p.accuracy, 0.00) DESC,
                coalesce(p.time_taken, 999999) ASC,
                p.completed_at ASC NULLS LAST
        ) AS rank
    FROM public.live_test_participants p
    JOIN public.profiles prof ON prof.id = p.user_id
    WHERE p.live_test_id = p_live_test_id
      AND p.status = 'completed'
    ORDER BY rank ASC, p.completed_at ASC;
$$;

-- Grant execution
GRANT EXECUTE ON FUNCTION public.get_live_test_leaderboard(TEXT) TO authenticated, anon;

-- 6. Seed initial live test matching Home UI design
INSERT INTO public.live_tests (
    id, test_id, start_at, registration_deadline, status,
    ranking_enabled, subscription_required, title, scheduled_start_time,
    scheduled_end_time, duration_minutes, total_questions, total_marks, negative_marking,
    instructions, is_published, enrolled_count
) VALUES (
    'live-wbp-weekly-01',
    'test-wbp-001',
    NOW() + INTERVAL '2 days 18 hours 30 minutes',
    NOW() + INTERVAL '2 days 18 hours 25 minutes',
    'upcoming',
    TRUE,
    FALSE,
    'WBP Constable Weekly Test',
    NOW() + INTERVAL '2 days 18 hours 30 minutes',
    NOW() + INTERVAL '2 days 20 hours',
    90,
    100,
    100.00,
    0.25,
    'Official West Bengal Police Constable pattern. 100 Questions, 90 Minutes, 0.25 Negative Marking. Statewide ranking and detailed analysis will be available immediately upon completion.',
    TRUE,
    12450
) ON CONFLICT (id) DO UPDATE SET
    test_id = EXCLUDED.test_id,
    start_at = EXCLUDED.start_at,
    registration_deadline = EXCLUDED.registration_deadline,
    status = EXCLUDED.status,
    ranking_enabled = EXCLUDED.ranking_enabled,
    subscription_required = EXCLUDED.subscription_required;

-- 7. Mark popular test series for Home screen display
UPDATE public.test_series
SET is_popular = TRUE
WHERE id IN ('wbp-prelims-2025', 'wbp-mains-pro')
   OR exam_id IN ('wbp-constable', 'wbpsc-clerkship', 'railway-group-d');
