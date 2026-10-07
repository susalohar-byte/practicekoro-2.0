# Admin Subjects correctness and persistence fixes

## Scope and findings

The Subjects screen combined real subject rows with fabricated KPI/detail values and static topics/tests. Creation assigned invented topic/test/question totals and scores. Import/template/order controls reported cosmetic success without their promised writes. Core load errors were buried in editor-only state. Slug generation could erase manually entered values, IDs could collide, subject/topic reads could be capped by the server, and upload/save/delete state needed confirmation and race protection.

Live `/admin/subjects` redirected the agent browser to login. Findings were established by current repository review, isolated API/UI regressions, and read-only Supabase schema/constraint inspection; no authenticated production CRUD test was performed.

## Implemented

- Complete, exact-count paginated subject/topic reads, stable ordering, actual database timestamps and identity.
- Real subject/topic/test/question counts; actual subject-linked attempts, completion rate and mean completed score percentages. Accuracy is pooled correct/(correct+wrong) from completed subject-linked attempts. Both `topic` and legacy `chapter_mock` types count as topic tests. Unknown/denied metrics are explicitly unavailable, not fabricated zeroes.
- Real topics/tests per selected subject, no static science examples, honest empty/error/retry states and optional-statistic warnings.
- Creation/edit uses confirmed returned records and IDs, preserves entered values after failure, and synchronizes shared data only on confirmation. Production does not inject demo presets into backend results.
- Separate validated lowercase URL slug for Bengali/non-ASCII names; explicit slug remains intact when the name changes. Fresh backend checks distinguish exam-scoped/global slugs. New IDs use UUIDs rather than truncated-name/time collisions.
- Delete uses the existing protected `admin_delete_record` RPC; mismatched/false/failed responses retain the row. Inbound dependencies remain protected. Confirmed deletion clears only that row's checkbox/menu/drawer; it never opens another subject.
- Duplicate creates a new draft subject record, not a fake copy of topics/tests.
- CSV/JSON import validates the whole file before writes, supports real CSV quoting and a downloadable template, accepts 1–100 subjects/5 MB, and uses actual sequential creates. Partial failures remain explicit; retries exclude already saved rows. This is per-record persistence, not an atomic bulk transaction.
- Display ordering covers every loaded subject, not just the current table page; only changed rows are written and confirmed. Partial failures and retries are explicit; successful values are not rewritten on retry.
- PNG/JPEG/WebP icons <=2 MB use durable Supabase Storage HTTPS URLs. Temporary blob/data/insecure references are rejected for production saves. Save/close are blocked during upload; storage errors preserve the form. Known named icons and broken-image fallback render correctly.
- Synchronous mutation/upload locks prevent duplicate requests. Better form/dialog labels, visible feedback, mobile editor scrolling, background-scroll lock, current-page checkbox membership, dynamic category filters, correct topic/practice links.

## Production database guard — applied after explicit approval

`supabase/migrations/20261007203958_subjects_global_slug_guard.sql` adds a narrowly scoped partial unique index on `lower(trim(slug))` for subjects with `exam_id IS NULL`. Existing UNIQUE(exam_id,slug) does not prevent duplicate NULL/global scopes. Fresh frontend/API checks cannot eliminate concurrent-writer races; the index is required for race-proof global uniqueness.

After explicit user approval, the guard was applied through Supabase MCP as `subjects_global_slug_guard`, recorded version `20261007203958`. The originally proposed file `20261007203000_subjects_global_slug_guard.sql` was renamed to match the production ledger; do not reapply it under the old version. Preflight and postflight found 0 duplicate global slug groups. The index is unique, valid, ready, normalized by lower(trim(slug)), and scoped to exam_id IS NULL. Before/after counts remained 12 subjects / 10 global subjects. No subject/history/storage rows were rewritten. Do not replay historical migrations or weaken RLS.

The SQL fixture test is disposable/in-memory and verifies duplicate rejection, preservation of exam-scoped subjects, rollback on failed edits, and safe reapplication. Run with `PGLITE_MODULE` pointing to an installed @electric-sql/pglite module if not installed in this checkout.

## Verification

Verification results are recorded below after final checks. UI/backend tests use mocks and fixtures, not live-account mutations. Local responsive preview blocks non-local network requests and is not evidence of authenticated production operation. GitHub push and Hostinger deployment are reported separately.

### Final verification on latest-main integration (`defbbe4`)

- Subjects-focused regressions: **42/42 passed** (13 UI workflows, 8 backend integrity, 13 model/validation, 8 CSV/JSON parser tests).
- Changed-file ESLint: **0 errors / 0 warnings**.
- TypeScript: passed. Production build (`tsc -b && vite build`): passed.
- Disposable SQL guard fixture: passed.
- Local fixtures at desktop 1280 px/mobile 375 px: no page errors or document horizontal overflow; editor fits viewport and permits scrolling. Temporary preview entrypoints were removed.
- Untouched current-main baseline: **453 passed / 35 failed / 488 total**. Integrated Subjects fixes: **495 passed / 35 failed / 530 total**. Exact failed-test identities are unchanged: **no new regression failures**. The suite remains red due to pre-existing failures, not fully passing.
- Concurrent Dashboard removal and sidebar changes were preserved. Baseline/reports were isolated from production by demo/mocked test configuration.
- Live login prevented authenticated CRUD verification. No real subjects, topics, attempts, paid access, messages, or shared storage files were deleted/modified for testing.

### Approved production rollout confirmation

- Supabase migration `subjects_global_slug_guard` applied successfully; version `20261007203958` and the actual index metadata independently verified.
- Hostinger now serves Subjects chunk `AdminSubjects-B4IU1HL9.js` with all four new workflow/loading/reporting markers present. This verifies deployed code, not authenticated CRUD operation.
- The browser still redirects to login; no real-account writes or destructive production tests were performed.
