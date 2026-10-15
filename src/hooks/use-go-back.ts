import { type Href,useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Back handler that never throws when there is no history (e.g. a screen opened
 * directly via deep link / fresh tab): falls back to `fallback`.
 */
export function useGoBack(fallback: Href = '/(tabs)/feed') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
}
