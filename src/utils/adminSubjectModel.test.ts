import { describe, it, expect } from 'vitest';
import {
  enrichSubject,
  subjectSummary,
  validateSubjectInput,
  subjectTests,
} from './adminSubjectModel';
import type { Subject, Chapter, MockTest } from '@/types';
const s: Subject = {
  id: 's',
  name: 'Math',
  slug: 'math',
  category: 'Aptitude',
  iconName: 'BookOpen',
  orderIndex: 1,
  isActive: true,
  createdAt: '2026-10-01T10:00:00Z',
};
const c: Chapter = {
  id: 'c',
  subjectId: 's',
  name: 'Algebra',
  slug: 'algebra',
  orderIndex: 1,
  isActive: true,
};
const t = {
  id: 't',
  title: 'Actual topic test',
  subjectId: 's',
  chapterId: 'c',
  testType: 'topic',
  totalQuestions: 4,
  durationMinutes: 10,
} as MockTest;
describe('Subject model integrity', () => {
  it('computes actual relation counts without inherited demo totals', () => {
    const r = enrichSubject(s, [c], [t], {
      questions: [{ id: 'q', subject_id: 's', chapter_id: 'c', topic_id: 'c' }],
      attempts: [],
      warnings: [],
    });
    expect(r).toMatchObject({
      topicsCount: 1,
      topicTestsCount: 1,
      totalQuestionsCount: 1,
      totalQuestionsFormatted: '1',
      attemptsCount: 0,
      avgScoreFormatted: 'Unavailable',
      createdByName: 'Unavailable',
    });
    expect(
      enrichSubject({ ...s, id: 'new' }, [c], [t], { questions: [], attempts: [], warnings: [] })
    ).toMatchObject({ topicsCount: 0, topicTestsCount: 0, totalQuestionsCount: 0 });
  });
  it('keeps failed reads unavailable instead of inventing zero or percentages', () => {
    const r = enrichSubject(s, [c], [t], { questions: null, attempts: null, warnings: ['denied'] });
    expect(r.totalQuestionsFormatted).toBe('Unavailable');
    expect(r.attemptsCount).toBeNull();
    expect(
      subjectSummary([s], [c], [t], { questions: null, attempts: null, warnings: [] }).accuracy
    ).toBe('Unavailable');
  });
  it('uses linked test attempts, actual completion and recorded score percentages', () => {
    const attempts = [
      {
        id: 'a',
        test_id: 't',
        status: 'completed',
        score: 0,
        total_marks: 4,
        correct_count: 0,
        wrong_count: 4,
      },
      {
        id: 'b',
        test_id: 't',
        status: 'in_progress',
        score: 0,
        total_marks: 4,
        correct_count: 0,
        wrong_count: 0,
      },
      {
        id: 'other',
        test_id: 'unrelated',
        status: 'completed',
        score: 100,
        total_marks: 100,
        correct_count: 100,
        wrong_count: 0,
      },
    ];
    const r = enrichSubject(s, [c], [t], { questions: [], attempts, warnings: [] });
    expect(r).toMatchObject({
      attemptsCount: 2,
      completionRateFormatted: '50%',
      avgScoreFormatted: '0%',
    });
    expect(subjectSummary([s], [c], [t], { questions: [], attempts, warnings: [] })).toMatchObject({
      attempts: 2,
      accuracy: '0%',
    });
  });
  it('resolves chapter-only test associations but respects an explicit different subject', () => {
    expect(
      subjectTests(
        's',
        [c],
        [
          { ...t, subjectId: undefined },
          { ...t, id: 'else', subjectId: 'other' },
        ]
      )
    ).toHaveLength(1);
  });
  it.each(['', 'Bangla নাম', 'Bad Slug', '-invalid'])('rejects invalid URL slug %s', (slug) => {
    expect(() => validateSubjectInput({ ...s, slug })).toThrow();
  });
  it.each([
    'blob:https://example.test/temp',
    'data:image/png;base64,abc',
    'http://example.test/a.png',
  ])('rejects non-durable icon reference %s', (iconName) => {
    expect(() => validateSubjectInput({ ...s, iconName })).toThrow();
  });
  it('accepts durable assets/named icons and order zero', () => {
    for (const iconName of ['BookOpen', '/images/math.png', 'https://example.test/math.png'])
      expect(() => validateSubjectInput({ ...s, iconName, orderIndex: 0 })).not.toThrow();
  });
  it('counts legacy chapter_mock tests alongside topic tests', () => {
    const sub = {
      id: 's',
      name: 'Math',
      slug: 'math',
      iconName: 'BookOpen',
      orderIndex: 0,
      isActive: true,
    };
    const t = { id: 'legacy', subjectId: 's', testType: 'chapter_mock' } as any;
    expect(
      enrichSubject(sub, [], [t], { questions: [], attempts: [], warnings: [] }).topicTestsCount
    ).toBe(1);
    expect(
      subjectSummary([sub], [], [t], { questions: [], attempts: [], warnings: [] }).topicTests
    ).toBe(1);
  });
});
