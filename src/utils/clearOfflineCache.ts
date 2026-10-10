/** Clear only this web app's disposable caches; never auth, drafts, exam answers or Flutter stores. */
export async function clearOfflineCache(): Promise<number> {
  localStorage.removeItem('practicekoro_offline_cache');
  sessionStorage.removeItem('practicekoro_offline_cache');
  if (typeof caches === 'undefined') return 0;
  const names = (await caches.keys()).filter((name) => name.startsWith('practice-koro-'));
  await Promise.all(
    names.map(async (name) => {
      const deleted = await caches.delete(name);
      // A concurrent removal is harmless, but a surviving cache is not a confirmed clear.
      if (!deleted && (await caches.keys()).includes(name))
        throw new Error('Offline cache could not be deleted.');
    })
  );
  return names.length;
}
