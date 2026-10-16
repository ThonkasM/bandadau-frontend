import type { Locale } from '@bandada/i18n';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import {
  uploadMedia,
  useCompleteUpload,
  useCreateUpload,
  usePublishPost,
} from '@/features/create/api';
import { MediaPicker } from '@/features/create/components/media-picker';
import { MAX_TEXT_LENGTH, type MediaItem, type Visibility } from '@/features/create/types';
import { ApiError } from '@/lib/api-error';
import { newClientId } from '@/lib/ids';
import { useTokens } from '@/theme/theme-provider';

const HASHTAG = /#[\p{L}\d_]{2,50}/gu;

/** UC-05 · Compose post: media → visibility → text, then publish (upload + create). */
export default function CreateScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('create');
  const locale = i18n.language as Locale;
  const router = useRouter();
  const createUpload = useCreateUpload();
  const completeUpload = useCompleteUpload();
  const publish = usePublishPost();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [text, setText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counter = `${text.length}/${MAX_TEXT_LENGTH}`;
  const hashtags = text.match(HASHTAG) ?? [];
  const canPublish = (text.trim().length > 0 || media.length > 0) && !publishing;

  const sizeOf = async (item: MediaItem): Promise<number> => {
    if (item.fileSize) return item.fileSize;
    const blob = await (await fetch(item.uri)).blob();
    return blob.size;
  };

  const onPublish = async () => {
    if (!canPublish) return;
    if (visibility === 'GROUP') {
      setError(t('groupRequired'));
      return;
    }
    setError(null);
    setPublishing(true);
    try {
      const mediaIds: string[] = [];
      for (const item of media) {
        const kind = item.kind === 'video' ? 'VIDEO' : 'IMAGE';
        const mimeType = item.mimeType ?? (kind === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
        const id = await uploadMedia(
          {
            kind,
            mimeType,
            sizeBytes: await sizeOf(item),
            durationSeconds: item.durationMs ? item.durationMs / 1000 : undefined,
          },
          item.uri,
          { createUpload: createUpload.mutateAsync, completeUpload: completeUpload.mutateAsync },
        );
        mediaIds.push(id);
      }
      await publish.mutateAsync({
        clientId: newClientId(),
        text: text.trim(),
        mediaIds,
        visibility,
      });
      setText('');
      setMedia([]);
      router.push('/(tabs)/feed');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.localizedMessage(locale) : t('publishError'));
    } finally {
      setPublishing(false);
    }
  };

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

          {error ? (
            <Text variant="caption" color={tokens.color.feedback.danger.fg}>
              {error}
            </Text>
          ) : null}

          <Button
            label={t('publish')}
            icon="send"
            disabled={!canPublish}
            loading={publishing}
            onPress={onPublish}
          />
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
