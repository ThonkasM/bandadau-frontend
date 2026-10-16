import type { Locale } from '@bandada/i18n';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { ProgressModal, type ProgressPhase } from '@/components/ui/progress-modal';
import { Segmented } from '@/components/ui/segmented';
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
import { useMyProfile } from '@/features/profile/api';
import { ApiError } from '@/lib/api-error';
import { randomIdempotencyKey } from '@/lib/idempotency';
import { newClientId, newUuid } from '@/lib/ids';
import { shadowStyle } from '@/lib/shadow';
import { enqueue } from '@/offline/outbox';
import { useTokens } from '@/theme/theme-provider';

/** Floating tab bar (capsule + gap) overlays the content; keep the Publish button above it. */
const TAB_BAR_CLEARANCE = 96;
const HASHTAG = /#[\p{L}\d_]{2,50}/gu;

/** UC-05 · Compose post: media → visibility → text, then publish (upload + create). */
export default function CreateScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('create');
  const locale = i18n.language as Locale;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createUpload = useCreateUpload();
  const completeUpload = useCompleteUpload();
  const publish = usePublishPost();
  const profile = useMyProfile();
  const authorName = profile.data?.displayName ?? '';
  const visibilityOptions = [
    { value: 'PUBLIC', label: t('visibility.PUBLIC'), icon: 'earth' },
    { value: 'FOLLOWERS', label: t('visibility.FOLLOWERS'), icon: 'account-multiple-outline' },
    { value: 'GROUP', label: t('visibility.GROUP'), icon: 'account-group-outline' },
  ] as const;

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [text, setText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuedNotice, setQueuedNotice] = useState(false);
  const [phase, setPhase] = useState<ProgressPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

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
    setQueuedNotice(false);
    setPublishing(true);
    setPhase('processing');
    setProgress(0);
    setStep(0);
    const clientId = newClientId();
    const idempotencyKey = randomIdempotencyKey();
    const trimmed = text.trim();
    let mediaIds: string[] = [];
    try {
      setStep(1);
      for (const [index, item] of media.entries()) {
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
          (ratio) => setProgress(media.length > 0 ? (index + ratio) / media.length : ratio),
        );
        mediaIds.push(id);
      }
      setStep(2);
      await publish.mutateAsync({ clientId, text: trimmed, mediaIds, visibility, idempotencyKey });
      setStep(3);
      setText('');
      setMedia([]);
      setPhase('done');
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.localizedMessage(locale));
        setPhase('failed');
      } else {
        // Offline / network error → queue it (sent when connectivity returns).
        mediaIds = [];
        await enqueue({
          id: newUuid(),
          clientId,
          idempotencyKey,
          kind: 'CREATE_POST',
          payload: { clientId, text: trimmed, mediaIds, visibility },
          attempts: 0,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        }).catch(() => undefined);
        setQueuedNotice(true);
        setPhase(null);
        setText('');
        setMedia([]);
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Screen title={t('title')} showBack>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: tokens.color.bg.surface,
                borderColor: tokens.color.border.default,
              },
              shadowStyle(tokens.shadow.sm),
            ]}>
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: tokens.color.brand.primary }]}>
                <Text style={[styles.avatarInitial, { color: tokens.color.text.inverse }]}>
                  {authorName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text variant="label" color={tokens.color.text.secondary} style={styles.authorLabel}>
                {t('publishingAs', { name: authorName })}
              </Text>
            </View>

            <TextField
              value={text}
              onChangeText={setText}
              placeholder={t('placeholder')}
              multiline
              maxLength={MAX_TEXT_LENGTH}
              style={styles.composer}
            />

            {hashtags.length > 0 ? (
              <View style={styles.tags}>
                {hashtags.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: tokens.color.bg.muted }]}>
                    <Text variant="caption" color={tokens.color.brand.primary}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <MediaPicker items={media} onChange={setMedia} />

            <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />

            <View style={styles.footer}>
              <View style={styles.segmented}>
                <Segmented options={visibilityOptions} value={visibility} onChange={setVisibility} />
              </View>
              <Text
                variant="caption"
                color={
                  text.length > MAX_TEXT_LENGTH * 0.9
                    ? tokens.color.feedback.warning.fg
                    : tokens.color.text.muted
                }>
                {counter}
              </Text>
            </View>
          </View>

          {error ? (
            <Text variant="caption" color={tokens.color.feedback.danger.fg}>
              {error}
            </Text>
          ) : null}

          {queuedNotice ? (
            <Text variant="caption" color={tokens.color.text.muted}>
              {t('queued')}
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

      <ProgressModal
        visible={phase !== null}
        phase={phase ?? 'processing'}
        title={t('progress.title')}
        subtitle={
          media.length > 0
            ? t('progress.uploading', { percent: Math.round(progress * 100) })
            : undefined
        }
        progress={media.length > 0 ? progress : undefined}
        steps={[t('progress.stepPrepare'), t('progress.stepUpload'), t('progress.stepPublish')]}
        step={step}
        done={{
          title: t('progress.doneTitle'),
          subtitle: t('progress.doneSubtitle'),
          primaryLabel: t('progress.viewFeed'),
          onPrimary: () => {
            setPhase(null);
            router.push('/(tabs)/feed');
          },
        }}
        failed={{
          title: t('progress.errorTitle'),
          subtitle: error ?? undefined,
          primaryLabel: t('progress.retry'),
          onPrimary: () => {
            setPhase(null);
            void onPublish();
          },
          secondaryLabel: t('progress.close'),
        }}
        onClose={() => setPhase(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 16 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, gap: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 15, fontWeight: '800' },
  authorLabel: { flex: 1 },
  composer: { minHeight: 120, textAlignVertical: 'top' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  divider: { height: StyleSheet.hairlineWidth },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segmented: { flex: 1 },
});
