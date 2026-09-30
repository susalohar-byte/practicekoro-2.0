import { describe, expect, it } from 'vitest';
import { calculateScore, type ScorableQuestion } from './scoring';

const questions: ScorableQuestion[] = [
  { id: 'q1', correctOption: 'A', marks: 2, negativeMarks: 0.5 },
  { id: 'q2', correctOption: 'B', marks: 2, negativeMarks: 0.5 },
  { id: 'q3', correctOption: 'C', marks: 2, negativeMarks: 0.5 },
];

describe('calculateScore', () => {
  it('awards positive marks for correct answers', () => {
    const result = calculateScore(
      questions,
      [
        { questionId: 'q1', selectedOption: 'A' },
        { questionId: 'q2', selectedOption: 'B' },
        { questionId: 'q3', selectedOption: 'C' },
      ],
      6,
      3
    );

    expect(result.score).toBe(6);
    expect(result.correctCount).toBe(3);
    expect(result.passed).toBe(true);
  });

  it('applies negative marking and tracks wrong questions', () => {
    const result = calculateScore(
      questions,
      [
        { questionId: 'q1', selectedOption: 'D' },
        { questionId: 'q2', selectedOption: 'B' },
      ],
      6,
      3
    );

    expect(result.score).toBe(1.5);
    expect(result.wrongCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.wrongQuestionIds).toEqual(['q1']);
  });

  it('does not deduct marks when the test negative marking is disabled', () => {
    const noNegativeMarkingQuestions = questions.map((question) => ({
      ...question,
      negativeMarks: 0,
    }));
    const result = calculateScore(
      noNegativeMarkingQuestions,
      [
        { questionId: 'q1', selectedOption: 'D' },
        { questionId: 'q2', selectedOption: 'B' },
      ],
      6,
      3
    );

    expect(result.score).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(1);
    expect(result.skippedCount).toBe(1);
  });

  it('does not allow a negative final score', () => {
    const result = calculateScore(
      questions,
      [
        { questionId: 'q1', selectedOption: 'D' },
        { questionId: 'q2', selectedOption: 'D' },
        { questionId: 'q3', selectedOption: 'D' },
      ],
      6,
      3
    );

    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('handles a fully skipped test', () => {
    const result = calculateScore(questions, [], 6, 3);

    expect(result.attemptedCount).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.skippedCount).toBe(3);
  });
});
