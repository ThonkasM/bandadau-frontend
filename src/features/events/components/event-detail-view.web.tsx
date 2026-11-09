import type { Locale } from '@bandada/i18n';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { GUTTER_DESKTOP } from '@/constants/layout';
import {
  EventCta,
  EventDescription,
  type EventDetailViewProps,
  EventHero,
  EventMeta,
  EventPrice,
} from '@/features/events/components/event-detail-parts';
import { useTokens } from '@/theme/theme-provider';

import NarrowEventDetailView from './event-detail-view.native';

const MAX_WIDTH = 1080;
const PANEL_WIDTH = 400;
/** Below this width (phones, small tablets) two columns do not fit: use the single-column layout. */
const TWO_COLUMN_MIN_WIDTH = 900;

/** Web event detail: hero on the left, info + CTA panel on the right. */
export default function EventDetailView(props: EventDetailViewProps) {
  const { width } = useWindowDimensions();
  if (width < TWO_COLUMN_MIN_WIDTH) return <NarrowEventDetailView {...props} />;
  return <WideEventDetailView {...props} />;
}

function WideEventDetailView({
  event,
  registered,
  soldOut,
  insufficientFunds,
  onParticipate,
  onViewTickets,
  onTopUp,
}: EventDetailViewProps) {
  const tokens = useTokens();
  const { i18n } = useTranslation('events');
  const locale = i18n.language as Locale;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        <View style={styles.left}>
          <EventHero event={event} />
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: tokens.color.bg.surface, borderColor: tokens.color.border.default },
          ]}>
          <Text style={[styles.title, { color: tokens.color.text.primary }]}>{event.title}</Text>
          <EventMeta event={event} locale={locale} />
          <View style={[styles.divider, { backgroundColor: tokens.color.border.default }]} />
          <EventDescription event={event} />
          <View style={styles.priceRow}>
            <EventPrice event={event} locale={locale} />
          </View>
          <EventCta
            registered={registered}
            soldOut={soldOut}
            insufficientFunds={insufficientFunds}
            onParticipate={onParticipate}
            onViewTickets={onViewTickets}
            onTopUp={onTopUp}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: GUTTER_DESKTOP, alignItems: 'center' },
  grid: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    flexDirection: 'row',
    gap: GUTTER_DESKTOP,
    alignItems: 'flex-start',
  },
  left: { flex: 1 },
  panel: { width: PANEL_WIDTH, gap: 14, padding: 24, borderRadius: 20, borderWidth: 1 },
  title: { fontSize: 26, fontWeight: '800' },
  divider: { height: 1 },
  priceRow: { marginTop: 4 },
});
