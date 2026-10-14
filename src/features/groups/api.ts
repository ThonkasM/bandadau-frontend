import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useInfiniteList } from '@/hooks/use-infinite-list';
import { apiRequest } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

import type { Group, GroupPage } from './types';

/** UC-09: study groups. */
export function useGroups() {
  return useInfiniteList<Group>({
    queryKey: queryKeys.groups.list(),
    fetchPage: (cursor) =>
      apiRequest<GroupPage>('/api/v1/groups', { query: { cursor, limit: 20 } }),
    getId: (item) => item.id,
  });
}

export function useJoinGroup() {
  const client = useQueryClient();
  return useMutation<Group, Error, string>({
    mutationFn: (groupId) => apiRequest<Group>(`/api/v1/groups/${groupId}/join`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.groups.root() }),
  });
}
