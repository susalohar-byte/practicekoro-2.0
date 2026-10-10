// Runtime validation is required even when callers use TypeScript interfaces.
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
export function isOrderPayload(value: unknown): value is { planId: string } {
  return isRecord(value) && nonEmptyString(value.planId);
}
export function isVerificationPayload(value: unknown): value is {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: string;
} {
  return (
    isRecord(value) &&
    ['orderId', 'paymentId', 'signature', 'planId'].every((key) => nonEmptyString(value[key]))
  );
}
export function isCompletedRefund(event: string, status: unknown): boolean {
  // An explicit non-final status always wins over the event name.
  return (
    status === 'processed' ||
    ((status === undefined || status === null) &&
      (event === 'refund.processed' || event === 'payment.refunded'))
  );
}
