# Admin Panel Skeleton loading UI

## Scope

Shared shadcn-style `Skeleton` primitive at `src/components/ui/skeleton.tsx`; manual implementation compatible with the existing React 18/Tailwind stack. No remote installer, extra UI package, database migration or production data operation is needed.

Shared admin layouts at `src/components/admin/AdminSkeleton.tsx`: table, dashboard, plan-card, settings-form and detail/workspace variants; scoped list/table/form placeholders; a boundary that preserves already-loaded content during background refresh.

Data-loading coverage includes all 31 admin screen modules (including supported legacy/redirected modules): Dashboard, Exams, Subjects, Topics, Banners, Test Series, Mock Tests, Test Questions, Question Bank, Live Tests, Students, Test Attempts, Subscriptions, Payments, Subscription Plans, Coupons, Notifications, Support, Staff, Audit Logs, Rankings, District Rankings, Performance, Cutoff, Analytics, Blog, Exam Topics, Topic Manage, Item Analysis and Revenue Analytics, plus Settings.

## Behavior and safety

- Actual request flags drive placeholders; missing flags were added around existing reads and cleared on both success and failure. No artificial timers or new backend requests.
- First loads show placeholders rather than premature empty tables/zero-looking cards. Dashboard/Analytics headers and date controls remain available while their data regions load, preserving stale-response/range-switch behavior. Loading stops when requests settle; existing empty/error/retry behavior remains visible.
- Background refresh preserves loaded child components/unsaved forms by default, with a subtle loading strip and aria-busy. Analytics opts into full data-region placeholders during a reporting-period refresh, while its date controls remain mounted.
- Admin lazy-route Suspense fallback is inside AdminLayout so navigation remains mounted; top-level admin fallback and admin-session loading also use Skeletons. Student/public route fallback and authentication/permission decisions are unchanged.
- Student attempt/order/note panels, series drawer tests, question-bank assignment modal, mock-test preview and drawer questions/attempts use scoped Skeletons. Mutation/upload/save buttons retain their progress feedback, not fake skeleton completion.
- Screen-reader loading status is polite; purely decorative shapes are aria-hidden. Shapes are noninteractive, responsive, light/dark compatible, and honor reduced-motion preference. They never display sample names, numbers or fake financial data.
- No authenticated production CRUD test or real student/payment/message/storage change was performed for this UI task.

## Verification

Results are completed below after final regression and build checks. Tests use mocked/demo reads, never production requests. Existing Exams/Staff/Notification tests now await real initial-load completion before interacting; their mutation/error assertions remain intact. Screenshot QA covered all five visual variants at 1280 px and 375 px, plus dark-mode dashboard; no document horizontal overflow/page errors were found, and reduced-motion animation computed to none. Table scrolling stays inside its region. Temporary preview sources were removed.

### Final integrated verification

- New Skeleton regressions: **56/56 passed** — 20 shared layout/route/refresh tests, 1 primitive test, 32 initial-load coverage cases across 31 screens (including workspace without a selected test), and 3 failure-completion checks.
- Untouched baseline: **495 passed / 35 failed / 530 total**. Final integrated suite: **551 passed / 35 failed / 586 total**. Exact failing-test identities are unchanged; **no new regressions**. Existing failures were not hidden or reclassified as passing.
- TypeScript and production build (`tsc -b && vite build`): **passed**.
- Changed-file ESLint: **0 errors, 8 pre-existing warnings**; comparison with untouched baseline found no new warnings.
- Desktop/mobile screenshots of all five Skeleton variants, dark-mode dashboard, and actual Dashboard/Analytics pending states were inspected. Local diagnostic checks found no page errors/document overflow and reduced-motion shapes had no animation.
- Latest concurrent sidebar changes were preserved before final build/tests. No schema/permissions/API persistence changes were part of this rollout. Live deployment is confirmed separately from GitHub push.
