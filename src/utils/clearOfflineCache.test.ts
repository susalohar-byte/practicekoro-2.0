import { afterEach, expect, it, vi } from 'vitest';
import { clearOfflineCache } from './clearOfflineCache';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
it('clears web caches but preserves sign-in, exam recovery, drafts and Flutter caches', async () => {
  localStorage.setItem('practicekoro_offline_cache', 'discard');
  for (const key of ['sb-auth-token', 'exam-recovery', 'draft']) localStorage.setItem(key, 'keep');
  const remove = vi.fn().mockResolvedValue(true);
  vi.stubGlobal('caches', {
    keys: vi
      .fn()
      .mockResolvedValue([
        'practice-koro-v3',
        'practice-koro-v2',
        'flutter-app-cache',
        'unrelated',
      ]),
    delete: remove,
  });
  expect(await clearOfflineCache()).toBe(2);
  expect(remove.mock.calls.map((c) => c[0])).toEqual(['practice-koro-v3', 'practice-koro-v2']);
  expect(localStorage.getItem('practicekoro_offline_cache')).toBeNull();
  for (const key of ['sb-auth-token', 'exam-recovery', 'draft'])
    expect(localStorage.getItem(key)).toBe('keep');
});
it('rejects a surviving cache rather than claiming success', async () => {
  vi.stubGlobal('caches', {
    keys: vi.fn().mockResolvedValue(['practice-koro-v3']),
    delete: vi.fn().mockResolvedValue(false),
  });
  await expect(clearOfflineCache()).rejects.toThrow('could not be deleted');
});
it('works in browsers without CacheStorage', async () => {
  vi.stubGlobal('caches', undefined);
  expect(await clearOfflineCache()).toBe(0);
});
