# Dashboard reporting corrections after 859ae95

## Scope and root causes

The previous dashboard synthesized previous-period values from current totals,
placed aggregate values into a final chart bucket, and used catalog attempt
counters that did not exist. Some failed reporting reads became zeroes. The
revenue selector did not load its own date range; ISO-to-date conversion shifted
Kolkata dates, and All Time was incorrectly routed to current-year revenue.
The pending RPC migration applied the Kolkata timezone twice.

The dashboard now reads dated rows using the caller's existing Supabase session
and RLS. It never uses a service key or silently falls back to demo records in
configured production. Exact-count, stably ordered paging exhausts result sets,
including when the server imposes a smaller page cap. Missing counts, truncated
results, changed totals, and database errors reject the reporting request.

## Metric definitions

- **Total Students**: all-time profiles with role `student`. Its comparison is
  explicitly **signup growth** in the selected period versus the immediately
  preceding equal-length period, not growth in the all-time stock.
- **Active Students**: distinct attempt users in the selected period.
- **Tests Attempted**: recorded attempts created in that period; completed
  attempts are counted separately by status.
- **Questions Solved**: stored answer rows with a non-null selected option,
  dated by answer creation. This means recorded responses, not inferred correct
  answers or an arbitrary questions-per-test multiplier.
- **Active Subscriptions**: active, unexpired subscription records now; clearly
  labeled a point-in-time metric rather than a historical period comparison.
- **Total Revenue / Revenue chart**: retained completed-payment amount minus
  recorded refund amount. Pending, failed, and fully refunded payments contribute
  zero. Rupee totals sum integer paise. This attributes retained revenue to the
  purchase date; it is **not** a cash-flow/refund-date ledger.
- **Test rankings**: actual period attempt counts matched by database test ID.
- **Exam rankings**: owning exams plus distinct `test_exams` associations; one
  test/exam pair is credited once. Shared tests may credit multiple exams.
  Progress bars normalize against total exam credits, not unique global attempts.
- **Top students**: average completed-attempt score percentage, with a strict
  start/end reporting window. Location, average score, and completed-test count
  are labeled accurately; district is not presented as an exam or score as accuracy.
- **Question/topic analysis**: actual period answer rows; same-named chapters
  from distinct subject/chapter identities are not merged.

## Filters, charts and errors

Dates are Asia/Kolkata calendar days with inclusive bounds. Custom dates reject
invalid/reversed ranges before querying. Month/quarter-to-date comparisons use
an equally long preceding interval. All Time queries from 1970 without inventing
previous-period growth; charts begin at the earliest real event.

Each chart selector performs its own bounded reporting query. Buckets are ordered,
gap-free, and non-overlapping. Each refresh publishes one complete dashboard
snapshot only after all required sources succeed. Partial failure retains the
previous complete snapshot and displays **Stale Data**, its saved period, the error,
and Retry. Initial failure displays unavailable reporting instead of fake zeroes.
Sequence tokens prevent an old response from overwriting newer filters.

Recent activity is a **bounded recent window**, not an exhaustive historical audit:
up to 20 records per source plus 200 audit entries within the selected range,
with 10 displayed per filter. Deduplication uses category, entity ID and timestamp;
distinct event types/times survive. Missing audit IDs have deterministic fallbacks.

## Original frontend-fix rollout — historical status at 194679f

`supabase/migrations/20261007151053_update_admin_dashboard_v2_stats.sql`
was corrected **in the repository only**. It fixes single-conversion Kolkata
boundaries, actual answer counts, and RPC authorization/EXECUTE grants atomically.
No production migration, roles reset, RLS weakening, or Edge Function deployment
was performed for this change.

The new frontend reporting path reads existing tables rather than depending on
this RPC, so the corrected RPC is not required to activate these frontend fixes.
Existing RLS/read permissions still apply; denied reads show an actionable error.
A GitHub/Hostinger frontend deploy does not apply Supabase SQL.

Before applying SQL: confirm whether this migration is already recorded, inspect
the live function and helpers from `20261007073444_admin_management_persistence.sql`
and `20261007102959_admin_crud_integrity.sql`, take the normal database backup,
and obtain explicit production-migration approval. Do not reapply unrelated old
migrations or reset roles. If the old version was already applied, use a separately
versioned corrective migration rather than rewriting production migration history.

## Verification

- TypeScript, changed-file ESLint, and production Vite build checked locally.
- New reporting regression tests: real previous periods, historical buckets, capped
  paging, exact answer zeroes, partial refunds, All Time, shared exam associations,
  bounded leaderboard, query failures, timezone boundaries and event deduplication.
- New component regression tests: real growth/history/rankings, revenue selector,
  All Time query, failed initial load and Retry, stale snapshot preservation,
  reversed custom dates, and out-of-order requests.
- Disposable PostgreSQL fixture validates the pending SQL in UTC, Asia/Kolkata,
  and America/New_York, including a payment at 01:00 IST, net refunds, stored
  responses, student-only profiles, distinct Pro users, anonymous grants and
  administrator authorization. No production records are test fixtures.

Run SQL validation after installing `@electric-sql/pglite` separately:

```sh
PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js \
  node scripts/tests/admin-dashboard-sql.mjs
```

The pre-change full suite at `859ae95` was 353 passed / 38 failed (391 total).
The final post-change run was 379 passed / the same 38 failed (417 total), with
no additional failing test names. The focused six-file suite passed all 76 tests,
including 26 new reporting/component regressions. Changed-file ESLint had no
errors or warnings. This is not a claim that the pre-existing full suite is green.

Authenticated live-dashboard verification requires an actual staff session.
Public deployed asset verification alone does not prove the live account's data
or read permissions, and no live payment/history mutations were used for testing.

## Concurrent-main verification

Before push, `main` received `51a9653` (test-icon upload) and `ebb8e60`
(English-only Dashboard headings). Both were preserved by rebasing these fixes.
An isolated baseline at `ebb8e60` produced **359 passed / 38 failed (397 total)**.
The merged implementation produced **385 passed / the same 38 failed (423 total)**,
with no newly failing test names. TypeScript, changed-file ESLint and the merged
production build passed again after rebase. The SQL fixture remained isolated.

## Production SQL rollout — completed after explicit approval

The user subsequently authorized production application of the corrected
Dashboard RPC migration. It was applied to the `practicekoro` Supabase project
(`prycanbnxuihxhskallw`) using the migration tool, without changing application
records, resetting roles, weakening RLS, or applying unrelated migrations.

- Original requested source: `20261007180000_update_admin_dashboard_v2_stats.sql`.
- Applied migration name: `update_admin_dashboard_v2_stats`.
- Supabase-recorded version: **20261007151053**.
- Repository filename aligned to `20261007151053_update_admin_dashboard_v2_stats.sql`
  so migration tooling does not see this as a second pending migration. SQL content
  was not changed during this filename alignment.
- Source SHA256: `ffa5da97861a5155b1ef50a0ecba00dc658e6794a9edd0ddc46302f8bcb46578`.

Preflight confirmed the old RPC, both required management helpers, matching
column types, and no dependent database objects. The previous RPC definition
and grants were retained locally for a rollback reference. This is a function
backup, not a full production database backup.

Post-apply catalog checks confirmed the new definition, pinned search path,
SECURITY DEFINER, authenticated EXECUTE, and no PUBLIC/anonymous EXECUTE.
Read-only verification used transaction-local JWT/role settings (not a browser
login) to invoke the real RPC under an active super-admin identity. Live revenue
and response/attempt/student/subscription counts matched independent SQL totals
in UTC, Asia/Kolkata and America/New_York. The seven-day trend returned seven
buckets. Missing identity and an existing student's identity were rejected.
No payment, subscription, student, attempt or history records were modified.

No manual reapplication of either filename is necessary. This completes the SQL
rollout; authenticated browser Dashboard verification remains a separate check.
