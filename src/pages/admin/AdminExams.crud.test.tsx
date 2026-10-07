import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const mocks = vi.hoisted(() => ({
  rows: [] as any[],
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  load: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabaseRuntime: {} }));
vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: mocks.load,
    getAllAdminTests: async () => [],
    getSubjects: async () => [],
    getTestSeries: async () => [],
    getExamCategories: async () => [],
    createExam: mocks.create,
    updateExam: mocks.update,
    deleteExam: mocks.remove,
  },
}));
import { AdminExams } from './AdminExams';
const row = {
  id: 'actual-id',
  title: 'Disposable Exam',
  slug: 'disposable',
  category: 'Other',
  isActive: true,
  orderIndex: 1,
  shortName: 'DE',
  subtitle: 'Real board',
};
const mount = () =>
  render(
    <MemoryRouter>
      <AdminExams />
    </MemoryRouter>
  );
const form = () => screen.getByPlaceholderText('e.g. WBP Constable').closest('form')!;
const openCreate = () => fireEvent.click(screen.getByRole('button', { name: 'Create Exam' }));
const openActions = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Actions for Disposable Exam' }));
};
beforeEach(() => {
  localStorage.clear();
  mocks.rows = [];
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  mocks.load.mockImplementation(async () => [...mocks.rows]);
  mocks.create.mockImplementation(async (input) => {
    const saved = { ...input, id: 'returned-backend-id' };
    mocks.rows.push(saved);
    return saved;
  });
  mocks.update.mockImplementation(async (id, input) => {
    const saved = { ...mocks.rows.find((r) => r.id === id), ...input };
    mocks.rows = mocks.rows.map((r) => (r.id === id ? saved : r));
    return saved;
  });
  mocks.remove.mockImplementation(async (id) => {
    mocks.rows = mocks.rows.filter((r) => r.id !== id);
    return true;
  });
});
describe('AdminExams backend-first workflow', () => {
  it('empty production database does not inject canonical exams', async () => {
    mount();
    await waitFor(() => expect(mocks.load).toHaveBeenCalled());
    expect(screen.queryByText('WBP Constable')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
  });
  it('fetch failures display an error instead of presets', async () => {
    mocks.load.mockRejectedValue(new Error('Database unreachable'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unreachable');
    expect(screen.queryByText('WBP Constable')).not.toBeInTheDocument();
  });
  it('adds using the backend record, persists after remount and remains editable', async () => {
    const mounted = mount();
    openCreate();
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'Saved Exam' },
    });
    fireEvent.submit(form());
    await waitFor(() => expect(screen.queryByText('Create Target Exam')).not.toBeInTheDocument());
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved Exam', slug: 'saved-exam' })
    );
    mounted.unmount();
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Actions for Saved Exam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Exam' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'Renamed' },
    });
    fireEvent.submit(form());
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        'returned-backend-id',
        expect.objectContaining({ title: 'Renamed' })
      )
    );
  });
  it('failed add preserves inputs and creates no phantom row', async () => {
    mocks.create.mockRejectedValue(new Error('Duplicate slug'));
    mount();
    openCreate();
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'Keep this' },
    });
    fireEvent.submit(form());
    expect(await screen.findByText('Duplicate slug')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. WBP Constable')).toHaveValue('Keep this');
    expect(mocks.rows).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Actions for Keep this' })).not.toBeInTheDocument();
  });
  it('failed edit preserves old row and editor values', async () => {
    mocks.rows = [{ ...row }];
    mocks.update.mockRejectedValue(new Error('No matching record was saved'));
    mount();
    await openActions();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Exam' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'Attempted rename' },
    });
    fireEvent.submit(form());
    expect(await screen.findByText('No matching record was saved')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. WBP Constable')).toHaveValue('Attempted rename');
    expect(mocks.rows[0].title).toBe('Disposable Exam');
  });
  it('blocked delete retains the exam and does not announce success', async () => {
    mocks.rows = [{ ...row }];
    mocks.remove.mockRejectedValue(new Error('Linked attempts exist; archive instead'));
    mount();
    await openActions();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Linked attempts exist; archive instead')
    );
    expect(
      await screen.findByRole('button', { name: 'Actions for Disposable Exam' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Exam deleted in the backend.')).not.toBeInTheDocument();
  });
  it('confirmed delete clears selected drawer and never selects another exam', async () => {
    mocks.rows = [{ ...row }, { ...row, id: 'second-id', slug: 'second', title: 'Second Exam' }];
    mount();
    await openActions();
    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
    await openActions();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Actions for Disposable Exam' })
      ).not.toBeInTheDocument()
    );
    expect(mocks.remove).toHaveBeenCalledWith('actual-id');
    expect(screen.getByRole('button', { name: 'Actions for Second Exam' })).toBeInTheDocument();
    expect(screen.queryByText('Disposable Exam')).not.toBeInTheDocument();
    expect(screen.queryByText('General Information')).not.toBeInTheDocument();
  });
  it('double submissions issue only one backend save while pending', async () => {
    let finish!: (v: any) => void;
    mocks.create.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    mount();
    openCreate();
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'Pending' },
    });
    fireEvent.submit(form());
    fireEvent.submit(form());
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(within(form()).getByRole('button', { name: 'Saving...' })).toBeDisabled();
    finish({ ...row, title: 'Pending' });
    await waitFor(() => expect(screen.queryByText('Create Target Exam')).not.toBeInTheDocument());
  });
});

// Confirmed backend changes survive optional cache and refresh failures.
describe('Exam save and delete feedback regressions', () => {
  it('confirmed deletion remains successful when browser cache cleanup throws', async () => {
    mocks.rows = [{ ...row }];
    mount();
    await openActions();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Browser cache quota exceeded');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }));
    expect(await screen.findByText('Exam deleted in the backend.')).toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
    expect(mocks.rows).toEqual([]);
    expect(
      screen.queryByRole('button', { name: 'Actions for Disposable Exam' })
    ).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
  it('confirmed edit replaces old row even when reload fails and retry clears warning', async () => {
    mocks.rows = [{ ...row }];
    mount();
    await openActions();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Exam' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'Actually Saved' },
    });
    mocks.load.mockRejectedValue(new Error('Reload failed after save'));
    fireEvent.submit(form());
    expect(await screen.findByText('Exam saved in the backend.')).toBeInTheDocument();
    expect(mocks.rows[0].title).toBe('Actually Saved');
    expect(await screen.findByRole('alert')).toHaveTextContent('Reload failed after save');
    expect(screen.getByRole('button', { name: 'Actions for Actually Saved' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for Disposable Exam' })
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. WBP Constable')).not.toBeInTheDocument();
    mocks.load.mockImplementation(async () => [...mocks.rows]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry exam list' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});

it('confirmed create remains visible and editable when list refresh fails', async () => {
  mount();
  await waitFor(() => expect(mocks.load).toHaveBeenCalled());
  openCreate();
  fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
    target: { value: 'Saved despite reload' },
  });
  mocks.load.mockRejectedValue(new Error('Refresh disconnected'));
  fireEvent.submit(form());
  expect(
    await screen.findByRole('button', { name: 'Actions for Saved despite reload' })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Actions for Saved despite reload' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Exam' }));
  expect(screen.getByPlaceholderText('e.g. WBP Constable')).toHaveValue('Saved despite reload');
  expect(mocks.rows[0].id).toBe('returned-backend-id');
});
