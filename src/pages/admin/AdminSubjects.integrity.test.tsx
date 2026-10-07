import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
const m = vi.hoisted(() => ({
  api: {
    getAllAdminSubjects: vi.fn(),
    getAllAdminChapters: vi.fn(),
    getAllAdminTests: vi.fn(),
    getSubjectReportingData: vi.fn(),
    createSubject: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubject: vi.fn(),
    uploadSubjectIcon: vi.fn(),
  },
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/services/api', () => ({ api: m.api }));
import { AdminSubjects } from './AdminSubjects';
const subject = {
  id: 'real-math',
  name: 'Mathematics',
  slug: 'mathematics',
  category: 'Aptitude',
  iconName: 'BookOpen',
  orderIndex: 1,
  isActive: true,
  createdAt: '2026-10-07T00:00:00Z',
};
async function ready(rows = [subject]) {
  m.api.getAllAdminSubjects.mockResolvedValue(rows);
  render(<AdminSubjects />);
  await screen.findByRole('table', { name: 'Subjects' });
  await waitFor(() =>
    expect(screen.queryByText('Loading complete subject records…')).not.toBeInTheDocument()
  );
}
async function editor() {
  fireEvent.click(screen.getByRole('button', { name: 'Create Subject' }));
  return screen.getByRole('dialog', { name: 'Subject editor' });
}
function input(d: HTMLElement, name = 'Physics') {
  fireEvent.change(within(d).getByLabelText('Subject name'), { target: { value: name } });
}
async function edit() {
  fireEvent.click(screen.getByRole('button', { name: 'Actions for Mathematics' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edit Subject' }));
  return screen.getByRole('dialog', { name: 'Subject editor' });
}
describe('Subjects production UI integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.api.getAllAdminChapters.mockResolvedValue([
      {
        id: 'algebra',
        subjectId: 'real-math',
        name: 'Actual Algebra',
        slug: 'algebra',
        orderIndex: 1,
        isActive: true,
      },
    ]);
    m.api.getAllAdminTests.mockResolvedValue([
      {
        id: 'real-test',
        subjectId: 'real-math',
        chapterId: 'algebra',
        title: 'Actual Algebra Quiz',
        testType: 'topic',
        isActive: true,
      },
    ]);
    m.api.getSubjectReportingData.mockResolvedValue({
      questions: [{ id: 'q', subject_id: 'real-math' }],
      attempts: [],
      warnings: [],
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  it('shows genuine empty state without demo subjects or fabricated KPI numbers', async () => {
    await ready([]);
    expect(screen.getByText('No subjects found matching current filters.')).toBeInTheDocument();
    expect(screen.queryByText('General Science')).not.toBeInTheDocument();
    expect(screen.queryByText('72%')).not.toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
  it('shows core read failure with Retry rather than a success-like empty load', async () => {
    m.api.getAllAdminSubjects.mockRejectedValueOnce(new Error('permission denied'));
    render(<AdminSubjects />);
    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    m.api.getAllAdminSubjects.mockResolvedValue([subject]);
    fireEvent.click(screen.getByText('Retry'));
    await screen.findByText('Mathematics');
  });
  it('renders only actual subject topics and tests in detail tabs', async () => {
    await ready();
    fireEvent.click(screen.getByText('Mathematics'));
    fireEvent.click(screen.getByRole('button', { name: 'Topics (1)' }));
    expect(screen.getByText('Actual Algebra')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Topic Tests (1)' }));
    expect(screen.getByText('Actual Algebra Quiz')).toBeInTheDocument();
    expect(screen.queryByText('Motion & Force')).not.toBeInTheDocument();
  });
  it('uses backend returned record, supports immediate edit using real ID without fabricated metrics', async () => {
    await ready();
    const d = await editor();
    input(d);
    m.api.createSubject.mockResolvedValue({
      ...subject,
      id: 'saved-uuid',
      name: 'Physics (saved)',
      slug: 'physics',
      orderIndex: 2,
    });
    fireEvent.click(within(d).getByRole('button', { name: 'Create Subject' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Subject editor' })).not.toBeInTheDocument()
    );
    expect(screen.getAllByText('Physics (saved)').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Physics (saved)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Subject' }));
    m.api.updateSubject.mockResolvedValue({
      ...subject,
      id: 'saved-uuid',
      name: 'Physics Updated',
      slug: 'physics',
      orderIndex: 2,
    });
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Update Subject' })
    );
    await waitFor(() =>
      expect(m.api.updateSubject).toHaveBeenCalledWith('saved-uuid', expect.any(Object))
    );
  });
  it('preserves failed create form and never inserts a phantom row', async () => {
    await ready();
    const d = await editor();
    input(d);
    m.api.createSubject.mockRejectedValue(new Error('save denied'));
    fireEvent.click(within(d).getByRole('button', { name: 'Create Subject' }));
    expect(await within(d).findByRole('alert')).toHaveTextContent('save denied');
    expect(within(d).getByLabelText('Subject name')).toHaveValue('Physics');
    expect(within(screen.getByRole('table')).queryByText('Physics')).not.toBeInTheDocument();
  });
  it('rejects duplicate slug before a write and retains manually entered slug on name change', async () => {
    await ready();
    const d = await editor();
    input(d);
    fireEvent.change(within(d).getByLabelText('URL slug'), { target: { value: 'mathematics' } });
    input(d, 'Physics renamed');
    expect(within(d).getByLabelText('URL slug')).toHaveValue('mathematics');
    fireEvent.click(within(d).getByRole('button', { name: 'Create Subject' }));
    expect(await within(d).findByRole('alert')).toHaveTextContent('already used');
    expect(m.api.createSubject).not.toHaveBeenCalled();
  });
  it('locks repeated submit while a save is pending', async () => {
    await ready();
    const d = await editor();
    input(d);
    let resolve!: (x: any) => void;
    m.api.createSubject.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const submit = within(d).getByRole('button', { name: 'Create Subject' });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(m.api.createSubject).toHaveBeenCalledTimes(1);
    expect(within(d).getByLabelText('Subject name')).toBeDisabled();
    resolve({ ...subject, id: 'saved', name: 'Physics', slug: 'physics' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('does not report success or mutate rows for failed edit', async () => {
    await ready();
    const d = await edit();
    input(d, 'Changed');
    m.api.updateSubject.mockRejectedValue(new Error('zero rows saved'));
    fireEvent.click(within(d).getByRole('button', { name: 'Update Subject' }));
    expect(await within(d).findByRole('alert')).toHaveTextContent('zero rows');
    expect(within(screen.getByRole('table')).getByText('Mathematics')).toBeInTheDocument();
    expect(within(d).getByLabelText('Subject name')).toHaveValue('Changed');
  });
  it('retains protected subject on failed delete and removes only confirmed ID without opening another drawer', async () => {
    await ready([subject, { ...subject, id: 'other', name: 'English', slug: 'english' }]);
    fireEvent.click(screen.getByText('Mathematics'));
    m.api.deleteSubject.mockResolvedValue(false);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Subject' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not confirmed');
    expect(within(screen.getByRole('table')).getByText('Mathematics')).toBeInTheDocument();
    m.api.deleteSubject.mockResolvedValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Subject' }));
    await waitFor(() => expect(screen.queryByText('Mathematics')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Delete Subject' })).not.toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });
  it('imports actual CSV records and retries only failed rows', async () => {
    await ready([]);
    fireEvent.click(screen.getByRole('button', { name: 'Import Subjects' }));
    const d = screen.getByRole('dialog', { name: 'Import Subjects' });
    const f = new File(['unused'], 'subjects.csv', { type: 'text/csv' });
    Object.defineProperty(f, 'text', {
      value: () => Promise.resolve('name,slug\nPhysics,physics\nChemistry,chemistry'),
    });
    fireEvent.change(within(d).getByLabelText('Subject import file'), { target: { files: [f] } });
    await waitFor(() =>
      expect(within(d).getByRole('button', { name: 'Import File' })).not.toBeDisabled()
    );
    m.api.createSubject
      .mockResolvedValueOnce({ ...subject, id: 'p', name: 'Physics', slug: 'physics' })
      .mockRejectedValueOnce(new Error('Chemistry denied'))
      .mockResolvedValueOnce({ ...subject, id: 'c', name: 'Chemistry', slug: 'chemistry' });
    fireEvent.click(within(d).getByRole('button', { name: 'Import File' }));
    await within(d).findByText(/1 subject\(s\) saved; 1 failed/);
    fireEvent.click(within(d).getByRole('button', { name: 'Import File' }));
    await within(d).findByText(/1 subject\(s\) saved; 0 failed/);
    expect(m.api.createSubject).toHaveBeenCalledTimes(3);
    expect(m.api.createSubject.mock.calls.map((c) => c[0].slug)).toEqual([
      'physics',
      'chemistry',
      'chemistry',
    ]);
  });
  it('orders all records, beyond the table page, after confirmed backend save', async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({
      ...subject,
      id: `s${i}`,
      name: `Subject ${i}`,
      slug: `s${i}`,
      orderIndex: i,
    }));
    await ready(rows);
    fireEvent.click(screen.getByRole('button', { name: 'Subject Order' }));
    const d = screen.getByRole('dialog', { name: 'Subject Order' });
    expect(within(d).getAllByRole('spinbutton')).toHaveLength(12);
    fireEvent.change(within(d).getByLabelText('Order for Subject 11'), { target: { value: '0' } });
    m.api.updateSubject.mockResolvedValue({ ...rows[11], orderIndex: 0 });
    fireEvent.click(within(d).getByRole('button', { name: 'Save Order' }));
    await waitFor(() => expect(m.api.updateSubject).toHaveBeenCalledWith('s11', { orderIndex: 0 }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('keeps failed order visible and retries only unsuccessful values', async () => {
    const rows = [
      subject,
      { ...subject, id: 'english', name: 'English', slug: 'english', orderIndex: 2 },
    ];
    await ready(rows);
    fireEvent.click(screen.getByRole('button', { name: 'Subject Order' }));
    const d = screen.getByRole('dialog', { name: 'Subject Order' });
    fireEvent.change(within(d).getByLabelText('Order for Mathematics'), { target: { value: '4' } });
    fireEvent.change(within(d).getByLabelText('Order for English'), { target: { value: '5' } });
    m.api.updateSubject
      .mockResolvedValueOnce({ ...subject, orderIndex: 4 })
      .mockRejectedValueOnce(new Error('order denied'))
      .mockResolvedValueOnce({ ...rows[1], orderIndex: 5 });
    fireEvent.click(within(d).getByRole('button', { name: 'Save Order' }));
    await within(d).findByText(/order denied/);
    fireEvent.click(within(d).getByRole('button', { name: 'Save Order' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(m.api.updateSubject.mock.calls.map((c) => c[0])).toEqual([
      'real-math',
      'english',
      'english',
    ]);
  });
  it('blocks save during upload and preserves form on storage failure', async () => {
    await ready();
    const d = await editor();
    input(d);
    let reject!: (e: Error) => void;
    m.api.uploadSubjectIcon.mockReturnValue(
      new Promise((_r, j) => {
        reject = j;
      })
    );
    fireEvent.change(within(d).getByLabelText('Subject icon file'), {
      target: { files: [new File(['x'], 'icon.png', { type: 'image/png' })] },
    });
    expect(within(d).getByRole('button', { name: 'Create Subject' })).toBeDisabled();
    reject(new Error('Storage denied'));
    expect(await within(d).findByRole('alert')).toHaveTextContent('Storage denied');
    expect(within(d).getByLabelText('Subject name')).toHaveValue('Physics');
    expect(m.api.createSubject).not.toHaveBeenCalled();
  });
});
