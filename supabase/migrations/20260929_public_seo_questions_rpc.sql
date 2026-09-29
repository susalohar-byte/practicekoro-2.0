-- ============================================================================
-- Migration: Public SEO Questions RPCs (Testbook-style Google Search Indexing)
-- ============================================================================
-- Exposes active Question Bank items to public/unauthenticated visitors and
-- search engine crawlers (Googlebot) via SECURITY DEFINER RPCs, while keeping
-- direct table SELECT on public.questions restricted to admins (preserving
-- existing security probes) and excluding any questions locked in an active or
-- upcoming Live Test event.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_seo_questions(
    p_subject_id TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 500
)
RETURNS JSONB AS $$
DECLARE
    v_questions JSONB;
    v_safe_limit INT;
BEGIN
    v_safe_limit := LEAST(GREATEST(COALESCE(p_limit, 500), 1), 2000);

    SELECT jsonb_agg(q_row)
    INTO v_questions
    FROM (
        SELECT jsonb_build_object(
            'id', q.id,
            'subjectId', q.subject_id,
            'subjectName', s.name,
            'chapterId', q.chapter_id,
            'chapterName', c.name,
            'topicId', COALESCE(q.topic_id, q.chapter_id),
            'topicName', c.name,
            'questionText', q.question_text,
            'questionBengaliText', q.question_bengali_text,
            'imageUrl', q.image_url,
            'optionA', q.option_a,
            'optionB', q.option_b,
            'optionC', q.option_c,
            'optionD', q.option_d,
            'correctOption', q.correct_option,
            'explanation', q.explanation,
            'explanationBengali', q.explanation_bengali,
            'difficulty', COALESCE(q.difficulty, 'medium'),
            'defaultMarks', COALESCE(q.default_marks, 1.0),
            'defaultNegativeMarks', COALESCE(q.default_negative_marks, 0),
            'questionType', COALESCE(q.question_type, 'mcq'),
            'sourceType', COALESCE(q.source_type, 'topic'),
            'sourceYear', q.source_year,
            'sourceExam', q.source_exam,
            'sourcePaper', q.source_paper,
            'sourceShift', q.source_shift,
            'isActive', q.is_active,
            'status', COALESCE(q.status, 'active')
        ) AS q_row
        FROM public.questions q
        LEFT JOIN public.subjects s ON s.id = q.subject_id
        LEFT JOIN public.chapters c ON c.id = COALESCE(q.chapter_id, q.topic_id)
        WHERE q.is_active = true
          AND COALESCE(q.status, 'active') = 'active'
          AND (p_subject_id IS NULL OR p_subject_id = '' OR q.subject_id = p_subject_id)
          AND (
              p_search IS NULL
              OR p_search = ''
              OR q.question_text ILIKE '%' || p_search || '%'
              OR q.question_bengali_text ILIKE '%' || p_search || '%'
          )
          -- Never leak answers for questions currently part of an upcoming or live event
          AND NOT EXISTS (
              SELECT 1
              FROM public.test_questions tq
              JOIN public.live_tests lt ON lt.test_id = tq.test_id
              WHERE tq.question_id = q.id
                AND lt.status IN ('upcoming', 'live', 'scheduled')
          )
        ORDER BY q.created_at DESC NULLS LAST
        LIMIT v_safe_limit
    ) sub;

    RETURN COALESCE(v_questions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_public_seo_questions(TEXT, TEXT, INT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_seo_question_by_id(
    p_question_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_question JSONB;
BEGIN
    IF p_question_id IS NULL OR p_question_id = '' THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'id', q.id,
        'subjectId', q.subject_id,
        'subjectName', s.name,
        'chapterId', q.chapter_id,
        'chapterName', c.name,
        'topicId', COALESCE(q.topic_id, q.chapter_id),
        'topicName', c.name,
        'questionText', q.question_text,
        'questionBengaliText', q.question_bengali_text,
        'imageUrl', q.image_url,
        'optionA', q.option_a,
        'optionB', q.option_b,
        'optionC', q.option_c,
        'optionD', q.option_d,
        'correctOption', q.correct_option,
        'explanation', q.explanation,
        'explanationBengali', q.explanation_bengali,
        'difficulty', COALESCE(q.difficulty, 'medium'),
        'defaultMarks', COALESCE(q.default_marks, 1.0),
        'defaultNegativeMarks', COALESCE(q.default_negative_marks, 0),
        'questionType', COALESCE(q.question_type, 'mcq'),
        'sourceType', COALESCE(q.source_type, 'topic'),
        'sourceYear', q.source_year,
        'sourceExam', q.source_exam,
        'sourcePaper', q.source_paper,
        'sourceShift', q.source_shift,
        'isActive', q.is_active,
        'status', COALESCE(q.status, 'active')
    )
    INTO v_question
    FROM public.questions q
    LEFT JOIN public.subjects s ON s.id = q.subject_id
    LEFT JOIN public.chapters c ON c.id = COALESCE(q.chapter_id, q.topic_id)
    WHERE q.id = p_question_id
      AND q.is_active = true
      AND COALESCE(q.status, 'active') = 'active'
      AND NOT EXISTS (
          SELECT 1
          FROM public.test_questions tq
          JOIN public.live_tests lt ON lt.test_id = tq.test_id
          WHERE tq.question_id = q.id
            AND lt.status IN ('upcoming', 'live', 'scheduled')
      )
    LIMIT 1;

    RETURN v_question;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_public_seo_question_by_id(TEXT) TO anon, authenticated;
