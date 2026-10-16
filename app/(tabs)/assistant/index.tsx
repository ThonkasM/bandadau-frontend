import type { Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { createLocalLlm, type LlmStatus, type LocalModelInfo } from '@/ai/local-llm';
import { checkDownload } from '@/ai/model-manager';
import { formatBytes } from '@/ai/model-store';
import { createStudyAssistant, MAX_INPUT_CHARS } from '@/ai/study-assistant';
import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { FlashcardView } from '@/features/assistant/components/flashcard-view';
import { TextEditorSheet } from '@/features/assistant/components/text-editor-sheet';
import { useTokens } from '@/theme/theme-provider';

const llm = createLocalLlm();
const assistant = createStudyAssistant(llm);

/** UC-17 · Offline study assistant (on-device; summary + flashcards). No network, ever. */
export default function AssistantScreen() {
  const tokens = useTokens();
  const { t, i18n } = useTranslation('assistant');
  const locale = i18n.language as Locale;
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [cards, setCards] = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy] = useState<'summary' | 'cards' | null>(null);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<LlmStatus>(llm.status());
  const [recommended, setRecommended] = useState<LocalModelInfo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const off = llm.onStatus(setStatus);
    void llm.capabilities().then((caps) => {
      setRecommended(caps.recommended);
      // Restore the `ready` state if the model is already cached (never downloads on its own).
      if (caps.recommended) void llm.load(caps.recommended.id).catch(() => undefined);
    });
    return off;
  }, []);

  const onDownload = async (allowCellular = false) => {
    if (!recommended) return;
    setNotice(null);
    const gate = await checkDownload(recommended, allowCellular);
    if (!gate.ok) {
      setNotice(
        gate.reason === 'no-space'
          ? t('model.noSpace', { missing: formatBytes(gate.missingBytes) })
          : t('model.cellular'),
      );
      return;
    }
    try {
      await llm.download(recommended.id, { allowCellular });
    } catch {
      setNotice(t('model.downloadError'));
    }
  };

  const onRemove = async () => {
    setNotice(null);
    await llm.remove(recommended?.id ?? 'llama-3.2-1b-q').catch(() => undefined);
  };

  const onSummarize = async () => {
    setBusy('summary');
    setSummary('');
    setCards([]);
    setFailed(false);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await assistant.summarize(
        text,
        locale,
        (token) => setSummary((prev) => prev + token),
        controller.signal,
      );
      setSummary(result);
    } catch {
      setNotice(t('model.downloadError'));
    } finally {
      setBusy(null);
      abortRef.current = null;
    }
  };

  const onStop = () => {
    abortRef.current?.abort();
    setBusy(null);
  };

  const onFlashcards = async () => {
    // Flashcards need the on-device model; the extractive mode cannot produce them.
    if (status.kind !== 'ready') {
      setNotice(t('model.notDownloaded'));
      return;
    }
    setBusy('cards');
    setCards([]);
    setSummary('');
    setFailed(false);
    try {
      const deck = await assistant.generateFlashcards(text, locale);
      if (deck) setCards(deck.cards);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const modelCard = (() => {
    if (status.kind === 'downloading') {
      return (
        <Text variant="caption" style={{ color: tokens.color.text.muted }}>
          {t('model.downloading', { percent: Math.round(status.progress * 100) })}
        </Text>
      );
    }
    if (status.kind === 'ready') {
      return (
        <View style={styles.row}>
          <Text variant="caption" style={{ color: tokens.color.feedback.success.fg }}>
            {t('model.ready', { name: recommended?.displayName ?? '' })}
          </Text>
          <Button label={t('model.remove')} variant="secondary" onPress={onRemove} />
        </View>
      );
    }
    if (recommended && (status.kind === 'not-downloaded' || status.kind === 'error')) {
      return (
        <>
          <Text variant="caption" style={{ color: tokens.color.text.muted }}>
            {t('model.notDownloaded')}
          </Text>
          <Button
            label={t('model.download', { size: formatBytes(recommended.sizeBytes) })}
            icon="download-outline"
            onPress={() => onDownload()}
          />
        </>
      );
    }
    return (
      <Text variant="caption" style={{ color: tokens.color.text.muted }}>
        {t('basicMode')}
      </Text>
    );
  })();

  return (
    <Screen title={t('title')} subtitle={t('subtitle')}>
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.color.bg.surface,
              borderColor: tokens.color.border.default,
            },
          ]}
        >
          <View style={styles.cardTitle}>
            <MaterialCommunityIcons name="chip" size={16} color={tokens.color.text.secondary} />
            <Text variant="label">{t('model.title')}</Text>
          </View>
          {modelCard}
          {notice ? (
            <Text variant="caption" color={tokens.color.feedback.danger.fg}>
              {notice}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => setEditorVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('editor.title')}
          style={[
            styles.composer,
            {
              backgroundColor: tokens.color.bg.muted,
              borderColor: tokens.color.border.default,
            },
          ]}
        >
          <Text
            numberOfLines={3}
            style={[
              styles.preview,
              { color: text ? tokens.color.text.primary : tokens.color.text.muted },
            ]}
          >
            {text || t('placeholder')}
          </Text>
          <View style={styles.composerFooter}>
            <Text variant="caption" style={{ color: tokens.color.text.muted }}>
              {t('counter', { used: text.length, max: MAX_INPUT_CHARS })}
            </Text>
            <Text variant="caption" style={{ color: tokens.color.text.link }}>
              {t('seeMore')}
            </Text>
          </View>
        </Pressable>

        {busy === 'summary' ? (
          <Button label={t('stop')} icon="stop" onPress={onStop} />
        ) : (
          <View style={styles.row}>
            <Button
              label={t('summarize')}
              icon="text-box-outline"
              onPress={onSummarize}
              disabled={!text.trim()}
            />
            {assistant.canGenerateFlashcards ? (
              <Button
                label={t('flashcards')}
                icon="cards-outline"
                onPress={onFlashcards}
                disabled={!text.trim()}
                loading={busy === 'cards'}
              />
            ) : null}
          </View>
        )}

        {summary ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: tokens.color.bg.surface,
                borderColor: tokens.color.border.default,
              },
            ]}
          >
            <Text variant="label">{t('summaryTitle')}</Text>
            <Text>{summary}</Text>
            <Text variant="caption" style={{ color: tokens.color.text.muted }}>
              {t('disclaimer')}
            </Text>
          </View>
        ) : null}

        {failed ? (
          <Text variant="caption" color={tokens.color.feedback.danger.fg}>
            {t('flashcardsFailed')}
          </Text>
        ) : null}

          {cards.length > 0 ? (
            <View style={styles.cards}>
              {cards.map((card, index) => (
                <FlashcardView
                  key={`${index}-${card.q}`}
                  question={card.q}
                  answer={card.a}
                  flipped={flipped === index}
                  position={`${index + 1}/${cards.length}`}
                  onFlip={() => setFlipped(flipped === index ? null : index)}
                />
              ))}
            </View>
          ) : null}
      </KeyboardAwareScrollView>

      <TextEditorSheet
        visible={editorVisible}
        value={text}
        onChangeText={setText}
        onClose={() => setEditorVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12, paddingBottom: 96 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, gap: 8 },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  composer: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14, gap: 10 },
  preview: { fontSize: 15, lineHeight: 21, minHeight: 42 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  cards: { gap: 10 },
});
