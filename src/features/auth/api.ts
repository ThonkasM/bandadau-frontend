import { useMutation, useQuery } from '@tanstack/react-query';

import { applyAuthSession } from '@/auth/session';
import { apiRequest } from '@/lib/api-client';
import type { ApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';

import type {
  AuthTokens,
  AuthUser,
  LoginRequest,
  RegisterUserRequest,
  RegisterUserResponse,
  UniversityPage,
  UpdatePreferencesRequest,
  VerifyEmailRequest,
} from './types';

export function useUniversities() {
  return useQuery({
    queryKey: queryKeys.universities(),
    queryFn: () => apiRequest<UniversityPage>('/api/v1/universities', { auth: false }),
    staleTime: 60 * 60 * 1000,
  });
}

/** UC-01 step 5: register (♻️). The Idempotency-Key is generated per intent. */
export function useRegister() {
  return useMutation<
    RegisterUserResponse,
    ApiError,
    { input: RegisterUserRequest; idempotencyKey: string }
  >({
    mutationFn: ({ input, idempotencyKey }) =>
      apiRequest<RegisterUserResponse>('/api/v1/auth/register', {
        method: 'POST',
        auth: false,
        body: input,
        idempotencyKey,
      }),
  });
}

/** UC-01: verify the 6-digit code → session established. */
export function useVerifyEmail() {
  return useMutation<AuthTokens, ApiError, VerifyEmailRequest>({
    mutationFn: (input) =>
      apiRequest<AuthTokens>('/api/v1/auth/verify-email', {
        method: 'POST',
        auth: false,
        body: input,
      }),
    onSuccess: applyAuthSession,
  });
}

export function useResendCode() {
  return useMutation<void, ApiError, { email: string }>({
    mutationFn: ({ email }) =>
      apiRequest<void>('/api/v1/auth/resend-code', {
        method: 'POST',
        auth: false,
        body: { email },
      }),
  });
}

/** UC-02 login. */
export function useLogin() {
  return useMutation<AuthTokens, ApiError, LoginRequest>({
    mutationFn: (input) =>
      apiRequest<AuthTokens>('/api/v1/auth/login', {
        method: 'POST',
        auth: false,
        body: input,
      }),
    onSuccess: applyAuthSession,
  });
}

export function useUpdatePreferences() {
  return useMutation<AuthUser, ApiError, UpdatePreferencesRequest>({
    mutationFn: (input) =>
      apiRequest<AuthUser>('/api/v1/users/me/preferences', { method: 'PATCH', body: input }),
  });
}
