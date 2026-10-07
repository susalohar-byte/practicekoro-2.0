import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  data: {} as Record<string, any[]>,
  errors: {} as Record<string, string>,
  calls: [] as any[],
  saved: null as any,
  saveError: null as any,
  deleted: null as any,
  deleteError: null as any,
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    rpc: async (_name: string, args: any) => {
      m.calls.push(args);
      return { data: m.deleted, error: m.deleteError };
    },
    from: (table: string) => {
      const filters: ((r: any) => boolean)[] = [];
      let lo = 0,
        hi = Infinity,
        head = false;
      const q: any = {
        insert: (payload: any) => {
          m.calls.push({ insert: payload });
          return q;
        },
        update: (payload: any) => {
          m.calls.push({ update: payload });
          return q;
        },
        single: async () => ({ data: m.saved, error: m.saveError }),
        maybeSingle: async () => ({
          data: (m.data[table] || []).find((r) => filters.every((f) => f(r))) || null,
          error: null,
        }),
        select: (columns: string, opt: any = {}) => {
          head = Boolean(opt.head);
          m.calls.push({ table, columns, head });
          return q;
        },
        order: () => q,
        range: (a: number, b: number) => {
          lo = a;
          hi = b;
          return q;
        },
        limit: (n: number) => {
          hi = n - 1;
          return q;
        },
        eq: (k: string, v: any) => {
          filters.push((r) => r[k] === v);
          return q;
        },
        is: (k: string, v: any) => {
          filters.push((r) => (r[k] ?? null) === v);
          return q;
        },
        neq: (k: string, v: any) => {
          filters.push((r) => r[k] !== v);
          return q;
        },
        ilike: (k: string, v: string) => {
          filters.push((r) => String(r[k]).toLowerCase() === v.toLowerCase());
          return q;
        },
        in: (k: string, v: any[]) => {
          filters.push((r) => v.includes(r[k]));
          return q;
        },
        not: (k: string, _op: string, _v: any) => {
          filters.push((r) => r[k] != null);
          return q;
        },
        gt: (k: string, v: any) => {
          filters.push((r) => r[k] > v);
          return q;
        },
        gte: (k: string, v: any) => {
          filters.push((r) => Date.parse(r[k]) >= Date.parse(v));
          return q;
        },
        lte: (k: string, v: any) => {
          filters.push((r) => Date.parse(r[k]) <= Date.parse(v));
          return q;
        },
        then: (yes: any, no: any) => {
          const all = (m.data[table] || []).filter((r) => filters.every((f) => f(r)));
          // Simulate a server result limit lower than the requested 500, with exact count.
          return Promise.resolve({
            data: head ? null : all.slice(lo, Math.min(hi + 1, lo + 2)),
            count: all.length,
            error: m.errors[table] ? { message: m.errors[table] } : null,
          }).then(yes, no);
        },
      };
      return q;
    },
  },
}));
import {
  getAllAdminSubjects,
  getSubjectReportingData,
  uploadSubjectIcon,
  createSubject,
  updateSubject,
  deleteSubject,
} from './admin.subjects';
import { getAllAdminChapters } from './admin.chapters';
describe('Subject backend read and validation integrity', () => {
  beforeEach(() => {
    m.data = {};
    m.errors = {};
    m.calls = [];
    m.saved = null;
    m.saveError = null;
    m.deleted = null;
    m.deleteError = null;
  });
  it('fetches all subject/topic server pages with real zero counts and timestamps', async () => {
    m.data.subjects = Array.from({ length: 7 }, (_, i) => ({
      id: `s${i}`,
      name: `Subject ${i}`,
      slug: `s${i}`,
      order_index: i,
      is_active: true,
      created_at: '2026-10-01T00:00:00Z',
      chapters: [{ count: 0 }],
    }));
    m.data.chapters = Array.from({ length: 7 }, (_, i) => ({
      id: `c${i}`,
      subject_id: 's0',
      name: `Topic ${i}`,
      slug: `c${i}`,
      order_index: i,
      is_active: true,
    }));
    const subjects = await getAllAdminSubjects();
    expect(subjects).toHaveLength(7);
    expect(subjects[0]).toMatchObject({ chaptersCount: 0, createdAt: '2026-10-01T00:00:00Z' });
    expect(await getAllAdminChapters('s0')).toHaveLength(7);
  });
  it('throws on core read errors instead of returning presets or empty records', async () => {
    m.errors.subjects = 'permission denied';
    await expect(getAllAdminSubjects()).rejects.toThrow('permission denied');
  });
  it('preserves available metrics and explicitly reports permission-denied sections', async () => {
    m.errors.test_attempts = 'attempt permission denied';
    m.data.questions = [{ id: 'q', subject_id: 's' }];
    const r = await getSubjectReportingData();
    expect(r.questions).toHaveLength(1);
    expect(r.attempts).toBeNull();
    expect(r.warnings[0]).toContain('Attempt statistics unavailable');
  });
  it('rejects duplicate global slug using a fresh backend scope check', async () => {
    m.data.subjects = [{ id: 'old', slug: 'math', exam_id: null }];
    await expect(
      createSubject({
        name: 'Math',
        slug: 'math',
        iconName: 'BookOpen',
        orderIndex: 1,
        isActive: true,
      })
    ).rejects.toThrow('already exists');
  });
  it('returns only confirmed backend IDs/fields and survives a fresh complete read', async () => {
    m.saved = {
      id: 'db-id',
      name: 'Server Math',
      slug: 'math',
      order_index: 0,
      is_active: true,
      icon_name: 'BookOpen',
      created_at: '2026-10-07T00:00:00Z',
    };
    const row = await createSubject({
      name: 'Math',
      slug: 'math',
      orderIndex: 0,
      isActive: true,
      iconName: 'BookOpen',
    });
    expect(row).toMatchObject({ id: 'db-id', name: 'Server Math', orderIndex: 0 });
    m.data.subjects = [m.saved];
    expect(await getAllAdminSubjects()).toEqual([
      expect.objectContaining({ id: 'db-id', name: 'Server Math' }),
    ]);
    m.saved = { ...m.saved, name: 'Updated' };
    expect(await updateSubject('db-id', { name: 'Updated' })).toMatchObject({
      id: 'db-id',
      name: 'Updated',
    });
    expect(m.calls).toContainEqual({ update: { name: 'Updated' } });
  });
  it('rejects zero-row and permission-denied writes rather than returning optimistic data', async () => {
    await expect(
      createSubject({
        name: 'Math',
        slug: 'math',
        orderIndex: 1,
        isActive: true,
        iconName: 'BookOpen',
      })
    ).rejects.toThrow('No matching record');
    await expect(updateSubject('missing', { name: 'Updated' })).rejects.toThrow(
      'No matching record'
    );
    m.saveError = { message: 'permission denied' };
    await expect(updateSubject('missing', { name: 'Updated' })).rejects.toThrow(
      'permission denied'
    );
    m.saveError = null;
    m.saved = { id: 'wrong' };
    await expect(updateSubject('wanted', { name: 'Updated' })).rejects.toThrow(
      'No matching record'
    );
  });
  it('requires protected deletion RPC to confirm exactly the selected ID', async () => {
    m.deleted = { success: true, deleted_id: 'other' };
    await expect(deleteSubject('chosen')).rejects.toThrow('not confirmed');
    m.deleted = { success: false, error: 'Subject has linked history' };
    await expect(deleteSubject('chosen')).rejects.toThrow('linked history');
    m.deleteError = { message: 'admin permission required' };
    await expect(deleteSubject('chosen')).rejects.toThrow('permission');
    m.deleteError = null;
    m.deleted = { success: true, deleted_id: 'chosen' };
    expect(await deleteSubject('chosen')).toBe(true);
    expect(m.calls).toContainEqual({ p_table: 'subjects', p_id: 'chosen' });
  });
  it('rejects invalid slug/file formats, empty and oversized icons before any upload', async () => {
    await expect(
      createSubject({
        name: 'বাংলা',
        slug: '',
        iconName: 'BookOpen',
        orderIndex: 1,
        isActive: true,
      })
    ).rejects.toThrow('URL slug');
    for (const file of [
      new File(['x'], 'bad.svg', { type: 'image/svg+xml' }),
      new File([], 'empty.png', { type: 'image/png' }),
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
    ])
      await expect(uploadSubjectIcon(file)).rejects.toThrow('2 MB');
  });
});
