import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentSupportModal } from './StudentSupportModal';
import { api } from '@/services/api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-123',
      fullName: 'Suman Roy',
      email: 'suman@example.com',
    },
    role: 'student',
    isPro: false,
    isAdmin: false,
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    createSupportTicket: vi.fn(),
    getStudentSupportTickets: vi.fn(),
  },
}));

describe('StudentSupportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<StudentSupportModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Student Support & Help')).toBeNull();
  });

  it('renders modal with default prefilled values when isOpen is true', () => {
    vi.mocked(api.getStudentSupportTickets).mockResolvedValueOnce([]);

    render(
      <StudentSupportModal
        isOpen={true}
        onClose={vi.fn()}
        defaultCategory="Test Issue"
        defaultSubject="Question 5 error"
        defaultIssue="Option B is mathematically ambiguous"
      />
    );

    expect(screen.getByText('Student Support & Help')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Question 5 error')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option B is mathematically ambiguous')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Exam & Question Issue')).toBeInTheDocument();
  });

  it('submits a new support ticket and switches to success state', async () => {
    vi.mocked(api.getStudentSupportTickets).mockResolvedValue([]);
    vi.mocked(api.createSupportTicket).mockResolvedValueOnce({ success: true });

    render(
      <StudentSupportModal
        isOpen={true}
        onClose={vi.fn()}
        defaultSubject="Payment deduction"
        defaultIssue="Amount deducted but pro pass inactive"
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createSupportTicket).toHaveBeenCalledWith({
        userId: 'test-user-123',
        studentName: 'Suman Roy',
        studentEmail: 'suman@example.com',
        subject: 'Payment deduction',
        issue: 'Amount deducted but pro pass inactive',
        category: 'Technical Issue',
        priority: 'medium',
        status: 'open',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Ticket Submitted Successfully!')).toBeInTheDocument();
    });
  });

  it('loads and renders student tickets with admin resolution notes in history tab', async () => {
    vi.mocked(api.getStudentSupportTickets).mockResolvedValue([
      {
        id: 'ticket-99',
        userId: 'test-user-123',
        studentName: 'Suman Roy',
        studentEmail: 'suman@example.com',
        subject: 'Wrong answer key in Mock 01',
        issue: 'Question 14 had option C instead of D',
        category: 'Test Issue',
        priority: 'high',
        status: 'resolved',
        resolutionNotes: 'Verified and corrected answer key to option D. Ranking updated.',
        createdAt: '2026-03-10T12:00:00Z',
        updatedAt: '2026-03-10T14:00:00Z',
      },
    ]);

    render(<StudentSupportModal isOpen={true} onClose={vi.fn()} />);

    // Click My Tickets tab
    const historyTab = screen.getByRole('button', { name: /My Tickets/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('Wrong answer key in Mock 01')).toBeInTheDocument();
      expect(screen.getByText('RESOLVED')).toBeInTheDocument();
      expect(screen.getByText(/Verified and corrected answer key/i)).toBeInTheDocument();
    });
  });

  it('renders directly with initialTab="history" and shows tickets', async () => {
    vi.mocked(api.getStudentSupportTickets).mockResolvedValue([
      {
        id: 'ticket-102',
        userId: 'test-user-123',
        studentName: 'Suman Roy',
        studentEmail: 'suman@example.com',
        subject: 'UPI transaction delayed',
        issue: 'UTR 982173981729 payment deduction',
        category: 'Payment Issue',
        priority: 'high',
        status: 'open',
        createdAt: '2026-03-12T10:00:00Z',
        updatedAt: '2026-03-12T10:00:00Z',
      },
    ]);

    render(<StudentSupportModal isOpen={true} onClose={vi.fn()} initialTab="history" />);

    await waitFor(() => {
      expect(screen.getByText('UPI transaction delayed')).toBeInTheDocument();
      expect(screen.getByText('OPEN')).toBeInTheDocument();
    });
  });

  it('validates required fields before submitting', async () => {
    vi.mocked(api.getStudentSupportTickets).mockResolvedValue([]);

    render(
      <StudentSupportModal isOpen={true} onClose={vi.fn()} defaultSubject="" defaultIssue="" />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a specific subject/i)).toBeInTheDocument();
      expect(api.createSupportTicket).not.toHaveBeenCalled();
    });
  });
  it('shows persisted public support replies without exposing internal notes', async () => {
    vi.mocked(api.getStudentSupportTickets).mockResolvedValue([
      {
        id: 't1',
        userId: 'test-user-123',
        studentName: 'Suman Roy',
        studentEmail: 'suman@example.com',
        subject: 'Help',
        issue: 'Question',
        category: 'Other',
        priority: 'medium',
        status: 'pending',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        messages: [
          {
            id: 'public',
            ticketId: 't1',
            authorKind: 'support',
            authorName: 'Support',
            body: 'Persistent public answer',
            createdAt: '2026-10-01',
          },
          {
            id: 'private',
            ticketId: 't1',
            authorKind: 'internal_note',
            authorName: 'Support',
            body: 'Private staff-only note',
            createdAt: '2026-10-01',
          },
        ],
      },
    ]);
    render(<StudentSupportModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /My Tickets/i }));
    expect(await screen.findByText('Persistent public answer')).toBeInTheDocument();
    expect(screen.queryByText('Private staff-only note')).not.toBeInTheDocument();
  });
});
