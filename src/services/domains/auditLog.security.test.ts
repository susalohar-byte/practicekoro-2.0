import { describe, it, expect, vi, beforeEach } from 'vitest';
const state = vi.hoisted(() => ({
  from: vi.fn(),
  result: { data: null as unknown, error: null as unknown, count: 0 },
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { from: state.from },
}));
import { logAdminActivity, getAdminAuditLogs } from './auditLog';
import { localAuditLogs } from './localStore';
beforeEach(() => {
  state.from.mockReset();
  state.result = { data: null, error: null, count: 0 };
});
describe('production audit authority', () => {
  it('never submits client claimed actors or writes local fallback evidence', async () => {
    localStorage.setItem(
      'practicekoro_user',
      JSON.stringify({ email: 'spoof@example.test', adminRole: 'super_admin' })
    );
    const before = localAuditLogs.length;
    await logAdminActivity({ action: 'fake', entityType: 'payments' });
    expect(state.from).not.toHaveBeenCalled();
    expect(localAuditLogs.length).toBe(before);
  });
  it('surfaces backend failures rather than pretending there are no logs', async () => {
    const q = { select: () => q, order: () => q, range: async () => state.result };
    state.from.mockReturnValue(q);
    state.result.error = { message: 'audit access denied' };
    await expect(getAdminAuditLogs()).rejects.toThrow('audit access denied');
  });
});
