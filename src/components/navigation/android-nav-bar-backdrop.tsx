import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTokens } from '@/theme/theme-provider';

/**
 * Paints the Android bottom inset (3-button nav bar) with the neutral canvas
 * color under edge-to-edge. No-op on iOS/web; never captures touches.
 */
export function AndroidNavBarBackdrop() {
  const insets = useSafeAreaInsets();
  const tokens = useTokens();

  if (Platform.OS !== 'android' || insets.bottom <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.backdrop, { height: insets.bottom, backgroundColor: tokens.color.bg.canvas }]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
