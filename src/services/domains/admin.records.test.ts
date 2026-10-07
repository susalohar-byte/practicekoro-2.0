import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  payments: vi.fn(),
  subscriptions: vi.fn(),
  students: vi.fn(),
  from: vi.fn(),
}));
vi.mock('./adminCommerce', () => ({
  adminCommerceApi: {
    getAdminPayments: mocks.payments,
    getAdminSubscriptions: mocks.subscriptions,
    getAdminStudents: mocks.students,
  },
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { from: mocks.from },
}));
import { adminRecordsApi } from './admin.records';
beforeEach(() => vi.clearAllMocks());
describe('complete admin record loaders', () => {
  it('loads all payment and subscription pages instead of only 50 records', async () => {
    const rows = Array.from({ length: 123 }, (_, i) => ({ id: `id-${i}` }));
    mocks.payments.mockImplementation(async (_status, _search, limit, offset) =>
      rows.slice(offset, offset + limit)
    );
    mocks.subscriptions.mockImplementation(async (_status, _search, limit, offset) =>
      rows.slice(offset, offset + limit)
    );
    expect(await adminRecordsApi.getAllAdminPayments()).toHaveLength(123);
    expect(await adminRecordsApi.getAllAdminSubscriptions()).toHaveLength(123);
    expect(mocks.payments).toHaveBeenLastCalledWith(undefined, undefined, 50, 150);
  });
  it('loads more than 200 students with persisted account status', async () => {
    const rows = Array.from({ length: 215 }, (_, i) => ({ id: `u${i}` }));
    mocks.students.mockImplementation(async (_search, _plan, _status, limit, offset) =>
      rows.slice(offset, offset + limit)
    );
    mocks.from.mockImplementation(() => ({
      select: () => ({
        in: async (_column: string, ids: string[]) => ({
          data: ids.map((id) => ({ id, account_status: id === 'u214' ? 'inactive' : 'active' })),
          error: null,
        }),
      }),
    }));
    const students = await adminRecordsApi.getAllAdminStudents();
    expect(students).toHaveLength(215);
    expect(students[214].accountStatus).toBe('inactive');
  });
});
