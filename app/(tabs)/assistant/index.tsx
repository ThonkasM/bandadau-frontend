import type { Locale } from '@bandada/i18n';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { createLocalLlm } from '@/ai/local-llm';
import { createStudyAssistant,MAX_INPUT_CHARS } from '@/ai/study-assistant';
import { Screen } from '@/components/screens/screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useTokens } from '@/theme/theme-provider';

const assistant = createStudyAssistant(createLocalLlm());

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
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
    setBusy('cards');
    setCards([]);
    setSummary('');
    setFailed(false);
    try {
      const deck = await assistant.generateFlashcards(text, locale);
      if (deck) setCards(deck.cards);
      else setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen title={t('title')} subtitle={t('subtitle')}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TextField
            value={text}
            onChangeText={setText}
            placeholder={t('placeholder')}
            multiline
            maxLength={MAX_INPUT_CHARS}
            style={styles.composer}
          />
          <Text variant="caption" style={{ color: tokens.color.text.muted }}>
            {t('counter', { used: text.length, max: MAX_INPUT_CHARS })}
          </Text>

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

          {!assistant.canGenerateFlashcards ? (
            <Text variant="caption" style={{ color: tokens.color.text.muted }}>
              {t('basicMode')}
            </Text>
          ) : null}

          {summary ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: tokens.color.bg.surface,
                  borderColor: tokens.color.border.default,
                },
              ]}>
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
                <Pressable
                  key={`${index}-${card.q}`}
                  onPress={() => setFlipped(flipped === index ? null : index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('flip')}
                  style={[styles.flashcard, { backgroundColor: tokens.color.bg.muted }]}>
                  <Text variant="body">{flipped === index ? card.a : card.q}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12, paddingBottom: 96 },
  composer: { minHeight: 140, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, gap: 8 },
  cards: { gap: 10 },
  flashcard: { borderRadius: 14, padding: 16, minHeight: 88, justifyContent: 'center' },
});
