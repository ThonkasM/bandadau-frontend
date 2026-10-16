import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { FeedItem, FeedPage } from '@/features/feed/types';
import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type {
  CreateGroupRequest,
  Group,
  GroupMembership,
  GroupMembershipPage,
  GroupPage,
} from './types';

/** UC-09: study groups. */
export function useGroups() {
  return useInfiniteList<Group>({
    queryKey: queryKeys.groups.list(),
    fetchPage: (cursor, signal) =>
      apiRequest<GroupPage>('/api/v1/groups', { query: { cursor, limit: 20 }, signal }),
    getId: (item) => item.id,
  });
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.byId(id ?? ''),
    queryFn: () => apiRequest<Group>(`/api/v1/groups/${id}`),
    enabled: Boolean(id),
  });
}

/** UC-09: create a study group. */
export function useCreateGroup() {
  const client = useQueryClient();
  return useMutation<Group, Error, CreateGroupRequest>({
    mutationFn: (input) => apiRequest<Group>('/api/v1/groups', { method: 'POST', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.groups.root() }),
  });
}

export function useJoinGroup() {
  const client = useQueryClient();
  return useMutation<Group, Error, string>({
    mutationFn: (groupId) => apiRequest<Group>(`/api/v1/groups/${groupId}/join`, { method: 'POST' }),
    onSuccess: (_group, groupId) =>
      client.invalidateQueries({ queryKey: queryKeys.groups.byId(groupId) }),
  });
}

export function useLeaveGroup() {
  const client = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (groupId) => apiRequest<void>(`/api/v1/groups/${groupId}/leave`, { method: 'POST' }),
    onSuccess: (_void, groupId) =>
      client.invalidateQueries({ queryKey: queryKeys.groups.byId(groupId) }),
  });
}

/** UC-09: members of a group (with their membership status). */
export function useGroupMembers(groupId: string | undefined) {
  return useInfiniteList<GroupMembership>({
    queryKey: [...queryKeys.groups.byId(groupId ?? ''), 'members'],
    fetchPage: (cursor, signal) =>
      apiRequest<GroupMembershipPage>(`/api/v1/groups/${groupId}/members`, {
        query: { cursor, limit: 20 },
        signal,
      }),
    getId: (item) => item.userId,
    enabled: Boolean(groupId),
  });
}

/** UC-09: approve or reject a pending membership (OWNER/ADMIN). */
export function useReviewGroupMember(groupId: string) {
  const client = useQueryClient();
  return useMutation<void, Error, { userId: string; decision: 'approve' | 'reject' }>({
    mutationFn: ({ userId, decision }) =>
      apiRequest<void>(`/api/v1/groups/${groupId}/members/${userId}/${decision}`, {
        method: 'POST',
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.groups.byId(groupId) }),
  });
}

/** UC-09: posts published in a group. */
export function useGroupPosts(groupId: string | undefined) {
  return useInfiniteList<FeedItem>({
    queryKey: [...queryKeys.groups.byId(groupId ?? ''), 'posts'],
    fetchPage: (cursor, signal) =>
      apiRequest<FeedPage>(`/api/v1/groups/${groupId}/posts`, { query: { cursor, limit: 12 }, signal }),
    getId: (item) => item.post.id,
    enabled: Boolean(groupId),
  });
}
