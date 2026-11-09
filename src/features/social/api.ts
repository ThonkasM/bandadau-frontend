import type { social } from '@bandada/contracts-ts';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export type ReportReason = social.components['schemas']['ReportReason'];
export type ReportTargetType = 'POST' | 'COMMENT';
export type FollowSuggestion = social.components['schemas']['FollowSuggestion'];

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

/** Following someone changes their profile, my counters, my feed and my suggestions. */
function refreshAfterFollowChange(client: QueryClient, userId: string) {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.profile.byId(userId) }),
    client.invalidateQueries({ queryKey: queryKeys.profile.me() }),
    client.invalidateQueries({ queryKey: queryKeys.feed.root() }),
    client.invalidateQueries({ queryKey: queryKeys.follows.suggestions() }),
  ]);
}

/** UC-08: follow a student (PUT, idempotent). */
export function useFollow(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest(`/api/v1/follows/${userId}`, { method: 'PUT' }),
    onSuccess: () => refreshAfterFollowChange(client, userId),
  });
}

/** UC-08: unfollow (DELETE, idempotent). */
export function useUnfollow(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest(`/api/v1/follows/${userId}`, { method: 'DELETE' }),
    onSuccess: () => refreshAfterFollowChange(client, userId),
  });
}

/** UC-08: who to follow suggestions. */
export function useFollowSuggestions() {
  return useQuery({
    queryKey: queryKeys.follows.suggestions(),
    queryFn: () =>
      apiRequest<{ items: FollowSuggestion[] }>('/api/v1/follows/suggestions', {
        query: { limit: 20 },
      }),
  });
}

/** UC-10: report a post or comment (♻️). */
export function useReportContent() {
  return useMutation({
    mutationFn: (input: ReportInput) =>
      apiRequest('/api/v1/reports', { method: 'POST', body: input, idempotent: true }),
  });
}
