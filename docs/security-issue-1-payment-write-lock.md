# Security issue #1 — service-only payment writes

## Production outcome

Applied migration `20261010055334_service_only_payment_writes.sql` to the existing production project. This change addresses payment-record tampering only. Security issues #2 onward are not included.

- Anonymous and authenticated clients, including Super Admin browser sessions, retain SELECT but no payment-table mutation or maintenance privileges.
- Explicit column-level mutation grants are removed.
- The permissive `Admin manage payments` ALL policy is removed. Existing owner/admin read policy and payment reporting RPC remain unchanged.
- Restrictive policies deny client INSERT, UPDATE and DELETE even if grants are accidentally restored.
- Client execution of the legacy `create_razorpay_order(text)` and `mark_payment_refunded(uuid,numeric,text,text)` RPCs is revoked. SECURITY DEFINER routines would otherwise bypass table ACL/RLS.
- A BEFORE row-write trigger requires the service role from the verified request identity, covering accidental re-exposure of definer writers.
- Existing service-role grants and verified activation/webhook/refund reconciliation function implementations are unchanged.

## Verification

- Disposable PostgreSQL regression fixture: **70 assertions passed**. Covers guest, students, all three admin roles, inactive-admin role simulation, SELECT ownership, table/column permissions, legacy RPC denial, accidental-grant defence, service writes, actual verified-activation implementation and idempotency.
- Existing activation SQL regression suite: **18 assertions passed**.
- Production read-only post-rollout checks: **10/10 true**, using `supabase/tests/payment_write_permissions.sql`.
- Production payment-record fingerprint and record count were unchanged before/after the migration.
- Production definition fingerprints of activation, webhook reconciliation, refund reconciliation and payment reporting were unchanged.
- Authenticated live `/admin/payments` loaded its Payments heading and retained-revenue reporting without a payment-load/permission error.
- No order, charge, refund, invitation or subscription was initiated during verification.
- No real post-rollout payment was performed by the agent; service-side continuity is supported by permission/definition checks and isolated execution, not a new production transaction.

## Deliberately blocked legacy workflow

The browser's manual refund-recording RPC/direct-update fallback is now denied. This is intentional: accepting a client-supplied refund identifier without provider verification is not a trusted payment workflow.

The existing production refund webhook reconciliation remains allowed. A new admin gateway-refund/manual-reconciliation workflow is not deployed as part of this fix. Do not re-enable direct table writes to make the old button succeed.

## Operations

Payment-changing scripts must use the trusted server service identity; ordinary administrator browser sessions are read-only for payment records. Privileged database maintenance requires explicit operator authorization and a controlled server identity. Do not roll back by restoring broad client grants.