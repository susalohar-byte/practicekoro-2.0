-- Calculate current rankings directly from completed, database-backed results.
-- Best attempt per test is used so an improvement is reflected immediately,
-- while a lower re-attempt does not erase a student's best performance.

CREATE INDEX IF NOT EXISTS idx_test_attempts_rank_completed_test_user
    ON public.test_attempts (test_id, user_id)
    WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_tests_rank_series_test
    ON public.tests (test_series_id, id)
    WHERE test_series_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_rank_district
    ON public.profiles (LOWER(BTRIM(district)))
    WHERE role = 'student' AND district IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_attempt_rankings(p_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_series_id TEXT;
    v_series_name TEXT;
    v_district TEXT;
    v_score NUMERIC(6, 2);
    v_total_marks NUMERIC(6, 2);
    v_series_rank BIGINT;
    v_series_participants BIGINT := 0;
    v_district_rank BIGINT;
    v_district_participants BIGINT := 0;
    v_west_bengal_rank BIGINT;
    v_west_bengal_participants BIGINT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT
        t.test_series_id,
        ts.title,
        CASE
            WHEN LOWER(BTRIM(p.district)) = 'west bengal' THEN NULL
            ELSE NULLIF(BTRIM(p.district), '')
        END,
        COALESCE(tr.score, a.score)::NUMERIC(6, 2),
        COALESCE(NULLIF(tr.total_marks, 0), NULLIF(a.total_marks, 0), t.total_marks)::NUMERIC(6, 2)
    INTO v_series_id, v_series_name, v_district, v_score, v_total_marks
    FROM public.test_attempts AS a
    JOIN public.tests AS t ON t.id = a.test_id
    LEFT JOIN public.test_series AS ts ON ts.id = t.test_series_id
    LEFT JOIN public.test_results AS tr ON tr.attempt_id = a.id
    LEFT JOIN public.profiles AS p ON p.id = v_user_id
    WHERE a.id = p_attempt_id
      AND a.user_id = v_user_id
      AND a.status = 'completed';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Completed result not found' USING ERRCODE = 'P0002';
    END IF;

    WITH completed_attempts AS (
        SELECT
            a.id AS attempt_id,
            a.user_id,
            a.test_id,
            t.test_series_id,
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
    ),
    ranked_attempts AS (
        SELECT
            ca.*,
            ca.score / NULLIF(ca.total_marks, 0) * 100 AS percentage,
            ROW_NUMBER() OVER (
                PARTITION BY ca.user_id, ca.test_id
                ORDER BY
                    ca.score / NULLIF(ca.total_marks, 0) DESC,
                    ca.score DESC,
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
    student_stats AS (
        SELECT
            ba.user_id,
            AVG(ba.percentage) AS average_percentage,
            SUM(ba.score) AS total_score,
            CASE WHEN SUM(ba.correct_count + ba.wrong_count) > 0
                THEN SUM(ba.correct_count)::NUMERIC / SUM(ba.correct_count + ba.wrong_count) * 100
                ELSE 0 END AS accuracy_percentage,
            AVG(ba.time_spent_seconds)::NUMERIC AS average_time_seconds
        FROM best_attempts AS ba
        GROUP BY ba.user_id
    ),
    series_stats AS (
        SELECT
            ba.user_id,
            AVG(ba.percentage) AS average_percentage,
            SUM(ba.score) AS total_score,
            CASE WHEN SUM(ba.correct_count + ba.wrong_count) > 0
                THEN SUM(ba.correct_count)::NUMERIC / SUM(ba.correct_count + ba.wrong_count) * 100
                ELSE 0 END AS accuracy_percentage,
            AVG(ba.time_spent_seconds)::NUMERIC AS average_time_seconds
        FROM best_attempts AS ba
        JOIN public.profiles AS p ON p.id = ba.user_id AND p.role = 'student'
        WHERE v_series_id IS NOT NULL
          AND ba.test_series_id = v_series_id
        GROUP BY ba.user_id
    ),
    ranked_series AS (
        SELECT
            ss.user_id,
            ROW_NUMBER() OVER (
                ORDER BY ss.average_percentage DESC, ss.total_score DESC,
                         ss.accuracy_percentage DESC, ss.average_time_seconds ASC, ss.user_id ASC
            ) AS student_rank
        FROM series_stats AS ss
    ),
    west_bengal_students AS (
        SELECT ss.*
        FROM student_stats AS ss
        JOIN public.profiles AS p ON p.id = ss.user_id AND p.role = 'student'
        WHERE NULLIF(BTRIM(p.district), '') IS NOT NULL
          AND LOWER(BTRIM(p.district)) <> 'west bengal'
    ),
    ranked_west_bengal AS (
        SELECT
            wbs.user_id,
            ROW_NUMBER() OVER (
                ORDER BY wbs.average_percentage DESC, wbs.total_score DESC,
                         wbs.accuracy_percentage DESC, wbs.average_time_seconds ASC, wbs.user_id ASC
            ) AS student_rank
        FROM west_bengal_students AS wbs
    ),
    district_students AS (
        SELECT ss.*
        FROM student_stats AS ss
        JOIN public.profiles AS p ON p.id = ss.user_id AND p.role = 'student'
        WHERE v_district IS NOT NULL
          AND LOWER(BTRIM(p.district)) = LOWER(v_district)
    ),
    ranked_district AS (
        SELECT
            ds.user_id,
            ROW_NUMBER() OVER (
                ORDER BY ds.average_percentage DESC, ds.total_score DESC,
                         ds.accuracy_percentage DESC, ds.average_time_seconds ASC, ds.user_id ASC
            ) AS student_rank
        FROM district_students AS ds
    )
    SELECT
        (SELECT rs.student_rank FROM ranked_series AS rs WHERE rs.user_id = v_user_id),
        (SELECT COUNT(*) FROM series_stats),
        (SELECT rw.student_rank FROM ranked_west_bengal AS rw WHERE rw.user_id = v_user_id),
        (SELECT COUNT(*) FROM west_bengal_students),
        (SELECT rd.student_rank FROM ranked_district AS rd WHERE rd.user_id = v_user_id),
        (SELECT COUNT(*) FROM district_students)
    INTO v_series_rank, v_series_participants,
         v_west_bengal_rank, v_west_bengal_participants,
         v_district_rank, v_district_participants;

    RETURN jsonb_build_object(
        'testSeries', jsonb_build_object(
            'id', v_series_id,
            'name', v_series_name,
            'score', v_score,
            'totalMarks', v_total_marks,
            'rank', v_series_rank,
            'participants', v_series_participants
        ),
        'district', jsonb_build_object(
            'name', v_district,
            'rank', v_district_rank,
            'participants', v_district_participants
        ),
        'westBengal', jsonb_build_object(
            'rank', v_west_bengal_rank,
            'participants', v_west_bengal_participants
        )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_attempt_rankings(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_attempt_rankings(UUID) TO authenticated;
