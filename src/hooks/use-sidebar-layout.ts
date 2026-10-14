import { useMemo } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { SIDEBAR_BREAKPOINT, SIDEBAR_WIDTH } from '@/constants/layout';

export interface SidebarLayout {
  hasSidebar: boolean;
  sidebarWidth: number;
  contentPaddingLeft: number;
  isMobile: boolean;
  screenWidth: number;
}

/** Decides whether the web sidebar is shown and the content offset it requires. */
export function useSidebarLayout(): SidebarLayout {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const hasSidebar = Platform.OS === 'web' && width > SIDEBAR_BREAKPOINT;
    return {
      hasSidebar,
      sidebarWidth: SIDEBAR_WIDTH,
      contentPaddingLeft: hasSidebar ? SIDEBAR_WIDTH : 0,
      isMobile: width <= SIDEBAR_BREAKPOINT,
      screenWidth: width,
    };
  }, [width]);
}
