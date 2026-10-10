# Remaining Settings feature activation — current stage

## Completed

- The prior gateway-read migration and `create-razorpay-order` v9 production deployment are complete. This stage does not change their permissions, credentials, or gateway enabled flag.
- Authenticated General Settings save was tested through the real website using the user-supplied Super Admin login. Existing displayed values were saved without edits. After reload, all 12 captured displayed input values matched the pre-save snapshot. Normal settings update timestamps/audit entries may change; no payment, student, or message records were edited for this test.
- SEO Settings now validates and persists title, description and Google verification token through the confirmed admin RPC, refreshes runtime settings, and actually emits browser metadata. Route-specific SEO retains precedence. Initial static metadata duplicates are removed while runtime metadata is mounted. React escapes content; verification accepts only a bounded token, not pasted HTML.
- SEO defaults preserve deployed default title/description when no values are configured. Google ownership verification is not automatic. The SPA's client-rendered settings are not a server-rendered social preview or a trigger to regenerate static/prerendered pages; those require deployment/prerender integration.
- Global default theme and font controls now save `theme_mode` and `font_family`. The production runtime consumes both. Theme supports Light/Dark/System, tracks device changes and preserves explicit user preferences. Defaults never invent a personal storage preference. Three allowlisted font stacks are available, including the shipped Bengali face. The shared Tailwind sans family consumes the runtime font variable.
- Theme defaults have a separate General-card save action and are editable in Branding. General Save remains isolated. Palette colors remain preview values, not a complete recoloring of all hardcoded illustrations or semantic status colors.

## Verification

- Full suite before the last incoming logo-only update: **754 passed, 0 failed**.
- SEO/theme/settings focused run: **41 passed, 0 failed**; nine new regression tests cover runtime metadata, verification clearing, page precedence, unsafe input, platform default versus user preference, device theme listeners, and confirmed saves.
- Production build and changed-file ESLint passed.
- Isolated Playwright: 8 tabs × 4 widths (320/390/1280/1920), **32 checks**, no overflow or browser errors.
- Concurrent upstream Analytics and logo changes were preserved; the logo update receives a merged build/navigation/settings retest.

## Not completed — required inputs / infrastructure

| Capability | Required before activation | Safety boundary |
| --- | --- | --- |
| Application email delivery/templates | Sending provider, verified sender/domain, authorized test recipient, server-side provider credential configuration | No credential in public app_settings/browser; no success on provider failure; no email has been sent |
| GA4 / FCM / WhatsApp / Telegram | Service/project identifiers, allowed tracking/notification behavior, server-side credentials and authorized destinations | Do not fabricate connectivity or send unsolicited alerts; consent handling is required for optional tracking |
| Server-enforced security policy | Agreed session duration, failure threshold and lockout duration; supported Supabase auth configuration/hooks and deployment access | Do not pretend client-local counters protect public auth endpoints or silently disable an existing protection |
| Global feature switches | Server-side per-feature enforcement across registration, new test attempts, commerce and public data access, with an explicit capability registry | Preserve historical results, already-started attempts and payment settlement; saving unused flags alone is not enforcement |
| GST / invoicing | GST registration status, GSTIN if applicable, confirmed rate and inclusive/exclusive pricing, invoice series/last-issued serial | Do not guess taxes, fabricate registration, retroactively rewrite transactions or alter checkout totals without confirmed policy |
| End-to-end payment test | Dedicated test account/plan; test-mode environment or explicit real-charge plan and maximum approved amount | Do not switch the live gateway into test mode or charge a card without a defined test boundary |

Remaining controls stay disabled until their runtime/server implementation and configuration are verified. The completed SEO/theme implementation does not mean all Settings features are finished.
