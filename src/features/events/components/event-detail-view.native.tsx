import type { Locale } from '@bandada/i18n';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EventCta,
  EventDescription,
  type EventDetailViewProps,
  EventHero,
  EventMeta,
  EventPrice,
} from '@/features/events/components/event-detail-parts';
import { useTokens } from '@/theme/theme-provider';

/** Native event detail: single column, full-bleed hero and a fixed bottom CTA bar. */
export default function EventDetailView({
  event,
  confirmed,
  onParticipate,
  onViewTickets,
}: EventDetailViewProps) {
  const tokens = useTokens();
  const { i18n } = useTranslation('events');
  const locale = i18n.language as Locale;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <EventHero event={event} style={styles.hero} />
        <View style={styles.body}>
          <Text style={[styles.title, { color: tokens.color.text.primary }]}>{event.title}</Text>
          <EventMeta event={event} locale={locale} />
          <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
          <EventDescription event={event} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.bar,
          {
            backgroundColor: tokens.color.bg.surface,
            borderTopColor: tokens.color.border.default,
            paddingBottom: insets.bottom + 12,
          },
        ]}>
        <EventPrice event={event} locale={locale} />
        <View style={styles.cta}>
          <EventCta
            confirmed={confirmed}
            onParticipate={onParticipate}
            onViewTickets={onViewTickets}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingBottom: 24 },
  hero: { borderRadius: 0 },
  body: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  divider: { height: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cta: { flex: 1, maxWidth: 240 },
});
