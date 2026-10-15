import { type QueryClient,useMutation, useQueryClient } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { FeedItem, FeedPage, Post, ReactionState, ReactionType } from './types';

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

type FeedData = { pages: { items: FeedItem[] }[]; pageParams: unknown[] };

/** Maps the single post inside the cached feed (all pages). */
function mapPost(client: QueryClient, postId: string, fn: (post: Post) => Post): void {
  client.setQueryData<FeedData>(queryKeys.feed.home(), (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      pages: prev.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.post.id === postId ? { ...item, post: fn(item.post) } : item,
        ),
      })),
    };
  });
}

const countsKey = (type: ReactionType) => type.toLowerCase() as keyof Post['reactionCounts'];

/** Optimistic toggle of a reaction on the cached post. */
function optimisticReaction(client: QueryClient, postId: string, type: ReactionType): void {
  mapPost(client, postId, (post) => {
    const counts = { ...post.reactionCounts };
    const key = countsKey(type);
    if (post.myReaction === type) {
      counts[key] = Math.max(0, counts[key] - 1);
      return { ...post, myReaction: null, reactionCounts: counts };
    }
    if (post.myReaction) {
      const prev = countsKey(post.myReaction);
      counts[prev] = Math.max(0, counts[prev] - 1);
    }
    counts[key] += 1;
    return { ...post, myReaction: type, reactionCounts: counts };
  });
}

function applyReactionState(client: QueryClient, state: ReactionState): void {
  mapPost(client, state.postId, (post) => ({
    ...post,
    myReaction: state.myReaction,
    reactionCounts: state.reactionCounts,
  }));
}

/** UC-07: set my reaction (PUT, idempotent). Optimistic with rollback. */
export function useSetReaction() {
  const client = useQueryClient();
  return useMutation<ReactionState, Error, { postId: string; type: ReactionType }, { prev?: FeedData }>({
    mutationFn: ({ postId, type }) =>
      apiRequest<ReactionState>(`/api/v1/posts/${postId}/reactions/me`, {
        method: 'PUT',
        body: { type },
      }),
    onMutate: async ({ postId, type }) => {
      await client.cancelQueries({ queryKey: queryKeys.feed.root() });
      const prev = client.getQueryData<FeedData>(queryKeys.feed.home());
      optimisticReaction(client, postId, type);
      return { prev };
    },
    onError: (_error, _vars, context) => {
      if (context?.prev) client.setQueryData(queryKeys.feed.home(), context.prev);
    },
    onSuccess: (state) => applyReactionState(client, state),
  });
}

/** UC-07: remove my reaction (DELETE). Optimistic with rollback. */
export function useRemoveReaction() {
  const client = useQueryClient();
  return useMutation<ReactionState, Error, { postId: string }, { prev?: FeedData }>({
    mutationFn: ({ postId }) =>
      apiRequest<ReactionState>(`/api/v1/posts/${postId}/reactions/me`, { method: 'DELETE' }),
    onMutate: async ({ postId }) => {
      await client.cancelQueries({ queryKey: queryKeys.feed.root() });
      const prev = client.getQueryData<FeedData>(queryKeys.feed.home());
      mapPost(client, postId, (post) => {
        const counts = { ...post.reactionCounts };
        if (post.myReaction) {
          const key = countsKey(post.myReaction);
          counts[key] = Math.max(0, counts[key] - 1);
        }
        return { ...post, myReaction: null, reactionCounts: counts };
      });
      return { prev };
    },
    onError: (_error, _vars, context) => {
      if (context?.prev) client.setQueryData(queryKeys.feed.home(), context.prev);
    },
    onSuccess: (state) => applyReactionState(client, state),
  });
}
