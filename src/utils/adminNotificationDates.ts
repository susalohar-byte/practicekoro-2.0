/** Calendar-day filters use the same local timezone as the notification date display. */
export function notificationDateInput(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function notificationDateMatches(
  value: string | undefined,
  preset: string,
  customStart: string,
  customEnd: string,
  now = new Date()
): boolean {
  if (preset === 'All Time') return true;
  const date = value ? new Date(value) : new Date(NaN);
  if (!Number.isFinite(date.getTime())) return false;
  const day = notificationDateInput(date);
  let from = customStart;
  let to = customEnd;
  if (preset === 'Last 7 Days' || preset === 'Last 30 Days') {
    const start = new Date(now);
    start.setDate(start.getDate() - (preset === 'Last 7 Days' ? 6 : 29));
    from = notificationDateInput(start);
    to = notificationDateInput(now);
  } else if (preset === 'This Month') {
    from = notificationDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
    to = notificationDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }
  return Boolean(from && to && from <= to && day >= from && day <= to);
}
