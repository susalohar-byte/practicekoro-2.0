import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { rpc: mocks.rpc, from: mocks.from },
}));
import { assignStaffByEmail, removeStaffMember, updateStaffRole } from './auditLog';
beforeEach(() => vi.clearAllMocks());
describe('staff mutation confirmation', () => {
  it.each(['assign', 'remove', 'update'])(
    'never falls back to direct profile writes after %s RPC denial',
    async (operation) => {
      mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Denied' } });
      const result =
        operation === 'assign'
          ? await assignStaffByEmail('staff@example.com', 'support_agent')
          : operation === 'remove'
            ? await removeStaffMember('staff')
            : await updateStaffRole('staff', 'support_agent');
      expect(result).toMatchObject({ success: false, error: 'Denied' });
      expect(mocks.from).not.toHaveBeenCalled();
    }
  );
  it('requires a returned member ID on assignment', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });
    expect((await assignStaffByEmail('staff@example.com', 'support_agent')).success).toBe(false);
  });
  it('requires explicit confirmation on removal', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    expect((await removeStaffMember('staff')).success).toBe(false);
  });
});
