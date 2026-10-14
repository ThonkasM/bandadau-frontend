import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { FeedItem, FeedPage } from '@/features/feed/types';
import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { Profile, UpdateProfileRequest } from './types';

/** UC-04: own academic profile. */
export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: () => apiRequest<Profile>('/api/v1/profiles/me'),
  });
}

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation<Profile, Error, UpdateProfileRequest>({
    mutationFn: (input) =>
      apiRequest<Profile>('/api/v1/profiles/me', { method: 'PATCH', body: input }),
    onSuccess: (profile) => client.setQueryData(queryKeys.profile.me(), profile),
  });
}

/** UC-04: posts authored by a user (profile grid → user feed). */
export function useUserPosts(userId: string | undefined) {
  return useInfiniteList<FeedItem>({
    queryKey: [...queryKeys.profile.byId(userId ?? ''), 'posts'],
    fetchPage: (cursor) =>
      apiRequest<FeedPage>(`/api/v1/profiles/${userId}/posts`, {
        query: { cursor, limit: 12 },
      }),
    getId: (item) => item.post.id,
    enabled: Boolean(userId),
  });
}
