-- ============================================================================
-- Migration: 20261002080000_test_series_leaderboard_rpc.sql
-- Function to retrieve test-series-specific leaderboard with dynamic ranking.
-- ============================================================================

-- Function: get_test_series_leaderboard
-- Returns the ranking of students for a specific test series.
-- Consistent ranking rule:
--   1. Higher total score in that series -> better rank
--   2. If equal, higher average percentage -> better rank
--   3. If equal, higher accuracy percentage -> better rank
--   4. If equal, lower average time -> better rank
-- Best attempt per test is used so duplicate retries do not distort rankings.

CREATE OR REPLACE FUNCTION public.get_test_series_leaderboard(p_series_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_target_series_id TEXT := p_series_id;
    v_series_title TEXT;
    v_user_rank BIGINT := NULL;
    v_user_score NUMERIC(6, 2) := NULL;
    v_user_percentage NUMERIC(5, 2) := NULL;
    v_total_participants BIGINT := 0;
    v_rankings_json JSONB := '[]'::JSONB;
BEGIN
    -- 1. If no series ID was provided, discover the student's latest attempted test series,
    -- or fallback to the first active test series.
    IF v_target_series_id IS NULL OR BTRIM(v_target_series_id) = '' THEN
        IF v_user_id IS NOT NULL THEN
            SELECT t.test_series_id INTO v_target_series_id
            FROM public.test_attempts AS a
            JOIN public.tests AS t ON t.id = a.test_id
            WHERE a.user_id = v_user_id
              AND a.status = 'completed'
              AND t.test_series_id IS NOT NULL
            ORDER BY COALESCE(a.end_time, a.created_at) DESC
            LIMIT 1;
        END IF;

        IF v_target_series_id IS NULL THEN
            SELECT id INTO v_target_series_id
            FROM public.test_series
            WHERE is_active = TRUE
            ORDER BY order_index ASC
            LIMIT 1;
        END IF;
    END IF;

    -- 2. Resolve series title and ID (support lookup by ID or slug)
    SELECT ts.id, ts.title INTO v_target_series_id, v_series_title
    FROM public.test_series AS ts
    WHERE ts.id = v_target_series_id OR ts.slug = v_target_series_id
    LIMIT 1;

    IF v_target_series_id IS NULL THEN
        RETURN jsonb_build_object(
            'series_id', NULL,
            'series_title', 'Test Series Not Found',
            'user_rank', NULL,
            'total_participants', 0,
            'user_score', 0,
            'user_percentage', 0,
            'rankings', '[]'::JSONB
        );
    END IF;

    -- 3. Calculate dynamic rankings for this specific Test Series
    WITH completed_attempts AS (
        SELECT
            a.id AS attempt_id,
            a.user_id,
            a.test_id,
            COALESCE(tr.score, a.score)::NUMERIC AS score,
            COALESCE(
                NULLIF(tr.total_marks, 0),
                NULLIF(a.total_marks, 0),
                NULLIF(t.total_marks, 0),
                0
            )::NUMERIC AS total_marks,
            COALESCE(tr.accuracy, a.accuracy, 0)::NUMERIC AS accuracy,
            COALESCE(a.correct_count, 0)::INT AS correct_count,
            COALESCE(a.wrong_count, 0)::INT AS wrong_count,
            COALESCE(a.time_spent_seconds, 0)::INT AS time_spent_seconds,
            COALESCE(a.end_time, a.created_at) AS completed_at
        FROM public.test_attempts AS a
        JOIN public.tests AS t ON t.id = a.test_id
        LEFT JOIN public.test_results AS tr ON tr.attempt_id = a.id
        WHERE a.status = 'completed'
          AND t.test_series_id = v_target_series_id
    ),
    ranked_attempts AS (
        SELECT
            ca.*,
            (ca.score / NULLIF(ca.total_marks, 0) * 100) AS percentage,
            ROW_NUMBER() OVER (
                PARTITION BY ca.user_id, ca.test_id
                ORDER BY
                    ca.score DESC,
                    (ca.score / NULLIF(ca.total_marks, 0) * 100) DESC,
                    ca.accuracy DESC,
                    ca.time_spent_seconds ASC,
                    ca.completed_at DESC,
                    ca.attempt_id ASC
            ) AS personal_best_order
        FROM completed_attempts AS ca
        WHERE ca.total_marks > 0
    ),
    best_attempts AS (
        SELECT * FROM ranked_attempts WHERE personal_best_order = 1
    ),
    series_stats AS (
        SELECT
            ba.user_id,
            p.full_name,
            p.avatar_url,
            p.district,
            ROUND(SUM(ba.score), 2) AS total_score,
            ROUND(AVG(ba.percentage), 1) AS average_percentage,
            CASE WHEN SUM(ba.correct_count + ba.wrong_count) > 0
                THEN ROUND(SUM(ba.correct_count)::NUMERIC / SUM(ba.correct_count + ba.wrong_count) * 100, 1)
                ELSE 0 END AS accuracy_percentage,
            ROUND(AVG(ba.time_spent_seconds))::INT AS average_time_seconds,
            COUNT(DISTINCT ba.test_id)::INT AS tests_completed
        FROM best_attempts AS ba
        JOIN public.profiles AS p ON p.id = ba.user_id AND p.role = 'student'
        GROUP BY ba.user_id, p.full_name, p.avatar_url, p.district
    ),
    ranked_series AS (
        SELECT
            ROW_NUMBER() OVER (
                ORDER BY
                    ss.total_score DESC,
                    ss.average_percentage DESC,
                    ss.accuracy_percentage DESC,
                    ss.average_time_seconds ASC,
                    ss.user_id ASC
            ) AS rank,
            ss.user_id,
            CASE
                WHEN NULLIF(BTRIM(ss.full_name), '') IS NULL THEN 'Student'
                ELSE BTRIM(ss.full_name)
            END AS display_name,
            ss.avatar_url,
            ss.district,
            ss.total_score,
            ss.average_percentage,
            ss.accuracy_percentage,
            ss.average_time_seconds,
            ss.tests_completed,
            (v_user_id IS NOT NULL AND ss.user_id = v_user_id) AS is_current_user
        FROM series_stats AS ss
    )
    SELECT
        (SELECT COUNT(*) FROM series_stats),
        (SELECT rs.rank FROM ranked_series rs WHERE rs.user_id = v_user_id),
        (SELECT rs.total_score FROM ranked_series rs WHERE rs.user_id = v_user_id),
        (SELECT rs.average_percentage FROM ranked_series rs WHERE rs.user_id = v_user_id),
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'rank', rs.rank,
                        'user_id', rs.user_id,
                        'name', rs.display_name,
                        'avatar_url', rs.avatar_url,
                        'district', rs.district,
                        'score', rs.total_score,
                        'percentage', rs.average_percentage,
                        'accuracy', rs.accuracy_percentage,
                        'time_spent_seconds', rs.average_time_seconds,
                        'tests_completed', rs.tests_completed,
                        'is_current_user', rs.is_current_user
                    )
                    ORDER BY rs.rank ASC
                )
                FROM (SELECT * FROM ranked_series ORDER BY rank ASC LIMIT 100) AS rs
            ),
            '[]'::JSONB
        )
    INTO
        v_total_participants,
        v_user_rank,
        v_user_score,
        v_user_percentage,
        v_rankings_json;

    RETURN jsonb_build_object(
        'series_id', v_target_series_id,
        'series_title', COALESCE(v_series_title, 'Test Series Leaderboard'),
        'user_rank', v_user_rank,
        'total_participants', v_total_participants,
        'user_score', v_user_score,
        'user_percentage', v_user_percentage,
        'rankings', v_rankings_json
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_test_series_leaderboard(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_series_leaderboard(TEXT) TO authenticated, anon;
