import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminStaff } from './AdminStaff';
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'primary', email: 'admin@practicekoro.online' } }),
}));
vi.mock('@/services/api', () => ({
  api: {
    getStaffMembers: vi.fn(),
    assignStaffByEmail: vi.fn(),
    removeStaffMember: vi.fn(),
    setStaffAccountStatus: vi.fn(),
  },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getStaffMembers).mockResolvedValue([
    {
      id: 'staff-id',
      email: 'staff@example.com',
      fullName: 'Existing Staff',
      role: 'admin',
      adminRole: 'content_writer',
      accountStatus: 'active',
      createdAt: '2026-10-01',
    },
  ]);
});
async function openStaffMenu() {
  fireEvent.click(screen.getByRole('button', { name: /Admin Users/ }));
  const row = (await screen.findByText('Existing Staff')).closest('tr')!;
  fireEvent.click(within(row).getByRole('button'));
  return row;
}
describe('AdminStaff mutation confirmation', () => {
  it('does not invent a new staff row after a failed assignment', async () => {
    vi.mocked(api.assignStaffByEmail).mockResolvedValue({
      success: false,
      error: 'Assignment denied',
    });
    render(<AdminStaff />);
    fireEvent.change(screen.getByPlaceholderText('Enter full name'), {
      target: { value: 'New Staff' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Admin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Assignment denied');
    expect(screen.queryByText('New Staff')).not.toBeInTheDocument();
  });
  it('keeps staff visible if removal was denied', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.removeStaffMember).mockResolvedValue({ success: false, error: 'Removal denied' });
    render(<AdminStaff />);
    const row = await openStaffMenu();
    fireEvent.click(within(row).getByRole('button', { name: 'Remove Admin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Removal denied');
    expect(screen.getByText('Existing Staff')).toBeInTheDocument();
  });
  it('keeps an account active when backend deactivation fails', async () => {
    vi.mocked(api.setStaffAccountStatus).mockResolvedValue({
      success: false,
      error: 'Status denied',
    });
    render(<AdminStaff />);
    const row = await openStaffMenu();
    fireEvent.click(within(row).getByRole('button', { name: 'Deactivate Admin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Status denied');
    expect(within(row).getByText('Active')).toBeInTheDocument();
    expect(api.setStaffAccountStatus).toHaveBeenCalledWith('staff-id', 'inactive');
  });
});
