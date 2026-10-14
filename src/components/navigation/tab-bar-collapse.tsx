import { createContext, type ReactNode,useCallback, useContext, useMemo, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { type SharedValue,useSharedValue } from 'react-native-reanimated';

/** Minimum scroll delta (px) to consider a direction change. */
const SCROLL_DELTA = 8;

const TabBarCollapseContext = createContext<SharedValue<number> | null>(null);

/**
 * Shared tab-bar state: `0` = expanded, `1` = collapsed. Mounted around the
 * tabs navigator (`CustomTabs`) so the floating bar and any list can connect
 * without props.
 */
export function TabBarCollapseProvider({ children }: { children: ReactNode }) {
  const collapsed = useSharedValue(0);
  return (
    <TabBarCollapseContext.Provider value={collapsed}>{children}</TabBarCollapseContext.Provider>
  );
}

/** Collapse shared value. Outside the provider (screen used without the bar) returns a local no-op. */
export function useTabBarCollapse(): SharedValue<number> {
  const ctx = useContext(TabBarCollapseContext);
  const fallback = useSharedValue(0);
  return ctx ?? fallback;
}

/**
 * Scroll handler (JS thread) that collapses the bar on scroll down and restores
 * it on scroll up / reaching the top. Works with `FlatList`/`FlashList`/`ScrollView`
 * via `onScroll` (use with `scrollEventThrottle={16}`).
 */
export function useTabBarOnScroll(
  extra?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
  threshold = SCROLL_DELTA,
) {
  const collapsed = useTabBarCollapse();
  const lastY = useRef(0);

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      extra?.(event);
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const y = contentOffset.y;
      const maxY = contentSize.height - layoutMeasurement.height;

      if (y <= 0 || maxY <= 0) {
        collapsed.value = 0;
        lastY.current = 0;
        return;
      }
      if (y > maxY) return;

      const dy = y - lastY.current;
      if (Math.abs(dy) < threshold) return;
      collapsed.value = dy > 0 ? 1 : 0;
      lastY.current = y;
    },
    [collapsed, extra, threshold],
  );
}

/** Restores the bar (e.g. on filter/section change). */
export function useExpandTabBar() {
  const collapsed = useTabBarCollapse();
  return useMemo(() => () => {
    collapsed.value = 0;
  }, [collapsed]);
}
