# Admin Settings functional audit and remediation

Scope: `/admin/settings`, shared runtime settings, saved brand assets, student support contacts, checkout gateway enforcement, and the gateway metadata reader. No real customer records, messages, payments, or production settings were changed during this audit.

## Feature inventory

| Tab | Connected capabilities | Limitations / unavailable capabilities |
| --- | --- | --- |
| General | Platform/contact fields, description, maintenance flag, durable PNG/JPEG logo and PNG favicon upload/removal, local web-cache clearing | Timezone/interface language are deployment-managed. Global feature switches have no enforcement backend and remain disabled. SMTP fields store reference metadata only; they do not send mail. |
| Branding | Primary, secondary, and accent palette persistence and preview; navigation identity consumes saved name/logo | Palette changes are preview-only, not a global Tailwind theme override. Global theme/font controls remain disabled. |
| SEO & Meta | Existing page-level SEO remains deployment-managed | Settings editor/Search Console verification are not implemented here. |
| Email & Notifications | No delivery action | Templates, test email, and sample notification remain disabled. No message was sent. |
| Payments | Atomic, confirmed public Razorpay key and enabled-flag persistence; INR checkout | Checkout enforcement patch deployed as Edge v9. Key/secret rotation must be coordinated server-side. GST, invoice numbering, and other currencies remain unavailable. |
| Integrations | Inventory labels only; no fake connected status | GA4, FCM, WhatsApp Business, and Telegram configuration/health checks are not implemented here. |
| Security | Existing server-managed authorization | Session timeout/max-login-failure policy editor remains disabled; no fake security controls were enabled. |
| System | Saved app version display | Database engine is Supabase-managed. Server/storage health is not monitored by this UI. |

## Targeted fixes

| Priority | Defect | Remediation | Release requirement |
| --- | --- | --- | --- |
| High | Environment credentials bypassed the saved disabled gateway flag | Every new order confirms the authoritative gateway row and active boolean; failed/missing configuration and mismatched environment/public keys stop before contacting Razorpay | Deployed `create-razorpay-order` v9 ACTIVE with JWT enabled; verification/webhooks were not changed |
| High | Gateway reader used legacy role/email bypasses and returned secret suffixes | Applied migration requires an active admin profile, revokes anonymous execution, selects only public fields, returns no secret fragments, and defaults absent gateway to disabled | Applied once as `20261010041322_settings_gateway_read_guard.sql` |
| High | Student content could flash before maintenance availability was known | Initial settings loading blocks the student outlet; initial failure provides Retry; admins retain recovery access | Frontend release |
| Medium | Refresh failures were swallowed; stale reads and optimistic language changes overwrote confirmed state | Refresh rejects on failure and preserves confirmed state; request generations discard stale responses; language changes require successful persistence and reject duplicate writes | Frontend release |
| Medium | Deleted contacts retained stale/default helplines; WhatsApp and hours had no editor | Contacts clear when empty/removed; General exposes WhatsApp/hours; student support consumes saved hours and safe helpline links | Frontend release |
| Medium | General Save persisted and validated unrelated Branding drafts | Independent General and Branding payloads; normalized General text writes | Frontend release |
| Medium | Saved assets were not used by deployed navigation; removals did not restore favicon | Shared safe BrandLogo in admin/student navigation and maintenance screen; saved favicon effect restores deployed icon on removal; failed images use fallback; post-save refresh failure is explicit | Frontend release |
| Medium | Clear Cache removed only unused storage keys, leaving actual service-worker caches | Delete only `practice-koro-*` CacheStorage entries and legacy disposable keys; preserve sign-in, exam recovery, drafts, Flutter, and unrelated caches; surviving cache yields failure | Frontend release |
| Medium | Malformed gateway data could invent enabled status | Reject missing/wrong gateway identity, non-string key, or non-boolean active switch instead of coercing | Frontend release |
| Low | Accent color was not editable on the Branding tab | Added accessible accent picker/text editor, narrowed mobile inputs | Frontend release |
| Low | Settings stripped intentional text quotes; misleading integration styles and template index keys | Keep already parsed text intact; neutral unverified integration status; stable template/integration identity keys | Frontend release |

## Verification

- Clean starting baseline: 670 passed, 35 failed, 705 total. Pre-merge remediation verification: 695 passed, the same 35 failed, 730 total (no added failures). The later merge includes upstream test fixes; those baseline fixes are not attributed to this task.
- Final merged full-suite verification: **745 passed, 0 failed, 745 total**. Upstream test corrections are included and preserved.
- Initial focused settings/context/cache/availability/gateway regression run: 65 passed, 0 failed. Merged focused verification, including current settings/navigation integration tests and strict email acknowledgements: 102 passed, 0 failed.
- 32 new Vitest tests cover contact removal, refresh failure, stale responses, rejected language saves, saved logo/favicon, safe URL rejection, cache preservation/failure, independent drafts, quoted text, accent persistence, malformed gateway responses, initial availability and admin recovery, plus seven email-acknowledgement/error cases.
- Actual Edge handlers exercised in an isolated transpiled harness: existing proof/ownership/amount/refund tests plus five new gateway-denial scenarios; no provider requests on denial.
- Read migration exercised in isolated PGlite fixtures: active admin allowed, anonymous/student/inactive denied, no secret fragments, missing gateway disabled, anonymous execute revoked.
- Production TypeScript/Vite build passed; changed-file ESLint passed with no warnings or errors.
- Local Playwright uses mocked settings and blocks all external requests. All eight tabs checked at 320, 390, 1280, and 1920 pixels: 32 tab/viewport checks, no document overflow or browser errors after stabilizing isolated preview mocks. Not an authenticated production CRUD test.

## Concurrent changes reconciled

Two upstream commits arrived during the audit (`9578988`, `3d9214b`). Their analytics, district, payment reporting, mobile, and updated test work was preserved. Overlapping Settings additions had no runtime consumers outside the settings form for SEO, security policies, tax metadata, or feature-switch enforcement. The audited page keeps these unsupported controls disabled rather than enabling form-only capabilities or adding unchecked secondary payment writes.

The upstream `sendTestEmail` service fabricated success/probe IDs on invocation errors, exceptions, and local mode. Its API entry was preserved but corrected to fail explicitly on network/backend errors and require `success: true` plus a real server message ID. Test-email UI remains disabled because no authenticated production delivery was verified. No actual email was sent.

## Production boundary

The user approved the gateway-read migration and updated checkout function. Both are deployed to production:

- `settings_gateway_read_guard`: production migration version **20261010041322**, applied once. The proposed repository filename `20261010040000_settings_gateway_read_guard.sql` was renamed to the actual Supabase history version; only the comment header was annotated, no SQL behavior changed and no second application occurred.
- `create-razorpay-order`: **v9 ACTIVE**, `verify_jwt: true`. Retrieved deployed entrypoint and shared dependency match the approved payload byte-for-byte.
- Live database checks: anonymous execute false, authenticated execute true, active-profile guard present, legacy email bypass removed, no secret-suffix logic.
- Six non-mutating HTTP probes passed: missing auth 401, anonymous user token 401, method guard 405, production preflight 200 with allowed origin, untrusted preflight with no CORS grant, anonymous gateway RPC denied 401.
- Live public gateway metadata check: enabled, public key present and format-valid, not the placeholder key. Environment/public-key pairing was not inspected or verified by an authenticated checkout.
- Previous production function/reader definitions were backed up before deployment. No settings values, gateway enabled flag, server credentials, messages, student records or payment records were changed.
- Real authenticated checkout, Razorpay credential pairing, and authenticated Settings CRUD were not exercised. Disabled/missing/malformed/read-failure/key-mismatch behavior was validated with isolated handler fixtures, not by toggling the live gateway.

Frontend rollout is independent of these confirmed backend deployments. Public bundle checks alone are not authenticated runtime tests. Fresh production build asset `App-CNPbYNWv.js` matched the public production bundle at handoff, confirming frontend bundle rollout (not authenticated Settings CRUD). Unavailable capabilities in the inventory remain unavailable.
