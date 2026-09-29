-- A safe, read-only leaderboard endpoint for authenticated app users.
-- Scores are the average percentage across a student's completed tests.
CREATE OR REPLACE FUNCTION public.get_app_leaderboard(
  p_scope TEXT DEFAULT 'all_india',
  p_district TEXT DEFAULT NULL
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
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_scope IS NULL OR p_scope NOT IN ('all_india', 'west_bengal', 'district') THEN
    RAISE EXCEPTION 'Invalid leaderboard scope';
  END IF;

  IF p_scope = 'district' AND NULLIF(BTRIM(p_district), '') IS NULL THEN
    RAISE EXCEPTION 'A district is required for district rankings';
  END IF;

  RETURN QUERY
  WITH student_scores AS (
    SELECT
      a.user_id,
      p.full_name,
      p.district AS student_district,
      AVG(LEAST(100::NUMERIC, GREATEST(0::NUMERIC, a.score / NULLIF(a.total_marks, 0) * 100))) AS avg_percentage,
      COUNT(*)::BIGINT AS completed_tests
    FROM public.test_attempts AS a
    JOIN public.profiles AS p ON p.id = a.user_id
    WHERE a.status = 'completed'
      AND p.role = 'student'
      AND a.total_marks > 0
      AND (
        p_scope = 'all_india'
        OR (p_scope = 'west_bengal' AND NULLIF(BTRIM(p.district), '') IS NOT NULL)
        OR (p_scope = 'district' AND LOWER(BTRIM(p.district)) = LOWER(BTRIM(p_district)))
      )
    GROUP BY a.user_id, p.full_name, p.district
  ), ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY avg_percentage DESC, completed_tests DESC, user_id) AS student_rank,
      CASE
        WHEN NULLIF(BTRIM(full_name), '') IS NULL THEN 'Student'
        ELSE LEFT(BTRIM(full_name), 1) || '•••'
      END AS student_name,
      ROUND(avg_percentage, 1) AS score_percentage,
      student_district,
      completed_tests
    FROM student_scores
  )
  SELECT student_rank, student_name, score_percentage, student_district, completed_tests
  FROM ranked
  ORDER BY student_rank
  LIMIT 100;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_app_leaderboard(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_app_leaderboard(TEXT, TEXT) TO authenticated;
