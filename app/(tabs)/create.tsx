import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { MediaPreviewFrame } from '@/features/create/components/media-preview';
import { useTokens } from '@/theme/theme-provider';

type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'GROUP';
type Photo = { uri: string; width: number; height: number };

const MAX_LENGTH = 2000;

/** UC-05 · Compose post (mockup: media preview + crop guide, publish not wired). */
export default function CreateScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('create');
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const picks = useRef(0);

  const counter = `${text.length}/${MAX_LENGTH}`;
  const hashtags = text.match(/#[\p{L}\d_]+/gu) ?? [];

  // Mock picker: alternates portrait (3:4) and landscape (4:3) to show the guide.
  const pickPhoto = () => {
    const portrait = picks.current % 2 === 0;
    const [width, height] = portrait ? [900, 1200] : [1200, 900];
    setPhoto({
      uri: `https://picsum.photos/seed/bandada-compose-${Date.now()}/${width}/${height}`,
      width,
      height,
    });
    picks.current += 1;
  };

  return (
    <Screen title={t('title')}>
      <TextField
        value={text}
        onChangeText={setText}
        placeholder={t('placeholder')}
        multiline
        style={styles.composer}
      />
      <Text variant="caption" style={[styles.counter, { color: tokens.color.text.muted }]}>
        {counter}
      </Text>

      {hashtags.length > 0 ? (
        <View style={styles.tags}>
          {hashtags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: tokens.color.bg.muted }]}>
              <Text variant="caption" color={tokens.color.text.primary}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text variant="label">{t('visibilityLabel')}</Text>
      <View style={styles.row}>
        {(['PUBLIC', 'FOLLOWERS', 'GROUP'] as Visibility[]).map((option) => (
          <Chip
            key={option}
            label={t(`visibility.${option}`)}
            selected={visibility === option}
            onPress={() => setVisibility(option)}
          />
        ))}
      </View>

      {photo ? (
        <>
          <MediaPreviewFrame uri={photo.uri} width={photo.width} height={photo.height} />
          <Pressable onPress={() => setPhoto(null)}>
            <Text variant="link">{t('remove')}</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.mediaRow}>
          <MediaButton icon="image-plus" label={t('addImage')} onPress={pickPhoto} />
          <MediaButton icon="video-plus" label={t('addVideo')} />
        </View>
      )}

      <Button label={t('publish')} icon="send" onPress={() => undefined} />
      <Text variant="caption" style={{ color: tokens.color.text.muted }}>
        {t('mockNote')}
      </Text>
    </Screen>
  );
}

function MediaButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  const tokens = useTokens();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.media, { borderColor: tokens.color.border.default }]}
      accessibilityRole="button">
      <MaterialCommunityIcons name={icon} size={22} color={tokens.color.text.muted} />
      <Text style={{ color: tokens.color.text.muted }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  composer: { minHeight: 120, textAlignVertical: 'top' },
  counter: { textAlign: 'right' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  media: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
});
