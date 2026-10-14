import { QueryClient } from '@tanstack/react-query';

import { isAbortError } from '@/lib/is-abort-error';

function reportError(error: unknown) {
  if (!isAbortError(error)) {
    // TODO: forward to the error reporter (OTel/Sentry) once wired.
    console.warn('[query]', error);
  }
}

/** Singleton QueryClient (never recreated across renders). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => !isAbortError(error) && failureCount < 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
    },
  },
});

queryClient.getQueryCache().config.onError = reportError;
queryClient.getMutationCache().config.onError = reportError;
