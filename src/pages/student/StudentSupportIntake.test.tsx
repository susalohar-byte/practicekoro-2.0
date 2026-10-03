import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Profile } from './Profile';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'student-456',
      fullName: 'Ananya Roy',
      email: 'ananya@example.com',
      phone: '9876543210',
    },
    role: 'student',
    isPro: true,
    isAdmin: false,
    updateProfile: vi.fn(),
  }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/context/ExamContext', () => ({
  useExam: () => ({
    exams: [{ id: 'wbcs_2026', title: 'WBCS Prelims' }],
    selectedExam: { id: 'wbcs_2026', title: 'WBCS Prelims' },
    setSelectedExam: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    plans: [
      { id: 'pro_1_year', title: '1-Year Pro Pass', price: 499, durationDays: 365, isActive: true },
    ],
    subscriptionDetails: {
      isActive: true,
      hasSubscription: true,
      daysRemaining: 180,
      status: 'active',
    },
    refreshSubscription: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    getUserAttempts: vi.fn().mockResolvedValue([]),
    getStudentSupportTickets: vi.fn().mockResolvedValue([
      {
        id: 'tkt-init-1',
        userId: 'student-456',
        studentName: 'Ananya Roy',
        studentEmail: 'ananya@example.com',
        subject: 'WBCS Mock 02 question clarification',
        issue: 'Please verify option C in Q12',
        category: 'Test Issue',
        priority: 'medium',
        status: 'open',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z',
      },
    ]),
    createSupportTicket: vi.fn().mockResolvedValue({ success: true, ticketId: 'tkt-new-123' }),
    getStudentPaymentHistory: vi.fn().mockResolvedValue([]),
  },
}));

describe('Student Support Intake Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Help & Support in Profile and opens the support desk', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/support" element={<div>PracticeKoro Support Desk</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('Get help and contact us')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Help & Support'));
    await waitFor(() => {
      expect(screen.getByText('PracticeKoro Support Desk')).toBeInTheDocument();
    });
  });

  it('exposes the support action as an accessible button', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/support" element={<div>PracticeKoro Support Desk</div>} />
        </Routes>
      </MemoryRouter>
    );

    const supportAction = screen.getByRole('button', { name: /help & support/i });
    supportAction.focus();
    expect(supportAction).toHaveFocus();
    fireEvent.click(supportAction);
    await waitFor(() => {
      expect(screen.getByText('PracticeKoro Support Desk')).toBeInTheDocument();
    });
  });
});
