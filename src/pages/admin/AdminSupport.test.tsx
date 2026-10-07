import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminSupport, mapAdminSupportTicket } from './AdminSupport';
import type { SupportTicketItem } from '@/types';
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/services/api', () => ({
  api: {
    getSupportTickets: vi.fn(),
    sendSupportTicketMessage: vi.fn(),
    updateSupportTicket: vi.fn(),
    createSupportTicket: vi.fn(),
  },
}));
afterEach(cleanup);
const ticket: SupportTicketItem = {
  id: 't1',
  userId: 'u1',
  studentName: 'Learner',
  studentEmail: 'learner@example.com',
  subject: 'Support question',
  issue: 'Please help',
  category: 'Other',
  priority: 'medium',
  status: 'pending',
  createdAt: '2026-10-01',
  updatedAt: '2026-10-01',
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getSupportTickets).mockResolvedValue([ticket]);
});
describe('AdminSupport persistent conversations', () => {
  it('maps saved pending status to In Progress on reload', () => {
    expect(mapAdminSupportTicket(ticket).status).toBe('In Progress');
    expect(mapAdminSupportTicket({ ...ticket, status: 'closed' }).status).toBe('Closed');
  });
  it('preserves reply text and shows an error when delivery fails', async () => {
    vi.mocked(api.sendSupportTicketMessage).mockResolvedValue({
      success: false,
      error: 'Save denied',
    });
    render(<AdminSupport />);
    await screen.findAllByText('Support question');
    fireEvent.change(screen.getByPlaceholderText('Type your reply...'), {
      target: { value: 'A useful answer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reply' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Save denied');
    expect(screen.getByPlaceholderText('Type your reply...')).toHaveValue('A useful answer');
    expect(screen.queryByText('A useful answer', { selector: 'p' })).not.toBeInTheDocument();
  });
  it('renders a confirmed server message and reports portal delivery, not email delivery', async () => {
    vi.mocked(api.sendSupportTicketMessage).mockResolvedValue({
      success: true,
      message: {
        id: 'server-message',
        ticketId: 't1',
        authorKind: 'support',
        authorName: 'Support Agent',
        body: 'Saved answer',
        createdAt: '2026-10-01',
      },
    });
    render(<AdminSupport />);
    await screen.findAllByText('Support question');
    fireEvent.change(screen.getByPlaceholderText('Type your reply...'), {
      target: { value: 'Saved answer' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reply' }));
    expect(await screen.findByText('Saved answer')).toBeInTheDocument();
    expect(api.sendSupportTicketMessage).toHaveBeenCalledWith('t1', 'Saved answer', false);
    expect(screen.getByRole('status')).toHaveTextContent('student portal');
  });
  it('loads saved messages instead of discarding the conversation', async () => {
    vi.mocked(api.getSupportTickets).mockResolvedValue([
      {
        ...ticket,
        messages: [
          {
            id: 'old',
            ticketId: 't1',
            authorKind: 'support',
            authorName: 'Support',
            body: 'Previously saved answer',
            createdAt: '2026-10-01',
          },
        ],
      },
    ]);
    render(<AdminSupport />);
    expect(await screen.findByText('Previously saved answer')).toBeInTheDocument();
  });
});
