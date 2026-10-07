BEGIN;

-- Migration: update_admin_dashboard_v2_stats
-- Enhances get_admin_dashboard_v2_stats to return real testsAttempted, questionsAnswered,
-- accurate Asia/Kolkata date boundaries, net revenue, distinct pro users, and truthful activity feeds.

DROP FUNCTION IF EXISTS public.get_admin_dashboard_v2_stats();
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_v2_stats()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_stats JSONB;
    v_total_revenue NUMERIC(10, 2);
    v_today_revenue NUMERIC(10, 2);
    v_month_revenue NUMERIC(10, 2);
    v_year_revenue NUMERIC(10, 2);
    v_total_students INT;
    v_new_students INT;
    v_active_students INT;
    v_pro_students INT;
    v_free_students INT;
    v_active_subs INT;
    v_tests_attempted INT;
    v_completed_tests INT;
    v_questions_answered INT;
    v_total_exams INT;
    v_total_tests INT;
    v_topic_tests INT;
    v_full_mock_tests INT;
    v_pyq_tests INT;
    v_total_questions INT;
    v_topic_questions INT;
    v_full_mock_questions INT;
    v_pyq_questions INT;
    v_trend JSONB;
    v_recent_activity JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL OR NOT (public.is_management_super_admin() OR public.can_mutate_admin_record('payments')) THEN
        RAISE EXCEPTION 'Forbidden: Administrator privileges required' USING ERRCODE = '40300';
    END IF;

    -- Revenue Metrics (Completed payments minus refunds in Asia/Kolkata timezone)
    SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0.00)), 0.00) INTO v_total_revenue
    FROM public.payments WHERE status = 'completed';

    SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0.00)), 0.00) INTO v_today_revenue
    FROM public.payments
    WHERE status = 'completed'
      AND created_at >= ((NOW() AT TIME ZONE 'Asia/Kolkata')::date::timestamp AT TIME ZONE 'Asia/Kolkata');

    SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0.00)), 0.00) INTO v_month_revenue
    FROM public.payments
    WHERE status = 'completed'
      AND created_at >= (date_trunc('month', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata');

    SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0.00)), 0.00) INTO v_year_revenue
    FROM public.payments
    WHERE status = 'completed'
      AND created_at >= (date_trunc('year', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata');

    -- Student Metrics (Strictly role = 'student', excluding staff/admin)
    SELECT COUNT(*) INTO v_total_students
    FROM public.profiles WHERE role = 'student';

    SELECT COUNT(*) INTO v_new_students
    FROM public.profiles
    WHERE role = 'student' AND created_at >= (NOW() - INTERVAL '30 days');

    SELECT COUNT(DISTINCT user_id) INTO v_active_students
    FROM public.test_attempts
    WHERE created_at >= (NOW() - INTERVAL '30 days');

    -- Pro students: Distinct eligible users with active unexpired subscriptions
    SELECT COUNT(DISTINCT user_id) INTO v_pro_students
    FROM public.subscriptions
    WHERE status = 'active' AND expires_at > NOW();

    v_free_students := GREATEST(0, v_total_students - v_pro_students);

    SELECT COUNT(*) INTO v_active_subs
    FROM public.subscriptions
    WHERE status = 'active' AND expires_at > NOW();

    -- Test Attempt & Question Answering Metrics
    SELECT COUNT(*) INTO v_tests_attempted
    FROM public.test_attempts;

    SELECT COUNT(*) INTO v_completed_tests
    FROM public.test_attempts
    WHERE status = 'completed';

    -- Derive answered questions from actual recorded responses
    SELECT COUNT(*) INTO v_questions_answered
    FROM public.attempt_answers
    WHERE selected_option IS NOT NULL;

    -- Content Metrics
    SELECT COUNT(*) INTO v_total_exams FROM public.exams;

    SELECT COUNT(*) INTO v_total_tests FROM public.tests;
    SELECT COUNT(*) INTO v_topic_tests FROM public.tests WHERE test_type IN ('topic', 'chapter_mock');
    SELECT COUNT(*) INTO v_full_mock_tests FROM public.tests WHERE test_type = 'full_mock';
    SELECT COUNT(*) INTO v_pyq_tests FROM public.tests WHERE test_type = 'pyq';

    SELECT COUNT(*) INTO v_total_questions FROM public.questions;
    SELECT COUNT(*) INTO v_topic_questions FROM public.questions WHERE source_type = 'topic' OR (source_type IS NULL AND chapter_id IS NOT NULL);
    SELECT COUNT(*) INTO v_full_mock_questions FROM public.questions WHERE source_type = 'other';
    SELECT COUNT(*) INTO v_pyq_questions FROM public.questions WHERE source_type = 'pyq';

    -- Revenue trend (last 7 days daily aggregate in Asia/Kolkata)
    SELECT COALESCE(jsonb_agg(d.item), '[]'::jsonb) INTO v_trend
    FROM (
        SELECT jsonb_build_object(
            'date', to_char(day_series, 'YYYY-MM-DD'),
            'label', to_char(day_series, 'Mon DD'),
            'amount', COALESCE(SUM(p.amount - COALESCE(p.refund_amount, 0.00)), 0)
        ) AS item
        FROM generate_series(
            (date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata') - INTERVAL '6 days')::timestamp,
            date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp,
            INTERVAL '1 day'
        ) day_series
        LEFT JOIN public.payments p
            ON date_trunc('day', p.created_at AT TIME ZONE 'Asia/Kolkata') = day_series
            AND p.status = 'completed'
        GROUP BY day_series
        ORDER BY day_series ASC
    ) d;

    -- Recent activity feed with explicit truthful types
    SELECT COALESCE(jsonb_agg(act), '[]'::jsonb) INTO v_recent_activity
    FROM (
        SELECT * FROM (
            SELECT
                p.id::text AS id,
                'payment' AS type,
                'Payment received of ₹' || (p.amount - COALESCE(p.refund_amount, 0.00))::text || ' from ' || COALESCE(pr.full_name, pr.email, 'Aspirant') AS description,
                p.created_at AS timestamp
            FROM public.payments p
            LEFT JOIN public.profiles pr ON pr.id = p.user_id
            WHERE p.status = 'completed'
            UNION ALL
            SELECT
                s.id::text AS id,
                'subscription' AS type,
                'Subscription activated for ' || COALESCE(pr.full_name, pr.email, 'Aspirant') AS description,
                s.created_at AS timestamp
            FROM public.subscriptions s
            LEFT JOIN public.profiles pr ON pr.id = s.user_id
            WHERE s.status = 'active'
            UNION ALL
            SELECT
                pr.id::text AS id,
                'registration' AS type,
                'New student registered: ' || COALESCE(pr.full_name, pr.email, 'Student') AS description,
                pr.created_at AS timestamp
            FROM public.profiles pr
            WHERE pr.role = 'student'
            UNION ALL
            SELECT
                t.id::text AS id,
                'test_created' AS type,
                'New test created: ' || t.title AS description,
                t.created_at AS timestamp
            FROM public.tests t
            UNION ALL
            SELECT
                e.id::text AS id,
                'exam_created' AS type,
                'Exam configured: ' || e.title AS description,
                e.created_at AS timestamp
            FROM public.exams e
        ) combined
        ORDER BY timestamp DESC
        LIMIT 20
    ) act;

    SELECT jsonb_build_object(
        'totalRevenue', v_total_revenue,
        'todayRevenue', v_today_revenue,
        'monthRevenue', v_month_revenue,
        'yearRevenue', v_year_revenue,
        'revenueTrend', v_trend,
        'totalStudents', v_total_students,
        'newStudents', v_new_students,
        'activeStudents', v_active_students,
        'freeStudents', v_free_students,
        'proStudents', v_pro_students,
        'activeSubscriptions', v_active_subs,
        'testsAttempted', v_tests_attempted,
        'completedTests', v_completed_tests,
        'questionsAnswered', v_questions_answered,
        'totalExams', v_total_exams,
        'totalTests', v_total_tests,
        'topicTests', v_topic_tests,
        'fullMockTests', v_full_mock_tests,
        'pyqTests', v_pyq_tests,
        'totalQuestions', v_total_questions,
        'topicQuestions', v_topic_questions,
        'fullMockQuestions', v_full_mock_questions,
        'pyqQuestions', v_pyq_questions,
        'recentActivity', v_recent_activity
    ) INTO v_stats;

    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_v2_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_v2_stats() TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
