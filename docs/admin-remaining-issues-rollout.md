# Remaining admin reporting and persistence fixes

## Implemented

- Test icons: production `tests.icon_url` column added. Requested icon writes and removals fail explicitly if the schema is missing or the returned icon is not confirmed. UI uses the saved record, not a submitted-but-unsaved URL. Clearing the editor sends an explicit empty value which maps to SQL NULL.
- Coupons: row/menu editing hydrates the actual coupon and restrictions, preserves hidden minimum order/per-user settings, updates the real backend ID, and never creates a duplicate as an edit. Optional restrictions can be cleared. Failed saves preserve the draft; synchronous locks prevent duplicate submissions. The unsupported standalone title field is read-only and the "first-time" switch is correctly labelled one-use-per-user. Load errors are surfaced and reads are paginated completely.
- Payments: period-scoped rows, summary totals, exports and revenue/refund bars; an All Time option preserves older records. Retained revenue excludes failed/pending/full-refund records and subtracts recorded partial refunds. Gateway donut geometry and legend use the same actual retained amounts, including Other. Gateway is not claimed to be an underlying payment method. Static September labels, fabricated growth percentages and stock student photos/phone numbers are removed. Pagination is bounded and filter changes reset the page.
- Receipt action: downloads an administrative receipt and explicitly says no email was sent. It is no longer labelled Send Receipt.
- Analytics: complete authorized reads with exact counts, stable pagination and date filtering in Asia/Kolkata. New students are actual registrations, not paying users. Answer counts/accuracy and content insight counts use recorded selected answers, excluding skips. Subject/topic labels say answered questions, not students. Student rankings, growth and district counts are recorded data. Static demographics and invented historical trends are removed.
- Analytics controls: dynamic presets/custom dates, stale-response protection, explicit load error/retry, disabled export on failure/loading and CSV labels matching the loaded scope. View All expands genuine underlying lists rather than showing a toast.

## Definitions and limitations

Total student profiles, district distribution and active Pro students are current snapshots. Other Analytics activity figures use the selected period. Retained revenue and recorded refunds are attributed to original payment date; this is not a refund cash-flow report. Activity can include answers recorded in the period for attempts started earlier.

Gender and historical subject trends are not available from these report queries and are explicitly unavailable, never estimated. Practice-pack dispatch is disabled until a real targeting/delivery workflow exists. Existing unavailable Settings features (email delivery, SEO editor, integrations, auth-policy enforcement and global styling) remain disabled; these fixes do not implement or claim delivery/enforcement for them.

## Production changes

Only narrowly approved schema/function DDL was applied, with no business-record mutation:

- `20261007162922_admin_settings_gateway_guard.sql`: already applied with approval. Gateway changes restricted to active Super Admin, client secret writes rejected, anonymous execution denied.
- `20261007193234_add_icon_url_to_tests.sql`: adds nullable TEXT column and schema cache reload; production column presence verified. Existing icons/content, attempts and student history were not rewritten.

Local filenames now match the actual Supabase migration versions. Do not reapply historical migrations or reset roles. Frontend publication is tracked separately from schema deployment.

## Safety and verification

All destructive/action tests use mocks, demo/local records or disposable PostgreSQL fixtures. No real payments, coupon changes, messages or student updates were submitted. Desktop 1280px and mobile 375px previews of Analytics, Payments and Coupons were rendered using fixture-only API overrides with external network blocked. No page JavaScript errors or page-level horizontal overflow were observed.

Full-suite baseline: 420 passed / 38 failed. Final results are reported with the delivery commit; existing redesigned-UI/mock failures are distinguished from new regressions. Changed-file ESLint retains the two pre-existing AdminTests hook warnings and must introduce no errors. Production build includes TypeScript compilation.

### Final verification results

- 45 focused regression tests passed (29 new tests plus existing icon and financial workflow coverage).
- Full suite: 456 passed / 31 failed / 487 total, versus baseline 420 passed / 38 failed / 458 total. No newly failing test names. Seven stale financial regressions now pass after using explicit drawer selection, current fixture dates, the retained-revenue label and the named payment table; their financial assertions were preserved.
- TypeScript and production build passed. Changed-file ESLint: zero errors, two pre-existing AdminTests hook-dependency warnings.
- Disposable SQL tests passed for both icon schema/data preservation and the gateway authorization guard.
- Live authenticated mutations were not performed; mock/fixture verification and public deployed-bundle verification are separate from an account-specific live workflow check.

Concurrent commit `690a1ef` was preserved through rebase. Its explicit question–chapter foreign-key disambiguation was also used in the new Analytics read path, after checking the actual production constraint names. The question table has both chapter and topic foreign keys into chapters; unqualified embedding is not safe.

Post-integration verification: 457 passed / 31 existing failures / 488 total; no new failing names versus the original baseline. Integrated TypeScript and production build passed.
