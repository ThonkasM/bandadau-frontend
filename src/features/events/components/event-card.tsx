import { formatCredits, formatDate, type Locale } from '@bandada/i18n';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Event } from '@/features/events/types';
import { useTokens } from '@/theme/theme-provider';

export function EventCard({ event, onPress }: { event: Event; onPress?: () => void }) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation(['events', 'app']);
  const locale = i18n.language as Locale;
  const price =
    event.priceCredits === 0 ? t('app:free') : formatCredits(event.priceCredits, locale);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <View style={[styles.cover, { backgroundColor: tokens.color.bg.muted }]} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: tokens.color.text.primary }]}>{event.title}</Text>
        <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
          {formatDate(event.startsAt, locale, 'long')}
        </Text>
        <Text style={[styles.meta, { color: tokens.color.text.muted }]}>{event.venue}</Text>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: tokens.color.text.primary }]}>{price}</Text>
          <Text style={[styles.meta, { color: tokens.color.text.muted }]}>
            {t('events:seats', { count: event.seatsAvailable })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  cover: { height: 120 },
  body: { padding: 14, gap: 3 },
  title: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { fontSize: 14, fontWeight: '700' },
});
