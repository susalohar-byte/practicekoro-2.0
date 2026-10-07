import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { api } from '@/services/api';
import { AdminStudents } from './AdminStudents';
vi.mock('@/services/api', () => ({
  api: {
    getAllAdminStudents: vi.fn(),
    createStudentAccount: vi.fn(),
    updateStudentProfile: vi.fn(),
    deleteStudentProfile: vi.fn(),
    bulkDeleteStudentProfiles: vi.fn(),
  },
}));
const student = {
  id: 'u1',
  fullName: 'First Learner',
  email: 'first@example.com',
  accountStatus: 'active' as const,
  isPro: false,
  createdAt: '2026-10-01',
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getAllAdminStudents).mockResolvedValue([student]);
});
async function openAddForm() {
  fireEvent.click(screen.getByRole('button', { name: 'Add Student' }));
  fireEvent.change(screen.getByPlaceholderText('e.g. Suman Mondal'), {
    target: { value: 'New Learner' },
  });
  fireEvent.change(screen.getByPlaceholderText('student@gmail.com'), {
    target: { value: 'new@example.com' },
  });
  return screen.getByPlaceholderText('e.g. Suman Mondal').closest('form')!;
}
describe('AdminStudents backend persistence', () => {
  it('does not add a local phantom account when creation fails', async () => {
    vi.mocked(api.createStudentAccount).mockResolvedValue({
      success: false,
      error: 'Invite denied',
    });
    render(<AdminStudents />);
    await screen.findAllByText('First Learner');
    fireEvent.submit(await openAddForm());
    expect(await screen.findByRole('alert')).toHaveTextContent('Invite denied');
    expect(within(screen.getByRole('table')).queryByText('New Learner')).not.toBeInTheDocument();
  });
  it('uses a real Auth account ID and reloads backend records after creation', async () => {
    vi.mocked(api.createStudentAccount).mockResolvedValue({ success: true, userId: 'new-auth-id' });
    vi.mocked(api.getAllAdminStudents)
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([
        student,
        { ...student, id: 'new-auth-id', fullName: 'New Learner', email: 'new@example.com' },
      ]);
    render(<AdminStudents />);
    await screen.findAllByText('First Learner');
    fireEvent.submit(await openAddForm());
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getByText('New Learner')).toBeInTheDocument()
    );
    expect(api.getAllAdminStudents).toHaveBeenCalledTimes(2);
  });
  it('removes only confirmed bulk deletions and retains failed rows', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getAllAdminStudents).mockResolvedValue([
      student,
      { ...student, id: 'u2', fullName: 'Second Learner' },
    ]);
    vi.mocked(api.bulkDeleteStudentProfiles).mockResolvedValue({
      success: false,
      deletedIds: ['u1'],
      failures: [{ userId: 'u2', error: 'Denied' }],
      error: 'One failed',
    });
    render(<AdminStudents />);
    await screen.findAllByText('First Learner');
    const table = within(screen.getByRole('table'));
    fireEvent.click(table.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Selected' }));
    await waitFor(() =>
      expect(within(screen.getByRole('table')).queryByText('First Learner')).not.toBeInTheDocument()
    );
    expect(within(screen.getByRole('table')).getByText('Second Learner')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('1 account(s) deleted');
  });
});
