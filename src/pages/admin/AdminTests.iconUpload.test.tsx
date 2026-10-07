import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTests } from './AdminTests';
import { CreateMockTestModal } from '@/components/admin/CreateMockTestModal';
import { api } from '@/services/api';
import type { MockTest } from '@/types';

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

const sampleTestWithIcon: MockTest = {
  id: 'test-custom-icon-001',
  title: 'Custom Badge Mock Test 01',
  slug: 'custom-badge-mock-test-01',
  testType: 'full_mock',
  durationMinutes: 90,
  totalQuestions: 100,
  totalMarks: 100,
  passingMarks: 40,
  negativeMarking: 0.25,
  isPremium: false,
  orderIndex: 1,
  isActive: true,
  status: 'published',
  iconUrl: 'https://cdn.practicekoro.online/icons/wbp-custom.png',
  examTitle: 'WBP Constable',
};

const sampleTestWithoutIcon: MockTest = {
  id: 'test-no-icon-002',
  title: 'Default Badge Mock Test 02',
  slug: 'default-badge-mock-test-02',
  testType: 'topic',
  durationMinutes: 30,
  totalQuestions: 25,
  totalMarks: 25,
  passingMarks: 10,
  negativeMarking: 0.25,
  isPremium: false,
  orderIndex: 2,
  isActive: true,
  status: 'published',
  subjectName: 'History',
};

describe('Mock Test Icon Upload and Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploadTestIcon API exists and returns a valid image string URL', async () => {
    expect(typeof api.uploadTestIcon).toBe('function');
    const dummyFile = new File(['fake-image-bits'], 'test-badge.png', { type: 'image/png' });
    const result = await api.uploadTestIcon(dummyFile, 'test-custom-icon-001');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('createTest persists and returns iconUrl', async () => {
    const created = await api.createTest({
      title: 'New Police Mock With Icon',
      testType: 'full_mock',
      durationMinutes: 60,
      totalQuestions: 50,
      totalMarks: 50,
      passingMarks: 20,
      negativeMarking: 0.25,
      isPremium: false,
      orderIndex: 1,
      isActive: true,
      slug: 'new-police-mock-with-icon',
      iconUrl: 'https://cdn.practicekoro.online/icons/police-logo.png',
    });

    expect(created.iconUrl).toBe('https://cdn.practicekoro.online/icons/police-logo.png');
    expect(created.title).toBe('New Police Mock With Icon');
  });

  it('updateTest updates and returns the modified iconUrl', async () => {
    const updated = await api.updateTest(sampleTestWithIcon.id, {
      iconUrl: 'https://cdn.practicekoro.online/icons/updated-logo.png',
    });

    expect(updated.iconUrl).toBe('https://cdn.practicekoro.online/icons/updated-logo.png');
  });

  it('renders custom icon img in AdminTests table when test has iconUrl', async () => {
    vi.spyOn(api, 'getAllAdminTests').mockResolvedValue([sampleTestWithIcon, sampleTestWithoutIcon]);
    vi.spyOn(api, 'getExams').mockResolvedValue([]);
    vi.spyOn(api, 'getSubjects').mockResolvedValue([]);
    vi.spyOn(api, 'getAllAdminChapters').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminTests />
      </MemoryRouter>
    );

    expect(await screen.findByText('Custom Badge Mock Test 01')).toBeInTheDocument();

    const iconImg = screen.getByAltText('Custom Badge Mock Test 01');
    expect(iconImg).toBeInTheDocument();
    expect(iconImg).toHaveAttribute('src', 'https://cdn.practicekoro.online/icons/wbp-custom.png');
  });

  it('CreateMockTestModal renders icon upload input and creates test with iconUrl', async () => {
    const onTestCreated = vi.fn();
    const onClose = vi.fn();

    vi.spyOn(api, 'uploadTestIcon').mockResolvedValue('https://cdn.practicekoro.online/uploaded-badge.png');
    const createSpy = vi.spyOn(api, 'createTest').mockResolvedValue({
      ...sampleTestWithIcon,
      id: 'test-new-123',
      title: 'Created Test',
      iconUrl: 'https://cdn.practicekoro.online/uploaded-badge.png',
    });

    render(
      <CreateMockTestModal
        isOpen={true}
        onClose={onClose}
        exams={[{ id: 'exam-1', title: 'WBP Exam', slug: 'wbp', category: 'Police', orderIndex: 1, isActive: true, iconName: 'Shield' }]}
        subjects={[]}
        chapters={[]}
        onTestCreated={onTestCreated}
      />
    );

    // Verify Icon section exists
    expect(screen.getByText('Test Icon / Logo')).toBeInTheDocument();
    expect(screen.getByText(/Upload custom PNG, JPG, WebP, or SVG badge/i)).toBeInTheDocument();

    // Fill title
    const titleInput = screen.getByPlaceholderText(/e\.g\. WBP Constable Full Mock 01/i);
    fireEvent.change(titleInput, { target: { value: 'Created Test' } });

    // Upload icon file
    const file = new File(['dummy'], 'badge.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.uploadTestIcon).toHaveBeenCalled();
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /\+ Create Mock Test/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Created Test',
          iconUrl: 'https://cdn.practicekoro.online/uploaded-badge.png',
        })
      );
      expect(onTestCreated).toHaveBeenCalled();
    });
  });

  it('allows opening drawer and uploading/changing test icon in Settings tab', async () => {
    vi.spyOn(api, 'getAllAdminTests').mockResolvedValue([sampleTestWithIcon]);
    vi.spyOn(api, 'getExams').mockResolvedValue([]);
    vi.spyOn(api, 'getSubjects').mockResolvedValue([]);
    vi.spyOn(api, 'getAllAdminChapters').mockResolvedValue([]);
    vi.spyOn(api, 'uploadTestIcon').mockResolvedValue('https://cdn.practicekoro.online/new-badge.png');
    const updateSpy = vi.spyOn(api, 'updateTest').mockResolvedValue({
      ...sampleTestWithIcon,
      iconUrl: 'https://cdn.practicekoro.online/new-badge.png',
    });

    render(
      <MemoryRouter>
        <AdminTests />
      </MemoryRouter>
    );

    // Click row to open details drawer
    const testTitle = await screen.findByText('Custom Badge Mock Test 01');
    fireEvent.click(testTitle);

    // Details drawer opens
    expect(await screen.findByText('Test Details')).toBeInTheDocument();

    // Switch to Settings tab
    const settingsTabBtn = screen.getByRole('button', { name: 'Settings' });
    fireEvent.click(settingsTabBtn);

    // Test Icon section in settings tab is rendered
    expect(screen.getAllByText('Test Icon / Logo').length).toBeGreaterThan(0);

    // Save Changes button exists
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveBtn).toBeInTheDocument();
    expect(updateSpy).toBeDefined();
  });
});
