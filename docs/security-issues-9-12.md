# Security issues 9–12: rollout status

## Status

| Issue | Implemented | Production status |
| --- | --- | --- |
| 9: image upload validation | Raster-only bucket MIME settings and size limits; authenticated, rate-limited server decoding/re-encoding; frontend upload helpers use the validated endpoint without alternate-bucket/data-URL fallback. | Bucket settings and `upload-raster-image` version 1 are live. **Not fully closed:** frontend hosting deployment and the staged direct-write denial policy are still required. |
| 10: browser hardening | Enforcing CSP, externalized theme initialization, safe prerendered JSON-LD serialization, and initial one-day HSTS. | Built and locally tested, **not deployed to hosting**. Existing live headers remain unchanged. |
| 11: mutable function search paths | Fixed paths on all six reported functions; original bodies and execution permissions preserved. | **Applied and verified in production.** Mutable-path warnings cleared; unrelated advisories are not claimed resolved. |
| 12: leaked-password protection | Entitlement checked; no paid upgrade or substitute password checker added. | **Blocked:** organization is on the Free plan; Supabase requires Pro or above. |

Reference: https://supabase.com/docs/guides/auth/password-security

## Applied backend rollout

- `20261010074118_upload_and_function_hardening.sql`
- `20261010074504_image_upload_limits_service_policy.sql`
- Edge Function `upload-raster-image`, version 1, active, JWT verification enabled.
- Buckets: avatars 2 MB, question-images 5 MB, banners 10 MB. SVG is no longer allowed.
- The endpoint validates the signed-in active user, content-admin scope for non-avatar uploads, server-generated user-owned paths, capped request bodies, dimensions, decoded bytes, and ten requests per minute per user. PNG/JPEG are decoded and re-encoded to PNG.
- No production user, payment, subscription, or existing media was changed by testing. Profiles/payment fingerprints and the six original function bodies were verified unchanged. Metadata-labelled SVG object count was zero; this is not a full forensic byte scan.

## Required hosting handoff

1. Deploy this commit's built frontend and `public/.htaccess` to the existing hosting document root. Confirm the host actually emits CSP and HSTS; GitHub source publication alone is not a live deployment.
2. Verify authenticated avatar, content-image and banner uploads through the new function, plus reload persistence. Successful authenticated production upload has **not** been tested.
3. Only then apply `supabase/rollout/enable_validated_image_uploads.sql`. It blocks direct client INSERT/UPDATE to the three image buckets while preserving unrelated buckets, existing reads and authorized deletion.
4. Verify direct Storage writes are rejected and the validated endpoint still works. Until this step, spoofed allowed MIME on direct Storage uploads remains a content-validation bypass; old clients are deliberately not broken prematurely.
5. Confirm login, theme initialization, font loading, content editing and checkout on the live deployment. Initial HSTS is `max-age=86400`, without subdomain/preload opt-in. Increase only after host validation.

Browser WebP and banner GIF inputs normalize to PNG; animated GIFs become a static first frame. Browser normalization is not the security boundary: the server independently decodes/re-encodes.

CSP allows self-hosted application scripts and the observed Razorpay checkout/CDN scripts, not arbitrary inline JavaScript. Inline styles remain allowed for existing UI compatibility. This is browser hardening, not a claim that every XSS route has been eliminated.

## Verification

- Production build/typecheck and changed-file lint passed. All seven new frontend upload tests passed.
- Isolated tests: 25 PostgreSQL assertions and 16 actual raster-decoder assertions passed.
- Initial merged regression suite before the Settings test repair: 785 passed, 3 failed. All three failures were in `AdminSettings.behavior.test.tsx` and reproduced unchanged on upstream commit `558a3ea` (18 passed, 3 failed for that file).
- Isolated PostgreSQL checks cover unchanged function bodies/ACLs, hostile caller search paths, signup/access/topic compatibility, raster bucket settings, client-denied rate RPC and throttling.
- Real raster decoder checks cover PNG/JPEG, content/MIME mismatch, SVG denial, polyglots, CRC, size and pixel limits.
- Local browser preview boots the application, blocks injected inline/unlisted scripts and loads the Razorpay SDK. No order or payment was created.
- Live endpoint smoke checks reject missing credentials (401), anonymous credentials (401), and an untrusted preflight origin (403).
- Production read-only checks confirmed fixed paths, retained legacy payment-RPC denial, client-denied rate-table access, bucket limits, and unchanged profile/payment fingerprints.

## Concurrent upstream changes preserved

Upstream commit `558a3ea` introduced Fast2SMS/FCM integrations while this work was in progress. Those changes were preserved, not overwritten. Their browser-side provider-key usage and simulated-success fallbacks warrant a separate security review before enabling them with real secrets. This rollout does **not** certify those new integrations as secure or successfully delivered. CSP was not broadened to permit browser dispatch of provider secrets.

Subsequent readiness work replaced the unsafe browser dispatch and fabricated-success behavior with an authorized server-side gateway. See `docs/production-readiness.md` for the current status, verification and remaining provider/hosting prerequisites; actual delivery is still not certified.

## Reproducing isolated tests

Run the repository's normal `npm run typecheck`, `npm run build` and `npm test`.

For isolated decoder tests, install `pngjs@7.0.0` and `jpeg-js@0.4.4` in a separate test directory and set `RASTER_DECODER_PACKAGE` to that directory's `package.json`, then run `node scripts/tests/raster-content-validation.mjs`.

For SQL tests, install `@electric-sql/pglite` in a separate directory and set `PGLITE_MODULE` to its module entry, then run `node scripts/tests/search-path-storage-sql.mjs`.

## Settings regression repair follow-up

- Named the logo/favicon file inputs accessibly and replaced positional file-input selectors. Adding the upstream profile-photo input had caused the logo tests to exercise the wrong handler.
- Retained and strengthened metadata-save failure checks: the logo metadata request is verified, the previous logo/favicon remain visible, and no success status is emitted on rejection.
- Retained unsupported-format rejection checks: SVG never reaches upload or metadata save, and the old logo remains unchanged.
- Updated stale integration expectations for the current gateway editor. The four email-template “Not managed here” labels are informational text, not buttons. Unimplemented security/email-delivery actions still must be disabled.
- Added backend rejection and read-only-role tests for gateway saves. These are mocked UI regression tests, not provider delivery or live production-security certification.
- Targeted verification: all 23 behavior tests and 4 loading tests passed; build/typecheck and changed-file lint passed. No tests were skipped or deleted.
- Final full-suite verification after this repair: **106 test files passed, 790 tests passed, zero failures**.
- This follow-up is source/test work only; it does not change the pending hosting rollout or the Free-plan blocker above.