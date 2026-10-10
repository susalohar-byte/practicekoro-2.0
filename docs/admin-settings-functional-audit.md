# Admin Settings functional audit and remediation

Scope: `/admin/settings`, shared runtime settings, saved brand assets, student support contacts, checkout gateway enforcement, and the gateway metadata reader. No real customer records, messages, payments, or production settings were changed during this audit.

## Feature inventory

| Tab | Connected capabilities | Limitations / unavailable capabilities |
| --- | --- | --- |
| General | Platform/contact fields, description, maintenance flag, durable PNG/JPEG logo and PNG favicon upload/removal, local web-cache clearing | Timezone/interface language are deployment-managed. Global feature switches have no enforcement backend and remain disabled. SMTP fields store reference metadata only; they do not send mail. |
| Branding | Primary, secondary, and accent palette persistence and preview; navigation identity consumes saved name/logo | Palette changes are preview-only, not a global Tailwind theme override. Global theme/font controls remain disabled. |
| SEO & Meta | Existing page-level SEO remains deployment-managed | Settings editor/Search Console verification are not implemented here. |
| Email & Notifications | No delivery action | Templates, test email, and sample notification remain disabled. No message was sent. |
| Payments | Atomic, confirmed public Razorpay key and enabled-flag persistence; INR checkout | New checkout enforcement patch requires Edge deployment. Key/secret rotation must be coordinated server-side. GST, invoice numbering, and other currencies remain unavailable. |
| Integrations | Inventory labels only; no fake connected status | GA4, FCM, WhatsApp Business, and Telegram configuration/health checks are not implemented here. |
| Security | Existing server-managed authorization | Session timeout/max-login-failure policy editor remains disabled; no fake security controls were enabled. |
| System | Saved app version display | Database engine is Supabase-managed. Server/storage health is not monitored by this UI. |

## Targeted fixes

| Priority | Defect | Remediation | Release requirement |
| --- | --- | --- | --- |
| High | Environment credentials bypassed the saved disabled gateway flag | Every new order confirms the authoritative gateway row and active boolean; failed/missing configuration and mismatched environment/public keys stop before contacting Razorpay | Deploy updated `create-razorpay-order`; verification/webhooks still settle existing payments |
| High | Gateway reader used legacy role/email bypasses and returned secret suffixes | Pending migration requires an active admin profile, revokes anonymous execution, selects only public fields, returns no secret fragments, and defaults absent gateway to disabled | Apply `20261010040000_settings_gateway_read_guard.sql` after production approval |
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

- Clean starting baseline: 670 passed, 35 failed, 705 total. Those pre-existing failures are not declared resolved by this task.
- Focused settings/context/cache/availability/gateway regression run: 65 passed, 0 failed.
- 25 new Vitest tests cover contact removal, refresh failure, stale responses, rejected language saves, saved logo/favicon, safe URL rejection, cache preservation/failure, independent drafts, quoted text, accent persistence, malformed gateway responses, initial availability and admin recovery.
- Actual Edge handlers exercised in an isolated transpiled harness: existing proof/ownership/amount/refund tests plus five new gateway-denial scenarios; no provider requests on denial.
- Pending read migration exercised in isolated PGlite fixtures: active admin allowed, anonymous/student/inactive denied, no secret fragments, missing gateway disabled, anonymous execute revoked.
- TypeScript/build and changed-file lint checks are required before release.
- Local Playwright uses mocked settings and blocks all external requests. All eight tabs checked at 320, 390, 1280, and 1920 pixels; not an authenticated production CRUD test.

## Production boundary

The new read migration and updated order Edge Function are prepared and locally tested, not deployed by this audit. They require a fresh production rollout approval. No new secrets are stored in app settings or browser code. Existing server keys were not inspected or changed. The frontend GitHub commit/bundle check is recorded separately at handoff; public asset matching proves bundle rollout, not authenticated runtime writes or real Razorpay checkout success.
