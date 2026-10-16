import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { MediaPicker } from '@/features/create/components/media-picker';
import { MAX_TEXT_LENGTH, type MediaItem, type Visibility } from '@/features/create/types';
import { useTokens } from '@/theme/theme-provider';

const HASHTAG = /#[\p{L}\d_]{2,50}/gu;

/** UC-05 · Compose post (media → visibility → text; publish is wired in integration). */
export default function CreateScreen() {
  const tokens = useTokens();
  const { t } = useTranslation('create');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [text, setText] = useState('');

  const counter = `${text.length}/${MAX_TEXT_LENGTH}`;
  const hashtags = text.match(HASHTAG) ?? [];
  const canPublish = text.trim().length > 0 || media.length > 0;

  return (
    <Screen title={t('title')}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <MediaPicker items={media} onChange={setMedia} />

          <View style={styles.block}>
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
          </View>

          <View style={styles.block}>
            <TextField
              value={text}
              onChangeText={setText}
              placeholder={t('placeholder')}
              multiline
              maxLength={MAX_TEXT_LENGTH}
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
          </View>

          <Button label={t('publish')} icon="send" disabled={!canPublish} onPress={() => undefined} />
          <Text variant="caption" style={{ color: tokens.color.text.muted }}>
            {t('mockNote')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 20, paddingBottom: 24 },
  block: { gap: 8 },
  composer: { minHeight: 120, textAlignVertical: 'top' },
  counter: { textAlign: 'right' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
