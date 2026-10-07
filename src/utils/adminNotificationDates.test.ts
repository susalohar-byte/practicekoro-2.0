import { describe, it, expect } from 'vitest';
import {
  notificationDateInput,
  notificationDateMatches as matches,
} from './adminNotificationDates';
const now = new Date(2026, 9, 7, 12);
describe('notification calendar filters', () => {
  it('All Time includes unknown dates without manufacturing a timestamp', () =>
    expect(matches(undefined, 'All Time', '', '', now)).toBe(true));
  it('Last 7 Days includes both boundary days but excludes older and future days', () => {
    expect(matches('2026-10-01T12:00:00', 'Last 7 Days', '', '', now)).toBe(true);
    expect(matches('2026-10-07T23:59:00', 'Last 7 Days', '', '', now)).toBe(true);
    expect(matches('2026-09-30T12:00:00', 'Last 7 Days', '', '', now)).toBe(false);
    expect(matches('2026-10-08T12:00:00', 'Last 7 Days', '', '', now)).toBe(false);
  });
  it('Last 30 Days spans month boundaries', () => {
    expect(matches('2026-09-08T12:00:00', 'Last 30 Days', '', '', now)).toBe(true);
    expect(matches('2026-09-07T12:00:00', 'Last 30 Days', '', '', now)).toBe(false);
  });
  it('This Month includes scheduled dates later in the same month', () => {
    expect(matches('2026-10-31T12:00:00', 'This Month', '', '', now)).toBe(true);
    expect(matches('2026-11-01T12:00:00', 'This Month', '', '', now)).toBe(false);
  });
  it('custom dates are inclusive and reject inverted, missing or unparseable bounds', () => {
    expect(matches('2026-10-07T23:59:00', 'Custom Range', '2026-10-01', '2026-10-07', now)).toBe(
      true
    );
    expect(matches('2026-10-07', 'Custom Range', '2026-10-08', '2026-10-07', now)).toBe(false);
    expect(matches(undefined, 'Custom Range', '2026-10-01', '2026-10-07', now)).toBe(false);
    expect(matches('invalid', 'Custom Range', '2026-10-01', '2026-10-07', now)).toBe(false);
    expect(matches('2026-10-07', 'Custom Range', '', '', now)).toBe(false);
  });
  it('formats local calendar dates consistently with the visible date labels', () =>
    expect(notificationDateInput(now)).toBe('2026-10-07'));
});
