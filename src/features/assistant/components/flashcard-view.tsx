import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { shadowStyle } from '@/lib/shadow';
import { useTokens } from '@/theme/theme-provider';

export interface FlashcardViewProps {
  question: string;
  answer: string;
  flipped: boolean;
  /** Position label, e.g. `1/8`. */
  position?: string;
  onFlip: () => void;
}

/**
 * UC-17 flashcard with the Bandada identity: a tall card, blue front / light back, yellow accent
 * (brand tokens). Tap to flip between question and answer.
 */
export function FlashcardView({ question, answer, flipped, position, onFlip }: FlashcardViewProps) {
  const tokens = useTokens();
  const { t } = useTranslation('assistant');
  const front = !flipped;
  const background = front ? tokens.color.brand.primary : tokens.color.bg.surface;
  const foreground = front ? tokens.color.text.inverse : tokens.color.brand.primary;

  return (
    <Pressable
      onPress={onFlip}
      accessibilityRole="button"
      accessibilityLabel={t('flip')}
      style={[
        styles.card,
        {
          backgroundColor: background,
          borderColor: front ? tokens.color.brand.primary : tokens.color.border.default,
          borderTopColor: tokens.color.brand.accent,
        },
        shadowStyle(tokens.shadow.md),
      ]}>
      <View style={styles.head}>
        <MaterialCommunityIcons
          name={front ? 'help-circle-outline' : 'lightbulb-on-outline'}
          size={16}
          color={tokens.color.brand.accent}
        />
        <Text variant="label" style={{ color: tokens.color.brand.accent }}>
          {front ? t('card.question') : t('card.answer')}
        </Text>
        {position ? (
          <Text variant="caption" style={[styles.position, { color: foreground }]}>
            {position}
          </Text>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={[styles.content, { color: foreground }]}>{front ? question : answer}</Text>
      </View>

      <View style={styles.foot}>
        <MaterialCommunityIcons
          name="rotate-3d-variant"
          size={16}
          color={tokens.color.brand.accent}
        />
        <Text variant="caption" style={{ color: tokens.color.brand.accent }}>
          {t('flip')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 6,
    padding: 20,
    minHeight: 220,
    gap: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  position: { marginLeft: 'auto' },
  body: { flex: 1, justifyContent: 'center' },
  content: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
});
