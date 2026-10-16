import { Platform, StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_MEDIA_RATIO } from '@/lib/media-ratio';
import { useTokens } from '@/theme/theme-provider';

/** Placeholder matching `PostCard` (chrome, media ratio, actions and meta). */
export function PostCardSkeleton() {
  const tokens = useTokens();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.color.bg.surface,
          borderColor: tokens.color.border.default,
          shadowColor: tokens.color.text.primary,
        },
      ]}>
      <View style={styles.header}>
        <Skeleton width={42} height={42} circle />
        <View style={styles.headerText}>
          <Skeleton width={120} height={14} radius={6} />
          <Skeleton width={64} height={11} radius={6} />
        </View>
        <Skeleton width={22} height={22} circle />
      </View>

      <Skeleton radius={0} style={styles.media} />

      <View style={styles.actions}>
        <Skeleton width={24} height={24} radius={6} />
        <Skeleton width={24} height={24} radius={6} />
        <Skeleton width={24} height={24} radius={6} />
        <View style={styles.spacer} />
        <Skeleton width={24} height={24} radius={6} />
      </View>

      <View style={styles.meta}>
        <Skeleton width={92} height={13} radius={6} />
        <Skeleton width="88%" height={12} radius={6} />
        <Skeleton width="62%" height={12} radius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 6px 20px rgba(0,0,0,0.06)' } as object,
      ios: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerText: { flex: 1, gap: 5 },
  media: { width: '100%', aspectRatio: DEFAULT_MEDIA_RATIO },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  spacer: { flex: 1 },
  meta: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
});
