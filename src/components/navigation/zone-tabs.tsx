import { useSidebarLayout } from '@/hooks/use-sidebar-layout';
import { CustomTabs } from './custom-tabs';

/**
 * App tabs. On wide web the global sidebar navigates and the floating bar is
 * hidden; on native and narrow web the floating capsule is shown.
 */
export function ZoneTabs() {
  const { hasSidebar } = useSidebarLayout();
  return <CustomTabs showBar={!hasSidebar} />;
}
