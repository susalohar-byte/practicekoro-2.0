import { describe, it, expect } from 'vitest';
import {
  getDateRangeBounds,
  calculatePeriodGrowth,
  generateChartBuckets,
  normalizeActivityItems,
  getKolkataDateString,
  parseKolkataStartOfDay,
  parseKolkataEndOfDay,
} from './admin.dashboard';

describe('Admin Dashboard Domain Unit Tests', () => {
  describe('Timezone & Date Range Bounds (Asia/Kolkata)', () => {
    it('formats dates consistently in Asia/Kolkata timezone', () => {
      // 2026-10-07 16:45:00 UTC = 2026-10-07 22:15:00 in IST
      const d = new Date('2026-10-07T16:45:00Z');
      const formatted = getKolkataDateString(d);
      expect(formatted).toBe('2026-10-07');
    });

    it('parses start and end of day in Asia/Kolkata (+05:30)', () => {
      const start = parseKolkataStartOfDay('2026-10-07');
      const end = parseKolkataEndOfDay('2026-10-07');

      expect(start.toISOString()).toBe('2026-10-06T18:30:00.000Z');
      expect(end.toISOString()).toBe('2026-10-07T18:29:59.999Z');
      expect(end.getTime()).toBeGreaterThan(start.getTime());
    });

    it('calculates Last 7 Days range and equivalent previous period', () => {
      const bounds = getDateRangeBounds('Last 7 Days');
      expect(bounds.label).toBe('Last 7 Days');
      expect(bounds.daysCount).toBe(7);
      expect(bounds.isAllTime).toBe(false);
      expect(bounds.startIso).toBeDefined();
      expect(bounds.endIso).toBeDefined();
      expect(bounds.prevStartIso).toBeDefined();
      expect(bounds.prevEndIso).toBeDefined();

      const startTime = new Date(bounds.startIso).getTime();
      const endTime = new Date(bounds.endIso).getTime();
      const prevStartTime = new Date(bounds.prevStartIso!).getTime();
      const prevEndTime = new Date(bounds.prevEndIso!).getTime();

      // Ensure periods are sequential and equal duration
      expect(endTime).toBeGreaterThan(startTime);
      expect(prevEndTime).toBeLessThan(startTime);
      expect(startTime - prevStartTime).toBeCloseTo(7 * 86400000, -5);
    });

    it('calculates Last 30 Days range and previous period', () => {
      const bounds = getDateRangeBounds('Last 30 Days');
      expect(bounds.label).toBe('Last 30 Days');
      expect(bounds.daysCount).toBe(30);
      expect(bounds.isAllTime).toBe(false);
    });

    it('calculates This Month range', () => {
      const bounds = getDateRangeBounds('This Month');
      expect(bounds.label).toBe('This Month');
      expect(bounds.isAllTime).toBe(false);
      expect(bounds.prevStartIso).toBeDefined();
    });

    it('calculates This Quarter range', () => {
      const bounds = getDateRangeBounds('This Quarter');
      expect(bounds.label).toBe('This Quarter');
      expect(bounds.isAllTime).toBe(false);
      expect(bounds.prevStartIso).toBeDefined();
    });

    it('handles All Time boundary with no previous period', () => {
      const bounds = getDateRangeBounds('All Time');
      expect(bounds.label).toBe('All Time');
      expect(bounds.isAllTime).toBe(true);
      expect(bounds.prevStartIso).toBeUndefined();
    });

    it('handles Custom Range with specified start and end dates', () => {
      const bounds = getDateRangeBounds('Custom Range', '2026-09-01', '2026-09-15');
      expect(bounds.label).toBe('2026-09-01 - 2026-09-15');
      expect(bounds.daysCount).toBe(15);
      expect(bounds.isAllTime).toBe(false);
      expect(bounds.prevStartIso).toBeDefined();
    });
  });

  describe('Period-Over-Period Growth Calculations', () => {
    it('calculates positive growth percentage correctly', () => {
      const result = calculatePeriodGrowth(150, 100, 'Last 30 Days');
      expect(result.trendStr).toBe('+50%');
      expect(result.isPositive).toBe(true);
      expect(result.vsLabel).toBe('vs previous 30 days');
    });

    it('calculates negative growth percentage correctly', () => {
      const result = calculatePeriodGrowth(75, 100, 'Last 7 Days');
      expect(result.trendStr).toBe('-25%');
      expect(result.isPositive).toBe(false);
      expect(result.vsLabel).toBe('vs previous 7 days');
    });

    it('returns 0% when current equals previous', () => {
      const result = calculatePeriodGrowth(50, 50, 'This Month');
      expect(result.trendStr).toBe('0%');
      expect(result.isPositive).toBe(null);
      expect(result.vsLabel).toBe('vs last month');
    });

    it('handles zero previous denominator without fabricating percentages', () => {
      const result = calculatePeriodGrowth(25, 0, 'Last 30 Days');
      // Must not invent +100% or divide-by-zero Infinity%
      expect(result.trendStr).toBe('+25');
      expect(result.isPositive).toBe(true);
    });

    it('returns 0% when both current and previous are zero', () => {
      const result = calculatePeriodGrowth(0, 0, 'Last 14 Days');
      expect(result.trendStr).toBe('0%');
      expect(result.isPositive).toBe(null);
    });

    it('returns N/A when period is All Time', () => {
      const result = calculatePeriodGrowth(100, undefined, 'All Time');
      expect(result.trendStr).toBe('N/A');
      expect(result.isPositive).toBe(null);
      expect(result.vsLabel).toBe('all-time total');
    });
  });

  describe('Chart Buckets Generation', () => {
    it('generates non-empty date buckets with ordered timestamps', () => {
      const startIso = '2026-10-01T00:00:00+05:30';
      const endIso = '2026-10-07T23:59:59+05:30';
      const buckets = generateChartBuckets(startIso, endIso, 7);

      expect(buckets.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < buckets.length - 1; i++) {
        expect(buckets[i].startMs).toBeLessThan(buckets[i + 1].startMs);
        expect(buckets[i].label).toBeDefined();
        expect(buckets[i].dateStr).toBeDefined();
      }
    });
  });

  describe('Recent Activity Feed Normalization & Deduplication', () => {
    it('strictly maps event types to intended categories', () => {
      const rpcItems = [
        {
          id: 'pay_1',
          type: 'payment',
          description: 'Payment of ₹999 received',
          timestamp: '2026-10-07T10:00:00Z',
        },
        {
          id: 'sub_1',
          type: 'subscription',
          description: 'Subscription activated for Rahul',
          timestamp: '2026-10-07T11:00:00Z',
        },
        {
          id: 'reg_1',
          type: 'registration',
          description: 'New student registered: Amit',
          timestamp: '2026-10-07T09:00:00Z',
        },
        {
          id: 'test_1',
          type: 'test_created',
          description: 'New test created: WBCS Prelims 1',
          timestamp: '2026-10-07T08:00:00Z',
        },
      ];

      const normalized = normalizeActivityItems(rpcItems, []);
      expect(normalized.length).toBe(4);

      // Verify category classifications
      expect(normalized.find((i) => i.id === 'pay_1')?.category).toBe('payment');
      expect(normalized.find((i) => i.id === 'sub_1')?.category).toBe('subscription');
      expect(normalized.find((i) => i.id === 'reg_1')?.category).toBe('registration');
      expect(normalized.find((i) => i.id === 'test_1')?.category).toBe('test');

      // Verify newest first sorting
      expect(normalized[0].id).toBe('sub_1');
      expect(normalized[1].id).toBe('pay_1');
      expect(normalized[2].id).toBe('reg_1');
      expect(normalized[3].id).toBe('test_1');
    });

    it('deduplicates events appearing in both RPC and audit logs', () => {
      const rpcItems = [
        {
          id: 'shared_event_1',
          type: 'payment',
          description: 'Payment received',
          timestamp: '2026-10-07T10:00:00Z',
        },
      ];

      const auditLogs = [
        {
          id: 'shared_event_1',
          action: 'payment_received',
          details: { description: 'Payment received' },
          createdAt: '2026-10-07T10:00:00Z',
        },
      ];

      const normalized = normalizeActivityItems(rpcItems, auditLogs);
      expect(normalized.length).toBe(1);
    });

    it('classifies audit log actions explicitly without loose fallback', () => {
      const auditLogs = [
        {
          id: 'audit_sub',
          action: 'subscription_cancelled',
          details: { description: 'Subscription cancelled for student' },
          createdAt: '2026-10-07T12:00:00Z',
        },
        {
          id: 'audit_settings',
          action: 'settings_updated',
          details: { description: 'Platform contact email updated' },
          createdAt: '2026-10-07T07:00:00Z',
        },
      ];

      const normalized = normalizeActivityItems([], auditLogs);
      expect(normalized.find((i) => i.id === 'audit_sub')?.category).toBe('subscription');
      expect(normalized.find((i) => i.id === 'audit_settings')?.category).toBe('system');
    });
  });
});
