import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AdminNotifications } from './AdminNotifications';
import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  api: {
    getNotifications: vi.fn(),
    getAllAdminExams: vi.fn(),
    createNotification: vi.fn(),
    sendNotificationNow: vi.fn(),
    deleteNotification: vi.fn(),
  },
}));

describe('AdminNotifications Page', () => {
  const mockNotifications = [
    {
      id: 'n1',
      title: 'General Update for All',
      message: 'Practice platform maintenance tonight at 2 AM.',
      targetAudience: 'all',
      channel: 'in_app' as const,
      status: 'sent' as const,
      sentAt: '2026-09-18T10:00:00Z',
      createdAt: '2026-09-18T09:00:00Z',
    },
    {
      id: 'n2',
      title: 'Pro Pass Exclusive Mock',
      message: 'New premium mock test is live for Pro aspirants.',
      targetAudience: 'pro',
      channel: 'both' as const,
      status: 'sent' as const,
      sentAt: '2026-09-18T11:00:00Z',
      createdAt: '2026-09-18T10:30:00Z',
    },
    {
      id: 'n3',
      title: 'Scheduled Festival Greeting',
      message: 'Happy Durga Puja to all candidates!',
      targetAudience: 'all',
      channel: 'both' as const,
      status: 'scheduled' as const,
      scheduledAt: '2026-10-01T08:00:00Z',
      createdAt: '2026-09-18T12:00:00Z',
    },
  ];

  const mockExams = [{ id: 'wbp-constable', title: 'WBP Constable 2026', slug: 'wbp-constable' }];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getNotifications).mockResolvedValue(mockNotifications);
    vi.mocked(api.getAllAdminExams).mockResolvedValue(mockExams as any);
  });

  it('renders notifications list, audience badges, and counts', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(screen.getByText('General Update for All')).toBeInTheDocument();
      expect(screen.getByText('Pro Pass Exclusive Mock')).toBeInTheDocument();
      expect(screen.getByText('Scheduled Festival Greeting')).toBeInTheDocument();
    });

    // Check audience badges
    expect(screen.getAllByText('All Students').length).toBeGreaterThan(0);
    expect(screen.getByText('Pro Members')).toBeInTheDocument();
    // Check scheduled badge
    expect(screen.getAllByText('Scheduled').length).toBeGreaterThan(0);
  });

  it('filters notifications by status tab', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(screen.getByText('General Update for All')).toBeInTheDocument();
    });

    // Click Scheduled tab
    const scheduledTab = screen.getByRole('button', { name: /^Scheduled/i });
    fireEvent.click(scheduledTab);

    expect(screen.getByText('Scheduled Festival Greeting')).toBeInTheDocument();
    expect(screen.queryByText('General Update for All')).not.toBeInTheDocument();
  });

  it('allows filling title, message, and viewing Schedule tab in compose panel', async () => {
    render(<AdminNotifications />);

    await waitFor(() => {
      expect(screen.getByText('General Update for All')).toBeInTheDocument();
    });

    // Fill title and message
    fireEvent.change(screen.getByPlaceholderText(/enter notification title/i), {
      target: { value: 'Future Exam Alert' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your message/i), {
      target: { value: 'Exam will start next Monday.' },
    });

    // Switch to Schedule tab
    const scheduleTabBtn = screen.getByRole('button', { name: /^Schedule$/i });
    fireEvent.click(scheduleTabBtn);

    expect(screen.getByText('Schedule Date & Time')).toBeInTheDocument();
  });

  it('successfully dispatches a scheduled notification using Send Now button from row menu', async () => {
    vi.mocked(api.sendNotificationNow).mockResolvedValue({ success: true } as any);

    render(<AdminNotifications />);

    await waitFor(() => {
      expect(screen.getByText('Scheduled Festival Greeting')).toBeInTheDocument();
    });

    // Find the row containing 'Scheduled Festival Greeting'
    const scheduledRow = screen.getByText('Scheduled Festival Greeting').closest('tr')!;
    const menuBtn = within(scheduledRow).getByRole('button');
    fireEvent.click(menuBtn);

    const sendNowBtn = await screen.findByRole('button', { name: /Send Now/i });
    fireEvent.click(sendNowBtn);

    expect(api.sendNotificationNow).toHaveBeenCalledWith('n3');
  });
});
