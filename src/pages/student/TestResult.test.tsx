import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TestResult } from './TestResult';
import type { GradedResult, QuestionSolution } from '@/types';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'test-user-id', name: 'Test User' },
    isPro: true,
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    getAttemptResult: vi.fn().mockResolvedValue({
      attemptId: 'attempt-1',
      testId: 'test-1',
      testTitle: 'WBP Full Mock 01',
      score: 4,
      totalMarks: 10,
      percentage: 40,
      accuracy: 50,
      correctCount: 4,
      wrongCount: 4,
      skippedCount: 2,
      timeSpentSeconds: 600,
      rank: 12,
      totalCandidates: 100,
      percentile: 88,
      passed: true,
    } satisfies GradedResult),
    getAttemptSolutions: vi.fn().mockResolvedValue([
      // Weak section: History 1/4 correct (25%)
      ...[1, 2, 3].map((i) => ({
        id: `h-wrong-${i}`,
        questionOrder: i,
        questionText: `History Q${i}`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        selectedOption: 'A',
        correctOption: 'B',
        isCorrect: false,
        marksAwarded: -0.25,
        subjectId: 'hist',
        subjectName: 'History',
      } as const)),
      {
        id: 'h-right',
        questionOrder: 4,
        questionText: 'History Q4',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        selectedOption: 'B',
        correctOption: 'B',
        isCorrect: true,
        marksAwarded: 1,
        subjectId: 'hist',
        subjectName: 'History',
      } as const,
      // Strong section: Math 3/3 correct (100%) — must NOT appear as weak
      ...[1, 2, 3].map((i) => ({
        id: `m-right-${i}`,
        questionOrder: 10 + i,
        questionText: `Math Q${i}`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        selectedOption: 'B',
        correctOption: 'B',
        isCorrect: true,
        marksAwarded: 1,
        subjectId: 'math',
        subjectName: 'Math',
      } as const)),
    ] satisfies QuestionSolution[]),
    getAttemptNegativeMarks: vi.fn().mockResolvedValue(0.75),
    getAttemptRankings: vi.fn().mockResolvedValue(null),
    getStudentApplicableCutoff: vi.fn().mockResolvedValue(null),
  },
}));

function renderResult() {
  render(
    <MemoryRouter initialEntries={['/exams/test-1/results/attempt-1']}>
      <Routes>
        <Route path="/exams/:testId/results/:attemptId" element={<TestResult />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TestResult weak-areas loop', () => {
  it('surfaces weak sections with a deep link into targeted practice', async () => {
    renderResult();

    await waitFor(() => {
      expect(screen.getByText('Focus on Your Weak Areas')).toBeInTheDocument();
    });

    // Weak section card with accuracy + counts (name also appears in the
    // breakdown table, so expect both)
    expect(screen.getAllByText('History').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('25%').length).toBeGreaterThanOrEqual(2);

    // CTA deep-links to mistakes tab pre-filtered by subject
    const cta = screen.getByRole('link', { name: /Practice Mistakes/i });
    expect(cta.getAttribute('href')).toBe('/practice?tab=mistakes&subject=History');
  });

  it('does not list strong sections as weak areas', async () => {
    renderResult();

    await waitFor(() => {
      expect(screen.getByText('Focus on Your Weak Areas')).toBeInTheDocument();
    });

    // Math is 100% — shown in the breakdown table but must not get a weak card
    const weakHeading = screen.getByText('Focus on Your Weak Areas').closest('div');
    expect(weakHeading?.parentElement?.textContent).not.toMatch(/Math.*Practice Mistakes/);
    expect(screen.queryByRole('link', { name: /Math/i })).toBeNull();
  });
});
