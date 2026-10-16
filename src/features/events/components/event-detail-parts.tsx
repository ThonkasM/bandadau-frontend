import { formatCredits, formatDate, type Locale } from '@bandada/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import type { Event } from '@/features/events/types';
import { eventCoverUrl } from '@/lib/event-cover';
import { useTokens } from '@/theme/theme-provider';

/** Props shared by the platform-specific event detail views. */
export interface EventDetailViewProps {
  event: Event;
  /** The user already has a registration/ticket for this event (no re-purchase). */
  registered: boolean;
  /** The event has no seats left (`seatsAvailable === 0`): no registration possible. */
  soldOut: boolean;
  /** The wallet balance is visibly below the price (UC-12, alterno 1a). */
  insufficientFunds: boolean;
  onParticipate: () => void;
  onViewTickets: () => void;
  /** UC-12 «extend» UC-15: top up credits and continue registering. */
  onTopUp: () => void;
}

export function EventHero({ event, style }: { event: Event; style?: StyleProp<ViewStyle> }) {
  const tokens = useTokens();
  return (
    <View style={[styles.hero, { backgroundColor: tokens.color.bg.muted }, style]}>
      <Image
        source={{ uri: event.coverUrl ?? eventCoverUrl(event.id) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}

export function EventMeta({ event, locale }: { event: Event; locale: Locale }) {
  const { t } = useTranslation('events');
  return (
    <View style={styles.meta}>
      <MetaRow icon="calendar-month-outline" text={formatDate(event.startsAt, locale, 'long')} />
      <MetaRow icon="map-marker-outline" text={event.venue} />
      <MetaRow icon="account-multiple-outline" text={t('seats', { count: event.seatsAvailable })} />
    </View>
  );
}

function MetaRow({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  text: string;
}) {
  const tokens = useTokens();
  return (
    <View style={styles.metaRow}>
      <MaterialCommunityIcons name={icon} size={16} color={tokens.color.text.muted} />
      <Text style={[styles.metaText, { color: tokens.color.text.secondary }]}>{text}</Text>
    </View>
  );
}

export function EventDescription({ event }: { event: Event }) {
  const tokens = useTokens();
  return (
    <Text style={[styles.description, { color: tokens.color.text.secondary }]}>
      {event.description}
    </Text>
  );
}

export function EventPrice({ event, locale }: { event: Event; locale: Locale }) {
  const tokens = useTokens();
  const { t } = useTranslation('app');
  const price = event.priceCredits === 0 ? t('free') : formatCredits(event.priceCredits, locale);
  return <Text style={[styles.price, { color: tokens.color.text.primary }]}>{price}</Text>;
}

export function EventCta({
  registered,
  soldOut,
  insufficientFunds,
  onParticipate,
  onViewTickets,
  onTopUp,
}: Pick<
  EventDetailViewProps,
  'registered' | 'soldOut' | 'insufficientFunds' | 'onParticipate' | 'onViewTickets' | 'onTopUp'
>) {
  const tokens = useTokens();
  const { t } = useTranslation('events');
  if (registered) {
    return <Button label={t('viewTickets')} variant="secondary" onPress={onViewTickets} />;
  }
  if (soldOut) {
    return (
      <View
        accessibilityRole="text"
        style={[
          styles.soldOut,
          {
            backgroundColor: tokens.color.feedback.danger.bg,
            borderColor: tokens.color.feedback.danger.border,
          },
        ]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={18}
          color={tokens.color.feedback.danger.fg}
        />
        <Text style={[styles.soldOutText, { color: tokens.color.feedback.danger.fg }]}>
          {t('soldOut')}
        </Text>
      </View>
    );
  }
  if (insufficientFunds) {
    return (
      <Button
        label={t('payment.topUpAndContinue')}
        icon="wallet-plus-outline"
        onPress={onTopUp}
      />
    );
  }
  return <Button label={t('register')} onPress={onParticipate} />;
}

const styles = StyleSheet.create({
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20, overflow: 'hidden' },
  meta: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, flex: 1 },
  description: { fontSize: 15, lineHeight: 22 },
  price: { fontSize: 24, fontWeight: '900' },
  soldOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  soldOutText: { fontSize: 15.5, fontWeight: '700' },
});
