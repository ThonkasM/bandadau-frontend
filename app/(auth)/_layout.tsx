import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/stores/session.store';

/** Auth stack: an authenticated user never sees it (redirects to the tabs). */
export default function AuthLayout() {
  const status = useSessionStore((s) => s.status);
  if (status === 'authenticated') return <Redirect href="/(tabs)/feed" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
