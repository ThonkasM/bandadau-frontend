import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { cachedSource } from '@/lib/image-cache';
import { useTokens } from '@/theme/theme-provider';

/** Round avatar: the user's photo when there is one, otherwise their initial. */
export function Avatar({
  name,
  url,
  size = 40,
  ringColor,
  ringWidth = 2,
}: {
  name: string;
  url?: string | null;
  size?: number;
  ringColor?: string;
  ringWidth?: number;
}) {
  const tokens = useTokens();
  const radius = size / 2;
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tokens.color.bg.muted,
          borderColor: ringColor ?? tokens.color.brand.accent,
          borderWidth: ringWidth,
        },
      ]}>
      {url ? (
        <Image
          source={cachedSource(url)}
          cachePolicy="memory-disk"
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.initial, { color: tokens.color.text.primary, fontSize: size * 0.4 }]}>
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontWeight: '800' },
});
