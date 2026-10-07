# Settings page integrity fixes

## Confirmed defects and changes

- Payments, SEO and Security buttons previously displayed success without saving.
  Payments now call the existing atomic gateway RPC and require its returned key,
  gateway and active flag to match. There is no preliminary settings write, local
  production fallback, swallowed permission/network error or pre-response cache change.
- Saved description, logo/favicon, SMTP reference fields and platform version were
  not hydrated. They now reload from saved settings. An empty gateway Key ID no
  longer leaves the fabricated example live key in the form.
- Logo/favicon removal was local-only. It now clears the database setting only
  after a confirmed result. Stored/shared files are not deleted. Failed uploads
  or metadata saves preserve the previous displayed asset. New uploads validate
  non-empty content, MIME type and the advertised 2 MB limit; SVG/ICO are explicitly
  unsupported instead of being advertised as supported.
- General, brand-preview colors and non-secret SMTP references validate before
  persistence. Branding's save does not overwrite unrelated General fields.
  Payment secrets and SMTP passwords are not accepted as frontend settings.
- Active Super Admin UI gates, synchronous operation locks, disabled edit controls,
  accessible typed success/error notices and timer cleanup prevent misleading
  feedback and repeated requests. Authoritative load failure blocks editable defaults.
  Audit/refresh failures after persistence are distinguished from failed persistence.
- Clear Cache removes only the named local offline cache. It preserves authentication,
  unrelated session/browser storage and all server data; storage errors are not success.
- Unsupported SEO editor, feature-enforcement switches, global font/theme controls,
  invoicing/tax settings, integration connection actions, notification delivery and
  authentication-policy controls are disabled with explanations. They are not
  secretly implemented by storing unused metadata. SMTP values are reference
  metadata only, and saved branding values are admin preview/reference values,
  not automatic site-wide theme or layout changes. Static fake connectivity,
  server health, PG15 and 2.4 GB usage claims have been removed or marked unmonitored.

## Scope and production safety

No production settings, payment configuration, credentials, maintenance state,
student records or storage files were changed for testing. No real email,
notification, payment or connection was initiated. Production schema/function
inspection was read-only and did not fetch stored secrets.

The live browser redirected `/admin/settings` to login. Component and service
workflows were verified with mocks; deployed-bundle verification is distinct from
an authenticated, account-specific live Settings check.

## Applied server-side authorization hardening

Read-only inspection found the existing gateway mutation RPC accepts broader
legacy administrator checks than `admin_update_app_settings`, which already
requires an active Super Admin. Client gates are not a substitute for this server
policy. A narrow corrective migration is included:

`supabase/migrations/20261007162922_admin_settings_gateway_guard.sql`

It requires `is_management_super_admin()`, rejects invalid/unsupported public
keys and client secret writes, preserves existing secrets, synchronizes public
configuration atomically, and denies PUBLIC/anonymous execution. It changes
only the function/grants, not production settings values or roles.

**Applied to production with explicit approval** as Supabase migration version `20261007162922`, name `admin_settings_gateway_guard`. Verified the active Super Admin guard, anonymous EXECUTE denial, and unauthenticated request rejection. Stored settings, secrets and roles were not changed.

The guard migration was validated in disposable PostgreSQL fixtures: null identity,
content writer, inactive super admin and student denied; active super admin save
confirmed; secrets preserved; invalid/secret payloads rejected; sync failure rolled
back; anonymous execution denied.

```sh
PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js \
  node scripts/tests/admin-settings-gateway-sql.mjs
```

## Verification

- 15 new component tests and 14 new persistence/validation tests passed.
- Existing four authoritative-load tests passed; their auth fixture now represents
  a real Super Admin rather than an unauthenticated user.
- The existing credential regression now verifies explicit secret rejection and
  uses a correctly formatted public key instead of relying on ignored secrets.
- Focused component/service checks: **33 passed**.
- Full suite: **420 passed / the same 38 failed (458 total)**, versus
  391 passed / 38 failed before this change. No newly failing test names.
- Final TypeScript, changed-file ESLint and production build passed. The pending
  SQL fixture does not connect to production.
