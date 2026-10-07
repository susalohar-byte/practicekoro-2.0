import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { functions: { invoke: mocks.invoke } },
}));
import { accountManagementApi } from './accountManagement';
beforeEach(() => vi.clearAllMocks());
describe('secure management API confirmation', () => {
  it('creates accounts through the server-only function, not client sign-up', async () => {
    mocks.invoke.mockResolvedValue({ data: { success: true, userId: 'auth-id' }, error: null });
    expect(
      await accountManagementApi.createStudentAccount({
        fullName: 'Learner',
        email: 'learner@example.com',
      })
    ).toMatchObject({ userId: 'auth-id' });
    expect(mocks.invoke).toHaveBeenCalledWith('admin-manage-users', {
      body: { action: 'create_student', fullName: 'Learner', email: 'learner@example.com' },
    });
  });
  it('returns backend failures instead of false success', async () => {
    mocks.invoke.mockResolvedValue({ data: { success: false, error: 'Denied' }, error: null });
    expect(
      (await accountManagementApi.updateStudentProfile('u1', { fullName: 'Name' })).success
    ).toBe(false);
  });
  it('does not infer a deletion from a success flag without confirmed IDs', async () => {
    mocks.invoke.mockResolvedValue({ data: { success: true, failures: [] }, error: null });
    expect(await accountManagementApi.bulkDeleteStudentProfiles(['u1'])).toMatchObject({
      success: false,
      deletedIds: [],
      failures: [{ userId: 'u1' }],
    });
  });
  it('reports partial bulk deletions and batches more than 100 IDs', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `u${i}`);
    mocks.invoke
      .mockResolvedValueOnce({
        data: { success: true, deletedIds: ids.slice(0, 100) },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          success: false,
          deletedIds: [],
          failures: [{ userId: 'u100', error: 'Protected' }],
        },
        error: null,
      });
    const result = await accountManagementApi.bulkDeleteStudentProfiles(ids);
    expect(result.deletedIds).toHaveLength(100);
    expect(result.success).toBe(false);
    expect(result.failures).toEqual([{ userId: 'u100', error: 'Protected' }]);
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
  });
  it('persistently toggles staff status through the authenticated server function', async () => {
    mocks.invoke.mockResolvedValue({
      data: { success: false, error: 'Cannot deactivate primary admin' },
      error: null,
    });
    expect((await accountManagementApi.setStaffAccountStatus('admin', 'inactive')).success).toBe(
      false
    );
    expect(mocks.invoke).toHaveBeenCalledWith('admin-manage-users', {
      body: { action: 'set_staff_status', userId: 'admin', status: 'inactive' },
    });
  });
});
