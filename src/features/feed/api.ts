import { useInfiniteQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { FeedPage } from './types';

const PAGE_SIZE = 20;

/** UC-06: cursor-paginated feed (following + groups + popular). */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.feed.home(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      apiRequest<FeedPage>('/api/v1/feed', {
        query: { cursor: pageParam, limit: PAGE_SIZE },
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
