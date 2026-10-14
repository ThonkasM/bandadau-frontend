import { FlashList, type FlashListProps } from '@shopify/flash-list';
import type { ComponentType, ReactElement } from 'react';
import {
  FlatList,
  type ListRenderItem,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface VirtualListProps<T> {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  ListEmptyComponent?: ComponentType<unknown> | ReactElement | null;
  ItemSeparatorComponent?: ComponentType<unknown> | null;
  ListHeaderComponent?: ComponentType<unknown> | ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

/**
 * Virtualized list chooser: **FlashList** on native (RecyclerListView, far
 * better for long feeds and low-end devices) and **FlatList** on web
 * (FlashList's web support is not a first-class target). One API for callers.
 */
export function VirtualList<T>(props: VirtualListProps<T>) {
  if (Platform.OS === 'web') {
    return <FlatList {...props} />;
  }
  return (
    <FlashList
      {...(props as unknown as FlashListProps<T>)}
      // FlashList v2 draws its own platform shadows; keep the platform default.
      showsVerticalScrollIndicator={false}
    />
  );
}
