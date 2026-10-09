import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { BookmarkItem, MistakeItem } from '@/types';

export interface PracticeRevisionData {
  mistakes: MistakeItem[];
  bookmarks: BookmarkItem[];
}

export const practiceRevisionKey = (userId?: string) => ['practice', 'revision', userId] as const;

/**
 * Cached mistakes + bookmarks for the Practice & Revision hub.
 * Replaces hand-rolled useEffect fetching: 30s stale time, single retry,
 * automatic dedup across mounts. Disabled until the user id is known.
 */
export function usePracticeRevision(userId?: string) {
  return useQuery({
    queryKey: practiceRevisionKey(userId),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<PracticeRevisionData> => {
      const [mList, bList] = await Promise.all([
        api.getMistakes(userId!),
        api.getBookmarks(userId!),
      ]);
      return { mistakes: mList || [], bookmarks: bList || [] };
    },
  });
}

/**
 * Optimistic mistake resolve/unresolve. Mirrors the previous local-state
 * behaviour exactly (instant UI flip + lastReviewedAt stamp, revert on error).
 */
export function useResolveMistake(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mistakeId, nextState }: { mistakeId: string; nextState: boolean }) =>
      api.resolveMistake(mistakeId, nextState),
    onMutate: async ({ mistakeId, nextState }) => {
      await queryClient.cancelQueries({ queryKey: practiceRevisionKey(userId) });
      const previous = queryClient.getQueryData<PracticeRevisionData>(
        practiceRevisionKey(userId)
      );
      queryClient.setQueryData<PracticeRevisionData>(practiceRevisionKey(userId), (old) =>
        old
          ? {
              ...old,
              mistakes: old.mistakes.map((m) =>
                m.id === mistakeId
                  ? { ...m, isResolved: nextState, lastReviewedAt: new Date().toISOString() }
                  : m
              ),
            }
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(practiceRevisionKey(userId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: practiceRevisionKey(userId) });
    },
  });
}

/**
 * Optimistic bookmark removal (instant filter-out, server re-sync on error).
 */
export function useRemoveBookmark(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId }: { bookmarkId: string; questionId: string }) =>
      api.removeBookmarks(userId!, [questionId]),
    onMutate: async ({ bookmarkId }) => {
      await queryClient.cancelQueries({ queryKey: practiceRevisionKey(userId) });
      const previous = queryClient.getQueryData<PracticeRevisionData>(
        practiceRevisionKey(userId)
      );
      queryClient.setQueryData<PracticeRevisionData>(practiceRevisionKey(userId), (old) =>
        old ? { ...old, bookmarks: old.bookmarks.filter((b) => b.id !== bookmarkId) } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(practiceRevisionKey(userId), context.previous);
      } else {
        queryClient.invalidateQueries({ queryKey: practiceRevisionKey(userId) });
      }
    },
  });
}
