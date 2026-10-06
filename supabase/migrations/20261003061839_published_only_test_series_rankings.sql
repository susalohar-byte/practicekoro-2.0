-- Authenticated student leaderboard aggregated from completed test attempts.
-- Public rows contain masked names only; student identifiers and avatars are private.
DROP FUNCTION IF EXISTS public.get_test_series_leaderboard(text);
CREATE OR REPLACE FUNCTION public.get_test_series_leaderboard(
  p_series_id text DEFAULT NULL,
  p_district text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  v_user uuid := (select auth.uid());
  v_series_id text := p_series_id;
  v_title text;
  v_result jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  IF v_series_id IS NULL OR btrim(v_series_id) = '' THEN
    SELECT t.test_series_id INTO v_series_id
    FROM public.test_attempts a
    JOIN public.tests t ON t.id = a.test_id
    WHERE a.user_id = v_user AND a.status = 'completed'
      AND t.test_series_id IS NOT NULL
    ORDER BY coalesce(a.end_time, a.created_at) DESC LIMIT 1;
    IF v_series_id IS NULL THEN
      SELECT id INTO v_series_id FROM public.test_series
      WHERE is_active ORDER BY order_index LIMIT 1;
    END IF;
  END IF;

  SELECT ts.id, ts.title INTO v_series_id, v_title
  FROM public.test_series ts WHERE ts.id = v_series_id OR ts.slug = v_series_id
  LIMIT 1;

  IF v_series_id IS NULL THEN
    RETURN jsonb_build_object('series_id', NULL, 'series_title', 'Test Series Not Found',
      'user_rank', NULL, 'total_participants', 0, 'user_score', NULL,
      'user_percentage', NULL, 'rankings', '[]'::jsonb);
  END IF;

  WITH attempts AS (
    SELECT a.id, a.user_id, a.test_id,
      coalesce(tr.score, a.score)::numeric AS score,
      coalesce(nullif(tr.total_marks, 0), nullif(a.total_marks, 0), nullif(t.total_marks, 0), 0)::numeric AS marks,
      coalesce(tr.accuracy, a.accuracy, 0)::numeric AS accuracy,
      coalesce(a.time_spent_seconds, 0)::int AS seconds,
      coalesce(a.correct_count, 0)::int AS correct_count,
      coalesce(a.wrong_count, 0)::int AS wrong_count,
      coalesce(a.end_time, a.created_at) AS completed_at
    FROM public.test_attempts a
    JOIN public.tests t ON t.id = a.test_id
    LEFT JOIN public.test_results tr ON tr.attempt_id = a.id
    WHERE a.status = 'completed' AND t.is_active AND t.status = 'published'
      AND t.test_series_id = v_series_id
  ), best AS (
    SELECT *, score / nullif(marks, 0) * 100 AS pct,
      row_number() over (partition by user_id, test_id order by score desc,
        score / nullif(marks, 0) desc, accuracy desc, seconds asc, completed_at desc) AS rn
    FROM attempts WHERE marks > 0
  ), people AS (
    SELECT b.user_id, p.full_name, p.district,
      round(sum(b.score), 2) AS score,
      round(avg(b.pct), 1) AS percentage,
      CASE WHEN sum(b.correct_count + b.wrong_count) > 0
        THEN round(sum(b.correct_count)::numeric / sum(b.correct_count + b.wrong_count) * 100, 1)
        ELSE 0 END AS accuracy,
      round(avg(b.seconds))::int AS seconds,
      count(distinct b.test_id)::int AS tests_completed
    FROM best b JOIN public.profiles p ON p.id = b.user_id AND p.role = 'student'
    WHERE b.rn = 1 AND (p_district IS NULL OR btrim(p_district) = ''
      OR p_district = 'West Bengal' OR p.district = p_district)
    GROUP BY b.user_id, p.full_name, p.district
  ), ranked AS (
    SELECT row_number() over (order by score desc, percentage desc, accuracy desc,
      seconds asc, user_id) AS rank, * FROM people
  )
  SELECT jsonb_build_object(
    'series_id', v_series_id, 'series_title', coalesce(v_title, 'Test Series Leaderboard'),
    'user_rank', (SELECT rank FROM ranked WHERE user_id = v_user),
    'total_participants', (SELECT count(*) FROM ranked),
    'user_score', (SELECT score FROM ranked WHERE user_id = v_user),
    'user_percentage', (SELECT percentage FROM ranked WHERE user_id = v_user),
    'rankings', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'rank', q.rank,
      'name', CASE WHEN nullif(btrim(q.full_name), '') IS NULL THEN 'Student'
        ELSE left(btrim(q.full_name), 1) || '•••' END,
      'avatar_url', NULL, 'district', q.district, 'score', q.score,
      'percentage', q.percentage, 'accuracy', q.accuracy,
      'time_spent_seconds', q.seconds, 'tests_completed', q.tests_completed,
      'is_current_user', q.user_id = v_user) ORDER BY q.rank)
      FROM (SELECT * FROM ranked ORDER BY rank LIMIT 100) q), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_test_series_leaderboard(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_series_leaderboard(text, text) TO authenticated;
