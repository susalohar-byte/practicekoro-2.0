import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';

export function requireSavedRow(
  result: { data: any; error: { message: string } | null },
  id?: string
): any {
  if (result.error) throw new Error(result.error.message);
  if (!result.data?.id || (id !== undefined && result.data.id !== id))
    throw new Error('No matching record was saved. Refresh and check your permissions.');
  return result.data;
}
export function requireSuccess<T>(result: T): T {
  if (
    result === false ||
    (result && typeof result === 'object' && 'success' in result && result.success === false)
  ) {
    throw new Error(
      (result as { error?: string }).error || 'The backend did not confirm this operation.'
    );
  }
  return result;
}
export async function deleteAdminRecord(table: string, id: string): Promise<boolean> {
  if (!id) throw new Error('A real record ID is required.');
  const { data, error } = await supabase.rpc('admin_delete_record', { p_table: table, p_id: id });
  if (error) throw new Error(error.message);
  if (data?.success !== true || data?.deleted_id !== id)
    throw new Error(
      data?.error || 'Deletion was not confirmed. The record may be missing or protected.'
    );
  return true;
}
/** Production mutations never treat success:false as a successful Promise. */
export function withMutationConfirmation<T extends object>(api: T): T {
  const pending = new Set<string>();
  return new Proxy(api, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      if (
        typeof key !== 'string' ||
        typeof value !== 'function' ||
        !/^(create|update|delete|remove|save|archive|publish|assign|bulk|extend|cancel|reorder|send)/.test(
          key
        )
      )
        return value;
      return async (...args: unknown[]) => {
        const lock = `${key}:${typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0])}`;
        if (pending.has(lock)) throw new Error('This operation is already in progress.');
        pending.add(lock);
        try {
          const result = await value.apply(target, args);
          return isSupabaseConfigured ? requireSuccess(result) : result;
        } finally {
          pending.delete(lock);
        }
      };
    },
  });
}
export async function mutateContentCollection(
  collection: 'blog' | 'banners',
  action: 'create' | 'update' | 'delete' | 'reorder',
  id?: string,
  item: unknown = {}
) {
  const { data, error } = await supabase.rpc('admin_mutate_collection', {
    p_collection: collection,
    p_action: action,
    p_id: id || null,
    p_item: item,
  });
  if (error) throw new Error(error.message);
  if (data?.success !== true) throw new Error(data?.error || 'Content save was not confirmed.');
  if (action === 'create' && !data.record?.id) throw new Error('Saved content ID is missing.');
  if (
    (action === 'update' && data.record?.id !== id) ||
    (action === 'delete' && data.deleted_id !== id)
  )
    throw new Error('Matching content change was not confirmed.');
  return data;
}
export async function runConfirmedBatch<T, R>(inputs: T[], work: (input: T) => Promise<R>) {
  const results: { input: T; value: R }[] = [];
  const failures: { input: T; error: string }[] = [];
  for (const input of inputs) {
    try {
      results.push({ input, value: requireSuccess(await work(input)) });
    } catch (error) {
      failures.push({ input, error: error instanceof Error ? error.message : 'Operation failed.' });
    }
  }
  return { results, failures };
}
