import { ScrollView, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { PostCardSkeleton } from './post-card-skeleton';

/** Scrollable list of post placeholders for the initial feed load. */
export function FeedSkeleton({
  count = 3,
  contentContainerStyle,
}: {
  count?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, contentContainerStyle]}>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 12, paddingBottom: 96 },
});
