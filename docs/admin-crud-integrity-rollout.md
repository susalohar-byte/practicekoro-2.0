# Admin CRUD integrity: implementation and rollout

## Release status

The backend migrations were applied to the production Supabase project
`prycanbnxuihxhskallw` with explicit approval. Supabase generated these ledger
versions; repository filenames now match them to prevent duplicate application:

- `20261007084500_student_internal_notes.sql` → `20261007102947_student_internal_notes.sql`
- `20261007100000_admin_crud_integrity.sql` → `20261007102959_admin_crud_integrity.sql`

SQL bodies were unchanged. Post-apply catalog checks confirmed all 14 metadata
columns, RLS on the three new tables, 44 restrictive write guards, and no anon
EXECUTE grant on the nine mutating RPCs. The read-only authorization helper
remains executable for policy evaluation. These checks do not establish live
end-to-end CRUD success or certify all existing project security advisories.

**The matching Hostinger frontend has not been deployed by this work.** GitHub
push alone does not update the live website.

The work was reconciled with concurrent `main` commit `908508b`, preserving its
financial displays, actual-plan selection, student performance/notes work,
settings fixes, and payment receipt/invoice behavior.

## Root causes addressed

- Exam, subject and topic preset/cache merging could recreate rows that did not
  exist in the production database. Production loads now use actual records;
  preset enrichment never inserts absent records.
- Optimistic/local-only updates, swallowed errors and unchecked `success:false`
  results could produce success feedback after a failed mutation.
- Missing/zero-row mutations were treated as success. Updates require confirmed
  rows and deletes require an authorized RPC response with the exact deleted ID.
- Question creation/import/duplication used UI-generated IDs instead of returned
  records; bulk actions could discard failed selections. Confirmed batches retain
  failures and their messages.
- Pre-deletion association cleanup could damage linked content/history before
  the parent deletion failed. Protected deletion now locks the parent and blocks
  **every existing incoming foreign-key reference**, even cascading references.
- Content collection edits rewrote whole cached banner/blog lists. Their
  production writes now operate atomically on the authoritative `app_settings`
  collection, returning the actual saved record and ID.
- Assignment replacement fallback deleted mappings before a failed insert.
  Exam/topic, test/exam and test/question mapping changes use validated atomic
  RPCs; bulk series assignments are also atomic.
- Production image upload failures could silently use browser-only data URLs.
  Durable storage upload errors now fail rather than pretending to persist.

## Covered surfaces

Exams, categories, subjects, topics, question bank (including row actions,
imports and bulk status/delete), tests and assigned questions, test series,
live tests, banners, blog CRUD, notifications and cutoff CRUD. Financial/admin
changes from concurrent main were preserved, with stricter protected deletion
for plans, coupons, attempts and internal notes, plus atomic subscription
extensions. Generic API mutation confirmation rejects structured failure and
prevents repeat in-flight requests for the same mutation.

Student/staff account CRUD retains the authenticated `admin-manage-users` Edge
Function introduced in the earlier management release. Account deletion remains
its own explicitly confirmed operation; the protected content-deletion RPC is
not a replacement for account administration.

## Deployment order

1. Back up, review current migration history and validate in staging.
2. Ensure the existing management migration
   `20261007073444_admin_management_persistence.sql` is already present. Do not
   blindly replay old migrations, reset roles, or run a database reset.
3. Check whether the concurrent-main migration
   `20261007102947_student_internal_notes.sql` is present; apply **only if missing**.
4. Review and apply the new migration
   `20261007102959_admin_crud_integrity.sql` **only after explicit deployment
   approval**. It adds supported metadata/cutoff schema, scoped staff mutation
   guards and confirmed transactional RPCs. It does not rewrite signup triggers,
   erase student history, reset roles, or require a browser service-role key.
5. Confirm Storage permissions for `banners` and `question-images` using the
   intended authenticated staff roles. Do not make write access public to fix an
   upload. Missing bucket/permissions must produce an error. No shared file is
   automatically deleted by record deletion.
6. Build with `npm run build` and upload the web release to Hostinger using the
   existing deployment process. No new Edge Function deployment is required for
   this batch; retain the existing authenticated account-management function.
7. Use disposable staging records to smoke-test create, edit, delete, refresh,
   permission denial, duplicate slug, linked-record blockers and uploads. Check
   the student-facing catalog after publishing/archiving an exam.

Deploy the backend before the matching frontend. Without the new RPCs/schema,
affected operations fail closed; they must not fall back to local success.

## Deliberately truthful limitations

- Linked records block permanent deletion. Use Archive/Deactivate or explicitly
  unlink safe associations first. There is no automatic cascading history purge.
- Notification creation/edit publishes **in-app data only**. Email/external push
  delivery is not configured here. Schedule status is read from the database;
  elapsed time alone does not turn an unprocessed record into “Sent”.
- Test-series CSV creation from incomplete rows is unavailable; create valid
  draft tests and then assign them. This avoids inserting fake published tests.
- “Under Review” question status is disabled for production because the existing
  database lifecycle supports active/draft/archived. UI Published maps to active.
- SMTP/provider credentials require server-side configuration; they are not
  written into publicly readable app settings. Saving public configuration is
  not evidence that email delivery has been configured.
- This does not certify every non-CRUD analytics, scheduler, import UI or external
  integration in the admin panel. Production destructive/email tests were not run.

## Verification

New automated checks:

```sh
npx vitest run src/services/domains/admin.crudIntegrity.test.ts \
  src/pages/admin/AdminExams.crud.test.tsx
```

These use production-mode **mocks**, never production records. They cover real
returned IDs, refresh persistence, invalid/duplicate inputs, failure-preserved
forms/rows, zero-row edits/deletes, permission failures, selected-drawer cleanup,
no preset resurrection, batch failures and double-submit prevention.

Disposable PostgreSQL checks:

```sh
# Install PGlite in an isolated temporary folder, not as an application dependency.
QA_DIR="$(mktemp -d)"
npm install --prefix "$QA_DIR" --no-package-lock --no-save @electric-sql/pglite@0.5.8
PGLITE_MODULE="$QA_DIR/node_modules/@electric-sql/pglite/dist/index.js" \
  node scripts/verify-admin-crud-sql.mjs
```

The runner creates an in-memory database with mock Auth roles and disposable
fixtures. It loads historical schema only inside that disposable database; never
copy this setup into production. It verifies FK protection, zero-row failures,
transaction rollback, atomic series assignment, real subscription extensions,
collection IDs/duplicate slugs, staff authorization, credential rejection,
in-app targeted notifications and private-note visibility.

TypeScript, changed-file ESLint, production build and the full suite were also
run. Consult the delivery summary for the final post-merge counts; pre-existing
failures are distinguished from new regressions rather than called a green suite.

### Recorded validation results

- TypeScript and production build: passed.
- Changed-file ESLint: no errors; six hook-dependency warnings remain.
- New production-mode mock regression tests: **29 passed** (21 service + 8 exam UI).
- Latest-main baseline (`908508b`): **259 passed, 44 failed**, plus an inherited
  unhandled missing-mock error.
- Integrated full suite: **293 passed, 39 failed**, with **no new failure names**
  versus latest main. Five inherited failures and the unhandled error were
  resolved by completing mocks for real plan/student-detail APIs, without
  removing assertions. The suite is not fully green.
- Final targeted run including student persistence: **32 passed**.
- Disposable PostgreSQL migration/authorization/rollback assertions: passed.

No production records were deleted and no real student emails were sent during
verification. The backend migrations were subsequently applied with explicit
approval as recorded above; no Hostinger frontend upload was run.
