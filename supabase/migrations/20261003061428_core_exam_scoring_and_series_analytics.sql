-- ============================================================================
-- Reuse the authoritative submit_test_attempt grader and honor the saved
-- negative_marking value for every supported test type.
-- ============================================================================
-- Policy (matches app code in src/utils/negativeMarking.ts):
--   1. Negative marking is configured ONLY at the test level, at test
--      creation time (public.tests.negative_marking, 0 = no negative marking).
--   2. The value is per-test for Full Mock, PYQ, Subject, Chapter and Topic
--      tests. Zero explicitly means no negative marking.
--   3. Question-level negative-mark defaults are ignored by scoring.
--
-- Apply with: scripts/apply-migrations-prod.sh (or supabase db push)
-- ============================================================================

-- New tests with no explicitly saved policy have no deduction by default.
-- Existing test values are preserved so the admin's saved choices stay intact.
ALTER TABLE public.tests ALTER COLUMN negative_marking SET DEFAULT 0.00;
-- Some installations created live_tests from the legacy event-only schema
-- before migration 044 added the shared-test compatibility columns. Add the
-- fields needed by the runner/report idempotently before using them below.
ALTER TABLE public.live_tests
    ADD COLUMN IF NOT EXISTS negative_marking NUMERIC(4, 2) DEFAULT 0.00;
ALTER TABLE public.live_tests ALTER COLUMN negative_marking SET DEFAULT 0.00;

-- The original event-only participant table had no attempt/result linkage.
-- Keep it compatible with both schema generations so a completed live test
-- remains attached to the same authoritative exam attempt.
ALTER TABLE public.live_test_participants
    ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS score NUMERIC(6, 2),
    ADD COLUMN IF NOT EXISTS accuracy NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS time_taken INT,
    ADD COLUMN IF NOT EXISTS rank INT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.submit_test_attempt(
    p_attempt_id UUID,
    p_answers JSONB,
    p_time_spent_seconds INT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_attempt RECORD;
    v_test RECORD;
    v_q RECORD;
    v_selected TEXT;

    v_correct_count INT := 0;
    v_wrong_count INT := 0;
    v_skipped_count INT := 0;
    v_score NUMERIC(6, 2) := 0.00;
    v_accuracy NUMERIC(5, 2) := 0.00;
    v_percentage NUMERIC(5, 2) := 0.00;
    v_passed BOOLEAN := FALSE;

    -- Effective negative deduction per wrong answer (test-level policy).
    v_negative_marks NUMERIC(6, 2) := 0.00;

    v_rank INT;
    v_total_candidates INT;
    v_percentile NUMERIC(5, 2);
    v_existing_result RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    -- Verify attempt and strict ownership
    SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt not found' USING ERRCODE = '40400';
    END IF;

    IF v_attempt.user_id != v_user_id THEN
        RAISE EXCEPTION 'Forbidden: You do not own this attempt' USING ERRCODE = '40300';
    END IF;

    -- SUBMISSION IDEMPOTENCY: If already completed, return existing graded results immediately
    IF v_attempt.status = 'completed' THEN
        SELECT * INTO v_existing_result FROM public.test_results WHERE attempt_id = p_attempt_id;
        IF FOUND THEN
            RETURN jsonb_build_object(
                'attempt_id', p_attempt_id,
                'test_id', v_attempt.test_id,
                'score', v_existing_result.score,
                'total_marks', v_existing_result.total_marks,
                'percentage', v_existing_result.percentage,
                'accuracy', v_existing_result.accuracy,
                'correct_count', v_attempt.correct_count,
                'wrong_count', v_attempt.wrong_count,
                'skipped_count', v_attempt.skipped_count,
                'time_spent_seconds', v_attempt.time_spent_seconds,
                'rank', v_existing_result.rank,
                'total_candidates', v_existing_result.total_candidates,
                'percentile', v_existing_result.percentile,
                'passed', v_existing_result.passed
            );
        END IF;
    END IF;

    SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

    -- TEST-LEVEL NEGATIVE MARKING POLICY: all test types use their saved
    -- value; zero means no deduction. Question-level defaults are ignored.
    v_negative_marks := GREATEST(COALESCE(v_test.negative_marking, 0.00), 0.00);

    -- Normalize p_answers if passed as an object map or null
    IF jsonb_typeof(p_answers) = 'object' THEN
        SELECT COALESCE(jsonb_agg(
            CASE
                WHEN jsonb_typeof(val) = 'object' THEN val || jsonb_build_object('questionId', key)
                ELSE jsonb_build_object('questionId', key, 'selectedOption', val)
            END
        ), '[]'::JSONB)
        INTO p_answers
        FROM jsonb_each(p_answers);
    ELSIF p_answers IS NULL OR jsonb_typeof(p_answers) != 'array' THEN
        p_answers := '[]'::JSONB;
    END IF;

    -- Iterate strictly over AUTHORITATIVE test_questions for this test
    -- Client cannot inject arbitrary external question IDs
    FOR v_q IN
        SELECT
            tq.question_id,
            tq.question_order,
            COALESCE(tq.marks, q.default_marks, 1.00) AS marks,
            q.correct_option
        FROM public.test_questions tq
        JOIN public.questions q ON q.id = tq.question_id
        WHERE tq.test_id = v_test.id AND q.is_active = true
        ORDER BY tq.question_order ASC
    LOOP
        -- Look up student's selected answer from p_answers payload
        SELECT COALESCE(elem->>'selectedOption', elem->>'selected_option')
        INTO v_selected
        FROM jsonb_array_elements(p_answers) elem
        WHERE (COALESCE(elem->>'questionId', elem->>'question_id'))::UUID = v_q.question_id
        LIMIT 1;

        IF v_selected IS NULL OR v_selected = '' THEN
            -- Unanswered / Skipped
            v_skipped_count := v_skipped_count + 1;

            INSERT INTO public.attempt_answers (
                attempt_id, question_id, selected_option, is_correct, marks_awarded, time_spent_seconds
            )
            VALUES (
                p_attempt_id, v_q.question_id, NULL, FALSE, 0.00, 0
            )
            ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                selected_option = NULL,
                is_correct = FALSE,
                marks_awarded = 0.00;

        ELSIF v_selected = v_q.correct_option THEN
            -- Correct Answer
            v_correct_count := v_correct_count + 1;
            v_score := v_score + v_q.marks;

            INSERT INTO public.attempt_answers (
                attempt_id, question_id, selected_option, is_correct, marks_awarded, time_spent_seconds
            )
            VALUES (
                p_attempt_id, v_q.question_id, v_selected, TRUE, v_q.marks, 0
            )
            ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                selected_option = v_selected,
                is_correct = TRUE,
                marks_awarded = v_q.marks;

        ELSE
            -- Wrong Answer: Deduct the TEST-LEVEL negative marks (0 when the
            -- scheme does not apply). Per-question values are ignored.
            v_wrong_count := v_wrong_count + 1;
            v_score := v_score - v_negative_marks;

            INSERT INTO public.attempt_answers (
                attempt_id, question_id, selected_option, is_correct, marks_awarded, time_spent_seconds
            )
            VALUES (
                p_attempt_id, v_q.question_id, v_selected, FALSE, -v_negative_marks, 0
            )
            ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                selected_option = v_selected,
                is_correct = FALSE,
                marks_awarded = -v_negative_marks;

            -- AUTOMATED MISTAKES NOTEBOOK INTEGRATION (Idempotent per test attempt)
            INSERT INTO public.mistakes (
                user_id, question_id, last_attempt_id, wrong_count, is_resolved
            )
            VALUES (
                v_user_id, v_q.question_id, p_attempt_id, 1, FALSE
            )
            ON CONFLICT (user_id, question_id) DO UPDATE SET
                wrong_count = CASE
                    WHEN public.mistakes.last_attempt_id = p_attempt_id THEN public.mistakes.wrong_count
                    ELSE public.mistakes.wrong_count + 1
                END,
                last_attempt_id = p_attempt_id,
                is_resolved = FALSE,
                updated_at = NOW();
        END IF;
    END LOOP;

    -- Clamp minimum score to 0.00
    v_score := GREATEST(0.00, v_score);

    -- Mathematically distinct metrics:
    -- Accuracy: correct / attempted * 100
    IF (v_correct_count + v_wrong_count) > 0 THEN
        v_accuracy := ROUND(((v_correct_count::NUMERIC / (v_correct_count + v_wrong_count)) * 100), 2);
    ELSE
        v_accuracy := 0.00;
    END IF;

    -- Percentage: score / total_marks * 100
    IF v_test.total_marks > 0 THEN
        v_percentage := ROUND(((v_score / v_test.total_marks) * 100), 2);
    ELSE
        v_percentage := 0.00;
    END IF;

    IF v_score >= v_test.passing_marks THEN
        v_passed := TRUE;
    END IF;

    -- REAL-TIME COMPETITIVE RANK & PERCENTILE CALCULATION (No hardcoded values)
    SELECT COUNT(*) + 1 INTO v_rank
    FROM public.test_results
    WHERE test_id = v_attempt.test_id AND score > v_score;

    SELECT COUNT(*) + 1 INTO v_total_candidates
    FROM public.test_results
    WHERE test_id = v_attempt.test_id;

    IF v_total_candidates > 1 THEN
        v_percentile := ROUND((((v_total_candidates - v_rank)::NUMERIC / v_total_candidates) * 100), 2);
    ELSE
        v_percentile := 100.00;
    END IF;

    -- Complete the attempt record (Immutable after completion)
    UPDATE public.test_attempts
    SET status = 'completed',
        end_time = NOW(),
        time_spent_seconds = GREATEST(0, LEAST(p_time_spent_seconds, v_test.duration_minutes * 60)),
        score = v_score,
        correct_count = v_correct_count,
        wrong_count = v_wrong_count,
        skipped_count = v_skipped_count,
        accuracy = v_accuracy,
        rank = v_rank,
        percentile = v_percentile
    WHERE id = p_attempt_id;

    -- Upsert final test_results
    INSERT INTO public.test_results (
        attempt_id,
        user_id,
        test_id,
        score,
        total_marks,
        percentage,
        accuracy,
        rank,
        total_candidates,
        percentile,
        passed
    )
    VALUES (
        p_attempt_id,
        v_user_id,
        v_attempt.test_id,
        v_score,
        v_test.total_marks,
        v_percentage,
        v_accuracy,
        v_rank,
        v_total_candidates,
        v_percentile,
        v_passed
    )
    ON CONFLICT (attempt_id) DO UPDATE SET
        score = EXCLUDED.score,
        percentage = EXCLUDED.percentage,
        accuracy = EXCLUDED.accuracy,
        rank = EXCLUDED.rank,
        total_candidates = EXCLUDED.total_candidates,
        percentile = EXCLUDED.percentile,
        passed = EXCLUDED.passed;

    RETURN jsonb_build_object(
        'attempt_id', p_attempt_id,
        'test_id', v_attempt.test_id,
        'score', v_score,
        'total_marks', v_test.total_marks,
        'percentage', v_percentage,
        'accuracy', v_accuracy,
        'correct_count', v_correct_count,
        'wrong_count', v_wrong_count,
        'skipped_count', v_skipped_count,
        'time_spent_seconds', GREATEST(0, LEAST(p_time_spent_seconds, v_test.duration_minutes * 60)),
        'rank', v_rank,
        'total_candidates', v_total_candidates,
        'percentile', v_percentile,
        'passed', v_passed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- Caller-scoped series report. Summary metrics use the latest completed attempt
-- per active/published test; trend and history include every completed attempt.
-- Overall score is total score / total possible marks across latest attempts;
-- average score is the unweighted mean of each test percentage. Accuracy is
-- aggregated from correct / attempted questions, not averaged per-test.
CREATE OR REPLACE FUNCTION public.get_test_series_analytics(p_series_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_report JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.test_series WHERE id = p_series_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Test series not found' USING ERRCODE = '40400';
    END IF;

    WITH series_tests AS (
        SELECT t.id, t.title, t.test_type, t.total_marks
        FROM public.tests t
        WHERE t.test_series_id = p_series_id
          AND t.is_active = TRUE
          AND t.status = 'published'
    ),
    all_attempts AS (
        SELECT
            a.id AS attempt_id,
            a.test_id,
            t.title AS test_title,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM public.live_test_participants lp
                    WHERE lp.attempt_id = a.id AND lp.status = 'completed'
                ) THEN 'live_test'
                WHEN t.test_type = 'full_mock' THEN 'full_mock'
                WHEN t.test_type = 'pyq' THEN 'pyq'
                ELSE 'topic_test'
            END AS report_type,
            COALESCE(tr.score, a.score, 0)::NUMERIC AS score,
            COALESCE(tr.total_marks, NULLIF(a.total_marks, 0), t.total_marks, 0)::NUMERIC AS total_marks,
            COALESCE(
                tr.percentage,
                CASE WHEN COALESCE(tr.total_marks, NULLIF(a.total_marks, 0), t.total_marks, 0) > 0
                    THEN ROUND((COALESCE(tr.score, a.score, 0)::NUMERIC / COALESCE(tr.total_marks, NULLIF(a.total_marks, 0), t.total_marks, 0)) * 100, 2)
                    ELSE 0 END
            )::NUMERIC AS percentage,
            COALESCE(tr.accuracy, a.accuracy, 0)::NUMERIC AS accuracy,
            COALESCE(a.correct_count, 0)::INT AS correct_count,
            COALESCE(a.wrong_count, 0)::INT AS wrong_count,
            COALESCE(a.skipped_count, 0)::INT AS skipped_count,
            COALESCE(a.time_spent_seconds, 0)::INT AS time_spent_seconds,
            COALESCE(a.end_time, a.created_at) AS completed_at
        FROM public.test_attempts a
        JOIN public.tests t ON t.id = a.test_id
        LEFT JOIN public.test_results tr ON tr.attempt_id = a.id
        WHERE a.user_id = v_user_id
          AND a.status = 'completed'
          AND t.test_series_id = p_series_id
          AND t.is_active = TRUE
          AND t.status = 'published'
    ),
    negative_by_attempt AS (
        SELECT aa.attempt_id, ROUND(SUM(GREATEST(-aa.marks_awarded, 0)), 2)::NUMERIC AS negative_marks
        FROM all_attempts a
        JOIN public.attempt_answers aa ON aa.attempt_id = a.attempt_id
        GROUP BY aa.attempt_id
    ),
    attempts AS (
        SELECT a.*, COALESCE(n.negative_marks, 0)::NUMERIC AS negative_marks
        FROM all_attempts a
        LEFT JOIN negative_by_attempt n ON n.attempt_id = a.attempt_id
    ),
    ranked_attempts AS (
        SELECT a.*, ROW_NUMBER() OVER (
            PARTITION BY a.test_id ORDER BY a.completed_at DESC, a.attempt_id DESC
        ) AS attempt_rank
        FROM attempts a
    ),
    latest_attempts AS (
        SELECT * FROM ranked_attempts WHERE attempt_rank = 1
    ),
    latest_answers AS (
        SELECT
            l.attempt_id,
            aa.is_correct,
            COALESCE(q.subject_id, c.subject_id) AS subject_id,
            s.name AS subject_name,
            COALESCE(q.topic_id, q.chapter_id) AS topic_id,
            c.name AS topic_name
        FROM latest_attempts l
        JOIN public.attempt_answers aa ON aa.attempt_id = l.attempt_id
        JOIN public.questions q ON q.id = aa.question_id
        LEFT JOIN public.chapters c ON c.id = COALESCE(q.topic_id, q.chapter_id)
        LEFT JOIN public.subjects s ON s.id = COALESCE(q.subject_id, c.subject_id)
        WHERE aa.selected_option IS NOT NULL
    ),
    subject_stats AS (
        SELECT
            subject_id,
            subject_name,
            COUNT(*)::INT AS questions_attempted,
            COUNT(*) FILTER (WHERE is_correct)::INT AS correct_count
        FROM latest_answers
        WHERE subject_id IS NOT NULL AND subject_name IS NOT NULL
        GROUP BY subject_id, subject_name
    ),
    topic_stats AS (
        SELECT
            topic_id,
            topic_name,
            COALESCE(subject_name, 'Other') AS subject_name,
            COUNT(*)::INT AS questions_attempted,
            COUNT(*) FILTER (WHERE is_correct)::INT AS correct_count
        FROM latest_answers
        WHERE topic_id IS NOT NULL AND topic_name IS NOT NULL
        GROUP BY topic_id, topic_name, COALESCE(subject_name, 'Other')
    ),
    summary AS (
        SELECT
            (SELECT COUNT(*)::INT FROM series_tests) AS total_tests,
            COUNT(*)::INT AS tests_attempted,
            CASE WHEN SUM(total_marks) > 0 THEN ROUND(SUM(score) / SUM(total_marks) * 100, 2) ELSE 0 END AS overall_score_percent,
            COALESCE(ROUND(AVG(percentage), 2), 0) AS average_score_percent,
            CASE WHEN SUM(correct_count + wrong_count) > 0
                THEN ROUND(SUM(correct_count)::NUMERIC / SUM(correct_count + wrong_count) * 100, 2)
                ELSE 0 END AS accuracy_percent,
            COALESCE(MAX(percentage), 0) AS best_score_percent,
            CASE WHEN (SELECT COUNT(*) FROM series_tests) > 0
                THEN ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM series_tests) * 100, 2)
                ELSE 0 END AS completion_percent
        FROM latest_attempts
    ),
    type_stats AS (
        SELECT
            categories.type,
            COUNT(l.attempt_id)::INT AS tests_attempted,
            COALESCE(ROUND(AVG(l.percentage), 2), 0) AS average_score_percent,
            COALESCE(MAX(l.percentage), 0) AS best_score_percent,
            CASE WHEN SUM(l.correct_count + l.wrong_count) > 0
                THEN ROUND(SUM(l.correct_count)::NUMERIC / SUM(l.correct_count + l.wrong_count) * 100, 2)
                ELSE 0 END AS accuracy_percent
        FROM (VALUES ('full_mock'::TEXT), ('pyq'::TEXT), ('topic_test'::TEXT), ('live_test'::TEXT)) categories(type)
        LEFT JOIN latest_attempts l ON l.report_type = categories.type
        GROUP BY categories.type
    )
    SELECT jsonb_build_object(
        'totalTests', summary.total_tests,
        'testsAttempted', summary.tests_attempted,
        'overallScorePercent', summary.overall_score_percent,
        'averageScorePercent', summary.average_score_percent,
        'accuracyPercent', summary.accuracy_percent,
        'bestScorePercent', summary.best_score_percent,
        'completionPercent', summary.completion_percent,
        'testTypeBreakdown', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'type', ts.type,
                'testsAttempted', ts.tests_attempted,
                'averageScorePercent', ts.average_score_percent,
                'bestScorePercent', ts.best_score_percent,
                'accuracyPercent', ts.accuracy_percent
            ) ORDER BY CASE ts.type WHEN 'full_mock' THEN 1 WHEN 'pyq' THEN 2 WHEN 'topic_test' THEN 3 ELSE 4 END)
            FROM type_stats ts
        ), '[]'::JSONB),
        'trend', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'attemptId', a.attempt_id,
                'testTitle', a.test_title,
                'percentage', a.percentage,
                'completedAt', a.completed_at
            ) ORDER BY a.completed_at ASC, a.attempt_id ASC)
            FROM attempts a
        ), '[]'::JSONB),
        'subjects', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'subjectId', ss.subject_id,
                'subjectName', ss.subject_name,
                'questionsAttempted', ss.questions_attempted,
                'correctCount', ss.correct_count,
                'accuracyPercent', ROUND(ss.correct_count::NUMERIC / NULLIF(ss.questions_attempted, 0) * 100, 2)
            ) ORDER BY ss.subject_name)
            FROM subject_stats ss
        ), '[]'::JSONB),
        'weakTopics', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'topicId', ws.topic_id,
                'topicName', ws.topic_name,
                'subjectName', ws.subject_name,
                'questionsAttempted', ws.questions_attempted,
                'accuracyPercent', ROUND(ws.correct_count::NUMERIC / NULLIF(ws.questions_attempted, 0) * 100, 2)
            ) ORDER BY ws.correct_count::NUMERIC / NULLIF(ws.questions_attempted, 0), ws.questions_attempted DESC)
            FROM (
                SELECT * FROM topic_stats
                WHERE questions_attempted >= 3
                  AND correct_count::NUMERIC / NULLIF(questions_attempted, 0) < 0.65
                ORDER BY correct_count::NUMERIC / NULLIF(questions_attempted, 0), questions_attempted DESC
                LIMIT 5
            ) ws
        ), '[]'::JSONB),
        'history', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'attemptId', a.attempt_id,
                'testId', a.test_id,
                'testTitle', a.test_title,
                'testType', a.report_type,
                'score', a.score,
                'totalMarks', a.total_marks,
                'percentage', a.percentage,
                'accuracy', a.accuracy,
                'correctCount', a.correct_count,
                'wrongCount', a.wrong_count,
                'skippedCount', a.skipped_count,
                'negativeMarks', a.negative_marks,
                'timeSpentSeconds', a.time_spent_seconds,
                'completedAt', a.completed_at
            ) ORDER BY a.completed_at DESC, a.attempt_id DESC)
            FROM attempts a
        ), '[]'::JSONB)
    ) INTO v_report
    FROM summary;

    RETURN COALESCE(v_report, '{}'::JSONB);
END;
$$;

REVOKE ALL ON FUNCTION public.get_test_series_analytics(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_test_series_analytics(TEXT) TO authenticated;
