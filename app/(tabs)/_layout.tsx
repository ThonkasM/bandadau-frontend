import { Redirect } from 'expo-router';

import { ZoneTabs } from '@/components/navigation/zone-tabs';
import { useSessionStore } from '@/stores/session.store';

/** Tabs: anonymous users are sent back to welcome. */
export default function TabsLayout() {
  const status = useSessionStore((s) => s.status);
  if (status === 'anonymous') return <Redirect href="/(auth)/welcome" />;
  return <ZoneTabs />;
}
