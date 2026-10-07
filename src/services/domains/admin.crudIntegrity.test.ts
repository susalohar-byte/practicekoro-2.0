import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  rows: [] as any[],
  error: null as any,
  blocked: false,
  from: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { from: state.from, rpc: state.rpc },
}));
vi.mock('@/lib/dataSync', () => ({ notifyExamsUpdated: vi.fn() }));
import { createExam, updateExam, deleteExam, getAllAdminExams } from './admin.exams';
import {
  requireSavedRow,
  requireSuccess,
  runConfirmedBatch,
  withMutationConfirmation,
  mutateContentCollection,
} from './admin.mutations';
import { createNotification, updateNotification, sendNotificationNow } from './admin.notifications';
const input = {
  iconName: 'Shield',
  title: 'Disposable Exam',
  slug: 'disposable-exam',
  category: 'Other',
  orderIndex: 1,
  isActive: true,
  shortName: 'DE',
  subtitle: 'Disposable Board',
};
beforeEach(() => {
  state.rows = [];
  state.error = null;
  state.blocked = false;
  vi.clearAllMocks();
  state.from.mockImplementation((table: string) => {
    let op = 'read',
      payload: any,
      filter: any;
    const chain: any = {
      select: () => chain,
      order: () => chain,
      eq: (k: string, v: any) => {
        filter = [k, v];
        return chain;
      },
      insert: (p: any) => {
        op = 'insert';
        payload = p;
        return chain;
      },
      update: (p: any) => {
        op = 'update';
        payload = p;
        return chain;
      },
      single: async () => run(true),
      maybeSingle: async () => run(true),
      then: (yes: any, no: any) => Promise.resolve(run(false)).then(yes, no),
    };
    function run(single: boolean) {
      if (state.error) return { data: null, error: state.error };
      if (table !== 'exams' && table !== 'notifications')
        return { data: single ? null : [], error: null };
      if (op === 'insert') {
        if (state.rows.some((r) => r.slug === payload.slug && payload.slug))
          return { data: null, error: { message: 'duplicate slug' } };
        const row = {
          ...payload,
          id: 'backend-' + state.rows.length,
          created_at: new Date().toISOString(),
        };
        state.rows.push(row);
        return { data: row, error: null };
      }
      const rows = state.rows.filter((r) => !filter || r[filter[0]] === filter[1]);
      if (op === 'update') rows.forEach((r) => Object.assign(r, payload));
      return { data: single ? rows[0] || null : [...rows], error: null };
    }
    return chain;
  });
  state.rpc.mockImplementation(async (name: string, args: any) => {
    if (name !== 'admin_delete_record') return { data: null, error: null };
    if (state.blocked) return { data: null, error: { message: 'Linked history blocks deletion' } };
    if (state.error) return { data: null, error: state.error };
    const row = state.rows.find((r) => r.id === args.p_id);
    if (!row) return { data: null, error: null };
    state.rows = state.rows.filter((r) => r !== row);
    return { data: { success: true, deleted_id: args.p_id }, error: null };
  });
});
describe('production admin mutation integrity', () => {
  it('creates from the returned record and persists every exam form field', async () => {
    const saved = await createExam(input);
    expect(saved.id).toBe('backend-0');
    expect(state.rows[0]).toMatchObject({
      title: input.title,
      short_name: 'DE',
      subtitle: input.subtitle,
    });
    expect((await getAllAdminExams())[0]).toMatchObject(saved);
  });
  it('rejects duplicates without adding a phantom row', async () => {
    await createExam(input);
    await expect(createExam(input)).rejects.toThrow('duplicate slug');
    expect(state.rows).toHaveLength(1);
  });
  it('rejects invalid exam title before writing', async () => {
    await expect(createExam({ ...input, title: ' ' })).rejects.toThrow();
    expect(state.from).not.toHaveBeenCalled();
  });
  it('edits by stable ID and reloads authoritative metadata', async () => {
    const saved = await createExam(input);
    const changed = await updateExam(saved.id, {
      title: 'Renamed',
      subtitle: 'New board',
      isActive: false,
    });
    expect(changed).toMatchObject({
      id: saved.id,
      title: 'Renamed',
      subtitle: 'New board',
      isActive: false,
    });
    expect((await getAllAdminExams())[0].title).toBe('Renamed');
  });
  it('never upserts missing exams', async () => {
    await expect(updateExam('missing', { title: 'New' })).rejects.toThrow('No matching record');
    expect(state.rows).toEqual([]);
  });
  it('preserves records on permission/network update failure', async () => {
    const saved = await createExam(input);
    state.error = { message: 'Permission denied' };
    await expect(updateExam(saved.id, { title: 'Wrong' })).rejects.toThrow('Permission denied');
    expect(state.rows[0].title).toBe(input.title);
  });
  it('deletes only after confirmed RPC ID and does not resurrect presets', async () => {
    const saved = await createExam(input);
    await expect(deleteExam(saved.id)).resolves.toBe(true);
    expect(state.rpc).toHaveBeenCalledWith('admin_delete_record', {
      p_table: 'exams',
      p_id: saved.id,
    });
    expect(await getAllAdminExams()).toEqual([]);
  });
  it('does not consider zero-row delete successful', async () => {
    await expect(deleteExam('missing')).rejects.toThrow('Deletion was not confirmed');
  });
  it('preserves linked data when deletion is blocked', async () => {
    const saved = await createExam(input);
    state.blocked = true;
    await expect(deleteExam(saved.id)).rejects.toThrow('Linked history');
    expect(state.rows).toHaveLength(1);
  });
  it('rejects an unauthorized deletion', async () => {
    await createExam(input);
    state.error = { message: 'Active administrator privileges required' };
    await expect(deleteExam('backend-0')).rejects.toThrow('privileges');
    expect(state.rows).toHaveLength(1);
  });
  it('production empty load stays empty', async () => {
    expect(await getAllAdminExams()).toEqual([]);
  });
  it('production fetch error is not a demo fallback', async () => {
    state.error = { message: 'Network unavailable' };
    await expect(getAllAdminExams()).rejects.toThrow('Network unavailable');
  });
  it('rejects missing/mismatched saved rows', () => {
    expect(() => requireSavedRow({ data: null, error: null })).toThrow();
    expect(() => requireSavedRow({ data: { id: 'other' }, error: null }, 'expected')).toThrow();
  });
  it('rejects structured failure and false', () => {
    expect(() => requireSuccess({ success: false, error: 'denied' })).toThrow('denied');
    expect(() => requireSuccess(false)).toThrow();
  });
  it('locks repeat in-flight mutations and releases after completion', async () => {
    let finish!: (v: any) => void;
    const work = vi.fn(
      (_id: string) =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const api = withMutationConfirmation({ updateExam: work });
    const pending = api.updateExam('a');
    await expect(api.updateExam('a')).rejects.toThrow('already in progress');
    expect(work).toHaveBeenCalledTimes(1);
    finish({ id: 'a' });
    await pending;
    const next = api.updateExam('a');
    finish({ id: 'a' });
    await next;
    expect(work).toHaveBeenCalledTimes(2);
  });
  it('proxy rejects success:false rather than resolving a success toast', async () => {
    const api = withMutationConfirmation({
      createThing: async () => ({ success: false, error: 'save failed' }),
    });
    await expect(api.createThing()).rejects.toThrow('save failed');
  });
  it('batch retains failed IDs and only reports confirmed successes', async () => {
    const batch = await runConfirmedBatch(['a', 'b', 'c'], async (id) =>
      id === 'b' ? { success: false, error: 'blocked' } : { success: true, id }
    );
    expect(batch.results.map((r) => r.input)).toEqual(['a', 'c']);
    expect(batch.failures).toEqual([{ input: 'b', error: 'blocked' }]);
  });
  it('collection saves require real returned IDs', async () => {
    state.rpc.mockResolvedValue({ data: { success: true, record: {} }, error: null });
    await expect(
      mutateContentCollection('blog', 'create', undefined, { title: 'Post' })
    ).rejects.toThrow('ID');
  });
  it('collection delete requires matching deleted ID', async () => {
    state.rpc.mockResolvedValue({ data: { success: true, deleted_id: 'other' }, error: null });
    await expect(mutateContentCollection('banners', 'delete', 'wanted')).rejects.toThrow(
      'not confirmed'
    );
  });
  it('notification create returns the actual saved record, edit persists, zero-row send fails', async () => {
    const result = await createNotification({
      title: 'Notice',
      message: 'Message',
      channel: 'in_app',
      targetAudience: 'all',
      status: 'draft',
    });
    expect(result.notification.id).toBe('backend-0');
    expect(await updateNotification(result.notification.id, { message: 'Changed' })).toMatchObject({
      message: 'Changed',
    });
    await expect(sendNotificationNow('missing')).rejects.toThrow('not found');
  });
  it('does not pretend disconnected email/push delivery works', async () => {
    await expect(
      createNotification({
        title: 'Notice',
        message: 'Message',
        channel: 'both',
        targetAudience: 'all',
        status: 'sent',
      })
    ).rejects.toThrow('Only in-app');
    expect(state.rows).toHaveLength(0);
  });
});
