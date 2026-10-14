import { usePathname, type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet } from 'react-native';

import { tabRoutes } from '@/config/navigation';
import { FloatingTabBar, FloatingTabButton } from './floating-tab-bar';

interface CustomTabsProps {
  /** false = no bar (wide web, where the sidebar navigates). */
  showBar?: boolean;
}

/**
 * Custom headless tabs (`expo-router/ui`) with a floating capsule for
 * native + narrow web. The hidden `TabList` defines the routes; the visible
 * buttons use `useTabTrigger` for focus + navigation.
 */
export function CustomTabs({ showBar = true }: CustomTabsProps) {
  const { t } = useTranslation('nav');
  const pathname = usePathname();
  const routes = useMemo(() => tabRoutes(), []);

  const tabsOptions = useMemo(
    () => ({ backBehavior: Platform.OS === 'web' ? ('history' as const) : undefined }),
    [],
  );

  // Touch the pathname so active states re-render on navigation (the buttons
  // read `triggerProps.isFocused`, but the navigator must re-evaluate).
  void pathname;

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
