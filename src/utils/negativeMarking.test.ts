import { describe, expect, it } from 'vitest';
import {
  supportsNegativeMarking,
  resolveTestNegativeMarking,
  NEGATIVE_MARKING_TEST_TYPES,
} from './negativeMarking';

describe('negative marking policy', () => {
  it('supports configured negative marking for every existing test type', () => {
    expect([...NEGATIVE_MARKING_TEST_TYPES]).toEqual([
      'full_mock',
      'pyq',
      'topic',
      'chapter_mock',
      'subject_mock',
    ]);
    expect(supportsNegativeMarking('full_mock')).toBe(true);
    expect(supportsNegativeMarking('pyq')).toBe(true);
    expect(supportsNegativeMarking('topic')).toBe(true);
    expect(supportsNegativeMarking('chapter_mock')).toBe(true);
    expect(supportsNegativeMarking('subject_mock')).toBe(true);
    expect(supportsNegativeMarking(undefined)).toBe(false);
    expect(supportsNegativeMarking(null)).toBe(false);
  });

  it('resolves the configured value for each supported test type', () => {
    expect(resolveTestNegativeMarking('full_mock', 0.25)).toBe(0.25);
    expect(resolveTestNegativeMarking('pyq', 1)).toBe(1);
    expect(resolveTestNegativeMarking('topic', 0.5)).toBe(0.5);
    expect(resolveTestNegativeMarking('chapter_mock', 0.75)).toBe(0.75);
    expect(resolveTestNegativeMarking('subject_mock', 0.1)).toBe(0.1);
  });

  it('returns 0 when the scheme is unset (optional)', () => {
    expect(resolveTestNegativeMarking('full_mock', 0)).toBe(0);
    expect(resolveTestNegativeMarking('full_mock', null)).toBe(0);
    expect(resolveTestNegativeMarking('full_mock', undefined)).toBe(0);
    expect(resolveTestNegativeMarking('pyq', NaN)).toBe(0);
    expect(resolveTestNegativeMarking('pyq', -0.5)).toBe(0);
  });

  it('returns 0 for unknown test types', () => {
    expect(resolveTestNegativeMarking('live', 0.25)).toBe(0);
    expect(resolveTestNegativeMarking(undefined, 0.25)).toBe(0);
  });
});
