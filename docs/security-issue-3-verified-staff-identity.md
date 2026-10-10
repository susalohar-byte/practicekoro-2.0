# Security issue #3 — verified Auth identity for staff assignment

## Production outcome

Applied `20261010062734_verified_staff_identity.sql`. This fix addresses staff email impersonation only; security issue #4 onward is not included.

- Staff assignment resolves the requested email against confirmed, non-banned `auth.users` identities, not the client-editable profile email.
- Ambiguous Auth email matches fail closed instead of selecting an arbitrary account.
- The direct UUID staff-role RPC also requires a confirmed, non-banned Auth identity and an active matching profile. Primary Super Admin restrictions use Auth email.
- Existing active Super Admin authorization and RPC response shapes are preserved.
- A profile identity trigger rejects inserts/email changes that disagree with the account's Auth email, including independent service-side profile writes.
- An Auth email-change trigger mirrors actual Auth identity email changes to the profile without changing account roles. Pending email-change requests do not change the profile email.
- Existing primary Super Admin constraints remain intact. Changing that protected account's email is not enabled by this fix and requires a separately reviewed identity migration.
- Existing role/account-status safeguards and account-removal logic are unchanged.

## Verification

- Disposable PostgreSQL with existing profile/role triggers: **46 assertions passed**.
- Tested forged duplicate profile emails, direct profile spoofing, missing/ambiguous/unverified/banned/inactive targets, restricted callers, direct UUID promotion bypasses and primary-admin protection.
- Tested valid verified staff assignment, ordinary profile edits, new signup, pending email-change behavior and actual Auth email synchronization.
- Issue #1 regression fixture: **70 assertions passed**. Issue #2 regression fixture: **93 assertions passed**.
- Production read-only checks: **13/13 passed**, including exact comparison of all four deployed function bodies with the approved patch.
- Production profile, role and selected Auth identity fingerprints were unchanged before/after rollout. No real account was promoted, demoted, renamed, invited or banned during verification.
- Production definition fingerprints for account creation, account removal, role/status guards and security fixes #1/#2 were unchanged.
- Real email delivery and real account promotion/email-change operations were not performed; behavioral tests used disposable fixtures only.

## Scope and compatibility

This was a database-only fix; no frontend or Edge Function deployment was required. Profile email is an identity mirror, not an independently editable contact field. Email changes must use the Auth-managed flow, not direct profile updates.

No unique profile-email constraint or bulk identity repair was applied. The authoritative lookup and fail-closed matching address impersonation without rewriting existing accounts. Production identity-health inspection found no profile/Auth email mismatches at audit time.