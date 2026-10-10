# App readiness rating report

## Assessment and scope

**Provisional technical-readiness rating: 8.5/10.** This is a reviewer judgment, not a benchmark, certification, user rating or measured weighted score. It covers inspected source and available test evidence; it does not certify the currently served website or Android release. The score is not increased simply because requested.

The prior validated release is `854299a`: 107 test files and 805 tests passed, production build passed, 39 mocked notification-provider assertions and 15 isolated PostgreSQL assertions passed. The notification security migration and gateway version 2 were deployed previously. These are separate from frontend deployment.

## Additional improvements in this follow-up

- Updated the build-tool dependency `source-map-js` from 1.2.1 to 1.2.2 using a non-major audit repair. No forced Tailwind major upgrade was applied.
- Added the previously tested PGlite 0.5.8 harness as an exact development-only dependency, making the notification SQL tests runnable from a normal clean installation rather than a separate workspace harness.
- Added `npm run test:notification-security` to run provider and isolated SQL regression checks without production credentials or live messages.
- Added a notification-security CI job for main pushes and pull requests, including a runtime dependency audit. Limited the CI token to `contents: read`. Local validation is reported separately from observed remote workflow execution.

## Dependency audit evidence

Initial full audit: 8 findings (6 high, 2 moderate, 0 critical). After the compatible source-map-js repair: 7 remaining findings (5 high, 2 moderate). Remaining affected packages are braces, chokidar, fast-glob, micromatch, postcss-nested, postcss-selector-parser and tailwindcss. Several entries are dependency-chain findings, not seven independent exploit demonstrations.

Runtime-only audit (`npm audit --omit=dev`): 0 reported vulnerabilities. That does not prove the app is free of vulnerabilities; registry advisories are only one evidence source. Remaining advisories concern development/build tooling. They still warrant remediation because builds process inputs, but they must not be described as confirmed remotely exploitable production-app bugs.

Relevant advisories:
- Braces nested-pattern denial of service: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- PostCSS selector parsing CPU exhaustion: https://github.com/advisories/GHSA-rj75-hqrm-r3gf
- Repaired source-map-js indexed-source-map denial of service: https://github.com/advisories/GHSA-68fv-2mgg-jv7q

## Why the rating is not 9+ yet

| Priority | Gap and evidence | Impact | Requirement to close |
| --- | --- | --- | --- |
| 1 | Current frontend deployment and headers are not verified. This session's public root and release-marker requests returned 403 to the automated client. | Cannot establish that users receive the tested bundle or CSP/HSTS. The 403 is an access limitation, not proof of an outage for normal users. | Confirm hosting provider/access, back up and deploy the tested build; verify served commit, HTTPS routes, CSP, HSTS and payment compatibility. |
| 2 | The restrictive direct-Storage-write rollout remains staged. | File validation can still be bypassed wherever older direct-write policies remain allowed; the server validator alone is not complete enforcement. | Verify every active web/Android upload client uses the validated endpoint, then apply the staged denial policy and test authorized uploads plus denied bypasses. |
| 3 | Authenticated Settings and student journeys have not received complete production smoke tests. | Unit tests do not prove production permissions, persistence, invoice/GST correctness or complete user journeys. | Verify save → reload with authorized and unauthorized roles, avatar persistence, signup → exam → result, and existing invoice/GST behavior using controlled accounts. Never equate a saved setting with implemented runtime behavior. |
| 4 | SMS/push provider configuration and actual delivery remain unverified; bulk SMS and registered-device test workflows deliberately fail closed. Email delivery is also not certified by this work. | Notifications are not fully production-certified. Provider acceptance is not actual delivery. | Provision server-only credentials, verified audience/consent/DLT and device registration. Conduct narrowly authorized provider tests; do not dispatch bulk messages by default. |
| 5 | Leaked-password protection is not enabled; the current plan does not support that feature. | Missing an additional compromised-password safeguard. This does not mean all authentication protections are absent. | Obtain explicit paid-plan approval if required, then enable and verify the feature. Do not silently upgrade or charge. |
| 6 | Seven development/build dependency findings remain. | Build-tool risk and security-maintenance debt, not proven production runtime exploitation. | Perform a compatibility-tested upgrade or use validated compatible patches when available; re-audit and test CSS, dark mode, checkout and the build. Do not use `npm audit fix --force` blindly. |
| 7 | No measured mobile performance, accessibility assessment or representative user feedback in this rollout. | A functional/security test suite cannot establish speed, usability or product quality. | Measure representative student/admin screens and slow-network behavior; test keyboard/focus/contrast and mobile layouts; record results and repair actual findings. |

## Rating decision

These changes improve maintainability and regression prevention. The overall provisional rating remains **8.5/10** until the high-impact live gates have evidence. A 9+ review should follow successful deployment, upload-policy enforcement, authenticated journeys, narrowly scoped provider verification and measured usability/performance. No specific score is guaranteed in advance.

Real payments previously reported working by the user are user-provided evidence, not an independently executed end-to-end payment test in this session. No real payment, SMS, push or email was initiated by these checks.

## Follow-up verification

- Clean `npm ci`: passed.
- Full suite: **107 test files, 805 tests passed, zero failures**.
- Production build/typecheck: passed.
- Notification security: **39 provider assertions and 15 SQL assertions passed** using mocks/isolated PGlite.
- Runtime dependency audit: **0 reported vulnerabilities**.
- Full dependency audit: **7 remaining findings: 5 high, 2 moderate, 0 critical**, in development/build tooling.
- Full `src/` ESLint: **0 errors, 10 warnings**. Warning-free lint is not claimed.
- Source changes preserved the published baseline `854299a`.
- New CI checks were locally validated; remote GitHub Actions execution is not implied by local success.
