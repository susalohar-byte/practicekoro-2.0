-- Extend the existing privacy-masked leaderboard to honor the visible exam and
-- time filters on the student ranking screen.
DROP FUNCTION IF EXISTS public.get_app_leaderboard(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_app_leaderboard(
  p_scope TEXT DEFAULT 'all_india',
  p_district TEXT DEFAULT NULL,
  p_exam_name TEXT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  average_percentage NUMERIC,
  district TEXT,
  tests_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_scope IS NULL OR p_scope NOT IN ('all_india', 'west_bengal', 'district') THEN
    RAISE EXCEPTION 'Invalid leaderboard scope' USING ERRCODE = '22023';
  END IF;
  IF p_scope = 'district' AND NULLIF(BTRIM(p_district), '') IS NULL THEN
    RAISE EXCEPTION 'A district is required for district rankings' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH student_scores AS (
    SELECT a.user_id, p.full_name, p.district AS student_district,
      AVG(LEAST(100::NUMERIC, GREATEST(0::NUMERIC, a.score / NULLIF(a.total_marks, 0) * 100))) AS avg_percentage,
      COUNT(*)::BIGINT AS completed_tests
    FROM public.test_attempts AS a
    JOIN public.profiles AS p ON p.id = a.user_id
    JOIN public.tests AS t ON t.id = a.test_id
    JOIN public.exams AS e ON e.id = t.exam_id
    WHERE a.status = 'completed' AND p.role = 'student' AND a.total_marks > 0
      AND (p_scope = 'all_india'
        OR (p_scope = 'west_bengal' AND NULLIF(BTRIM(p.district), '') IS NOT NULL)
        OR (p_scope = 'district' AND LOWER(BTRIM(p.district)) = LOWER(BTRIM(p_district))))
      AND (p_exam_name IS NULL OR LOWER(BTRIM(e.title)) = LOWER(BTRIM(p_exam_name)))
      AND (p_from IS NULL OR COALESCE(a.end_time, a.created_at) >= p_from)
    GROUP BY a.user_id, p.full_name, p.district
  ), ranked AS (
    SELECT ROW_NUMBER() OVER (ORDER BY avg_percentage DESC, completed_tests DESC, user_id) AS student_rank,
      CASE WHEN NULLIF(BTRIM(full_name), '') IS NULL THEN 'Student'
        ELSE LEFT(BTRIM(full_name), 1) || '•••' END AS student_name,
      ROUND(avg_percentage, 1) AS score_percentage, student_district, completed_tests
    FROM student_scores
  )
  SELECT student_rank, student_name, score_percentage, student_district, completed_tests
  FROM ranked ORDER BY student_rank LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_app_leaderboard(TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_app_leaderboard(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
