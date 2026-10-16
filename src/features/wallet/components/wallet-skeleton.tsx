import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { useTokens } from '@/theme/theme-provider';

/** Balance placeholder sized like the 30px amount figure. */
export function BalanceSkeleton() {
  return <Skeleton width={132} height={38} radius={8} />;
}

function MovementRowSkeleton() {
  const tokens = useTokens();
  return (
    <View style={[styles.row, { borderBottomColor: tokens.color.border.default }]}>
      <View style={styles.left}>
        <Skeleton width="62%" height={16} radius={6} />
        <Skeleton width="36%" height={12} radius={6} />
      </View>
      <Skeleton width={54} height={16} radius={6} />
    </View>
  );
}

/** Movement rows placeholder shown while the ledger's first page loads. */
export function MovementsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, index) => (
        <MovementRowSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginTop: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1, gap: 3, paddingRight: 12 },
});
