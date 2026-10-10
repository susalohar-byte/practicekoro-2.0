import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/services/api', () => ({
  api: {
    getExams: vi.fn(async () => [
      { id: 'e1', title: 'One' },
      { id: 'e2', title: 'Two' },
    ]),
  },
}));
import { ExamProvider, useExam } from './ExamContext';
function Probe() {
  const { selectedExam, selectExamById, refreshExams } = useExam();
  return (
    <>
      <span>{selectedExam?.title}</span>
      <button onClick={() => selectExamById('e2')}>Select Two</button>
      <button onClick={() => void refreshExams()}>Refresh</button>
    </>
  );
}
describe('Restricted storage', () => {
  afterEach(() => vi.restoreAllMocks());
  it('loads, selects and refreshes even when storage reads and writes throw', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    render(
      <ExamProvider>
        <Probe />
      </ExamProvider>
    );
    await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Select Two'));
    expect(screen.getByText('Two')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Refresh'));
    await waitFor(() => expect(screen.getByText('Two')).toBeInTheDocument());
  });
});
