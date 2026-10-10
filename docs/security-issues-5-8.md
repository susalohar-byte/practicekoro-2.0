# Security issues 5–8: implementation and rollout report

## Status

- **#5 server-side permissions: applied to production.** Migration `20261010071456_admin_scope_authorization.sql` adds explicit active staff/sub-role checks to seven RPCs and restrictive RLS guards around student/financial data, batches, payment gateways, test associations, attempts, and content media writes. Existing student ownership paths and earlier service-only payment write protections remain intact. Content Writer aggregate content counts remain supported; financial analytics is Super Admin-only.
- **#6 trustworthy auditing: applied to production.** Migration `20261010071514_server_mutation_auditing.sql` revokes browser audit writes (including column-level grants) and restricts audit reads to Super Admin. Transactional BEFORE mutation triggers capture the verified staff identity before self-demotion/deletion and record only changed field names, entity IDs and operation, not secret values or full student payloads. A failed audit insert rolls back the mutation. Present listed admin tables and storage objects are covered.
- **#7 safe CSV exports: implemented and built; frontend hosting deployment pending.** A shared encoder neutralizes formula/control prefixes, quotes every cell and escapes quotes/newlines. All located dynamic admin CSV exporters use it, including notification, audit, question/result and financial exports. Numeric values remain numeric text; formula-like strings receive an apostrophe. Data-URI exports encode `#` and other reserved characters correctly.
- **#8 fail-closed client roles: implemented and built; frontend hosting deployment pending.** Email allowlists and user metadata no longer grant staff privileges. Missing/invalid sub-roles and failed profile/role reads deny admin access. Automatic promotion RPC calls are removed. Registration does not manufacture Super Admin state. Unknown permission-matrix roles return no permissions.

## Audit boundaries

- Historical client-generated logs are retained, **not retrospectively verified**. The frontend patch labels them unverified and stops inventing `127.0.0.1` IP addresses.
- Service-role changes are truthfully attributed to `service_role`, not to an invented human. Edge Functions using a service client do not yet carry an independently verified human actor into the database audit event.
- These triggers audit mutations, not every read, export, login, failed authorization attempt or Auth-only operation. Existing frontend events are not authoritative audit evidence.
- Privileged database owners and trusted service credentials are outside browser append-only protection; this is not an external tamper-evident/WORM log system.
- Content Writer access to the general student directory and raw financial data is intentionally removed. Dedicated authorized content/support RPCs retain their existing behavior; every sub-role UI workflow was not manually exercised in production.

## Verification

- **95/95** isolated PostgreSQL scope/audit assertions passed, including direct RPC denial for restricted/invalid/inactive roles, restrictive policy behavior under deliberately broad permissive policies, legitimate content/Super Admin operations, inability to forge/edit/delete audit entries, service attribution, sensitive-value exclusion, self-demotion attribution and transactional rollback on audit failure.
- **16/16** read-only production metadata assertions passed after migration application.
- Production profiles, user roles, payments and subscriptions had identical pre/post rollout fingerprints. Existing audit row count stayed at eight; no real accounts, subscriptions or payments were altered for testing.
- Previous isolated regression suites passed: payment write lock **70**, bulk subscription grants **93**, verified staff identity **46**, avatar ownership **23**, payment activation **18**.
- Targeted frontend suite: **41/41 passed**. Production TypeScript/Vite build passed. Changed-file lint: no errors; one existing effect-dependency warning in Test Series.
- Full frontend suite: **779 passed, 2 failed**. Both failures also reproduce on the unchanged `496250f` baseline in `AdminSettings.behavior.test.tsx`: the tests select the first file input (now the profile photo field), rather than the intended logo field. Those unrelated tests were not altered or suppressed.

## Frontend handoff

The source changes and production-ready `dist` package are ready. A fresh live asset comparison still reports an older production App bundle, so **#7 and #8 must not be represented as live until hosting deployment and post-deployment verification complete**. No FTP deployment variables or ready hosting connection are available in this environment. Production backend migrations do not require reapplication.

Deploy the built release through the existing hosting process, retaining previous assets for rollback, then verify the live bundle and hard-refresh the admin panel. Recheck CSV exports, invalid-role/error-state denial and audit labels after rollout. Issues #9–#12 are untouched.
