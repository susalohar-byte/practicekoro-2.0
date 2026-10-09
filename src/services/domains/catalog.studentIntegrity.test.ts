import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  rows: {} as Record<string, any[]>,
  error: '' as string,
  phase: '' as string,
  nullRpc: false,
  partialDelete: false,
  failSecondPage: false,
  calls: [] as any[],
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    rpc: vi.fn(async () => ({
      data: m.nullRpc ? null : { attempt_id: 'actual', start_time: '2026-10-01' },
      error: m.error ? { message: m.error } : null,
    })),
    from: (table: string) => {
      let mode = 'read',
        lo = 0,
        hi = Infinity;
      const filters: ((r: any) => boolean)[] = [];
      const q: any = {
        select: () => q,
        order: () => q,
        eq: (k: string, v: any) => {
          filters.push((r) => r[k] === v);
          return q;
        },
        in: (k: string, ids: any[]) => {
          filters.push((r) => ids.includes(r[k]));
          return q;
        },
        range: (a: number, b: number) => {
          lo = a;
          hi = b;
          return q;
        },
        limit: (n: number) => {
          hi = n - 1;
          return q;
        },
        delete: () => {
          mode = 'delete';
          return q;
        },
        insert: (row: any) => {
          mode = 'insert';
          m.calls.push(row);
          return q;
        },
        maybeSingle: async () => ({
          data: (m.rows[table] || []).filter((r) => filters.every((f) => f(r)))[0] || null,
          error: m.error ? { message: m.error } : null,
        }),
        single: async () => ({
          data: m.nullRpc ? null : { id: 'saved' },
          error: m.error ? { message: m.error } : null,
        }),
        then: (resolve: any, reject: any) => {
          m.calls.push({ table, mode, lo });
          const error = m.error || (m.failSecondPage && lo > 0 ? 'page failed' : '');
          if (mode === 'delete' && !error && !m.partialDelete)
            m.rows[table] = (m.rows[table] || []).filter((r) => !filters.every((f) => f(r)));
          const all = (m.rows[table] || []).filter((r) => filters.every((f) => f(r)));
          return Promise.resolve({
            data: all.slice(lo, Math.min(hi + 1, lo + 2)),
            count: all.length,
            error: error ? { message: error } : null,
          }).then(resolve, reject);
        },
      };
      return q;
    },
  },
}));
import { catalogApi } from './catalog';
const bm = (id: string, user_id = 'u') => ({
  id,
  user_id,
  question_id: id,
  created_at: '2026-10-01',
  questions: {
    id,
    question_text: `Question ${id}`,
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    correct_option: 'B',
  },
});
describe('Student backend integrity', () => {
  beforeEach(() => {
    m.rows = {};
    m.error = '';
    m.nullRpc = false;
    m.partialDelete = false;
    m.failSecondPage = false;
    m.calls = [];
    localStorage.clear();
  });
  it('throws bookmark lookup errors without inserting a phantom bookmark', async () => {
    m.error = 'denied';
    await expect(catalogApi.toggleBookmark('u', 'q')).rejects.toThrow('denied');
    expect(m.calls).toEqual([]);
  });
  it('requires a returned bookmark ID', async () => {
    m.nullRpc = true;
    await expect(catalogApi.toggleBookmark('u', 'q')).rejects.toThrow('not confirmed');
  });
  it('returns confirmed bookmark state', async () =>
    expect(await catalogApi.toggleBookmark('u', 'q')).toBe(true));
  it('removes only requested bookmarks belonging to the caller', async () => {
    m.rows.bookmarks = [bm('q'), bm('q', 'other'), bm('keep')];
    expect(await catalogApi.removeBookmarks('u', ['q'])).toBe(true);
    expect(m.rows.bookmarks).toEqual([bm('q', 'other'), bm('keep')]);
  });
  it('is idempotent rather than re-adding already removed bookmarks', async () => {
    m.rows.bookmarks = [bm('q')];
    await catalogApi.removeBookmarks('u', ['q']);
    await catalogApi.removeBookmarks('u', ['q']);
    expect(m.rows.bookmarks).toEqual([]);
  });
  it('does not report failed deletion as success', async () => {
    m.error = 'delete denied';
    await expect(catalogApi.removeBookmarks('u', ['q'])).rejects.toThrow('delete denied');
  });
  it('detects zero affected deletion when rows remain', async () => {
    m.partialDelete = true;
    m.rows.bookmarks = [bm('q')];
    await expect(catalogApi.removeBookmarks('u', ['q'])).rejects.toThrow('not confirmed');
  });
  it('clears only caller bookmarks and verifies absence', async () => {
    m.rows.bookmarks = [bm('q'), bm('other', 'other')];
    await catalogApi.clearAllBookmarks('u');
    expect(m.rows.bookmarks).toEqual([bm('other', 'other')]);
  });
  it('does not report a blocked clear as success', async () => {
    m.partialDelete = true;
    m.rows.bookmarks = [bm('q')];
    await expect(catalogApi.clearAllBookmarks('u')).rejects.toThrow('not confirmed');
  });
  it('loads all saved questions across server caps', async () => {
    m.rows.bookmarks = Array.from({ length: 5 }, (_, i) => bm(`${i}`));
    expect(await catalogApi.getBookmarks('u')).toHaveLength(5);
    expect(m.calls.filter((c) => c.table === 'bookmarks').map((c) => c.lo)).toEqual([0, 2, 4]);
  });
  it('does not convert denied reads into an empty list', async () => {
    m.error = 'permission denied';
    await expect(catalogApi.getBookmarks('u')).rejects.toThrow('permission denied');
    await expect(catalogApi.getUserAttempts('u')).rejects.toThrow('permission denied');
  });
  it('does not expose incomplete results after a later-page failure', async () => {
    m.rows.bookmarks = Array.from({ length: 5 }, (_, i) => bm(`${i}`));
    m.failSecondPage = true;
    await expect(catalogApi.getBookmarks('u')).rejects.toThrow('page failed');
  });
  it('loads complete attempts with real series identity', async () => {
    m.rows.test_attempts = Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`,
      user_id: 'u',
      test_id: 't',
      tests: { test_series_id: 'series' },
      created_at: '2026-10-01',
    }));
    const result = await catalogApi.getUserAttempts('u');
    expect(result).toHaveLength(5);
    expect(result[0].testSeriesId).toBe('series');
  });
  it('returns failed server autosave status while retaining local recovery', async () => {
    m.error = 'offline';
    const answers = [
      {
        questionId: 'q',
        selectedOption: 'A' as const,
        isMarkedForReview: false,
        timeSpentSeconds: 2,
      },
    ];
    expect(await catalogApi.saveAnswers('a', answers, 2)).toBe(false);
    expect(JSON.parse(localStorage.getItem('practicekoro_attempt_a')!).answers).toEqual(answers);
  });
  it('does not use a fake attempt when configured RPC returns no session', async () => {
    m.rows.tests = [{ id: 't', is_active: true, status: 'published', duration_minutes: 15 }];
    m.nullRpc = true;
    await expect(catalogApi.startTestAttempt('t')).rejects.toThrow('not confirmed');
  });
  it('does not fabricate a graded result on missing submission response', async () => {
    m.rows.tests = [{ id: 't', is_active: true, status: 'published' }];
    m.nullRpc = true;
    await expect(catalogApi.submitTestAttempt('a', [], 0, 't')).rejects.toThrow('not confirmed');
  });
  it('distinguishes test load failure from not found', async () => {
    m.error = 'offline';
    await expect(catalogApi.getTestById('t')).rejects.toThrow('offline');
  });
  it('rejects a missing server series report instead of inventing zero', async () => {
    m.nullRpc = true;
    await expect(catalogApi.getTestSeriesAnalytics('s')).rejects.toThrow('not confirmed');
  });
  it('does not replace the saved series icon with a stale browser override', async () => {
    localStorage.setItem(
      'practicekoro_series_icons',
      JSON.stringify({ s: 'https://stale.example.test/icon.png' })
    );
    m.rows.test_series = [
      { id: 's', is_active: true, title: 'Saved Series', icon_url: null, tests: [] },
    ];
    const result = await catalogApi.getStudentTestSeries();
    expect(result[0].iconUrl).toBeUndefined();
    expect(result[0].testCount).toBe(0);
  });
  it('propagates series catalog and series-test read failures', async () => {
    m.error = 'catalog denied';
    await expect(catalogApi.getStudentTestSeries()).rejects.toThrow('catalog denied');
    await expect(catalogApi.getSeriesTestsForStudent('s')).rejects.toThrow('catalog denied');
  });
});
