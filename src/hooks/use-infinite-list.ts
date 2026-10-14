import { type QueryKey,useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

/** Every Bandada cursor-paginated list returns `{ items, nextCursor }`. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface UseInfiniteListOptions<TItem> {
  queryKey: QueryKey;
  fetchPage: (cursor: string | undefined) => Promise<CursorPage<TItem>>;
  getId: (item: TItem) => string;
  enabled?: boolean;
}

export interface InfiniteList<TItem> {
  items: TItem[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  refetch: () => void;
}

/**
 * Cursor infinite list over `useInfiniteQuery` (the single feed/list engine).
 *
 * - **Dedupes** items across pages by id (no flicker/duplicates on re-fetch).
 * - **`refresh`** (pull-to-refresh) trims to page 1 first, so only the head is
 *   refetched and the user can keep paginating.
 * - **`error`** only surfaces when there are no items, so a failed "load more"
 *   never wipes the list.
 *
 * No manual `useMemo`/`useCallback`: the React Compiler memoizes the derived
 * `items` and the returned handlers.
 */
export function useInfiniteList<TItem>({
  queryKey,
  fetchPage,
  getId,
  enabled = true,
}: UseInfiniteListOptions<TItem>): InfiniteList<TItem> {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items: TItem[] = [];
  const seen = new Set<string>();
  for (const page of query.data?.pages ?? []) {
    for (const item of page.items) {
      const id = getId(item);
      if (seen.has(id)) continue;
      seen.add(id);
      items.push(item);
    }
  }

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      queryClient.setQueryData(queryKey, (prev) => {
        const data = prev as { pages: unknown[]; pageParams: unknown[] } | undefined;
        return data
          ? { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) }
          : data;
      });
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return {
    items,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    refreshing,
    error: query.isError && items.length === 0,
    hasMore: Boolean(query.hasNextPage),
    loadMore,
    refresh,
    refetch: () => void query.refetch(),
  };
}
