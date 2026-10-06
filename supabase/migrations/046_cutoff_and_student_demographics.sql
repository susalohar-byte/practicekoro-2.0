-- ============================================================================
-- MIGRATION 046: Student Demographics & Real Competitive Exam Cutoff Architecture
-- Standardizes Category (Caste) & Gender for demographic analytics & cutoff comparison.
-- Introduces multi-tier Exam Cutoff Configuration and Historical Cutoff Records.
-- ============================================================================

-- 1. Extend profiles table with standardized demographic & academic fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'NOT_SPECIFIED';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'GEN';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'West Bengal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_subjects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preparation_status TEXT DEFAULT 'BEGINNER';

-- 2. Performance indexes for category & gender analytics
CREATE INDEX IF NOT EXISTS idx_profiles_category ON public.profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_category_gender ON public.profiles(category, gender);

-- 3. Update handle_new_user() trigger to safely extract demographics from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        district,
        state,
        gender,
        category,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NULLIF(TRIM(NEW.raw_user_meta_data->>'district'), ''),
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'state'), ''), 'West Bengal'),
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'gender'), ''), 'NOT_SPECIFIED'),
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'category'), ''), 'GEN'),
        'student'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        district = COALESCE(NULLIF(TRIM(EXCLUDED.district), ''), public.profiles.district),
        gender = COALESCE(NULLIF(TRIM(EXCLUDED.gender), ''), public.profiles.gender),
        category = COALESCE(NULLIF(TRIM(EXCLUDED.category), ''), public.profiles.category);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Exam Cutoff Configuration Table
CREATE TABLE IF NOT EXISTS public.exam_cutoff_configs (
    exam_id TEXT PRIMARY KEY REFERENCES public.exams(id) ON DELETE CASCADE,
    category_enabled BOOLEAN DEFAULT true,
    gender_enabled BOOLEAN DEFAULT false,
    district_enabled BOOLEAN DEFAULT false,
    stage_enabled BOOLEAN DEFAULT true,
    allowed_stages JSONB DEFAULT '["Preliminary", "Written Examination", "Final Merit"]'::jsonb,
    default_score_type TEXT DEFAULT 'raw_marks',
    default_max_marks NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on exam_cutoff_configs
ALTER TABLE public.exam_cutoff_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for exam cutoff configs"
    ON public.exam_cutoff_configs FOR SELECT
    USING (true);

CREATE POLICY "Admin write access for exam cutoff configs"
    ON public.exam_cutoff_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Create Structured Cutoff Records Table
CREATE TABLE IF NOT EXISTS public.cutoff_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id TEXT NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    exam_title TEXT NOT NULL,
    year INT NOT NULL,
    stage TEXT NOT NULL,
    cutoff_type TEXT NOT NULL CHECK (cutoff_type IN ('OFFICIAL', 'EXPECTED')),
    category TEXT NOT NULL CHECK (category IN ('GEN', 'OBC_A', 'OBC_B', 'SC', 'ST', 'EWS', 'PWD', 'OTHER', 'NOT_SPECIFIED')),
    gender TEXT NOT NULL DEFAULT 'ALL' CHECK (gender IN ('ALL', 'MALE', 'FEMALE')),
    district TEXT DEFAULT 'ALL',
    score_type TEXT NOT NULL DEFAULT 'raw_marks',
    max_marks NUMERIC NOT NULL DEFAULT 100,
    cutoff_marks NUMERIC NOT NULL,
    percentage NUMERIC,
    negative_marking NUMERIC DEFAULT 0.25,
    source_type TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'Pending Verification' CHECK (verification_status IN ('Verified', 'Pending Verification')),
    verified_by TEXT,
    verified_date TIMESTAMPTZ,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high speed cutoff lookups and comparisons
CREATE INDEX IF NOT EXISTS idx_cutoff_lookup
    ON public.cutoff_records(exam_id, year, stage, cutoff_type);

CREATE INDEX IF NOT EXISTS idx_cutoff_demographics
    ON public.cutoff_records(exam_id, category, gender);

-- Enable RLS on cutoff_records
ALTER TABLE public.cutoff_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active cutoff records"
    ON public.cutoff_records FOR SELECT
    USING (status = 'active');

CREATE POLICY "Admin manage all cutoff records"
    ON public.cutoff_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
