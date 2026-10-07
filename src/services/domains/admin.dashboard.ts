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
  const now = getKolkataNow();
  const todayStr = getKolkataDateString(now);
  const [ty, tm, td] = todayStr.split('-').map(Number);

  if (preset === 'Today') {
    const start = parseKolkataStartOfDay(todayStr);
    const end = parseKolkataEndOfDay(todayStr);
    const prevDate = new Date(Date.UTC(ty, tm - 1, td - 1));
    const prevStr = getKolkataDateString(prevDate);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      prevStartIso: parseKolkataStartOfDay(prevStr).toISOString(),
      prevEndIso: parseKolkataEndOfDay(prevStr).toISOString(),
      label: 'Today',
      daysCount: 1,
      isAllTime: false,
    };
  }

  if (preset === 'Yesterday') {
    const yestDate = new Date(Date.UTC(ty, tm - 1, td - 1));
    const yestStr = getKolkataDateString(yestDate);
    const start = parseKolkataStartOfDay(yestStr);
    const end = parseKolkataEndOfDay(yestStr);
    const dayBefore = new Date(Date.UTC(ty, tm - 1, td - 2));
    const dayBeforeStr = getKolkataDateString(dayBefore);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      prevStartIso: parseKolkataStartOfDay(dayBeforeStr).toISOString(),
      prevEndIso: parseKolkataEndOfDay(dayBeforeStr).toISOString(),
      label: 'Yesterday',
      daysCount: 1,
      isAllTime: false,
    };
  }

  if (preset === 'Last 7 Days') {
    const sDate = new Date(Date.UTC(ty, tm - 1, td - 6));
    const sStr = getKolkataDateString(sDate);
    const start = parseKolkataStartOfDay(sStr);
    const end = parseKolkataEndOfDay(todayStr);
    const prevSDate = new Date(Date.UTC(ty, tm - 1, td - 13));
    const prevEDate = new Date(Date.UTC(ty, tm - 1, td - 7));
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      prevStartIso: parseKolkataStartOfDay(getKolkataDateString(prevSDate)).toISOString(),
      prevEndIso: parseKolkataEndOfDay(getKolkataDateString(prevEDate)).toISOString(),
      label: 'Last 7 Days',
      daysCount: 7,
      isAllTime: false,
    };
  }

  if (preset === 'Last 14 Days') {
    const sDate = new Date(Date.UTC(ty, tm - 1, td - 13));
    const sStr = getKolkataDateString(sDate);
    const start = parseKolkataStartOfDay(sStr);
    const end = parseKolkataEndOfDay(todayStr);
    const prevSDate = new Date(Date.UTC(ty, tm - 1, td - 27));
    const prevEDate = new Date(Date.UTC(ty, tm - 1, td - 14));
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      prevStartIso: parseKolkataStartOfDay(getKolkataDateString(prevSDate)).toISOString(),
      prevEndIso: parseKolkataEndOfDay(getKolkataDateString(prevEDate)).toISOString(),
      label: 'Last 14 Days',
      daysCount: 14,
      isAllTime: false,
    };
  }

  if (preset === 'This Month') {
    const sStr = `${ty}-${String(tm).padStart(2, '0')}-01`;
    const start = parseKolkataStartOfDay(sStr);
    const end = parseKolkataEndOfDay(todayStr);
    // Previous calendar month
    const prevMonthEnd = new Date(Date.UTC(ty, tm - 1, 0));
    const prevMonthStart = new Date(Date.UTC(ty, tm - 2, 1));
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      prevStartIso: parseKolkataStartOfDay(getKolkataDateString(prevMonthStart)).toISOString(),
      prevEndIso: parseKolkataEndOfDay(getKolkataDateString(prevMonthEnd)).toISOString(),
      label: 'This Month',
      daysCount: td,
      isAllTime: false,
    };
  }

  if (preset === 'This Quarter') {
    const qIndex = Math.floor((tm - 1) / 3);
    const qStartMonth = qIndex * 3 + 1;
    const sStr = `${ty}-${String(qStartMonth).padStart(2, '0')}-01`;
    const start = parseKolkataStartOfDay(sStr);
    const end = parseKolkataEndOfDay(todayStr);
    const prevQEnd = new Date(Date.UTC(ty, qStartMonth - 1, 0));
    const prevQStart = new Date(Date.UTC(ty, qStartMonth - 4, 1));
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      prevStartIso: parseKolkataStartOfDay(getKolkataDateString(prevQStart)).toISOString(),
      prevEndIso: parseKolkataEndOfDay(getKolkataDateString(prevQEnd)).toISOString(),
      label: 'This Quarter',
      daysCount: Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)),
      isAllTime: false,
    };
  }

  if (preset === 'All Time') {
    const start = new Date(0);
    const end = parseKolkataEndOfDay(todayStr);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      label: 'All Time',
      daysCount: 3650,
      isAllTime: true,
    };
  }

  if (preset === 'Custom Range' && customStart) {
    const start = parseKolkataStartOfDay(customStart);
    const end = customEnd ? parseKolkataEndOfDay(customEnd) : parseKolkataEndOfDay(todayStr);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const prevStart = new Date(start.getTime() - diffDays * 86400000);
    const prevEnd = new Date(start.getTime() - 1);
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      prevStartIso: prevStart.toISOString(),
      prevEndIso: prevEnd.toISOString(),
      label: `${customStart} - ${customEnd || todayStr}`,
      daysCount: diffDays,
      isAllTime: false,
    };
  }

  // Default: Last 30 Days
  const sDate = new Date(Date.UTC(ty, tm - 1, td - 29));
  const sStr = getKolkataDateString(sDate);
  const start = parseKolkataStartOfDay(sStr);
  const end = parseKolkataEndOfDay(todayStr);
  const prevSDate = new Date(Date.UTC(ty, tm - 1, td - 59));
  const prevEDate = new Date(Date.UTC(ty, tm - 1, td - 30));
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    prevStartIso: parseKolkataStartOfDay(getKolkataDateString(prevSDate)).toISOString(),
    prevEndIso: parseKolkataEndOfDay(getKolkataDateString(prevEDate)).toISOString(),
    label: 'Last 30 Days',
    daysCount: 30,
    isAllTime: false,
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
      ? 'vs last month'
      : periodName === 'This Quarter'
      ? 'vs last quarter'
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

export function generateChartBuckets(startIso: string, endIso: string, targetCount = 7): ChartBucket[] {
  const startTime = new Date(startIso).getTime();
  const endTime = new Date(endIso).getTime();
  const totalDuration = Math.max(1, endTime - startTime);
  const buckets: ChartBucket[] = [];

  const count = Math.min(targetCount, Math.max(2, Math.round(totalDuration / 86400000)));
  const step = totalDuration / count;

  for (let i = 0; i < count; i++) {
    const bStart = startTime + i * step;
    const bEnd = i === count - 1 ? endTime : startTime + (i + 1) * step;
    const dateObj = new Date(bStart);
    const label = dateObj.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
    });
    const dateStr = getKolkataDateString(dateObj);
    buckets.push({
      label,
      dateStr,
      startMs: bStart,
      endMs: bEnd,
    });
  }

  return buckets;
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
    if (!act.id || seenIds.has(act.id)) continue;
    seenIds.add(act.id);

    let category: 'payment' | 'subscription' | 'registration' | 'test' | 'system' = 'system';
    const type = (act.type || '').toLowerCase();
    if (type === 'payment') category = 'payment';
    else if (type === 'subscription') category = 'subscription';
    else if (type === 'registration') category = 'registration';
    else if (type.includes('test') || type.includes('exam')) category = 'test';

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
          ? 'Subscription Active'
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
    const logId = log.id || `audit_${log.createdAt}_${Math.random()}`;
    if (seenIds.has(logId)) continue;
    seenIds.add(logId);

    const action = (log.action || '').toLowerCase();
    let category: 'payment' | 'subscription' | 'registration' | 'test' | 'system' = 'system';

    if (action.includes('subscription') || action.includes('plan')) {
      category = 'subscription';
    } else if (action.includes('payment') || action.includes('refund')) {
      category = 'payment';
    } else if (action.includes('student') || action.includes('user_created')) {
      category = 'registration';
    } else if (action.includes('test') || action.includes('exam') || action.includes('question')) {
      category = 'test';
    }

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
