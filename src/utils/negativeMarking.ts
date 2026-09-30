/**
 * Test-level negative marking policy.
 *
 * - Negative marking is configured on each test, independently of its type.
 * - It is OPTIONAL: a test may carry 0 (no negative marking), because some
 *   exams have no negative marking scheme.
 * - Questions NEVER carry negative marks: no negative-marks field exists at
 *   question upload / question-bank / per-question assignment level.
 * - Scoring (server RPC + local fallback) must resolve the effective value
 *   through `resolveTestNegativeMarking`, never from question-level data.
 */

export const NEGATIVE_MARKING_TEST_TYPES = [
  'full_mock',
  'pyq',
  'topic',
  'chapter_mock',
  'subject_mock',
] as const;

export type NegativeMarkingTestType = (typeof NEGATIVE_MARKING_TEST_TYPES)[number];

/** True when the test type is a supported PracticeKoro test. */
export function supportsNegativeMarking(testType: string | undefined | null): boolean {
  return NEGATIVE_MARKING_TEST_TYPES.includes(testType as NegativeMarkingTestType);
}

/**
 * Resolve the effective negative marks deducted per wrong answer for a test.
 * Returns 0 when the scheme is unset, invalid, or the test type is unknown.
 */
export function resolveTestNegativeMarking(
  testType: string | undefined | null,
  negativeMarking: number | null | undefined
): number {
  if (!supportsNegativeMarking(testType)) return 0;
  const value = Number(negativeMarking);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value;
}
