import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { FeedItem, FeedPage } from './types';

const PAGE_SIZE = 20;

/** UC-06: cursor-paginated feed (following + groups + popular). */
export function useFeed() {
  return useInfiniteList<FeedItem>({
    queryKey: queryKeys.feed.home(),
    fetchPage: (cursor) =>
      apiRequest<FeedPage>('/api/v1/feed', { query: { cursor, limit: PAGE_SIZE } }),
    getId: (item) => item.post.id,
  });
}
