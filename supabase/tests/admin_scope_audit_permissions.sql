-- Read-only production metadata verification; does not modify users, payments or subscriptions.
WITH scoped_functions AS (
 SELECT p.oid,pg_get_functiondef(p.oid) def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname=ANY(ARRAY['archive_test','get_admin_payments','get_admin_subscriptions','get_admin_students','bulk_assign_students_to_batch','admin_get_payment_gateway','get_admin_dashboard_counts'])
), audit_tables AS (
 SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
 AND c.relname=ANY(ARRAY['profiles','user_roles','payments','subscriptions','subscription_plans','coupons','blog_posts','hero_banners','cutoff_records','exam_cutoff_configs','student_notes','student_batches','student_batch_members','payment_gateways','app_settings','exams','subjects','chapters','questions','test_attempts','test_results','attempt_answers','live_test_participants','exam_categories','test_series','tests','live_tests','test_questions','test_exams','exam_topics','notifications','support_tickets'])
)
SELECT jsonb_build_object(
 'seven_rpc_guards',(SELECT count(*)=7 AND bool_and(def LIKE '%admin_scope_allowed(%') FROM scoped_functions),
 'rpc_anon_denied',(SELECT bool_and(NOT has_function_privilege('anon',oid,'EXECUTE')) FROM scoped_functions),
 'rpc_authenticated_allowed',(SELECT bool_and(has_function_privilege('authenticated',oid,'EXECUTE')) FROM scoped_functions),
 'anonymous_scope_denied',NOT public.admin_scope_allowed('super'),
 'profile_read_restrictive',EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='staff_read_scope' AND permissive='RESTRICTIVE'),
 'gateway_restrictive',EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_gateways' AND policyname='staff_management_scope' AND permissive='RESTRICTIVE'),
 'association_guards',(SELECT count(*)=9 FROM pg_policies WHERE schemaname='public' AND tablename IN ('test_questions','test_exams','exam_topics') AND policyname LIKE 'staff_content_%' AND permissive='RESTRICTIVE'),
 'audit_client_insert_denied',NOT has_table_privilege('authenticated','public.admin_audit_logs','INSERT'),
 'audit_client_update_denied',NOT has_table_privilege('authenticated','public.admin_audit_logs','UPDATE'),
 'audit_client_delete_denied',NOT has_table_privilege('authenticated','public.admin_audit_logs','DELETE'),
 'audit_client_column_writes_denied',NOT EXISTS(SELECT 1 FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='admin_audit_logs' AND grantee IN ('anon','authenticated') AND privilege_type IN ('INSERT','UPDATE')),
 'audit_read_super_only',EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_audit_logs' AND policyname='server_audit_read' AND permissive='RESTRICTIVE' AND qual LIKE '%admin_scope_allowed%'),
 'audit_function_not_rpc',NOT has_function_privilege('authenticated','public.audit_privileged_mutation()','EXECUTE') AND NOT has_function_privilege('anon','public.audit_privileged_mutation()','EXECUTE'),
 'all_present_tables_audited',NOT EXISTS(SELECT 1 FROM audit_tables a WHERE NOT EXISTS(SELECT 1 FROM pg_trigger t WHERE t.tgrelid=a.oid AND t.tgname='audit_privileged_mutation' AND t.tgenabled='O')),
 'storage_audited',EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='storage.objects'::regclass AND tgname='audit_privileged_mutation' AND tgenabled='O'),
 'audit_values_redacted',pg_get_functiondef('public.audit_privileged_mutation()'::regprocedure) NOT LIKE '%''old_values''%' AND pg_get_functiondef('public.audit_privileged_mutation()'::regprocedure) LIKE '%changed_fields%'
) AS security_checks;
