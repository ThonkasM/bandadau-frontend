import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
