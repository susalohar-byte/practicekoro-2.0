# Ten-finding security and integrity remediation

## Production rollout — completed

- User explicitly approved applying the migration and deploying all three functions.
- Project: `practicekoro` (`prycanbnxuihxhskallw`), production status ACTIVE_HEALTHY.
- Applied only `service_only_payment_activation`; production migration history version `20261010031832`. No historical migrations replayed, data resets or role resets.
- `verify-payment`: v9 ACTIVE, JWT verification enabled.
- `razorpay-webhook`: v11 ACTIVE, JWT disabled as before; requests authenticated by webhook HMAC.
- `create-razorpay-order`: v8 ACTIVE, JWT verification enabled; deployed LAST after activation SQL and verify-payment.
- Read-back database privileges: anon/authenticated cannot execute either activation or legacy verification. New activation remains executable by service_role, with its internal role guard and locked search path. Legacy verification is deny-only and unavailable even to service_role.
- Existing refund/capture reconciliation permissions remain service-only.
- Previous SQL and Edge definitions were saved locally before rollout. They were not restored because deployment succeeded; the vulnerable legacy function must never be restored as an availability workaround.
- Live frontend matched the new build: `App-msdQUE2P.js`, production entry `/assets/index-B4P6MQSe.js`.

### Non-mutating live probes

12 checks passed: missing authorization and anonymous callers return 401 for both checkout/verification functions; authenticated-method guards reject GET with 405; production preflights return 200 with the expected origin; missing/invalid webhook signatures return 400; public activation and legacy RPC calls return permission-denied responses. The invalid-signature webhook check reached HMAC verification, confirming a non-empty webhook secret is configured without exposing it.

No real orders, payments, refunds, subscriptions, student records or messages were created/changed for these tests. A real authenticated purchase/refund was not tested. Presence/correctness of checkout key secrets was not independently verified through an authenticated request; function deployment and negative-path checks are not an end-to-end financial certification. Existing checkout secrets were not changed. Full coupon redemption remains unavailable.

## Initial code-delivery boundaries

At the initial code delivery, this changed application code, Edge Function source and one narrowly scoped SQL migration. Tests use mocks and a disposable PostgreSQL-compatible fixture. No production migration/functions were deployed, no student/payment history was changed, and no real checkout, refund or messages were sent.

Coupon mismatch is safely contained, not a completed coupon-redemption feature: coupon application is explicitly unavailable in the UI, stale applied coupons block checkout, and the order endpoint rejects coupon-bearing requests. Normal purchases use the listed server plan price. Implementing coupons requires server pricing, atomic usage reservation/expiry, redemption/idempotency and reconciliation before re-enabling the feature.

## Findings addressed in priority order

| Finding | Change | Production requirement |
| --- | --- | --- |
| 1. Payment verification bypass | Legacy public verification RPC becomes a deny-only endpoint with execution revoked. New activation RPC is service-only; Edge verifies environment-secret HMAC, exact caller-owned order/plan, provider capture status and amount/currency. Activation serializes per-user renewal, locks the order and enforces idempotency. Removed frontend public-RPC fallback. | Migration applied; verify-payment v9 ACTIVE. |
| 2. Stored XSS in Blog previews | DOMPurify HTML-profile sanitization applied to both drawer body and full preview; preserves ordinary prose and removes scripts, event handlers, unsafe links and SVG. | Frontend deployment. |
| 3. Pending refunds revoke access | Only completed refund status/events reach reconciliation; explicit pending/failed statuses never revoke access. | razorpay-webhook v11 ACTIVE. |
| 4. False autosave acknowledgement | save_test_answers must return boolean true with no error. False/null/malformed responses are failed saves and the existing retry banner remains active. | Frontend deployment. |
| 5. Older save overwrites recovery | Production browser recovery remains owned by the hook's immediate snapshot; the service never writes an old captured snapshot after network completion. | Frontend deployment. |
| 6. Coupon price mismatch | Disabled unsupported application honestly and blocked stale coupon checkout; backend rejects requested coupons rather than silently ignoring them. | Frontend matched live; create-razorpay-order v8 ACTIVE. Coupon redemption remains unavailable. |
| 7. Mock payment history on production failure | Production history failures/malformed responses throw; never fall through to demo/local records. UI distinguishes loading, failure, retry and true empty history, clears old-user state and ignores stale requests. | Frontend deployment. |
| 8. Invalid payment JSON shape | Runtime object/string checks before destructuring/reading both payment payloads; invalid shapes return 400. Also validates provider order response and stops checkout when the pending payment row cannot be persisted. | verify-payment v9 and create-razorpay-order v8 ACTIVE. |
| 9. Blocked storage crashes selection | Exam preference reads/writes are guarded; in-memory selection and refresh still work with browser SecurityError. | Frontend deployment. |
| 10. Malformed grading accepted | Requires finite authoritative score/marks/percentage/accuracy/count fields, positive marks, nonnegative integer counts and bounded accuracy. Rejects arrays/false-success/empty responses. Preserves genuine zeroes and numeric Postgres values; no invented grade fallback. | Frontend deployment. |

## Backend rollout procedure (completed after approval)

Migration: `supabase/migrations/20261010031832_service_only_payment_activation.sql`.

Originally proposed as `20261009090000_service_only_payment_activation.sql`; Supabase applied the exact SQL and recorded version `20261010031832`, name `service_only_payment_activation`. The repository file was renamed to match production history, not applied a second time.

1. Inspect production function definitions and permissions, confirm schema compatibility and take the normal backup. Do not reset roles or replay historical migrations.
2. Confirm Edge secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and webhook `RAZORPAY_WEBHOOK_SECRET`. Secrets stay in Edge environment, not frontend or application tables. Verification now needs the matching environment key ID to query captured payment status.
3. Under an approved maintenance/checkout window, apply only the new migration, then deploy `verify-payment` and `razorpay-webhook`, and deploy `create-razorpay-order` LAST from this commit. Keep JWT authentication for the first two functions; the webhook uses its signature verifier. Do not disable checkout JWT authentication to make it work.
4. Coordinate migration and Edge rollout: the legacy RPC becomes unavailable immediately. The old verification function will fail safely until the new Edge code is deployed; never restore the vulnerable RPC as an availability workaround. Frontend requires the new order endpoint verification version before opening checkout, preventing a charge against an unready security backend. Until that endpoint rolls out, checkout explicitly reports temporarily unavailable.
5. Confirm anon/authenticated cannot execute activation or legacy verification; service_role can execute activation. Confirm unauthenticated/invalid payload requests fail correctly and the webhook ignores pending refunds.
6. Validate a disposable staging purchase, idempotent callback, renewal and refund status transitions. No real production financial/student records were used for verification here.
7. Hostinger auto-deployment applies frontend code only. It does not apply this SQL migration or deploy Supabase Edge Functions. Public asset identity is not authenticated end-to-end verification.

## Verification

- 53 new unit/component regressions; 79 targeted tests including existing autosave and student-integrity tests. One existing recovery regression was updated to seed the immediate hook-owned snapshot and assert that failed server saves cannot overwrite it.
- Actual payment Edge handlers transpiled and run with mocked auth/database/provider/HMAC dependencies; no external calls. Separate existing signature helper tests exercise real HMAC.
- Disposable PGlite SQL tests cover grants/role guard, exact order ownership, no latest-pending fallback, signature presence, amount/currency, duplicate identity, fresh activation, replay, renewal and failure rollback. PGlite is not a substitute for staging concurrency/load tests.
- TypeScript, changed-file ESLint, production build and full-suite baseline comparison are recorded in the delivery report.
- Production dependencies audited separately; adding DOMPurify introduces no reported production dependency vulnerability at verification time.

### Final verification results

- Targeted: 79/79 passed (53 new tests).
- Full suite: 670 passed, 35 failed, 705 total; baseline was 617 passed / 35 failed / 652 total.
- Exact failed-test-name comparison: 0 new failures, 0 resolved baseline failures. The full suite is not green; existing unrelated failures remain outside this scope.
- TypeScript, all changed TypeScript/UI files plus test-script ESLint, production build and whitespace checks passed.
- SQL and actual mocked Edge handler security regressions passed.
- Production dependency audit: zero reported vulnerabilities.
- Backend production rollout was initially pending; it has now completed after explicit user approval. See the production status above.
