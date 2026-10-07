import type { AdminActivityItem } from '@/types';

/**
 * Explicit Asia/Kolkata timezone helpers for administrative and financial reporting.
 */
export function getKolkataNow(): Date {
  return new Date();
}

export function getKolkataDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function parseKolkataStartOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

export function parseKolkataEndOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+05:30`);
}

export interface DateRangeBounds {
  startIso: string;
  endIso: string;
  prevStartIso?: string;
  prevEndIso?: string;
  label: string;
  daysCount: number;
  isAllTime: boolean;
}

export function getDateRangeBounds(
  preset: string,
  customStart?: string,
  customEnd?: string
): DateRangeBounds {
  const today = getKolkataDateString(getKolkataNow());
  const [y, m, d] = today.split('-').map(Number);
  const civil = (days: number) => getKolkataDateString(new Date(Date.UTC(y, m - 1, d + days)));
  let from = civil(-29),
    to = today,
    label = preset;
  if (preset === 'Today') from = today;
  else if (preset === 'Yesterday') from = to = civil(-1);
  else if (preset === 'Last 7 Days') from = civil(-6);
  else if (preset === 'Last 14 Days') from = civil(-13);
  else if (preset === 'This Month') from = `${y}-${String(m).padStart(2, '0')}-01`;
  else if (preset === 'This Quarter')
    from = `${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, '0')}-01`;
  else if (preset === 'All Time') from = '1970-01-01';
  else if (preset === 'Custom Range') {
    if (!customStart) throw new Error('Choose a start date.');
    from = customStart;
    to = customEnd || customStart;
    label = `${from} - ${to}`;
  } else label = 'Last 30 Days';
  const start = parseKolkataStartOfDay(from),
    end = parseKolkataEndOfDay(to);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    getKolkataDateString(start) !== from ||
    getKolkataDateString(end) !== to ||
    start > end
  )
    throw new Error('Choose a valid date range with start on or before end.');
  const days = Math.round((end.getTime() - start.getTime() + 1) / 86400000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label,
    daysCount: days,
    isAllTime: preset === 'All Time',
    ...(preset === 'All Time'
      ? {}
      : {
          prevStartIso: new Date(start.getTime() - days * 86400000).toISOString(),
          prevEndIso: new Date(start.getTime() - 1).toISOString(),
        }),
  };
}

export interface GrowthResult {
  trendStr: string;
  isPositive: boolean | null;
  vsLabel: string;
}

export function calculatePeriodGrowth(
  currentVal: number,
  prevVal: number | null | undefined,
  periodName: string
): GrowthResult {
  const vsLabel =
    periodName === 'All Time'
      ? 'all-time total'
      : periodName === 'Last 7 Days'
        ? 'vs previous 7 days'
        : periodName === 'Last 14 Days'
          ? 'vs previous 14 days'
          : periodName === 'Last 30 Days'
            ? 'vs previous 30 days'
            : periodName === 'This Month'
              ? 'vs previous equal-length period'
              : periodName === 'This Quarter'
                ? 'vs previous equal-length period'
                : 'vs previous period';

  if (periodName === 'All Time' || prevVal === null || prevVal === undefined) {
    return { trendStr: 'N/A', isPositive: null, vsLabel };
  }

  if (prevVal === 0) {
    if (currentVal === 0) {
      return { trendStr: '0%', isPositive: null, vsLabel };
    }
    // Prevent inventing fabricated percentages when previous denominator is 0
    return { trendStr: `+${currentVal}`, isPositive: true, vsLabel };
  }

  const diff = currentVal - prevVal;
  const pct = Math.round((diff / prevVal) * 100);

  if (pct > 0) {
    return { trendStr: `+${pct}%`, isPositive: true, vsLabel };
  } else if (pct < 0) {
    return { trendStr: `${pct}%`, isPositive: false, vsLabel };
  } else {
    return { trendStr: '0%', isPositive: null, vsLabel };
  }
}

export interface ChartBucket {
  label: string;
  dateStr: string;
  startMs: number;
  endMs: number;
}

export function generateChartBuckets(
  startIso: string,
  endIso: string,
  targetCount = 7
): ChartBucket[] {
  const startTime = Date.parse(startIso),
    endTime = Date.parse(endIso);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || startTime > endTime)
    throw new Error('Invalid chart range.');
  const days = Math.max(1, Math.ceil((endTime - startTime + 1) / 86400000));
  const count = Math.min(Math.max(1, targetCount), days);
  return Array.from({ length: count }, (_, i) => {
    const startMs = startTime + Math.floor((i * days) / count) * 86400000;
    const endMs =
      i === count - 1 ? endTime : startTime + Math.floor(((i + 1) * days) / count) * 86400000 - 1;
    return {
      startMs,
      endMs,
      label: new Date(startMs).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
      }),
      dateStr: getKolkataDateString(new Date(startMs)),
    };
  });
}

export interface PopularExamItem {
  id: string;
  name: string;
  attempts: string;
  rawAttempts: number;
  percentage: number;
  code: string;
  bg: string;
  badgeText: string;
}

export interface MostAttemptedTestItem {
  id: string;
  title: string;
  exam: string;
  attempts: string;
  rawAttempts: number;
  iconBg: string;
}

export interface NormalizedActivityItem {
  id: string;
  category: 'payment' | 'subscription' | 'registration' | 'test' | 'system';
  title: string;
  desc: string;
  time: string;
  timestamp: string;
}

export function normalizeActivityItems(
  rpcActivities: AdminActivityItem[] = [],
  auditLogs: any[] = []
): NormalizedActivityItem[] {
  const items: NormalizedActivityItem[] = [];
  const seenIds = new Set<string>();

  // Process system events from RPC
  for (const act of rpcActivities) {
    if (!act.id) continue;

    let category: 'payment' | 'subscription' | 'registration' | 'test' | 'system' = 'system';
    const type = (act.type || '').toLowerCase();
    if (type === 'payment') category = 'payment';
    else if (type === 'subscription') category = 'subscription';
    else if (type === 'registration') category = 'registration';
    else if (type.includes('test') || type.includes('exam')) category = 'test';

    const eventKey = `${category}:${act.id}:${Date.parse(act.timestamp)}`;
    if (seenIds.has(eventKey)) continue;
    seenIds.add(eventKey);
    const d = new Date(act.timestamp);
    const formattedTime = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Recently';

    items.push({
      id: act.id,
      category,
      title:
        category === 'payment'
          ? 'Payment Confirmed'
          : category === 'subscription'
            ? 'Subscription Update'
            : category === 'registration'
              ? 'Student Joined'
              : 'Content Update',
      desc: act.description,
      time: formattedTime,
      timestamp: act.timestamp,
    });
  }

  // Process audit logs
  for (const log of auditLogs) {
    const logId =
      log.id ||
      `audit_${log.action}_${log.entityId || log.adminName || 'unknown'}_${log.createdAt}`;

    const action = (log.action || '').toLowerCase();
    let category: 'payment' | 'subscription' | 'registration' | 'test' | 'system' = 'system';

    if (action.includes('subscription') || action.includes('plan')) {
      category = 'subscription';
    } else if (action.includes('payment') || action.includes('refund')) {
      category = 'payment';
    } else if (['student_created', 'user_created', 'student_registration'].includes(action)) {
      category = 'registration';
    } else if (action.includes('test') || action.includes('exam') || action.includes('question')) {
      category = 'test';
    }

    const eventKey = `${category}:${log.entityId || logId}:${Date.parse(log.createdAt)}`;
    if (seenIds.has(eventKey)) continue;
    seenIds.add(eventKey);
    const d = new Date(log.createdAt);
    const formattedTime = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Recently';

    items.push({
      id: logId,
      category,
      title: log.action || 'Activity',
      desc: log.details?.description || `${log.adminName || 'Staff'} performed ${log.action}`,
      time: formattedTime,
      timestamp: log.createdAt,
    });
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return items;
}
