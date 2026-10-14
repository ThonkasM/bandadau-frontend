import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { targetRatio } from '@/lib/media-ratio';
import { useTokens } from '@/theme/theme-provider';

/**
 * Instagram-style crop guide: shows exactly how the picked photo will render in
 * the feed (framed at the final aspect ratio) so nothing is cut off later.
 */
export function MediaPreviewFrame({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  const tokens = useTokens();
  const { t } = useTranslation('create');
  const { ratio, orientation } = targetRatio(width, height);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.frame,
          { aspectRatio: ratio, borderColor: tokens.color.border.default, backgroundColor: tokens.color.bg.muted },
        ]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        <View
          pointerEvents="none"
          style={[styles.guide, { borderColor: tokens.color.bg.surface }]}
        />
        <View style={[styles.badge, { backgroundColor: tokens.color.bg.surface }]}>
          <Text variant="caption">{t(`orientation.${orientation}`)}</Text>
        </View>
      </View>
      <Text variant="caption">{t('preview')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  frame: { width: '100%', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  guide: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    opacity: 0.92,
  },
});
