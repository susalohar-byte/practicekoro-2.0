import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminExams } from './AdminExams';
import { AdminQuestionBank } from './AdminQuestionBank';
import { api } from '@/services/api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', fullName: 'Super Admin', email: 'admin@practicekoro.com' },
    role: 'admin',
    isPro: true,
    isAdmin: true,
    adminRole: 'super_admin',
    hasPermission: () => true,
    logout: vi.fn(),
  }),
}));

vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({
    isMaintenanceMode: false,
    appSettings: [],
    reloadSettings: vi.fn(),
  }),
  useContentLanguage: () => ({
    contentLanguageMode: 'bengali_only',
    isBilingualEnabled: false,
    isBengaliOnly: true,
    updateContentLanguageMode: vi.fn(),
  }),
}));

vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: vi.fn(),
    getExamCategories: vi.fn(),
    createExamCategory: vi.fn(),
    updateExamCategory: vi.fn(),
    deleteExamCategory: vi.fn(),
    reorderExamCategories: vi.fn(),
    createExam: vi.fn(),
    updateExam: vi.fn(),
    deleteExam: vi.fn(),
    createAdminExam: vi.fn(),
    updateAdminExam: vi.fn(),
    deleteAdminExam: vi.fn(),
    getAllAdminQuestions: vi.fn(),
    getAllAdminSubjects: vi.fn(),
    getAllAdminChapters: vi.fn(),
    getAllAdminTests: vi.fn(),
    bulkDeleteQuestions: vi.fn(),
    logAdminActivity: vi.fn(),
  },
}));

describe('AdminExams Category Management Updates', () => {
  const mockCategories = [
    { id: 'cat_wbp', name: 'WB Police (WBP / KP)', orderIndex: 0, isActive: true },
    { id: 'cat_ssc', name: 'SSC & Central Govt.', orderIndex: 1, isActive: true },
    { id: 'cat_tet', name: 'Teaching (TET / SLST)', orderIndex: 2, isActive: true },
  ];

  const mockExams = [
    {
      id: 'exam_wbp',
      title: 'WBP Constable',
      slug: 'wbp-constable',
      category: 'WB Police (WBP / KP)',
      orderIndex: 0,
      isActive: true,
      totalTests: 10,
      totalQuestions: 500,
    },
    {
      id: 'exam_ssc',
      title: 'SSC MTS',
      slug: 'ssc-mts',
      category: 'SSC & Central Govt.',
      orderIndex: 1,
      isActive: true,
      totalTests: 5,
      totalQuestions: 250,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getAllAdminExams as ReturnType<typeof vi.fn>).mockResolvedValue(mockExams);
    (api.getAllAdminTests as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getExamCategories as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);
    (api.deleteExamCategory as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (api.reorderExamCategories as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (api.updateExam as ReturnType<typeof vi.fn>).mockResolvedValue(mockExams[0]);
  });

  it('renders "Exam Categories" button and does not show "Manage Categories"', async () => {
    render(
      <MemoryRouter>
        <AdminExams />
      </MemoryRouter>
    );

    // Wait for categories and exams to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /exam categories/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /manage categories/i })).toBeNull();
  });

  it('opens category modal when clicking "Exam Categories" button', async () => {
    render(
      <MemoryRouter>
        <AdminExams />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /exam categories/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /exam categories/i }));

    await waitFor(() => {
      expect(screen.getByText('Manage Exam Categories')).toBeInTheDocument();
    });
  });

  it('renders draggable category pills and allows reordering', async () => {
    render(
      <MemoryRouter>
        <AdminExams />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle(/Drag to reorder "WB Police \(WBP \/ KP\)"/)).toBeInTheDocument();
      expect(screen.getByTitle(/Drag to reorder "SSC & Central Govt\."/)).toBeInTheDocument();
      expect(screen.getByTitle(/Drag to reorder "Teaching \(TET \/ SLST\)"/)).toBeInTheDocument();
    });

    // Verify draggable attribute is present on the category pill containers
    const policePill = screen.getByTitle(/Drag to reorder "WB Police \(WBP \/ KP\)"/);
    expect(policePill).toHaveAttribute('draggable', 'true');
  });

  it('deletes a category, reassigns affected exams, and reloads data to prevent resurrection', async () => {
    window.confirm = vi.fn(() => true);

    render(
      <MemoryRouter>
        <AdminExams />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /exam categories/i })).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /exam categories/i }));

    await waitFor(() => {
      expect(screen.getByText('Manage Exam Categories')).toBeInTheDocument();
    });

    // Find delete button for "Teaching (TET / SLST)" (which has 0 exams)
    const deleteButtons = screen.getAllByTitle(/delete category/i);
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click delete on Teaching (TET / SLST)
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(api.deleteExamCategory).toHaveBeenCalledWith('Teaching (TET / SLST)');
      expect(api.getExamCategories).toHaveBeenCalledTimes(2); // Initial load + refresh after delete
    });
  });
});

describe('AdminQuestionBank Selection UI Updates', () => {
  const mockQuestions = [
    {
      id: 'q1',
      questionText: 'What is the capital of West Bengal?',
      questionBengaliText: 'পশ্চিমবঙ্গের রাজধানী কী?',
      optionA: 'Kolkata',
      optionB: 'Siliguri',
      optionC: 'Durgapur',
      optionD: 'Asansol',
      correctOption: 'A',
      marks: 1,
      negativeMarks: 0.25,
      sourceType: 'topic',
      topicName: 'West Bengal GK',
      createdAt: '2026-01-01',
    },
    {
      id: 'q2',
      questionText: 'Which river is known as the Sorrow of Bengal?',
      questionBengaliText: 'বাংলার দুঃখ কোন নদীকে বলা হয়?',
      optionA: 'Damodar',
      optionB: 'Hooghly',
      optionC: 'Teesta',
      optionD: 'Rupnarayan',
      correctOption: 'A',
      marks: 1,
      negativeMarks: 0.25,
      sourceType: 'topic',
      topicName: 'West Bengal GK',
      createdAt: '2026-01-02',
    },
    {
      id: 'q3',
      questionText: 'When did India get independence?',
      questionBengaliText: 'ভারত কবে স্বাধীনতা লাভ করেছিল?',
      optionA: '1947',
      optionB: '1950',
      optionC: '1942',
      optionD: '1930',
      correctOption: 'A',
      marks: 1,
      negativeMarks: 0.25,
      sourceType: 'topic',
      topicName: 'Indian History',
      createdAt: '2026-01-03',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getAllAdminQuestions as ReturnType<typeof vi.fn>).mockResolvedValue(mockQuestions);
    (api.getAllAdminSubjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getAllAdminChapters as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getAllAdminExams as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getAllAdminTests as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('renders "Select All (3 Questions)" dynamically outside the question list card container', async () => {
    render(
      <MemoryRouter>
        <AdminQuestionBank />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Select All (3 Questions)')).toBeInTheDocument();
    });

    // "Select All Visible" should no longer exist
    expect(screen.queryByText('Select All Visible')).toBeNull();
  });

  it('selecting "Select All" selects all questions in current context', async () => {
    render(
      <MemoryRouter>
        <AdminQuestionBank />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Select All (3 Questions)')).toBeInTheDocument();
    });

    // Click Select All
    const selectAllBtn = screen.getByRole('button', { name: /select all \(3 questions\)/i });
    fireEvent.click(selectAllBtn);

    // Verify 3 selected is displayed with Delete Selected button
    await waitFor(() => {
      expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
      expect(screen.getByText('Delete Selected (3)')).toBeInTheDocument();
    });

    // Click again to unselect all
    fireEvent.click(selectAllBtn);
    await waitFor(() => {
      expect(screen.queryByText(/3 selected/i)).toBeNull();
    });
  });

  it('displays singular "Select All (1 Question)" when context has exactly 1 question', async () => {
    (api.getAllAdminQuestions as ReturnType<typeof vi.fn>).mockResolvedValue([mockQuestions[0]]);

    render(
      <MemoryRouter>
        <AdminQuestionBank />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Select All (1 Question)')).toBeInTheDocument();
    });
  });
});

describe('AdminExams Drag & Drop Reordering Execution', () => {
  const mockCategories = [
    { id: 'cat_wbp', name: 'WB Police (WBP / KP)', orderIndex: 0, isActive: true },
    { id: 'cat_ssc', name: 'SSC & Central Govt.', orderIndex: 1, isActive: true },
    { id: 'cat_tet', name: 'Teaching (TET / SLST)', orderIndex: 2, isActive: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getAllAdminExams as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getAllAdminTests as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (api.getExamCategories as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);
    (api.reorderExamCategories as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  it('triggers api.reorderExamCategories when dropping a category pill onto another', async () => {
    render(
      <MemoryRouter>
        <AdminExams />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle(/Drag to reorder "WB Police \(WBP \/ KP\)"/)).toBeInTheDocument();
    });

    const policePill = screen.getByTitle(/Drag to reorder "WB Police \(WBP \/ KP\)"/);
    const sscPill = screen.getByTitle(/Drag to reorder "SSC & Central Govt\."/);

    // Simulate HTML5 drag start on WB Police (index 0)
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => '0'),
      effectAllowed: 'move',
      dropEffect: 'move',
    };

    fireEvent.dragStart(policePill, { dataTransfer });
    fireEvent.dragOver(sscPill, { dataTransfer });
    fireEvent.drop(sscPill, { dataTransfer });

    await waitFor(() => {
      expect(api.reorderExamCategories).toHaveBeenCalledWith([
        { name: 'SSC & Central Govt.', orderIndex: 1 },
        { name: 'WB Police (WBP / KP)', orderIndex: 2 },
        { name: 'Teaching (TET / SLST)', orderIndex: 3 },
      ]);
    });
  });
});
