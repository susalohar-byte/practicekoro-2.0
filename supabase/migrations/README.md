# Supabase Migration Catalog & Production Rollout Guide

This directory contains the canonical historical Supabase migration files for PracticeKoro 2.0.

---

## 1. Migration History & Production Status

| Migration File                                                  | Description                                                                                                                        | Production Status |
| :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :---------------: |
| `001_initial_schema.sql`                                        | Core schema (profiles, exams, subjects, chapters, tests, questions)                                                                |    **APPLIED**    |
| `002_rls_policies.sql`                                          | Row Level Security policies for core tables                                                                                        |    **APPLIED**    |
| `003_seed_data.sql`                                             | Initial subjects, chapters, and seed exams                                                                                         |    **APPLIED**    |
| `004_mock_test_engine_rpc.sql`                                  | Mock test submission, scoring, and attempt engine                                                                                  |    **APPLIED**    |
| `005_phase2a_security_hardening.sql`                            | Hardened RLS policies for auth and attempts                                                                                        |    **APPLIED**    |
| `006_admin_content_management.sql`                              | Admin content curation, question creation, test publishing                                                                         |    **APPLIED**    |
| `007_subscription_razorpay.sql`                                 | Pro pass monetization, Razorpay orders, payments, verification                                                                     |    **APPLIED**    |
| `008_security_hardening.sql`                                    | User attempt isolation and answer privacy                                                                                          |    **APPLIED**    |
| `009_test_types_and_associations.sql`                           | Exam association updates and test types                                                                                            |    **APPLIED**    |
| `010_remove_question_difficulty_constraint.sql`                 | Difficulty check relaxation for dynamic tagging                                                                                    |    **APPLIED**    |
| `011_make_subject_exam_id_optional.sql`                         | Allows subjects to span multiple exams                                                                                             |    **APPLIED**    |
| `011_role_source_of_truth.sql`                                  | `user_roles` table as authoritative role boundary                                                                                  |    **APPLIED**    |
| `013_fix_user_test_access_view.sql`                             | Test catalog access control view                                                                                                   |    **APPLIED**    |
| `014_canonical_question_bank_architecture.sql`                  | `exam_topics` many-to-many mapping & PYQ metadata                                                                                  |    **APPLIED**    |
| `015_repair_broken_admin_policies.sql`                          | Restores admin-only management RLS policies                                                                                        |    **APPLIED**    |
| `015_upgrade_admin_practicekoro_online.sql`                     | Admin promotion for `admin@practicekoro.online`                                                                                    |    **APPLIED**    |
| `016_separate_question_sources.sql`                             | Performance indexes for source types (Topic, Full Mock, PYQ)                                                                       |    **APPLIED**    |
| `017_allow_topic_mock_tests_without_exam.sql`                   | Nullable `tests.exam_id` for standalone topic mock tests                                                                           |    **APPLIED**    |
| `018_admin_v2_architecture.sql`                                 | `app_settings`, `notifications`, `support_tickets`, admin stats RPC                                                                |    **PENDING**    |
| `019_admin_v2_polish.sql`                                       | Performance indexes on `questions` and `test_questions`                                                                            |    **PENDING**    |
| `020_replace_questions_with_bengali.sql`                        | Bengali competitive exam question bank seed                                                                                        |    **PENDING**    |
| `021_upgrade_admin_and_sync_rpc.sql`                            | `sync_admin_profile` RPC for instant role sync                                                                                     |    **PENDING**    |
| `022_add_free_plan.sql`                                         | `plan_free` Starter tier in `subscription_plans`                                                                                   |    **PENDING**    |
| `024_create_coupons_table.sql`                                  | `coupons` table and discount validation RPCs                                                                                       |    **PENDING**    |
| `025_notifications_scheduling_and_audience.sql`                 | `notifications.scheduled_at`, cron, and student audience RLS                                                                       |    **PENDING**    |
| `026_remove_admin_practicekoro_com.sql`                         | Demotes legacy `admin@practicekoro.com` from admin                                                                                 |    **PENDING**    |
| `027_commerce_student_management.sql`                           | Bulk student cohorts (`student_batches`), refund tracking                                                                          |    **PENDING**    |
| `027_question_images_and_exam_categories.sql`                   | `exam_categories` table, `questions.image_url` for diagrams                                                                        |    **PENDING**    |
| `028_app_settings_upsert_and_maintenance_rls.sql`               | Public read RLS on app settings & maintenance mode                                                                                 |    **PENDING**    |
| `029_admin_roles_and_audit_logs.sql`                            | Multi-admin RBAC (`admin_role`) and `admin_audit_logs`                                                                             |    **PENDING**    |
| `030_sync_test_question_counts_trigger.sql`                     | Automatic test question count & marks sync trigger                                                                                 |    **PENDING**    |
| `031_admin_payment_gateway_management.sql`                      | Secure RPCs for Razorpay gateway credentials & zero-leak preview                                                                   |    **PENDING**    |
| `032_app_settings_grants_and_admin_rpc.sql`                     | Full grants on app_settings, atomic admin RPC, avatar storage policy                                                               |    **PENDING**    |
| `033_strictly_reset_student_roles_and_fix_admin.sql`            | Drop super_admin default from profiles, reset student accounts to student, guarantee admin@practicekoro.online is sole Super Admin |    **PENDING**    |
| `034_fix_payment_gateway_and_order_creation.sql`                | Authoritative Razorpay order RPC + gateway credential hardening                                                                    |    **PENDING**    |
| `035_auto_revoke_subscription_on_refund.sql`                    | Auto-revoke Pro subscription on refund webhook                                                                                     |    **PENDING**    |
| `036_test_level_negative_marking.sql`                           | Test-level optional negative marking (Full Mock / PYQ only) in `submit_test_attempt`                                               |    **PENDING**    |
| `037_create_hero_banners_table.sql`                             | `hero_banners` table for student dashboard carousel                                                                                |    **PENDING**    |
| `038_submit_attempt_covering_indexes.sql`                       | Covering indexes for `submit_test_attempt` rank/count hot paths                                                                    |    **PENDING**    |
| `039_verify_payment_require_signature.sql`                      | `verify_razorpay_payment` rejects empty signatures (no-proof activation hole closed)                                               |    **PENDING**    |
| `040_pyq_question_images_in_rpcs.sql`                           | Expose `image_url` in runner + solutions RPCs for PYQ diagrams                                                                     |    **PENDING**    |
| `040_sync_hero_banners_app_settings.sql`                        | Sync hero banners with app_settings fallback                                                                                       |    **PENDING**    |
| `041_add_district_to_profiles.sql`                              | Add district field to user profiles                                                                                                |    **PENDING**    |
| `042_expose_subjects_in_student_rpcs.sql`                       | Restore subject and chapter metadata in student RPCs                                                                               |    **PENDING**    |
| `043_update_exam_categories.sql`                                | Standardize exam categories to 5 curated categories and purge legacy                                                               |    **PENDING**    |
| `20261003060135_popular_exam_carousel.sql` | Seed the admin-managed Popular Exam carousel configuration shared by web and Flutter student apps                       |    **APPLIED**    |
| `20261003060141_filtered_app_leaderboard.sql` | Add exam and date filters to the privacy-masked student leaderboard RPC                                                   |    **APPLIED**    |
| `20261003061413_admin_managed_live_tests.sql` | Add RLS-protected Admin-managed live events, participation, and series metadata                                            |    **APPLIED**    |
| `20261003061428_core_exam_scoring_and_series_analytics.sql` | Apply saved test-level scoring and expose caller-scoped series result analytics                              |    **APPLIED**    |
| `20261003061700_secure_test_series_leaderboard.sql` | Add authenticated, district-filtered test-series ranking from completed attempts with masked student names |    **APPLIED**    |
| `20261003061839_published_only_test_series_rankings.sql` | Exclude results from tests that admins have unpublished from student rankings |    **APPLIED**    |
| `20261003062139_popular_exam_image_storage.sql` | Add public card-image delivery with administrator-only upload/delete policies |    **APPLIED**    |

---

## 2. Safety Rules

1. **Do not rename or delete historical migration files:** Supabase records migrations by filename. Duplicate numbers (`011`, `015`, `027`, `037`) and gaps (`012`, `023`) are preserved intentionally.
2. **New migrations must use the next free sequential number** (currently `039+`) and never reuse an existing prefix — this keeps filenames unique going forward without rewriting history.
3. **Deleted:** `CONSOLIDATED_PENDING_018_TO_031.sql` (removed; it was an unreferenced partial bundle missing 010–017 and risked divergent applies — the individual files above are canonical).
4. **Lexicographical execution order:** Migrations must always run in alphabetical/lexicographical order as listed in `scripts/apply-migrations-prod.sh`.
5. **Idempotency:** Every migration uses `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING/UPDATE`, and `DROP POLICY IF EXISTS` guards to prevent corruption on re-run.

---

## 3. How to Verify Production State

Run the automated verification probe (requires no password, uses `.env` public keys):

```bash
python3 scripts/verify-prod-migrations.py
```

Or:

```bash
bash scripts/apply-migrations-prod.sh --verify
```

---

## 4. How to Apply Pending Migrations

### Preview pending migrations without making changes:

```bash
bash scripts/apply-migrations-prod.sh --dry-run
```

### Apply all pending migrations (018 through 029):

Get the database password from Supabase Dashboard > Project Settings > Database > Database password, then run:

```bash
SUPABASE_DB_PASSWORD="your-db-password" bash scripts/apply-migrations-prod.sh
```

### Re-apply / verify all 30 migrations (idempotent-safe):

```bash
SUPABASE_DB_PASSWORD="your-db-password" bash scripts/apply-migrations-prod.sh --all
```
