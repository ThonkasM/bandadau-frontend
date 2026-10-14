import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useTokens } from '@/theme/theme-provider';

type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'GROUP';

/** UC-05 · Compose post (mockup: not wired yet). */
export default function CreateScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('create');
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');

  return (
    <Screen title={t('title')}>
      <TextField
        value={text}
        onChangeText={setText}
        placeholder={t('placeholder')}
        multiline
        style={styles.composer}
      />

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

      <View style={styles.mediaRow}>
        <MediaButton icon="image-plus" label={t('addImage')} />
        <MediaButton icon="video-plus" label={t('addVideo')} />
      </View>

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
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  const tokens = useTokens();
  return (
    <Pressable
      style={[styles.media, { borderColor: tokens.color.border.default }]}
      accessibilityRole="button">
      <MaterialCommunityIcons name={icon} size={22} color={tokens.color.text.muted} />
      <Text style={{ color: tokens.color.text.muted }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  composer: { minHeight: 140, textAlignVertical: 'top' },
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
