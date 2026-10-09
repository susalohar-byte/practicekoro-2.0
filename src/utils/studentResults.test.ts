import { describe, expect, it } from 'vitest';
import { filterStudentAttempts } from './studentResults';
import type { TestAttempt } from '@/types';
const now = new Date('2026-10-08T05:00:00Z');
const a = (
  id: string,
  createdAt: string,
  testType: TestAttempt['testType'] = 'full_mock',
  extra = {}
): TestAttempt => ({
  id,
  createdAt,
  testType,
  userId: 'u',
  testId: id,
  startTime: createdAt,
  status: 'completed',
  score: 1,
  totalMarks: 5,
  correctCount: 1,
  wrongCount: 4,
  skippedCount: 0,
  accuracy: 20,
  timeSpentSeconds: 30,
  ...extra,
});
const rows = [
  a('old', '2025-10-01T00:00:00Z'),
  a('jul', '2026-07-08T00:00:00Z'),
  a('sep', '2026-09-01T00:00:00Z', 'topic'),
  a('oct', '2026-09-30T18:30:00Z', 'pyq'),
  a('series', '2026-10-01T00:00:00Z', 'subject_mock', { testSeriesId: 's' }),
];
describe('Student reporting scope', () => {
  it('actually filters rolling three months', () =>
    expect(
      filterStudentAttempts(rows, 'Last 3 Months', 'Overview', now).map((a) => a.id)
    ).not.toContain('old'));
  it('uses Kolkata month midnight rather than UTC midnight', () =>
    expect(filterStudentAttempts(rows, 'This Month', 'Overview', now).map((a) => a.id)).toEqual([
      'series',
      'oct',
    ]));
  it('filters this calendar year', () =>
    expect(filterStudentAttempts(rows, 'This Year', 'Overview', now)).toHaveLength(4));
  it('keeps all time records ordered newest first', () =>
    expect(filterStudentAttempts(rows, 'All Time', 'Overview', now).map((a) => a.id)).toEqual([
      'series',
      'oct',
      'sep',
      'jul',
      'old',
    ]));
  it('separates practice tests', () =>
    expect(filterStudentAttempts(rows, 'All Time', 'Practice Tests', now).map((a) => a.id)).toEqual(
      ['series', 'sep']
    ));
  it('separates full mock and PYQ tests', () =>
    expect(filterStudentAttempts(rows, 'All Time', 'Mock Tests', now).map((a) => a.id)).toEqual([
      'oct',
      'jul',
      'old',
    ]));
  it('does not invent live participation', () =>
    expect(filterStudentAttempts(rows, 'All Time', 'Live Tests', now)).toEqual([]));
  it('excludes incomplete, invalid and future attempts', () =>
    expect(
      filterStudentAttempts(
        [
          a('invalid', 'bad'),
          a('future', '2027-01-01'),
          a('unfinished', '2026-10-01', 'full_mock', { status: 'in_progress' }),
        ],
        'All Time',
        'Overview',
        now
      )
    ).toEqual([]));
  it('clamps month-end rolling dates', () =>
    expect(
      filterStudentAttempts(
        [a('feb-end', '2026-02-28T00:00:00Z')],
        'Last 3 Months',
        'Overview',
        new Date('2026-05-31T00:00:00Z')
      )
    ).toHaveLength(1));
});
