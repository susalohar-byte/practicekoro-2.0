# Student panel integrity and responsive UI fixes

## Scope

Confirmed defects were traced and corrected in Saved Questions, Results (My Tests), Test Details, the Exam Runner, Solutions, Support, Test Series Catalog and Test Series Detail. Shared student route loading, Practice bookmark removal and the existing Bengali font fallback were also corrected. This is not a claim that every feature across the website is bug-free.

## Fixed root causes

### Saved questions and Practice

- Single removal previously swallowed database errors; bulk deletion and Clear All only changed React state. All now call caller-scoped backend deletion APIs and reconcile UI after confirmation.
- Removal uses idempotent deletion instead of a toggle that could accidentally re-add an already removed bookmark. Production APIs check errors and verify that requested bookmarks no longer remain visible to the caller.
- Lookup/insert failures cannot fall through into local mock mutations. Inserts require the returned record ID.
- Reads use exact-count pagination and deterministic ordering; denied or incomplete reads fail rather than look like an empty saved list.
- Removal failure preserves visible rows and selection. Duplicate destructive requests are locked, confirmation controls are disabled while pending, and successful removal also clears obsolete practice/selection state.
- Removed fabricated subject counts (8/5/4/etc.), incorrect default exam labels and missing custom-subject filters. Counts and labels now derive from saved records.
- Clipboard success is shown only after the write succeeds.
- Mobile question cards no longer squeeze the text between four fixed-width columns. Search icon/text spacing, wrapping, meaningful subject badges and key action target sizes were improved.

### Student results

- Reporting period and category controls now filter real completed attempts; Kolkata month/year boundaries and rolling three-month bounds are applied to records, metrics and subject summaries.
- Accuracy is pooled correct/(correct+wrong), not an unweighted average of tests of different sizes. Recent-test percentage reflects marks/total marks, not a truthy accuracy fallback. Progress widths handle zero denominators and are bounded.
- Recent rows are ordered newest-first. See All actually reveals records beyond the initial ten rather than only changing a tab.
- Generic tests no longer get an invented WBSSC identity; topic/subject tests are not labelled full-length mocks. Result cards support keyboard activation.
- Loading/error/retry states replace misleading fresh zero metrics. Failed series reports are not replaced with fabricated zero scores. Series summaries are explicitly labelled All Time, separate from period-filtered individual results.
- Live-event participation is not available in the generic attempt rows used by this report. The Live Tests tab explicitly states this limitation and does not present ordinary mocks as live results. This change does not implement a new live-event reporting backend.

### Exam runner and test details

- The autosave debounce previously depended on the one-second clock state, continually cancelling a two-second save. It now depends on answer/session changes and reads the latest elapsed time from a ref.
- Immediate browser recovery is attempted independently of server saving. Failed/rejected server saves return/show failure with Retry instead of an unhandled rejection or false success.
- Restored answers are committed before an already-expired attempt is submitted, avoiding an empty stale closure. Timer submission no longer runs inside a React state updater; submissions use a synchronous duplicate-request lock.
- The displayed countdown is recomputed from the attempt deadline, avoiding extra UI time caused by background-tab throttling.
- Load failures, inaccessible/wrong-owner sessions and unavailable questions render actionable errors instead of a blank page. Restricted browser storage cannot crash initialization. Cancelled loads do not overwrite a newer route's state.
- Configured production RPCs cannot fall through into fake local sessions/results when the server returns no confirmation. Session creation requires a valid returned ID/start time.
- Details distinguish network/permission errors from actual not-found results and preserve clear start-error feedback. Authorization remains enforced by existing Supabase RLS/RPCs; client checks do not replace server permissions.
- Runner uses dynamic viewport height on mobile.

### Solutions and support

- Solutions have explicit load/retry and empty states. Bookmark failures preserve the previous state, surface errors and cannot duplicate requests on the same question.
- Reports retain the actual original question order, not a renumbered filtered-list index.
- Mobile solution filters wrap into a two-column layout rather than clipping the final filter.
- Support history errors are shown separately from a genuine no-ticket state. Stale history loads are discarded; unauthenticated or duplicate submissions are blocked, and confirmed submission requires the actual ticket ID.
- Empty configured contact values are not replaced with an invented helpline. Unsupported promises of immediate priority service/24-hour response are removed. The existing portal support-message backend was not replaced or changed.

### Production test-series catalog

- Empty/error catalog loads previously injected canonical stock series with fake counts. Detail pages could manufacture a series from promotional cards and inject unrelated local tests with synthetic IDs. These production fallback paths are removed.
- Catalog/detail pages use actual backend series/tests, genuine empty/not-found states and explicit error/retry feedback. Failed reads cannot show demo content as live records.
- Exam filtering uses the actual exam relationship rather than fuzzy SSC/police title matching. Newest sorting uses recorded creation timestamps. Missing count values no longer become fabricated 12/48/15 totals.
- Series reads are paginated with exact counts. Production icons use the saved backend value, not stale localStorage overrides.

### Shared UI

- Student route-level Suspense keeps the surrounding navigation mounted while a lazy page loads.
- Accessible loading placeholders and errors are shared by the corrected pages; reduced-motion behavior comes from the existing Skeleton primitive.
- The bundled Bengali font now has a Bengali-only Unicode fallback face. Bengali instructions/notes remain readable on devices without a system Bengali font, without switching English UI text into the decorative font.

## Verification and safety

- New regression coverage: 66 tests covering backend confirmation/failure, ownership scoping, pagination, saved UI persistence, real period/category filtering, autosave clock updates/recovery, expired submission, support/details/solutions recovery and absence of phantom series.
- Production build includes TypeScript compilation. Changed-file ESLint was checked separately.
- Baseline before this work: 551 passed / 35 failed / 586 total. Final results are recorded below after the delivery run; failures must be compared by exact test name, not treated as production bugs.
- Local visual checks used actual components with mock-only API/context overrides, and blocked every non-local request. Saved Questions and Results were inspected at 1280px and 390px; corrected details, runner, solutions, support, series catalog/detail and relevant dialogs were inspected on mobile. Loading, error and dark-mode saved-question states were inspected. No page-level horizontal overflow was detected in these previews.
- Temporary preview entrypoints/configuration were removed; they are not shipped.
- No production student/payment/question/support records were changed, no real test was submitted, no email/message was sent, no storage files were uploaded/deleted, and no database migration was applied. No migration is needed for these frontend/service fixes. RLS, service credentials and server authorization were not weakened.
- Authenticated production end-to-end use was not tested. GitHub push/Hostinger asset deployment confirmation is separate from authenticated functional verification.

## Final delivery verification

- New regression tests: **66/66 passed**.
- Full suite: **617 passed / 35 failed / 652 total**. The exact set of 35 failing test names is unchanged from the untouched baseline (551 passed / 35 failed / 586 total). No new regression; the full suite still has pre-existing failures and is not claimed green.
- TypeScript and production build: passed (`npm run build`, `tsc -b && vite build`).
- Changed-file ESLint: **zero errors, zero warnings**.
- `git diff --check`: passed. Existing unrelated admin/sidebar work was preserved. No dependencies were installed or upgraded.
