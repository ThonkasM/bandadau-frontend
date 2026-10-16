import { FlashList, type FlashListProps } from '@shopify/flash-list';
import { type ReactElement,useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  Platform,
  RefreshControl,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarOnScroll } from '@/components/navigation/tab-bar-collapse';
import { useTokens } from '@/theme/theme-provider';

const IS_WEB = Platform.OS === 'web';
/** Pre-load distance for the web sentinel before reaching the end. */
const WEB_PREFETCH_MARGIN = '600px';

export interface VirtualListProps<T> {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  onEndReached?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  renderFooter?: () => ReactElement | null;
  renderEmpty?: () => ReactElement | null;
  /** Footer shown while the next page loads (defaults to a spinner). Use it for a skeleton card in infinite scroll. */
  renderLoadingMore?: () => ReactElement | null;
  ListHeaderComponent?: ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentBottomPadding?: number;
  style?: StyleProp<ViewStyle>;
  numColumns?: number;
  columnWrapperStyle?: StyleProp<ViewStyle>;
  /** Imperative ref (e.g. to `scrollToIndex` to a specific item). */
  listRef?: React.Ref<FlatList<T>>;
  onScrollToIndexFailed?: (info: { index: number; averageItemLength: number }) => void;
  /** Fires when the list content size changes (e.g. images finish loading). */
  onContentSizeChange?: () => void;
}

/**
 * Shared virtual list (adapted from Homy).
 *
 * - **FlashList** on native (cell recycling; the critical case on low-end
 *   devices) and **FlatList** on web.
 * - Web uses an **IntersectionObserver sentinel** in the footer instead of
 *   `onEndReached`, which fires in cascade on react-native-web when the content
 *   does not fill the viewport.
 * - Encapsulates paddings (floating tabs + safe area), the "load more" spinner
 *   and the empty state; native perf props are tuned for long feeds.
 */
export function VirtualList<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  hasMore = false,
  loadingMore = false,
  refreshing = false,
  onRefresh,
  renderFooter,
  renderEmpty,
  renderLoadingMore,
  ListHeaderComponent,
  contentContainerStyle,
  contentBottomPadding = 96,
  style,
  numColumns,
  columnWrapperStyle,
  listRef,
  onScrollToIndexFailed,
  onContentSizeChange,
}: VirtualListProps<T>) {
  const insets = useSafeAreaInsets();
  const tokens = useTokens();
  const collapseOnScroll = useTabBarOnScroll();
  const sentinelRef = useRef<View | null>(null);

  const useSentinel = IS_WEB && typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    if (!useSentinel || !hasMore || loadingMore) return;
    const node = sentinelRef.current as unknown as Element | null;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onEndReached?.();
      },
      { rootMargin: WEB_PREFETCH_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [useSentinel, hasMore, loadingMore, data.length, onEndReached]);

  const footer = (
    <>
      {loadingMore
        ? (renderLoadingMore?.() ?? (
            <ActivityIndicator color={tokens.color.action.primary.bg} style={styles.footer} />
          ))
        : null}
      {renderFooter?.()}
      {useSentinel && hasMore ? <View ref={sentinelRef} style={styles.sentinel} /> : null}
    </>
  );

  const common = {
    data: data as T[],
    renderItem,
    keyExtractor,
    contentContainerStyle: [
      {
        flexGrow: data.length === 0 ? 1 : 0,
        paddingBottom: insets.bottom + contentBottomPadding,
      },
      contentContainerStyle,
    ],
    showsVerticalScrollIndicator: false,
    scrollEventThrottle: 16,
    onScroll: collapseOnScroll,
    onScrollToIndexFailed,
    onContentSizeChange,
    ...(numColumns && numColumns > 1
      ? { numColumns, columnWrapperStyle: columnWrapperStyle ?? { gap: 12 } }
      : {}),
    onEndReached: useSentinel ? undefined : onEndReached,
    onEndReachedThreshold: useSentinel ? undefined : 0.3,
    ListFooterComponent: footer,
    ListEmptyComponent: renderEmpty?.() ?? null,
    ListHeaderComponent: ListHeaderComponent ?? null,
    refreshControl: onRefresh ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={tokens.color.action.primary.bg}
      />
    ) : undefined,
  };

  if (IS_WEB) {
    return <FlatList ref={listRef} {...common} style={[style, styles.listContainer]} />;
  }

  return (
    <FlashList
      ref={listRef as never}
      {...(common as unknown as FlashListProps<T>)}
      style={[style, styles.listContainer] as unknown as FlashListProps<T>['style']}
    />
  );
}

const styles = StyleSheet.create({
  footer: { marginVertical: 16 },
  sentinel: { height: 1, width: '100%' },
  // `minHeight: 0` lets the list shrink inside flex parents on web so it scrolls
  // internally instead of pushing the page height (react-native-web min-content).
  listContainer: { minHeight: 0 },
});
