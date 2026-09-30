-- ============================================================================
-- PRACTICEKORO RLS/SECURITY ASSERTION SUITE (plain SQL, no pgTAP required)
-- ============================================================================
-- Runs against any Supabase Postgres (production included) with psql.
-- Usage:
--   SUPABASE_DB_PASSWORD=... ./scripts/supabase-sql.sh -f supabase/tests/rls_security.sql
-- Every block is wrapped in begin/rollback: zero writes persist.
-- Output: a single JSON row of named assertions; verify all are true (ci: true).

begin;

-- ------------------------------------------------------------------
-- 1. RLS enabled on every table in the public schema
-- ------------------------------------------------------------------
select jsonb_build_object(
  'rls_enabled_all_public_tables', (
    select bool_and(relrowsecurity)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  -- Named spot-checks (fail loudly if a new table was added without RLS)
  'rls_profiles',        (select relrowsecurity from pg_class where oid='public.profiles'::regclass),
  'rls_user_roles',      (select relrowsecurity from pg_class where oid='public.user_roles'::regclass),
  'rls_exams',           (select relrowsecurity from pg_class where oid='public.exams'::regclass),
  'rls_subjects',        (select relrowsecurity from pg_class where oid='public.subjects'::regclass),
  'rls_chapters',        (select relrowsecurity from pg_class where oid='public.chapters'::regclass),
  'rls_test_series',     (select relrowsecurity from pg_class where oid='public.test_series'::regclass),
  'rls_tests',           (select relrowsecurity from pg_class where oid='public.tests'::regclass),
  'rls_questions',       (select relrowsecurity from pg_class where oid='public.questions'::regclass),
  'rls_test_questions',  (select relrowsecurity from pg_class where oid='public.test_questions'::regclass),
  'rls_subscription_plans', (select relrowsecurity from pg_class where oid='public.subscription_plans'::regclass),
  'rls_payments',        (select relrowsecurity from pg_class where oid='public.payments'::regclass),
  'rls_subscriptions',   (select relrowsecurity from pg_class where oid='public.subscriptions'::regclass),
  'rls_test_attempts',   (select relrowsecurity from pg_class where oid='public.test_attempts'::regclass),
  'rls_attempt_answers', (select relrowsecurity from pg_class where oid='public.attempt_answers'::regclass),
  'rls_test_results',    (select relrowsecurity from pg_class where oid='public.test_results'::regclass),
  'rls_mistakes',        (select relrowsecurity from pg_class where oid='public.mistakes'::regclass),
  'rls_bookmarks',       (select relrowsecurity from pg_class where oid='public.bookmarks'::regclass),
  'rls_test_exams',      (select relrowsecurity from pg_class where oid='public.test_exams'::regclass),
  'rls_payment_gateways',(select relrowsecurity from pg_class where oid='public.payment_gateways'::regclass)
) as rls_enabled;

-- ------------------------------------------------------------------
-- 2. Ownership scoping: sensitive tables carry auth.uid() policies
-- ------------------------------------------------------------------
select jsonb_build_object(
  'payments_owner_policy',     exists(select 1 from pg_policies where schemaname='public' and tablename='payments' and qual ilike '%auth.uid()%'),
  'subscriptions_owner_policy',exists(select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and (qual ilike '%auth.uid()%' or with_check ilike '%auth.uid()%')),
  'attempts_owner_policy',     exists(select 1 from pg_policies where schemaname='public' and tablename='test_attempts' and (qual ilike '%auth.uid()%' or with_check ilike '%auth.uid()%')),
  'answers_owner_policy',      exists(select 1 from pg_policies where schemaname='public' and tablename='attempt_answers' and qual ilike '%user_id = auth.uid()%'),
  'results_owner_policy',      exists(select 1 from pg_policies where schemaname='public' and tablename='test_results' and qual ilike '%auth.uid()%'),
  'mistakes_owner_policy',     exists(select 1 from pg_policies where schemaname='public' and tablename='mistakes' and qual ilike '%auth.uid()%'),
  'bookmarks_owner_policy',    exists(select 1 from pg_policies where schemaname='public' and tablename='bookmarks' and qual ilike '%auth.uid()%'),
  'questions_admin_only',      exists(
                                 select 1 from pg_policies
                                 where schemaname='public' and tablename='questions'
                                   and cmd='SELECT' and policyname ilike '%admin%'
                               ),
  'questions_no_anon_policy',  not exists(
                                 select 1 from pg_policies
                                 where schemaname='public' and tablename='questions'
                                   and cmd='SELECT' and qual ilike '%auth.role() = ''authenticated''%'
                               )
) as ownership_policies;

-- ------------------------------------------------------------------
-- 3. Privilege hardening: gateway table + webhook function locked down
-- ------------------------------------------------------------------
select jsonb_build_object(
  'gateway_mutation_blocked',  not has_table_privilege('authenticated','public.payment_gateways','INSERT,UPDATE,DELETE'),
  'gateway_anon_read_blocked', not has_table_privilege('anon','public.payment_gateways','SELECT'),
  'webhook_execute_blocked',   not has_function_privilege('authenticated','public.reconcile_razorpay_webhook(text,text,numeric,text,text)','EXECUTE'),
  'webhook_anon_execute_blocked', not has_function_privilege('anon','public.reconcile_razorpay_webhook(text,text,numeric,text,text)','EXECUTE'),
  'webhook_service_role_allowed',  has_function_privilege('service_role','public.reconcile_razorpay_webhook(text,text,numeric,text,text)','EXECUTE'),
  'series_analytics_authenticated_allowed', has_function_privilege('authenticated','public.get_test_series_analytics(text)','EXECUTE'),
  'series_analytics_anon_blocked', not has_function_privilege('anon','public.get_test_series_analytics(text)','EXECUTE')
) as privileges;

-- ------------------------------------------------------------------
-- 4. Security definer functions: search_path pinned (advisor hygiene)
-- ------------------------------------------------------------------
select jsonb_build_object(
  'helpers_pinned', (
    select bool_and(proconfig::text like '%search_path%')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname in ('has_role','has_active_subscription','has_test_access',
                        'create_razorpay_order','verify_razorpay_payment',
                        'reconcile_razorpay_webhook','get_student_subscription_details')
  ),
  'engine_pinned', (
    select bool_and(proconfig::text like '%search_path%')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname in ('start_test_attempt','save_test_answers','submit_test_attempt',
                        'get_student_exam_questions','get_attempt_solutions',
                        'get_test_series_analytics')
  )
) as definer_search_path;

-- ------------------------------------------------------------------
-- 5. Security definer view fixed (migration 013)
-- ------------------------------------------------------------------
select jsonb_build_object(
  'user_test_access_security_invoker', (
    select coalesce(reloptions::text like '%security_invoker=true%', false)
    from pg_class where oid = 'public.user_test_access'::regclass
  ),
  'user_test_access_anon_revoked', (
    not has_table_privilege('anon','public.user_test_access','SELECT')
  ),
  'user_test_access_authed_readable', (
    has_table_privilege('authenticated','public.user_test_access','SELECT')
  )
) as views;

rollback;

-- ============================================================================
-- POST-MIGRATION STATE PROBE (anon role via PostgREST)
-- Run this against the live API to prove the policy state end-to-end:
--   python3 scripts/prod-anon-probe.py
-- (kept as documentation here; the script is the executable source of truth)
-- ============================================================================
