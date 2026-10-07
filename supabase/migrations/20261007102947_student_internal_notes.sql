-- ============================================================================
-- PRACTICEKORO: MIGRATION 20261007084500 - STUDENT INTERNAL NOTES
-- Description: Adds student_notes table for staff internal remarks and audit notes.
--              Strictly protected with RLS so only authenticated administrators can
--              read or write internal notes. Students have no access.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL DEFAULT 'Admin Staff',
    note TEXT NOT NULL CHECK (length(TRIM(note)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_notes_student_id
    ON public.student_notes(student_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Administrators can read and manage all student notes
DROP POLICY IF EXISTS "Admins can manage student internal notes" ON public.student_notes;
CREATE POLICY "Admins can manage student internal notes"
    ON public.student_notes
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students have NO select policy: cannot read internal staff notes under any circumstances.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO authenticated;
GRANT ALL ON public.student_notes TO service_role;
