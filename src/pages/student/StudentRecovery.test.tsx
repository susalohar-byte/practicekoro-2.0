import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
const user = { id: 'u', fullName: 'Recorded Student', email: 'student@example.test' };
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user, isPro: false }) }));
vi.mock('@/context/MaintenanceContext', () => ({
  useContentLanguage: () => ({ isBilingualEnabled: true }),
  useMaintenance: () => ({ supportEmail: '', supportPhone: '', supportWhatsapp: '' }),
}));
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({ hasAccessToTest: () => true }),
}));
vi.mock('@/components/common/MathText', () => ({
  MathText: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/components/student/StudentSupportModal', () => ({ StudentSupportModal: () => null }));
vi.mock('@/services/api', () => ({
  api: {
    getTestById: vi.fn(),
    startTestAttempt: vi.fn(),
    getAttemptSolutions: vi.fn(),
    toggleBookmark: vi.fn(),
    getStudentSupportTickets: vi.fn(),
    createSupportTicket: vi.fn(),
  },
}));
import { api } from '@/services/api';
import { TestDetails } from './TestDetails';
import { TestSolutions } from './TestSolutions';
import { Support } from './Support';
const mount = (component: React.ReactNode, path = '/exams/t') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={
            path === '/support'
              ? path
              : path.includes('solutions')
                ? '/exams/:testId/solutions/:attemptId'
                : '/exams/:testId'
          }
          element={component}
        />
      </Routes>
    </MemoryRouter>
  );
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getTestById).mockResolvedValue({
    id: 't',
    title: 'Recorded Test',
    durationMinutes: 10,
    totalQuestions: 1,
    totalMarks: 1,
    isPremium: false,
    testType: 'topic',
  } as any);
  vi.mocked(api.getStudentSupportTickets).mockResolvedValue([]);
  vi.mocked(api.getAttemptSolutions).mockResolvedValue([
    {
      id: 'q',
      questionOrder: 5,
      questionText: 'Recorded Question',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
      correctOption: 'A',
      selectedOption: 'B',
      isCorrect: false,
      marksAwarded: 0,
    },
  ] as any);
});
describe('Student error recovery', () => {
  it('distinguishes a failed details load from test not found and retries', async () => {
    vi.mocked(api.getTestById).mockRejectedValueOnce(new Error('offline'));
    mount(<TestDetails />);
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    expect(screen.queryByText('Mock Test Not Found')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recorded Test')).toBeInTheDocument();
  });
  it('shows inline start failure without opening a phantom session', async () => {
    vi.mocked(api.startTestAttempt).mockRejectedValue(new Error('permission denied'));
    mount(<TestDetails />);
    await screen.findByText('Recorded Test');
    fireEvent.click(screen.getByRole('button', { name: 'Start Test Now' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
  });
  it('shows failed solutions load and can retry', async () => {
    vi.mocked(api.getAttemptSolutions).mockRejectedValueOnce(new Error('offline'));
    mount(<TestSolutions />, '/exams/t/solutions/a');
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recorded Question')).toBeInTheDocument();
  });
  it('preserves unsaved bookmark state on backend failure', async () => {
    vi.mocked(api.toggleBookmark).mockRejectedValue(new Error('bookmark denied'));
    mount(<TestSolutions />, '/exams/t/solutions/a');
    await screen.findByText('Recorded Question');
    fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('bookmark denied');
    expect(screen.getByRole('button', { name: 'Add bookmark' })).not.toBeDisabled();
  });
  it('does not show failed support history as no tickets', async () => {
    vi.mocked(api.getStudentSupportTickets).mockRejectedValue(new Error('history offline'));
    mount(<Support />, '/support');
    fireEvent.click(screen.getByRole('button', { name: /My Tickets/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('history offline');
    expect(screen.queryByText('No support tickets raised yet')).not.toBeInTheDocument();
    vi.mocked(api.getStudentSupportTickets).mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No support tickets raised yet')).toBeInTheDocument();
  });
  it('does not invent helpline details or promise instant service', async () => {
    mount(<Support />, '/support');
    await waitFor(() => expect(api.getStudentSupportTickets).toHaveBeenCalled());
    expect(screen.getByText('Direct helpline not configured')).toBeInTheDocument();
    expect(screen.queryByText('+91 9547771118')).not.toBeInTheDocument();
    expect(screen.queryByText('Upgrade for instant queue support')).not.toBeInTheDocument();
  });
});
