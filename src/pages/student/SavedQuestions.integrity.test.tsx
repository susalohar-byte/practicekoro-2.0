import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const user = { id: 'u', fullName: 'Student' };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/context/MaintenanceContext', () => ({
  useContentLanguage: () => ({ isBilingualEnabled: true }),
}));
vi.mock('@/components/common/MathText', () => ({
  MathText: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/services/api', () => ({
  api: {
    getBookmarks: vi.fn(),
    removeBookmarks: vi.fn(),
    clearAllBookmarks: vi.fn(),
    toggleBookmark: vi.fn(),
  },
}));
import { api } from '@/services/api';
import { SavedQuestions } from './SavedQuestions';
const rows = [
  {
    id: 'b1',
    questionId: 'q1',
    userId: 'u',
    subjectName: 'History',
    createdAt: '2026-10-01',
    question: {
      id: 'q1',
      questionText: 'Recorded History Question',
      optionA: 'a',
      optionB: 'b',
      optionC: 'c',
      optionD: 'd',
      correctOption: 'B',
    },
  },
];
const mount = () =>
  render(
    <MemoryRouter>
      <SavedQuestions />
    </MemoryRouter>
  );
describe('Saved questions persistence UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getBookmarks).mockResolvedValue(rows as any);
    vi.mocked(api.removeBookmarks).mockResolvedValue(true);
    vi.mocked(api.clearAllBookmarks).mockResolvedValue(true);
  });
  it('shows loading rather than fake subject counts', () => {
    vi.mocked(api.getBookmarks).mockImplementation(() => new Promise(() => {}));
    mount();
    expect(screen.getByRole('status')).toHaveTextContent('Loading saved questions');
    expect(screen.queryByText('Mathematics (5)')).not.toBeInTheDocument();
  });
  it('shows actual custom subject counts with no fabricated defaults', async () => {
    mount();
    expect(await screen.findByRole('button', { name: 'History (1)' })).toBeInTheDocument();
    expect(screen.queryByText('General Knowledge (8)')).not.toBeInTheDocument();
  });
  it('keeps a failed deletion visible and does not toggle the bookmark', async () => {
    vi.mocked(api.removeBookmarks).mockRejectedValue(new Error('permission denied'));
    mount();
    await screen.findByText('Recorded History Question');
    fireEvent.click(screen.getByRole('button', { name: 'Remove from saved' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
    expect(screen.getByText('Recorded History Question')).toBeInTheDocument();
    expect(api.toggleBookmark).not.toHaveBeenCalled();
  });
  it('removes only after backend confirmation', async () => {
    let resolve!: (v: boolean) => void;
    vi.mocked(api.removeBookmarks).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    mount();
    await screen.findByText('Recorded History Question');
    fireEvent.click(screen.getByRole('button', { name: 'Remove from saved' }));
    expect(screen.getByText('Recorded History Question')).toBeInTheDocument();
    resolve(true);
    await waitFor(() =>
      expect(screen.queryByText('Recorded History Question')).not.toBeInTheDocument()
    );
    expect(api.removeBookmarks).toHaveBeenCalledWith('u', ['q1']);
  });
  it('persists clear all using the signed-in user', async () => {
    mount();
    await screen.findByText('Recorded History Question');
    fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));
    await waitFor(() => expect(api.clearAllBookmarks).toHaveBeenCalledWith('u'));
    await waitFor(() =>
      expect(screen.queryByText('Recorded History Question')).not.toBeInTheDocument()
    );
  });
  it('renders retry on read failure rather than claiming no bookmarks', async () => {
    vi.mocked(api.getBookmarks).mockRejectedValueOnce(new Error('offline'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recorded History Question')).toBeInTheDocument();
  });
});
