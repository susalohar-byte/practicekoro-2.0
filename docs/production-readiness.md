# Production readiness: evidence, not a guaranteed rating

## Completed in this rollout

- Removed browser-side Fast2SMS/FCM HTTP requests and simulated-success fallbacks. CORS/network failures no longer fabricate delivery or wallet balances.
- Removed the hard-coded SMS fallback recipient and the first-50-students broadcast shortcut. Bulk SMS now fails closed until a server-side, complete, consent-aware audience resolver is configured. No unrelated recipient is substituted.
- Removed provider-secret hydration and persistence from Settings. Secret-entry controls are disabled and explain server-side configuration. The production database rejects the two legacy provider-secret setting IDs; neither row existed before rollout.
- Added `notification-gateway` version 2 in production, with JWT verification, active verified Super Admin authorization, strict origins, bounded streamed JSON, server-only credentials, request deduplication, a five-per-minute actor rate limit, and server-side outcome/receipt auditing.
- FCM uses HTTP v1 with a server-side Firebase service account and short-lived Google OAuth authorization, not deprecated browser legacy-server-key dispatch. Provider acceptance is distinct from device/handset delivery.
- Push tests cannot silently broadcast to all students. A registered test-device workflow is still required. Audience-specific push topics fail closed until membership is verified; no paid/free audience is widened to everyone.
- External push failure is visible separately from a successful in-app save. Saved in-app records are not falsely presented as verified external delivery.
- Quick SMS tests support exactly one explicitly selected number. DLT/OTP and bulk delivery are not claimed implemented.
- Image normalization now respects the server 4 MP limit; avatar images normalize to at most 512×512, and other raster images to at most 2000×2000. Two additional pixel-budget tests passed.
- Corrected Settings profile-photo uploads to use the owned `avatars` upload helper, not `question-images`. Missing or rejected profile-save callbacks cannot produce success toasts; profile removals also require a confirmed callback result. Four regression tests cover these cases. Authenticated live persistence still requires the deployment smoke test.

## Backend rollout

- Applied `20261010093512_notification_gateway_security.sql`.
- Deployed Edge Function `notification-gateway`, version 2, active, `verify_jwt=true`.
- Production read-only verification: legacy-secret rows 0, dispatch-request rows 0, anonymous/authenticated execution of the rate RPC denied, authenticated audit-table reads denied.
- No real SMS, push notification, payment, or bulk audience dispatch was initiated during development/testing.

## Server-side configuration prerequisites

Configure these in Supabase Edge Function secrets, never `VITE_*`, the repository, local browser storage or public `app_settings`:

- `FAST2SMS_API_KEY` for the provider account.
- `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON` for authorized HTTP v1 delivery.

Gateway enabled preferences must also be saved by a verified Super Admin. Neither an enabled switch nor a deployed function proves valid credentials or delivered messages. Provider accounts, DLT registration/templates, consent, device-token registration and real acceptance/delivery require separate verification. No provider secrets were read or fabricated for this rollout.

## Still blocks a justified 9+ readiness assessment

1. Hosting deployment and live CSP/HSTS verification. GitHub publication is not hosting deployment.
2. Authenticated frontend upload smoke tests, followed by activating `supabase/rollout/enable_validated_image_uploads.sql`. Activating it before the frontend rollout would break old upload clients.
3. Authenticated production Settings save/reload and student signup → practice/exam → result flows. No full live end-to-end certification is claimed.
4. Secure provider provisioning and explicit, narrowly scoped delivery tests. Bulk SMS and registered-device testing remain unavailable, not simulated.
5. Leaked-password protection requires Supabase Pro or above; no paid upgrade authorized or purchased.
6. Actual performance/accessibility checks and user feedback across the student experience. Passing tests is not a speed, usability or product-market-fit score.

## Hosting deployment handoff

Verify every active client, including Android/native apps and older web versions, has migrated to the validated upload endpoint before activating direct-write denial. Otherwise keep the staged policy unapplied or explicitly retire incompatible clients.

Deploy the complete latest built `dist` contents, including `.htaccess` and `theme-init.js`, after backing up the existing document root. Do not upload the repository or `.env`. Retain old hashed assets during rollout so open sessions referencing an older bundle still work. Verify live headers and served build before enabling the staged upload policy.

## Verification performed

- Isolated provider validation: 39 assertions passed using mocked HTTP responses, including rejection, malformed receipts/balances, server-only secrets, unsupported audiences and acceptance-versus-delivery distinction.
- Isolated PostgreSQL: 15 assertions passed covering secret-setting rejection, client-denied RPC/table access, atomic rate limiting and duplicate request prevention.
- Final full-suite regression verification: **107 test files passed, 805 tests passed, zero failures**. Tests cover external-push rejection versus a successful in-app save, unavailable bulk SMS, backend rejection, read-only roles, no browser-secret transmission and no simulated delivery.
- Build/typecheck and changed-file lint passed.
- Live unauthenticated gateway smoke checks: missing credentials 401, anonymous credentials 401, untrusted-origin preflight 403. No provider request was made by these checks.
- Hosting release packaged and checked for `index.html`, `.htaccess`, and `theme-init.js`; no `src/` or `.env` files were included. Packaging is not deployment.
- Concurrent upstream changes through `d9daa47` (subscription/student profile pictures, Android changes and the chart-only revenue redesign) were preserved. The refund-report regression now checks labeled cash-flow summary amounts rather than globally unique chart text. No older production migration was blindly reapplied; source-level results do not certify new financial/avatar fields as live.
