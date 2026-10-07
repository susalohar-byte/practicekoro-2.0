import { beforeEach, describe, it, expect, vi } from 'vitest';
const m = vi.hoisted(() => ({
  result: { data: null, error: null } as any,
  from: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { from: m.from },
}));
vi.mock('@/lib/dataSync', () => ({ notifyExamsUpdated: vi.fn() }));
vi.mock('./catalog', () => ({ catalogApi: { syncTestExamAssociations: vi.fn() } }));
import { createTest, updateTest } from './admin.tests';
beforeEach(() => {
  vi.clearAllMocks();
  const q: any = {
    insert: m.insert,
    update: m.update,
    select: () => q,
    eq: () => q,
    single: async () => m.result,
  };
  m.from.mockReturnValue(q);
  m.insert.mockReturnValue(q);
  m.update.mockReturnValue(q);
});
const icon = 'https://cdn.example.test/icon.png';
describe('Authoritative test icon persistence', () => {
  it('blocks icon creation when schema is missing rather than retrying without the field', async () => {
    m.result = { data: null, error: { message: 'column icon_url missing' } };
    await expect(
      createTest({
        title: 'Disposable test',
        slug: 'disposable-test',
        isActive: true,
        negativeMarking: 0,
        testType: 'full_mock',
        durationMinutes: 1,
        totalQuestions: 1,
        totalMarks: 1,
        passingMarks: 0,
        isPremium: false,
        orderIndex: 1,
        iconUrl: icon,
      })
    ).rejects.toThrow('migration');
    expect(m.insert).toHaveBeenCalledTimes(1);
  });
  it('blocks icon edits/removal when schema is missing', async () => {
    m.result = { data: null, error: { message: 'column icon_url missing' } };
    await expect(updateTest('real-id', { iconUrl: icon })).rejects.toThrow('migration');
    expect(m.update).toHaveBeenCalledTimes(1);
    await expect(updateTest('real-id', { iconUrl: '' })).rejects.toThrow('migration');
  });
  it('returns only the stored icon, never an unconfirmed requested URL', async () => {
    m.result = {
      data: { id: 'real-id', title: 'Test', icon_url: 'https://cdn.example.test/stored.png' },
      error: null,
    };
    await expect(updateTest('real-id', { iconUrl: icon })).rejects.toThrow('confirm');
  });
  it('persists clear as SQL null and returns no icon after a confirmed removal', async () => {
    m.result = { data: { id: 'real-id', title: 'Test', icon_url: null }, error: null };
    expect((await updateTest('real-id', { iconUrl: '' })).iconUrl).toBeUndefined();
    expect(m.update).toHaveBeenCalledWith({ icon_url: null });
  });
});
