# Student web UI update

## Scope

Student dashboard and shared navigation presentation only. No production deployment, database migration, provider configuration, security-policy activation or Android app change was performed in this UI update. Authentication, entitlements and payment logic are not redesigned here.

## Changes

- A clearer learning-space header, selected-exam link and primary Start/Resume area.
- Consistent readable progress cards, quick-access tools, test-series cards and leaderboard layout.
- Desktop and mobile layouts with scoped light/dark styling, visible keyboard focus, a skip-to-content link and reduced-motion handling.
- A simpler five-item mobile navigation bar preserving Home, Test Series, Practice, Results and Profile destinations, with semantic current-page indicators and safe-area spacing.
- Larger mobile header touch targets and viewport-bounded search/notification popovers.
- Escape dismissal and hidden off-canvas navigation when the mobile drawer is closed.
- Removal of fabricated first-test 78% accuracy, fallback named-student/mock-test/live-event claims and placeholder unread-notification count. Dashboard series/counts come from returned data rather than fabricated catalog totals.
- Explicit empty, loading and retry states; the existing test-resume URL is preserved.
- Configured promotions retain manual slide controls, mobile artwork support and a text fallback when an image is missing or fails. Unsupported banner URL schemes do not become executable links.

## Local verification

- Full regression suite: **109 test files and 814 tests passed** (nine additional tests).
- Production build/typecheck passed.
- Changed TSX files: zero ESLint errors and zero warnings.
- Isolated local browser checks: **49 responsive/interaction assertions passed** at 320, 390, 768, 1024 and 1440 px. Checked horizontal overflow, header touch-target geometry, popover boundaries, search, drawer Escape dismissal and theme switching.
- Visually inspected desktop, mobile, dark mode, first-test empty state, progress-load failure, mobile drawer, search and notification panels.

Visual previews used fixture-only data in a separate local harness with external requests blocked. Names, scores, counts and series in those preview images are examples, not production records. The preview harness is not included in the release. These checks do not certify authenticated production save/load, all student routes or a WCAG audit.

## Manual deployment

Build from the published source using `npm ci` and `npm run build`, then deploy the complete built `dist` contents using the previously documented backup and hashed-asset retention precautions. Do not deploy the local preview harness or a demo-enabled build. Existing production-readiness and upload-policy activation gates still apply.
