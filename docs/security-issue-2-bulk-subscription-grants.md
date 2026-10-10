# Security issue #2 — Super Admin-only bulk subscription grants

## Production outcome

Applied `20261010060535_super_admin_bulk_subscription_grants.sql`. Only the bulk subscription-grant RPC and its execution grants changed. Issues #3 onward are not included.

- `bulk_grant_student_subscription(uuid[],text,integer)` now requires a currently active Super Admin profile through the existing `is_management_super_admin()` helper.
- Content Writers, Support Agents, students, inactive administrators, missing profiles and missing sessions are denied inside the database function, not merely in the UI.
- Anonymous/public and service-role execution grants are removed. Authenticated users can reach the endpoint, but only an active Super Admin can perform the operation. Service-side payment activation uses separate RPCs.
- Requests must contain a one-dimensional roster of 1–100 unique, non-null student IDs.
- Every recipient must be an existing active student. A mixed invalid batch fails before any inserts.
- The plan must be active with a positive configured duration. Requested days must be positive and no greater than that plan duration. Longer extensions use a separately authorized extension workflow, not this endpoint.
- Plan/recipient rows are locked during validation and insertion; existing subscription history is not rewritten.

## Verification

- Disposable PostgreSQL fixture: **93 assertions passed**. Includes all admin sub-roles, students, inactive/missing identities, anonymous/service callers, session-preserving role revocation, malformed/duplicate/null/oversized rosters, invalid plans/durations, mixed-batch atomic rejection, valid single/100-student grants and existing-history preservation.
- Issue #1 regression fixture: **70 assertions passed**.
- Production read-only verification: **11/11 checks passed**, including exact comparison of the deployed function body with the approved patch.
- Full subscription-record fingerprint was unchanged before/after rollout.
- Subscription RLS policy fingerprint was unchanged.
- Existing Super Admin helper, verified payment activation, webhook/refund reconciliation, issue #1 payment trigger and batch-assignment function definitions were unchanged.
- No production subscription grant, real payment, refund or account invitation was initiated during verification.

## Scope

No frontend deployment or payment-function redeployment was required. Existing RPC parameters and integer-count response shape remain compatible. This fix does not claim that every other admin RPC has been converted to the complete sub-role permission matrix; those are separate audit findings awaiting authorization.