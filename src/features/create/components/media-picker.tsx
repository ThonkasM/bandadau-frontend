import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { MediaPreviewFrame, MediaThumbnail } from '@/features/create/components/media-preview';
import { MAX_IMAGES, type MediaItem } from '@/features/create/types';
import { useMediaSelection } from '@/features/create/use-media-selection';
import { useTokens } from '@/theme/theme-provider';

export interface MediaPickerProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

/** Composer media section: dropzone, selected media grid and limit feedback. */
export function MediaPicker({ items, onChange }: MediaPickerProps) {
  const tokens = useTokens();
  const { t } = useTranslation('create');
  const { error, pickImages, pickVideo, remove } = useMediaSelection({ items, onChange });

  const imageCount = items.filter((item) => item.kind === 'image').length;
  const hasVideo = items.some((item) => item.kind === 'video');
  const canAddImage = !hasVideo && imageCount < MAX_IMAGES;
  const singleImage = items.length === 1 && items[0]?.kind === 'image' ? items[0] : null;

  return (
    <View style={styles.section}>
      <Text variant="label">{t('media.title')}</Text>

      {items.length === 0 ? (
        <View style={styles.row}>
          <MediaButton icon="image-multiple-outline" label={t('addImage')} onPress={pickImages} />
          <MediaButton icon="video-outline" label={t('addVideo')} onPress={pickVideo} />
        </View>
      ) : (
        <>
          {singleImage ? (
            <View style={styles.featured}>
              <MediaPreviewFrame
                uri={singleImage.uri}
                width={singleImage.width}
                height={singleImage.height}
              />
              <Pressable onPress={() => remove(singleImage.id)} accessibilityRole="button">
                <Text variant="link">{t('remove')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {items.map((item) => (
                <MediaThumbnail
                  key={item.id}
                  item={item}
                  wide={items.length === 1}
                  onRemove={() => remove(item.id)}
                />
              ))}
            </View>
          )}

          {canAddImage ? (
            <MediaButton compact icon="image-plus" label={t('addImage')} onPress={pickImages} />
          ) : null}
        </>
      )}

      <Text variant="caption" style={{ color: tokens.color.text.muted }}>
        {t('media.hint')}
      </Text>
      {error ? (
        <Text variant="caption" color={tokens.color.feedback.danger.fg}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function MediaButton({
  icon,
  label,
  onPress,
  compact = false,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const tokens = useTokens();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.media,
        compact ? styles.mediaCompact : null,
        { borderColor: tokens.color.border.default, backgroundColor: tokens.color.bg.surface },
      ]}>
      <MaterialCommunityIcons
        name={icon}
        size={compact ? 18 : 24}
        color={tokens.color.text.secondary}
      />
      <Text style={{ color: tokens.color.text.secondary }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  row: { flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featured: { gap: 6 },
  media: {
    flex: 1,
    minHeight: 72,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mediaCompact: { minHeight: 44, paddingVertical: 8 },
});
