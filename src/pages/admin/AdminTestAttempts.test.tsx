import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTestAttempts } from './AdminTestAttempts';
import { api } from '@/services/api';
import type { AdminTestAttempt } from './AdminTestAttempts';

vi.mock('@/services/api', () => ({
  api: {
    getAllAdminTestAttempts: vi.fn(),
  },
}));

const createMockAttempt = (id: string, name: string): AdminTestAttempt => ({
  id,
  studentId: `PK${id}`,
  studentName: name,
  studentEmail: `${id}@example.test`,
  studentInitials: name.slice(0, 2).toUpperCase(),
  testName: 'WBP Constable Mock Test',
  exam: 'WBP Constable',
  type: 'Full Mock',
  score: 75,
  totalMarks: 100,
  accuracy: 80,
  timeTaken: '45 min',
  timeTakenSeconds: 2700,
  status: 'Completed',
  attemptedAtDate: '01 Oct 2026',
  attemptedAtTime: '10:00 AM',
  startedAt: '01 Oct 2026, 09:15 AM',
  submittedAt: '01 Oct 2026, 10:00 AM',
  totalQuestions: 100,
  correctAnswers: 75,
  wrongAnswers: 20,
  skippedAnswers: 5,
});

describe('AdminTestAttempts pagination', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('renders dynamic pagination matching actual record counts with no hardcoded 12,486', async () => {
    // Generate 25 test attempts
    const mockList = Array.from({ length: 25 }, (_, i) =>
      createMockAttempt(`att_${i + 1}`, `Student ${i + 1}`)
    );
    vi.mocked(api.getAllAdminTestAttempts).mockResolvedValue(mockList);

    render(
      <MemoryRouter>
        <AdminTestAttempts />
      </MemoryRouter>
    );

    // Initial page shows 1 to 10
    expect(await screen.findByText('Student 1')).toBeInTheDocument();
    expect(screen.getByText('Student 10')).toBeInTheDocument();
    expect(screen.queryByText('Student 11')).not.toBeInTheDocument();

    // Showing 1–10 of 25 attempts
    expect(screen.getByText(/Showing 1–10 of 25 attempts/i)).toBeInTheDocument();

    // There should be pages 1, 2, 3 and NO 12,486
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.queryByText('12,486')).not.toBeInTheDocument();
    expect(screen.queryByText('12486')).not.toBeInTheDocument();

    // Previous page is disabled on page 1
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    // Next page is enabled
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    // Navigate to page 2
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(await screen.findByText('Student 11')).toBeInTheDocument();
    expect(screen.getByText('Student 20')).toBeInTheDocument();
    expect(screen.queryByText('Student 1')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 11–20 of 25 attempts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    // Navigate to page 3 via Next page
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Student 21')).toBeInTheDocument();
    expect(screen.getByText('Student 25')).toBeInTheDocument();
    expect(screen.queryByText('Student 20')).not.toBeInTheDocument();
    expect(screen.getByText(/Showing 21–25 of 25 attempts/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('updates pagination when changing page size and clamps page correctly', async () => {
    const mockList = Array.from({ length: 25 }, (_, i) =>
      createMockAttempt(`att_${i + 1}`, `Student ${i + 1}`)
    );
    vi.mocked(api.getAllAdminTestAttempts).mockResolvedValue(mockList);

    render(
      <MemoryRouter>
        <AdminTestAttempts />
      </MemoryRouter>
    );

    await screen.findByText('Student 1');

    // Change page size to 50 / page
    const pageSizeSelect = screen.getByLabelText('Items per page');
    fireEvent.change(pageSizeSelect, { target: { value: '50' } });

    // Now all 25 rows show on page 1
    expect(await screen.findByText(/Showing 1–25 of 25 attempts/i)).toBeInTheDocument();
    expect(screen.getByText('Student 1')).toBeInTheDocument();
    expect(screen.getByText('Student 25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('resets to page 1 when filtering or searching', async () => {
    const mockList = Array.from({ length: 25 }, (_, i) =>
      createMockAttempt(`att_${i + 1}`, `Student ${i + 1}`)
    );
    vi.mocked(api.getAllAdminTestAttempts).mockResolvedValue(mockList);

    render(
      <MemoryRouter>
        <AdminTestAttempts />
      </MemoryRouter>
    );

    await screen.findByText('Student 1');

    // Go to page 2
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(await screen.findByText('Student 11')).toBeInTheDocument();

    // Type a search filter
    const searchInput = screen.getByPlaceholderText(/Search by student name/i);
    fireEvent.change(searchInput, { target: { value: 'Student 11' } });

    // Should reset to page 1 and show only matching Student 11
    expect(await screen.findByText(/Showing 1–1 of 1 attempts/i)).toBeInTheDocument();
    expect(screen.getByText('Student 11')).toBeInTheDocument();
    expect(screen.queryByText('Student 12')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
