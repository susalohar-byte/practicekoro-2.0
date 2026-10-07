import { beforeEach, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ rows: [] as any[], load: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/services/api', () => ({ api: { getNotifications: mocks.load } }));
import { AdminNotifications } from './AdminNotifications';
beforeEach(() => {
  localStorage.clear();
  mocks.rows = [];
  mocks.load.mockImplementation(async () => mocks.rows);
});
it('does not invent production delivery telemetry or trend percentages', async () => {
  mocks.rows = Array.from({ length: 100 }, (_, i) => ({
    id: 'n' + i,
    title: 'Audit ' + i,
    message: 'Fixture',
    targetAudience: 'all',
    status: 'sent',
    channel: 'in_app',
    sentAt: '2026-09-15T10:00:00Z',
  }));
  render(<AdminNotifications />);
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem('practicekoro_admin_notifications_v5')!)).toHaveLength(
      100
    )
  );
  expect(screen.getAllByText('Unavailable')).toHaveLength(4);
  for (const fake of ['96', '79', '20', '↑ 28%', '79%', '↑ 20%', '↓ 3%'])
    expect(screen.queryByText(fake)).not.toBeInTheDocument();
  expect(screen.getByText(/Sent counts are saved notifications/)).toBeInTheDocument();
});
it('defaults to All Time and displays October records instead of fixed September filter', async () => {
  mocks.rows = [
    {
      id: 'oct',
      title: 'October Notice',
      message: 'Fixture',
      targetAudience: 'all',
      status: 'sent',
      channel: 'in_app',
      sentAt: '2026-10-07T10:00:00Z',
    },
  ];
  render(<AdminNotifications />);
  expect(await screen.findByText('October Notice')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'All Time' })).toBeInTheDocument();
  expect(screen.queryByText('01 Sep 2026 → 30 Sep 2026')).not.toBeInTheDocument();
});
it('applies the Last 7 Days preset rather than silently treating it as All Time', async () => {
  const old = new Date();
  old.setDate(old.getDate() - 45);
  mocks.rows = [
    {
      id: 'new',
      title: 'Current Notice',
      message: 'Fixture',
      targetAudience: 'all',
      status: 'sent',
      sentAt: new Date().toISOString(),
    },
    {
      id: 'old',
      title: 'Old Notice',
      message: 'Fixture',
      targetAudience: 'all',
      status: 'sent',
      sentAt: old.toISOString(),
    },
  ];
  render(<AdminNotifications />);
  expect(await screen.findByText('Old Notice')).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'All Time' }));
  fireEvent.click(screen.getByRole('button', { name: 'Last 7 Days' }));
  expect(screen.getByText('Current Notice')).toBeInTheDocument();
  expect(screen.queryByText('Old Notice')).not.toBeInTheDocument();
});
it('does not report zero deliveries when no delivery tracking is available', async () => {
  render(<AdminNotifications />);
  await waitFor(() => expect(mocks.load).toHaveBeenCalled());
  expect(screen.getAllByText('Unavailable')).toHaveLength(4);
});
it('rejects reversed custom date ranges', async () => {
  render(<AdminNotifications />);
  fireEvent.click(await screen.findByRole('button', { name: 'All Time' }));
  fireEvent.click(screen.getByRole('button', { name: 'Custom Range' }));
  fireEvent.change(screen.getByLabelText('Notification date from'), {
    target: { value: '2026-10-08' },
  });
  fireEvent.change(screen.getByLabelText('Notification date to'), {
    target: { value: '2026-10-07' },
  });
  expect(screen.getByRole('alert')).toHaveTextContent('From on or before To');
  expect(screen.getByRole('button', { name: 'Apply Range' })).toBeDisabled();
});

it('does not fabricate today timestamps for undated records under a date filter', async () => {
  mocks.rows = [
    {
      id: 'undated',
      title: 'Undated Notice',
      message: 'Fixture',
      targetAudience: 'all',
      status: 'draft',
    },
  ];
  render(<AdminNotifications />);
  expect(await screen.findByText('Undated Notice')).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: 'All Time' }));
  fireEvent.click(screen.getByRole('button', { name: 'Last 7 Days' }));
  expect(screen.queryByText('Undated Notice')).not.toBeInTheDocument();
});
