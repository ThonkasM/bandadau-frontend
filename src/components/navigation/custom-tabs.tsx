import { type Href,usePathname } from 'expo-router';
import { TabList, Tabs,TabSlot, TabTrigger } from 'expo-router/ui';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet } from 'react-native';

import {
  TabBarCollapseProvider,
  useTabBarCollapse,
} from '@/components/navigation/tab-bar-collapse';
import { tabRoutes } from '@/config/navigation';

import { FloatingTabBar, FloatingTabButton } from './floating-tab-bar';

interface CustomTabsProps {
  /** false = no bar (wide web, where the sidebar navigates). */
  showBar?: boolean;
}

/**
 * Custom headless tabs (`expo-router/ui`) with a floating capsule for
 * native + narrow web. The hidden `TabList` defines the routes; the visible
 * buttons use `useTabTrigger` for focus + navigation. The bar shrinks on scroll.
 */
export function CustomTabs({ showBar = true }: CustomTabsProps) {
  return (
    <TabBarCollapseProvider>
      <CustomTabsNavigator showBar={showBar} />
    </TabBarCollapseProvider>
  );
}

function CustomTabsNavigator({ showBar }: { showBar: boolean }) {
  const { t } = useTranslation('nav');
  const pathname = usePathname();
  const routes = useMemo(() => tabRoutes(), []);
  const collapsed = useTabBarCollapse();

  const tabsOptions = useMemo(
    () => ({ backBehavior: Platform.OS === 'web' ? ('history' as const) : undefined }),
    [],
  );

  // Each screen starts with the bar expanded.
  useEffect(() => {
    collapsed.value = 0;
  }, [pathname, collapsed]);

  return (
    <Tabs options={tabsOptions}>
      <TabSlot style={styles.tabSlot} />
      {showBar && (
        <FloatingTabBar>
          {routes.map((route) => (
            <FloatingTabButton
              key={route.name}
              name={route.name}
              icon={route.icon}
              iconActive={route.iconActive}
              label={t(route.labelKey)}
            />
          ))}
        </FloatingTabBar>
      )}
      <TabList style={styles.hiddenList}>
        {routes.map((route) => (
          <TabTrigger key={route.name} name={route.name} href={route.href as Href} />
        ))}
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabSlot: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0 },
  hiddenList: { display: 'none' },
});
