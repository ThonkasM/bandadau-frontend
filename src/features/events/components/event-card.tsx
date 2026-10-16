import { formatCredits, formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Event } from '@/features/events/types';
import { eventCoverUrl } from '@/lib/event-cover';
import { useTokens } from '@/theme/theme-provider';

export function EventCard({ event, onPress }: { event: Event; onPress?: () => void }) {
  const tokens = useTokens();
  const { t, i18n } = useTranslation(['events', 'app']);
  const locale = i18n.language as Locale;
  const price = event.priceCredits === 0 ? t('app:free') : formatCredits(event.priceCredits, locale);
  const soldOut = event.seatsAvailable <= 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.card,
        { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
      ]}>
      <View style={[styles.cover, { backgroundColor: tokens.color.bg.muted }]}>
        <Image source={{ uri: event.coverUrl ?? eventCoverUrl(event.id) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <View style={[styles.dateBadge, { backgroundColor: tokens.color.bg.surface }]}>
          <Text style={[styles.dateText, { color: tokens.color.text.primary }]}>
            {formatDate(event.startsAt, locale)}
          </Text>
        </View>
        <View style={[styles.priceBadge, { backgroundColor: tokens.color.brand.accent }]}>
          <Text style={[styles.priceText, { color: tokens.color.text.inverse }]}>{price}</Text>
        </View>
        {soldOut ? (
          <View
            style={[
              styles.soldOutBadge,
              {
                backgroundColor: tokens.color.feedback.danger.bg,
                borderColor: tokens.color.feedback.danger.border,
              },
            ]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={14}
              color={tokens.color.feedback.danger.fg}
            />
            <Text style={[styles.soldOutText, { color: tokens.color.feedback.danger.fg }]}>
              {t('events:soldOut')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: tokens.color.text.primary }]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={15} color={tokens.color.text.muted} />
          <Text style={[styles.meta, { color: tokens.color.text.muted }]} numberOfLines={1}>
            {event.venue}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="account-multiple-outline"
            size={15}
            color={soldOut ? tokens.color.feedback.danger.fg : tokens.color.text.muted}
          />
          <Text
            style={[
              styles.meta,
              { color: soldOut ? tokens.color.feedback.danger.fg : tokens.color.text.muted },
            ]}>
            {t('events:seats', { count: event.seatsAvailable })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  cover: { height: 168, justifyContent: 'space-between' },
  dateBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    opacity: 0.95,
  },
  dateText: { fontSize: 12.5, fontWeight: '700' },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceText: { fontSize: 12.5, fontWeight: '800' },
  soldOutBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  soldOutText: { fontSize: 12.5, fontWeight: '800' },
  body: { padding: 14, gap: 6 },
  title: { fontSize: 16.5, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13 },
});
