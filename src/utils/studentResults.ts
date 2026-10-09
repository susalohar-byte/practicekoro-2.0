import type { TestAttempt } from '@/types';
export type StudentResultRange = 'Last 3 Months' | 'This Month' | 'This Year' | 'All Time';
export type StudentResultTab =
  'Overview' | 'Mock Tests' | 'Test Series' | 'Practice Tests' | 'Live Tests';

export function filterStudentAttempts(
  attempts: TestAttempt[],
  range: StudentResultRange,
  tab: StudentResultTab,
  now = new Date()
) {
  const local = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [year, month, day] = local.split('-').map(Number);
  let cutoff = -Infinity;
  if (range === 'This Month') cutoff = Date.parse(`${local.slice(0, 7)}-01T00:00:00+05:30`);
  if (range === 'This Year') cutoff = Date.parse(`${year}-01-01T00:00:00+05:30`);
  if (range === 'Last 3 Months') {
    // Rolling calendar months, clamped rather than overflowing short months.
    const target = new Date(Date.UTC(year, month - 4, 1));
    const maxDay = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
    ).getUTCDate();
    target.setUTCDate(Math.min(day, maxDay));
    cutoff = target.getTime() - 330 * 60_000;
  }
  return attempts
    .filter((a) => {
      const time = Date.parse(a.createdAt);
      if (
        !Number.isFinite(time) ||
        time < cutoff ||
        time > now.getTime() ||
        a.status !== 'completed'
      )
        return false;
      if (tab === 'Practice Tests')
        return ['topic', 'chapter_mock', 'subject_mock'].includes(a.testType || '');
      if (tab === 'Mock Tests') return a.testType === 'full_mock' || a.testType === 'pyq';
      if (tab === 'Test Series') return Boolean(a.testSeriesId);
      // Attempt rows do not identify live-event participation. Do not relabel ordinary mocks as live.
      if (tab === 'Live Tests') return false;
      return true;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
