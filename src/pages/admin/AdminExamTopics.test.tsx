import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminExamTopics } from './AdminExamTopics';
import { AdminLayout } from '@/components/layout/AdminLayout';
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
  usePlatformBrand: () => ({ appName: 'PracticeKoro', logoUrl: null }),
  useMaintenance: () => ({
    isMaintenanceMode: false,
    appSettings: [],
    reloadSettings: vi.fn(),
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
    getAllAdminSubjects: vi.fn(),
    getAllAdminChapters: vi.fn(),
    getExamTopicMappings: vi.fn(),
    saveExamTopicMappings: vi.fn(),
    getAllAdminTests: vi.fn(),
    getAdminCategories: vi.fn(),
    getExamCategories: vi.fn(),
  },
}));

describe('AdminExamTopics Integration & Navigation', () => {
  const mockExams = [
    {
      id: 'exam_wb_police',
      title: 'West Bengal Police Constable',
      slug: 'wbp-constable',
      category: 'Police Exams',
      iconName: 'Shield',
      orderIndex: 1,
      isActive: true,
    },
    {
      id: 'exam_wbcs_prelims',
      title: 'WBCS Executive Prelims',
      slug: 'wbcs-prelims',
      category: 'Civil Services',
      iconName: 'Award',
      orderIndex: 2,
      isActive: true,
    },
  ];

  const mockSubjects = [
    {
      id: 'sub_math',
      name: 'Mathematics',
      slug: 'math',
      iconName: 'Calculator',
      orderIndex: 1,
      isActive: true,
    },
    {
      id: 'sub_history',
      name: 'Indian History',
      slug: 'history',
      iconName: 'Book',
      orderIndex: 2,
      isActive: true,
    },
  ];

  const mockChapters = [
    {
      id: 'chap_profit_loss',
      subjectId: 'sub_math',
      name: 'Profit and Loss',
      slug: 'profit-loss',
      orderIndex: 1,
      isActive: true,
    },
    {
      id: 'chap_percentage',
      subjectId: 'sub_math',
      name: 'Percentage',
      slug: 'percentage',
      orderIndex: 2,
      isActive: true,
    },
    {
      id: 'chap_mughals',
      subjectId: 'sub_history',
      name: 'Mughal Empire',
      slug: 'mughals',
      orderIndex: 1,
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getAllAdminExams).mockResolvedValue(mockExams);
    vi.mocked(api.getAllAdminSubjects).mockResolvedValue(mockSubjects);
    vi.mocked(api.getAllAdminChapters).mockResolvedValue(mockChapters);
    vi.mocked(api.getExamTopicMappings).mockResolvedValue(['chap_profit_loss']);
    vi.mocked(api.saveExamTopicMappings).mockResolvedValue(true);
    vi.mocked(api.getAllAdminTests).mockResolvedValue([]);
    vi.mocked(api.getExamCategories).mockResolvedValue([]);
  });

  it('renders "Exams" in Admin Sidebar navigation', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    const navLink = screen.getAllByRole('link', { name: /^Exams$/i })[0];
    expect(navLink).toBeInTheDocument();
    expect(navLink).toHaveAttribute('href', '/admin/exams');
  });

  it('loads and preselects exam based on ?examId= query parameter in AdminExamTopics', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/exam-topics?examId=exam_wbcs_prelims']}>
        <AdminExamTopics />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/WBCS Executive Prelims/i)).toBeInTheDocument();
      expect(api.getExamTopicMappings).toHaveBeenCalledWith('exam_wbcs_prelims');
    });
  });

  it('allows toggling topics and saving custom topic mappings', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/exam-topics?examId=exam_wb_police']}>
        <AdminExamTopics />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profit and Loss')).toBeInTheDocument();
      expect(screen.getByText('Percentage')).toBeInTheDocument();
    });

    // Toggle Percentage
    const percentageRow = screen.getByText('Percentage').closest('div');
    fireEvent.click(percentageRow!);

    // Click Save Exam Mappings button
    const saveBtn = screen.getByRole('button', { name: /Save Exam Mappings/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.saveExamTopicMappings).toHaveBeenCalledWith(
        'exam_wb_police',
        expect.arrayContaining(['chap_profit_loss', 'chap_percentage'])
      );
      expect(screen.getByText(/Saved successfully!/i)).toBeInTheDocument();
    });
  });
});
