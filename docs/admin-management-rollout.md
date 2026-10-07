# Admin management fixes: deployment checklist

These changes require a database migration, a Supabase Edge Function, and the web
release. A Git push alone does not enable the new backend operations.

## Deployment order

1. Back up the database and test against a staging project first.
2. Apply `supabase/migrations/20261007073444_admin_management_persistence.sql`
   after the existing baseline migrations, including admin roles (029) and the
   primary-admin role correction (033). Review the project's migration history
   before running `supabase db push`; do not blindly replay older migrations.
3. Deploy the new authenticated Edge Function:

   ```sh
   supabase functions deploy admin-manage-users --project-ref YOUR_PROJECT_REF
   ```

   The function validates the bearer token and requires an active Super Admin.
   It uses Supabase-provided server environment variables `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`. Never put the service-role key in browser code
   or any `VITE_*` variable. Do not disable authentication.

   Production origins default to `https://practicekoro.online` and
   `https://www.practicekoro.online`. For another frontend origin, configure the
   function's `ALLOWED_ORIGINS` as a comma-separated HTTPS allowlist.
4. Deploy the web build after the backend is ready.

## Behavior and safeguards

- Student creation sends a real Auth invitation and persists the returned user
  ID. It does not grant a paid subscription. Supabase Auth invitation/email
  settings must work. CSV imports create real accounts too.
- Student deletion removes the Auth account and cascading related records.
  Back up first; bulk deletion can partially succeed. Only confirmed deletions
  disappear from the UI; failed rows remain with an error.
- Staff assignment requires an existing registered account. Removal revokes
  its admin role; it does not delete the user's account.
- Account status updates change the Auth ban and persistent profile status.
  Inactive accounts fail admin/premium role checks. Status changes are server-only.
- Support replies persist and appear in the student's support portal after
  fetching/reopening tickets. This is not email delivery or push notification.
  Internal notes are hidden from students by RLS and client filtering.
- Admin-created tickets resolve a registered student by ID/email, not the
  logged-in administrator. An unregistered contact has no portal owner and
  cannot receive a portal reply until linked through an appropriate workflow.
- Payments, subscriptions, students and staff load every backend page before
  computing list-based totals/exports. A failed later page rejects the complete
  load rather than returning misleading partial data.

## Staging smoke tests

1. Open a pending ticket; verify it displays **In Progress** after refresh.
2. Reply as support staff; sign in as the student and verify the saved reply.
   Add an internal note and verify the student cannot read it.
3. Reject a staff assignment/removal request and confirm no success toast or
   phantom UI mutation. Deactivate/reactivate staff and verify fresh sign-in.
4. Invite a test student, reload, edit metadata, and reload again. Delete only
   disposable test accounts; confirm partial bulk failures retain failed rows.
5. Test more than 50 payments/subscriptions and more than 200 students; verify
   older rows, exports and totals. Simulate a later-page failure.
6. Verify students/content writers cannot call privileged account-management
   or staff-assignment operations, and primary-admin protections remain intact.

Local mocked tests and an isolated PostgreSQL-compatible migration check do not
replace these staging checks. No production migration or Edge deployment is
performed by the code commit itself.