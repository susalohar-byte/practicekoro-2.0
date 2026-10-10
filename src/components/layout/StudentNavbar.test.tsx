import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudentNavbar } from './StudentNavbar';
import { api } from '@/services/api';

// Shared auth mock state
let mockAuthUser: {
  user: { id: string; fullName: string; email: string; targetExamId?: string } | null;
  isPro: boolean;
  isAdmin: boolean;
  logout: () => void;
} = {
  user: {
    id: 'student-1',
    fullName: 'Rahul Das',
    email: 'rahul@example.com',
    targetExamId: 'wbp-constable',
  },
  isPro: false,
  isAdmin: false,
  logout: vi.fn(),
};

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthUser,
}));

const mockSelectedExam: { id: string; title: string } | null = {
  id: 'wbp-constable',
  title: 'WBP Constable',
};

vi.mock('@/context/ExamContext', () => ({
  useExam: () => ({
    selectedExam: mockSelectedExam,
    setSelectedExam: vi.fn(),
    exams: [],
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    getNotifications: vi.fn(),
  },
}));

vi.mock('@/components/common/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

describe('StudentNavbar Notification Audience & Schedule Filtering', () => {
  const testNotifications = [
    {
      id: 'notif-all',
      title: 'Notice for Everyone',
      message: 'All aspirants see this.',
      targetAudience: 'all',
      channel: 'in_app' as const,
      status: 'sent' as const,
      sentAt: '2026-09-18T10:00:00Z',
      createdAt: '2026-09-18T09:00:00Z',
    },
    {
      id: 'notif-pro',
      title: 'Pro Exclusive Tip',
      message: 'Targeted with audience "pro".',
      targetAudience: 'pro',
      channel: 'in_app' as const,
      status: 'sent' as const,
      sentAt: '2026-09-18T10:00:00Z',
      createdAt: '2026-09-18T09:00:00Z',
    },
    {
      id: 'notif-pro-users',
      title: 'Pro Users Announcement',
      message: 'Targeted with audience "pro_users".',
      targetAudience: 'pro_users',
      channel: 'in_app' as const,
      status: 'sent' as const,
      sentAt: '2026-09-18T10:00:00Z',
      createdAt: '2026-09-18T09:00:00Z',
    },
    {
      id: 'notif-free',
      title: 'Free Tier Offer',
      message: 'Targeted with audience "free".',
      targetAudience: 'free',
      channel: 'in_app' as const,
      status: 'sent' as const,
      sentAt: '2026-09-18T10:00:00Z',
      createdAt: '2026-09-18T09:00:00Z',
    },
    {
      id: 'notif-free-users',
      title: 'Free Users Upgrade Discount',
      message: 'Targeted with audience "free_users".',
      targetAudience: 'free_users',
      channel: 'in_app' as const,
      status: 'sent' as const,
      sentAt: '2026-09-18T10:00:00Z',
      createdAt: '2026-09-18T09:00:00Z',
    },
    {
      id: 'notif-sched-due',
      title: 'Scheduled Flash Mock',
      message: 'Scheduled in the past, now due.',
      targetAudience: 'all',
      channel: 'in_app' as const,
      status: 'scheduled' as const,
      scheduledAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      createdAt: '2026-09-18T09:00:00Z',
    },
    {
      id: 'notif-sched-future',
      title: 'Upcoming Sunday Marathon',
      message: 'Scheduled in the future, should not show yet.',
      targetAudience: 'all',
      channel: 'in_app' as const,
      status: 'scheduled' as const,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      createdAt: '2026-09-18T09:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getNotifications).mockResolvedValue(testNotifications);
  });

  it('does not invent an unread badge when there are no notifications', async () => {
    vi.mocked(api.getNotifications).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <StudentNavbar />
      </MemoryRouter>
    );
    await waitFor(() => expect(api.getNotifications).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Notifications' })).not.toHaveTextContent('3');
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('delivers free and free_users notices to Free candidates, and suppresses pro notices and future scheduled notices', async () => {
    mockAuthUser = {
      user: {
        id: 'free-user',
        fullName: 'Free Student',
        email: 'free@example.com',
        targetExamId: 'wbp-constable',
      },
      isPro: false,
      isAdmin: false,
      logout: vi.fn(),
    };

    render(
      <MemoryRouter>
        <StudentNavbar />
      </MemoryRouter>
    );

    // Open notification dropdown
    const bellBtn = screen.getByTitle('Notifications');
    bellBtn.click();

    await waitFor(() => {
      // Should show 'all'
      expect(screen.getByText('Notice for Everyone')).toBeInTheDocument();
      // Should show both 'free' and 'free_users'
      expect(screen.getByText('Free Tier Offer')).toBeInTheDocument();
      expect(screen.getByText('Free Users Upgrade Discount')).toBeInTheDocument();
      // Should show scheduled notice whose time has arrived
      expect(screen.getByText('Scheduled Flash Mock')).toBeInTheDocument();

      // Should NOT show pro or pro_users notices
      expect(screen.queryByText('Pro Exclusive Tip')).toBeNull();
      expect(screen.queryByText('Pro Users Announcement')).toBeNull();

      // Should NOT show future scheduled notices
      expect(screen.queryByText('Upcoming Sunday Marathon')).toBeNull();
    });
  });

  it('delivers pro and pro_users notices to Pro Pass candidates, and suppresses free notices', async () => {
    mockAuthUser = {
      user: {
        id: 'pro-user',
        fullName: 'Pro Candidate',
        email: 'pro@example.com',
        targetExamId: 'wbp-constable',
      },
      isPro: true,
      isAdmin: false,
      logout: vi.fn(),
    };

    render(
      <MemoryRouter>
        <StudentNavbar />
      </MemoryRouter>
    );

    const bellBtn = screen.getByTitle('Notifications');
    bellBtn.click();

    await waitFor(() => {
      // Should show 'all'
      expect(screen.getByText('Notice for Everyone')).toBeInTheDocument();
      // Should show both 'pro' and 'pro_users'
      expect(screen.getByText('Pro Exclusive Tip')).toBeInTheDocument();
      expect(screen.getByText('Pro Users Announcement')).toBeInTheDocument();
      // Should show past scheduled notice
      expect(screen.getByText('Scheduled Flash Mock')).toBeInTheDocument();

      // Should NOT show free tier notices
      expect(screen.queryByText('Free Tier Offer')).toBeNull();
      expect(screen.queryByText('Free Users Upgrade Discount')).toBeNull();

      // Should NOT show future scheduled notices
      expect(screen.queryByText('Upcoming Sunday Marathon')).toBeNull();
    });
  });
});
