import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { useTokens } from '@/theme/theme-provider';

const GRID_TILES = 9;

function StatSkeleton() {
  return (
    <View style={styles.stat}>
      <Skeleton width={28} height={20} radius={6} />
      <Skeleton width={52} height={13} radius={6} />
    </View>
  );
}

/** Square placeholders matching the profile posts grid. */
export function ProfileGridSkeleton({ tiles = GRID_TILES }: { tiles?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: tiles }).map((_, index) => (
        <Skeleton key={index} radius={4} style={styles.gridItem} />
      ))}
    </View>
  );
}

/** Full profile placeholder (cover, avatar, name, stats, tabs and grid). */
export function ProfileSkeleton() {
  const tokens = useTokens();
  return (
    <View>
      <Skeleton width="100%" height={140} radius={0} />
      <Skeleton width={40} height={40} circle style={styles.menuButton} />

      <View style={styles.identity}>
        <Skeleton width={88} height={88} circle />
        <Skeleton width={148} height={22} radius={8} style={styles.name} />
        <Skeleton width={96} height={16} radius={6} />
      </View>

      <View style={styles.stats}>
        <StatSkeleton />
        <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
        <StatSkeleton />
        <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
        <StatSkeleton />
      </View>

      <View style={[styles.tabs, { borderBottomColor: tokens.color.border.default }]}>
        <View style={styles.tab}>
          <Skeleton width={40} height={22} radius={6} />
        </View>
        <View style={styles.tab}>
          <Skeleton width={40} height={22} radius={6} />
        </View>
      </View>

      <ProfileGridSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: { position: 'absolute', top: 8, right: 12, zIndex: 10 },
  identity: { alignItems: 'center', marginTop: -44, gap: 4 },
  name: { marginTop: 4 },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, height: 28 },
  tabs: { flexDirection: 'row', marginTop: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, padding: 2 },
  gridItem: { width: '32.6%', aspectRatio: 1, borderRadius: 4 },
});
