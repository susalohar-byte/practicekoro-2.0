# Admin recheck: five confirmed issues fixed

## Scope

This patch addresses the five defects reproduced in the post-migration admin audit. It does not reset the database, change RLS, add migrations, delete production records, or send real messages.

## Changes

1. **Notification analytics:** production delivery/open/click/failure values now display `Unavailable` rather than invented percentages. Sample trends are demo-only. The sent count is explicitly a count of loaded notice records, not recipients or proven deliveries. Actual telemetry collection has not been implemented.
2. **Notification date filtering:** default is `All Time`. `Last 7 Days`, `Last 30 Days`, `This Month`, and custom ranges filter actual timestamps on inclusive local calendar dates. Undated records are not assigned today's date. Reversed or missing custom bounds disable Apply and display an error.
3. **Settings loading:** production settings and gateway reads propagate backend errors instead of returning demo/local defaults. Editable settings are hidden until loading succeeds, with an explicit error and Retry action on failure. Support and admin contact emails load/save separately so a general save does not overwrite the loaded support email with the default admin email.
4. **Exam deletion feedback:** optional browser cache cleanup is isolated from the confirmed backend deletion. Cache quota/security failures do not report deletion failure or put the exam back.
5. **Exam refresh resilience:** confirmed backend records are reconciled into the list/drawer before a follow-up refresh. If refresh fails, the saved state stays visible and an explicit refresh warning/Retry appears. This covers create, edit, status/archive, logo updates, drawer settings and duplicate drafts. Backend mutation failures still preserve the previous row/form and do not fabricate success.

## Verification

Production-mode mocks are used for settings, notifications and exam regressions; they do not connect to the live Supabase project. New regression tests cover all five defects, authoritative settings failures/empty reads, retry, distinct contact emails, calendar boundaries and refresh failure after create/edit. Existing CRUD tests continue to cover failed backend mutations, protected deletion, actual saved IDs and duplicate submits.

- TypeScript: passed.
- Changed-file ESLint: passed, zero errors and zero warnings.
- Production build: passed.
- New regression assertions: 26 passed; focused five-file regression group: 34 passed (including eight existing exam tests).
- Full suite: 319 passed / 39 failed / 358 total. Baseline was 293 passed / 39 failed / 332 total. Exact failed test names were compared: no new or removed failure names. The inherited suite remains red.
- Disposable PostgreSQL authorization, protected deletion and transaction/rollback checks: passed.

The 39 existing failures were not removed or weakened to obtain a green result.

## Rollout

No Supabase migration or Edge Function deployment is required. Push the focused commit to `main` for the user's Hostinger auto-deploy. Verify the compiled live assets against the build before claiming frontend deployment completion. Authenticated production CRUD smoke-testing still requires an admin browser session and safe disposable fixtures; real production data must not be deleted for testing.
