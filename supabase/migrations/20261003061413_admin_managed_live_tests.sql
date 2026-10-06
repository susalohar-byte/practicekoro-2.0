-- Add the missing Admin-managed Live Test event layer to the production schema.
-- Student visibility is limited to explicitly published scheduled/live events.
ALTER TABLE public.test_series
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

CREATE TABLE IF NOT EXISTS public.live_tests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  test_id TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'live', 'ended', 'cancelled')),
  ranking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title TEXT,
  exam_id TEXT REFERENCES public.exams(id) ON DELETE SET NULL,
  test_series_id TEXT REFERENCES public.test_series(id) ON DELETE SET NULL,
  scheduled_start_time TIMESTAMPTZ,
  scheduled_end_time TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 90,
  total_questions INT NOT NULL DEFAULT 100,
  total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
  negative_marking NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
  logo TEXT,
  exam_logo TEXT,
  instructions TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  enrolled_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.live_test_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_test_id TEXT NOT NULL REFERENCES public.live_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'started', 'completed', 'abandoned')),
  attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  score NUMERIC(6, 2),
  accuracy NUMERIC(5, 2),
  time_taken INT,
  rank INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(live_test_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_tests_test_id ON public.live_tests(test_id);
CREATE INDEX IF NOT EXISTS idx_live_tests_published_schedule
  ON public.live_tests(is_published, status, scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_live_participant_user ON public.live_test_participants(user_id, live_test_id);
CREATE INDEX IF NOT EXISTS idx_live_participant_attempt ON public.live_test_participants(attempt_id);

ALTER TABLE public.live_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_test_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view live tests" ON public.live_tests;
DROP POLICY IF EXISTS "Public can view published live tests" ON public.live_tests;
DROP POLICY IF EXISTS "Students read published live tests" ON public.live_tests;
CREATE POLICY "Students read published live tests" ON public.live_tests
  FOR SELECT TO authenticated
  USING (
    (is_published = TRUE AND status IN ('upcoming', 'live'))
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND (p.role = 'admin' OR p.admin_role = 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admin can manage live tests" ON public.live_tests;
CREATE POLICY "Admin can manage live tests" ON public.live_tests
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (p.role = 'admin' OR p.admin_role = 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (p.role = 'admin' OR p.admin_role = 'super_admin')
  ));

DROP POLICY IF EXISTS "Students can view participants for ranked live tests" ON public.live_test_participants;
DROP POLICY IF EXISTS "Students can register themselves" ON public.live_test_participants;
DROP POLICY IF EXISTS "Students can update their own participation" ON public.live_test_participants;
DROP POLICY IF EXISTS "Admin can manage all live test participations" ON public.live_test_participants;
CREATE POLICY "Students read own live test participation" ON public.live_test_participants
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Students register own live test participation" ON public.live_test_participants
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Students update own live test participation" ON public.live_test_participants
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Admins manage live test participation" ON public.live_test_participants
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (p.role = 'admin' OR p.admin_role = 'super_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (p.role = 'admin' OR p.admin_role = 'super_admin')
  ));
